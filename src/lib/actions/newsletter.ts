'use server'

import { resend, FROM_EMAIL, isResendConfigured } from '@/lib/resend/client'
import { WelcomeEmail, getWelcomeEmailSubject } from '@/lib/resend/templates/WelcomeEmail'
import { createAdminClient } from '@/lib/supabase/server'

interface SubscribeResult {
  success: boolean
  error?: string
}

export async function subscribeToNewsletter(
  email: string,
  locale: 'ko' | 'en' = 'ko'
): Promise<SubscribeResult> {
  if (!email || !email.includes('@')) {
    return {
      success: false,
      error: locale === 'ko' ? '유효한 이메일을 입력해주세요.' : 'Please enter a valid email.',
    }
  }

  try {
    const supabase = await createAdminClient()

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('subscribers')
      .select('id, status')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      if (existing.status === 'active') {
        return {
          success: false,
          error: locale === 'ko' ? '이미 구독 중인 이메일입니다.' : 'This email is already subscribed.',
        }
      }

      // Reactivate if previously unsubscribed
      await supabase
        .from('subscribers')
        .update({ status: 'active', subscribed_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      // Create new subscriber
      const { error: insertError } = await supabase
        .from('subscribers')
        .insert({
          email: email.toLowerCase(),
          status: 'active',
          source: 'website',
        })

      if (insertError) {
        console.error('Error inserting subscriber:', insertError)
        return {
          success: false,
          error: locale === 'ko' ? '구독 처리 중 오류가 발생했습니다.' : 'An error occurred while processing your subscription.',
        }
      }
    }

    // Send welcome email
    if (isResendConfigured() && resend) {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: getWelcomeEmailSubject(locale),
          react: WelcomeEmail({ email, locale }),
        })
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError)
        // Don't fail the subscription if email fails
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error subscribing to newsletter:', error)
    return {
      success: false,
      error: locale === 'ko' ? '구독 처리 중 오류가 발생했습니다.' : 'An error occurred while processing your subscription.',
    }
  }
}

export async function unsubscribeFromNewsletter(
  email: string,
  locale: 'ko' | 'en' = 'ko'
): Promise<SubscribeResult> {
  try {
    const supabase = await createAdminClient()

    const { error } = await supabase
      .from('subscribers')
      .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
      .eq('email', email.toLowerCase())

    if (error) {
      console.error('Error unsubscribing:', error)
      return {
        success: false,
        error: locale === 'ko' ? '구독 취소 중 오류가 발생했습니다.' : 'An error occurred while unsubscribing.',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error)
    return {
      success: false,
      error: locale === 'ko' ? '구독 취소 중 오류가 발생했습니다.' : 'An error occurred while unsubscribing.',
    }
  }
}
