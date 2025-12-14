'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { resend, FROM_EMAIL, isResendConfigured } from '@/lib/resend/client'
import { WelcomeEmail, getWelcomeEmailSubject } from '@/lib/resend/templates/WelcomeEmail'
import type { Subscriber } from '@/lib/supabase/types'

export async function subscribe(
  email: string,
  name?: string,
  source?: string,
  locale: 'ko' | 'en' = 'ko'
) {
  const supabase = await createClient()

  // Check if already subscribed
  const { data: existing } = await supabase
    .from('subscribers')
    .select('id, status')
    .eq('email', email.toLowerCase())
    .single()

  const messages = {
    ko: {
      alreadySubscribed: '이미 구독 중인 이메일입니다.',
      resubscribed: '다시 구독되었습니다!',
      subscribed: '구독해 주셔서 감사합니다! 이메일을 확인해 주세요.',
      error: '구독 처리 중 오류가 발생했습니다.',
    },
    en: {
      alreadySubscribed: 'This email is already subscribed.',
      resubscribed: 'You have been resubscribed!',
      subscribed: 'Thank you for subscribing! Please check your email.',
      error: 'An error occurred while processing your subscription.',
    },
  }

  const t = locale === 'ko' ? messages.ko : messages.en

  if (existing) {
    if (existing.status === 'active') {
      return { success: false, error: t.alreadySubscribed }
    }

    // Reactivate if previously unsubscribed
    const { error } = await supabase
      .from('subscribers')
      .update({
        status: 'active',
        name: name || null,
        unsubscribed_at: null,
      })
      .eq('id', existing.id)

    if (error) {
      return { success: false, error: t.error }
    }

    // Send welcome back email
    await sendWelcomeEmail(email, locale)

    return { success: true, message: t.resubscribed }
  }

  // New subscription
  const { error } = await supabase.from('subscribers').insert({
    email: email.toLowerCase(),
    name: name || null,
    source: source || 'website',
  })

  if (error) {
    console.error('Error subscribing:', error)
    return { success: false, error: t.error }
  }

  // Send welcome email
  await sendWelcomeEmail(email, locale)

  return { success: true, message: t.subscribed }
}

async function sendWelcomeEmail(email: string, locale: 'ko' | 'en') {
  try {
    if (!isResendConfigured() || !resend) {
      console.warn('Resend not configured, skipping welcome email')
      return
    }

    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: getWelcomeEmailSubject(locale),
      react: WelcomeEmail({ email, locale }),
    })

    console.log('Welcome email sent to:', email)
  } catch (error) {
    console.error('Error sending welcome email:', error)
    // Don't throw - email failure shouldn't prevent subscription
  }
}

export async function unsubscribe(email: string) {
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('subscribers')
    .update({
      status: 'unsubscribed',
      unsubscribed_at: new Date().toISOString(),
    })
    .eq('email', email.toLowerCase())

  if (error) {
    return { success: false, error: '구독 취소 처리 중 오류가 발생했습니다.' }
  }

  return { success: true }
}

// Admin functions
export async function getSubscribers(
  status?: 'active' | 'unsubscribed',
  limit = 50,
  offset = 0
): Promise<{ subscribers: Subscriber[]; total: number }> {
  const supabase = await createAdminClient()

  let query = supabase
    .from('subscribers')
    .select('*', { count: 'exact' })
    .order('subscribed_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching subscribers:', error)
    return { subscribers: [], total: 0 }
  }

  return { subscribers: data, total: count || 0 }
}

export async function getSubscriberStats() {
  const supabase = await createAdminClient()

  const { count: total } = await supabase
    .from('subscribers')
    .select('*', { count: 'exact', head: true })

  const { count: active } = await supabase
    .from('subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // This month's new subscribers
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: thisMonth } = await supabase
    .from('subscribers')
    .select('*', { count: 'exact', head: true })
    .gte('subscribed_at', startOfMonth.toISOString())

  return {
    total: total || 0,
    active: active || 0,
    thisMonth: thisMonth || 0,
  }
}
