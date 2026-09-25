import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { FROM_EMAIL } from '@/lib/resend/client'
import { guardAdminApi } from '@/lib/auth/admin'
import { buildUnsubscribeUrl, UNSUBSCRIBE_SECRET_ENV } from '@/lib/unsubscribe-token'

const UNSUBSCRIBE_PLACEHOLDER = '{{unsubscribe_url}}'

// 수신자별 서명 해지 링크로 자리표시를 모두 치환 (본문에 여러 번 나와도 전부)
function personalize(template: string | null, unsubscribeUrl: string): string | undefined {
  return template ? template.replaceAll(UNSUBSCRIBE_PLACEHOLDER, unsubscribeUrl) : undefined
}

export async function POST(request: NextRequest) {
  const guard = await guardAdminApi()
  if (!guard.ok) return guard.response

  // 해지 링크 없이 메일이 나가지 않도록 발송 전에 확인
  try {
    buildUnsubscribeUrl('config-check@example.com')
  } catch {
    return NextResponse.json(
      { error: `${UNSUBSCRIBE_SECRET_ENV} is not configured` },
      { status: 500 }
    )
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY is not configured' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { newsletterId, testEmail } = body

    const supabase = await createAdminClient()

    // 뉴스레터 조회
    const { data: newsletter, error: fetchError } = await supabase
      .from('newsletters')
      .select('*')
      .eq('id', newsletterId)
      .single()

    if (fetchError || !newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 })
    }

    if (newsletter.status === 'sent') {
      return NextResponse.json(
        { error: 'Newsletter already sent' },
        { status: 400 }
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    // 테스트 발송인 경우
    if (testEmail) {
      const unsubscribeUrl = buildUnsubscribeUrl(testEmail)
      const { error: sendError } = await resend.emails.send({
        from: FROM_EMAIL,
        to: testEmail,
        subject: `[테스트] ${newsletter.subject}`,
        html: personalize(newsletter.html_content, unsubscribeUrl) ?? '',
        text: personalize(newsletter.plain_text_content, unsubscribeUrl),
      })

      if (sendError) {
        console.error('Error sending test email:', sendError)
        return NextResponse.json(
          { error: 'Failed to send test email' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `테스트 이메일이 ${testEmail}로 발송되었습니다.`,
      })
    }

    // 실제 발송: 활성 구독자 목록 조회
    const { data: subscribers, error: subError } = await supabase
      .from('subscribers')
      .select('email')
      .eq('status', 'active')

    if (subError) {
      console.error('Error fetching subscribers:', subError)
      return NextResponse.json(
        { error: 'Failed to fetch subscribers' },
        { status: 500 }
      )
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json(
        { error: 'No active subscribers found' },
        { status: 400 }
      )
    }

    const recipientEmails = subscribers.map((s) => s.email)

    // Resend Batch API 사용 (최대 100개씩)
    const batchSize = 100
    const batches = []
    let totalSent = 0

    for (let i = 0; i < recipientEmails.length; i += batchSize) {
      const batch = recipientEmails.slice(i, i + batchSize)

      // 각 수신자에게 개별 이메일 발송
      const emailPromises = batch.map((email) => {
        const unsubscribeUrl = buildUnsubscribeUrl(email)
        return resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: newsletter.subject,
          html: personalize(newsletter.html_content, unsubscribeUrl) ?? '',
          text: personalize(newsletter.plain_text_content, unsubscribeUrl),
        })
      })

      const results = await Promise.allSettled(emailPromises)
      const successful = results.filter((r) => r.status === 'fulfilled').length
      totalSent += successful
      batches.push({ batch: i / batchSize + 1, successful, total: batch.length })
    }

    // 뉴스레터 상태 업데이트
    const { error: updateError } = await supabase
      .from('newsletters')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        total_recipients: recipientEmails.length,
        delivered_count: totalSent,
      })
      .eq('id', newsletterId)

    if (updateError) {
      console.error('Error updating newsletter status:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: `뉴스레터가 ${totalSent}명에게 발송되었습니다.`,
      totalRecipients: recipientEmails.length,
      delivered: totalSent,
      batches,
    })
  } catch (error) {
    console.error('Error sending newsletter:', error)
    return NextResponse.json(
      { error: 'Failed to send newsletter' },
      { status: 500 }
    )
  }
}
