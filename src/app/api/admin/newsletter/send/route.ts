import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/server'
import { FROM_EMAIL } from '@/lib/resend/client'
import { guardAdminApi } from '@/lib/auth/admin'
import { buildUnsubscribeUrl, UNSUBSCRIBE_SECRET_ENV } from '@/lib/unsubscribe-token'
import { getPostNumbers } from '@/lib/journal/data'
import {
  renderNewsletterHtml,
  renderNewsletterText,
  resolvedIntro,
  UNSUBSCRIBE_PLACEHOLDER,
  type NewsletterContent,
} from '@/lib/newsletter/template'

/*
 * 뉴스레터 발송 — 기록 기반(Paper IOR-0).
 *   POST { postIds, subject, intro, test? }
 *   test: true  → 로그인한 관리자 본인 메일로 한 통 (기록 남기지 않음)
 *   test: false → 활성 구독자 전원. newsletters에 기록하고, 실패한 주소는 failed_recipients에 남긴다.
 *
 * 메일 HTML은 서버가 기록을 다시 읽어 만든다(브라우저가 보낸 HTML을 믿지 않는다).
 * 집계: Resend는 실패를 예외가 아니라 { error }로 돌려준다 — 그걸 성공으로 세던 버그를 고쳤다.
 *   delivered_count = Resend가 접수한 수(실제 수신함 도착은 Resend 웹훅이 없어 모른다).
 * 해지 링크: 수신자별 서명 토큰 링크(긴급 수정 e7352d7)로 {{unsubscribe_url}}을 바꾼다.
 */

export const maxDuration = 300

const BATCH_SIZE = 100 // Resend batch 한 번에 최대 100통
const BATCH_GAP_MS = 600 // 기본 요청 한도(초당 2회) 아래로

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function personalize(template: string, email: string) {
  return template.replaceAll(UNSUBSCRIBE_PLACEHOLDER, buildUnsubscribeUrl(email))
}

function errorText(error: unknown): string {
  if (!error) return '알 수 없는 오류'
  if (typeof error === 'string') return error
  if (typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message)
  return JSON.stringify(error)
}

async function loadContent(postIds: string[], subject: string, intro: string): Promise<NewsletterContent | null> {
  const supabase = await createAdminClient()
  const [{ data, error }, numbers] = await Promise.all([
    supabase
      .from('posts')
      .select('id, slug, title, excerpt, cover_image_url, category:categories(name)')
      .in('id', postIds)
      .eq('status', 'published')
      .is('deleted_at', null),
    getPostNumbers(),
  ])
  if (error || !data || data.length !== postIds.length) return null
  const byId = new Map(data.map((p) => [p.id, p]))
  return {
    subject,
    intro,
    records: postIds.map((id) => {
      const p = byId.get(id)!
      const category = (Array.isArray(p.category) ? p.category[0] : p.category) as { name: string } | null
      return {
        slug: p.slug,
        number: numbers.get(p.id) ?? null,
        title: p.title,
        excerpt: p.excerpt,
        cover: p.cover_image_url,
        seriesName: category?.name ?? null,
      }
    }),
  }
}

export async function POST(request: NextRequest) {
  const guard = await guardAdminApi()
  if (!guard.ok) return guard.response

  // 해지 링크 없이 메일이 나가지 않도록 발송 전에 확인
  try {
    buildUnsubscribeUrl('config-check@example.com')
  } catch {
    return NextResponse.json({ error: `${UNSUBSCRIBE_SECRET_ENV}가 설정되지 않아 발송할 수 없습니다.` }, { status: 500 })
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY가 설정되지 않았습니다.' }, { status: 500 })
  }

  let body: { postIds?: unknown; subject?: unknown; intro?: unknown; test?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '요청을 읽지 못했습니다.' }, { status: 400 })
  }
  const postIds = Array.isArray(body.postIds) ? body.postIds.filter((id): id is string => typeof id === 'string' && UUID_RE.test(id)) : []
  const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
  const intro = typeof body.intro === 'string' ? body.intro.trim().slice(0, 2000) : ''
  const test = body.test === true
  if (!postIds.length || postIds.length > 10) return NextResponse.json({ error: '담을 기록을 1~10편 고르세요.' }, { status: 400 })
  if (!subject || subject.length > 200) return NextResponse.json({ error: '제목을 입력하세요(200자 이내).' }, { status: 400 })

  const content = await loadContent(postIds, subject, intro)
  if (!content) return NextResponse.json({ error: '발행된 기록만 담을 수 있습니다.' }, { status: 400 })
  const html = renderNewsletterHtml(content)
  const text = renderNewsletterText(content)
  const resend = new Resend(process.env.RESEND_API_KEY)

  // ── 나에게 테스트 발송 ──
  if (test) {
    let to: string | null = null
    try {
      const user = await (await clerkClient()).users.getUser(guard.userId)
      to = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null
    } catch (error) {
      console.error('Test recipient lookup failed:', error)
    }
    if (!to) return NextResponse.json({ error: '관리자 계정의 메일 주소를 확인하지 못했습니다.' }, { status: 500 })
    try {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: `[테스트] ${subject}`,
        html: personalize(html, to),
        text: personalize(text, to),
      })
      if (error) {
        console.error('Test newsletter rejected:', error)
        return NextResponse.json({ error: `테스트 발송 실패: ${errorText(error)}` }, { status: 502 })
      }
    } catch (error) {
      console.error('Test newsletter failed:', error)
      return NextResponse.json({ error: `테스트 발송 실패: ${errorText(error)}` }, { status: 502 })
    }
    return NextResponse.json({ success: true, message: `${to}로 테스트 메일을 보냈습니다.` })
  }

  // ── 구독자 전원 발송 ──
  const supabase = await createAdminClient()
  const { data: subscribers, error: subError } = await supabase.from('subscribers').select('email').eq('status', 'active')
  if (subError) {
    console.error('Error fetching subscribers:', subError)
    return NextResponse.json({ error: '구독자 목록을 읽지 못했습니다.' }, { status: 500 })
  }
  const recipients = [...new Set((subscribers ?? []).map((s) => s.email.trim().toLowerCase()).filter(Boolean))]
  if (!recipients.length) return NextResponse.json({ error: '활성 구독자가 없습니다.' }, { status: 400 })

  // 발송 전에 기록부터 남긴다 — 중간에 끊겨도 흔적이 남도록
  const baseRow = {
    subject,
    preview_text: resolvedIntro(content).slice(0, 255) || null,
    html_content: html,
    plain_text_content: text,
    status: 'draft' as const,
    total_recipients: recipients.length,
    created_by: guard.userId,
  }
  let newsletterId: string | null = null
  let hasNewColumns = true
  {
    const first = await supabase
      .from('newsletters')
      .insert({ ...baseRow, post_ids: postIds, intro: intro || null })
      .select('id')
      .single()
    if (first.error) {
      // 005 마이그레이션 전 — 새 컬럼 없이 기록
      hasNewColumns = false
      const retry = await supabase.from('newsletters').insert(baseRow).select('id').single()
      if (retry.error) console.error('Error recording newsletter:', retry.error)
      newsletterId = retry.data?.id ?? null
    } else newsletterId = first.data.id
  }

  const failed: { email: string; error: string }[] = []
  let accepted = 0

  const sendOne = async (email: string) => {
    try {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject,
        html: personalize(html, email),
        text: personalize(text, email),
        headers: { 'List-Unsubscribe': `<${buildUnsubscribeUrl(email)}>` },
      })
      if (error) failed.push({ email, error: errorText(error) })
      else accepted++
    } catch (error) {
      failed.push({ email, error: errorText(error) })
    }
  }

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const chunk = recipients.slice(i, i + BATCH_SIZE)
    if (i > 0) await sleep(BATCH_GAP_MS)
    let batchError: unknown = null
    let acceptedIds = 0
    try {
      const { data, error } = await resend.batch.send(
        chunk.map((email) => ({
          from: FROM_EMAIL,
          to: email,
          subject,
          html: personalize(html, email),
          text: personalize(text, email),
          headers: { 'List-Unsubscribe': `<${buildUnsubscribeUrl(email)}>` },
        })),
      )
      if (error) batchError = error
      else acceptedIds = data?.data?.length ?? 0
    } catch (error) {
      batchError = error
    }

    if (!batchError && acceptedIds === chunk.length) {
      accepted += chunk.length
      continue
    }
    // 묶음이 통째로 거부되면(주소 하나가 잘못돼도 전부 거부된다) 한 통씩 다시 보내 실패 주소만 가려낸다
    console.error('Newsletter batch rejected, retrying one by one:', batchError ?? `accepted ${acceptedIds}/${chunk.length}`)
    for (const email of chunk) {
      await sendOne(email)
      await sleep(BATCH_GAP_MS)
    }
  }

  const status = accepted === 0 ? 'failed' : 'sent'
  if (newsletterId) {
    const update = {
      status,
      sent_at: new Date().toISOString(),
      delivered_count: accepted,
      ...(hasNewColumns ? { failed_recipients: failed.length ? failed : null } : {}),
    } as const
    const { error } = await supabase.from('newsletters').update(update).eq('id', newsletterId)
    if (error) console.error('Error updating newsletter record:', error)
  }

  return NextResponse.json({
    success: accepted > 0,
    message: failed.length
      ? `${recipients.length}명 중 ${accepted}명에게 보냈습니다. ${failed.length}명은 실패했습니다.`
      : `${accepted}명에게 보냈습니다.`,
    total: recipients.length,
    accepted,
    failed,
    ...(hasNewColumns ? {} : { warning: '005 마이그레이션 전이라 담은 기록·실패 주소는 기록에 남지 않았습니다.' }),
  })
}
