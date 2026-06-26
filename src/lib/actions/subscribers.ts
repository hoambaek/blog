'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { resend, FROM_EMAIL, isResendConfigured } from '@/lib/resend/client'
import { render } from '@react-email/render'
import { WelcomeEmail, getWelcomeEmailSubject } from '@/lib/resend/templates/WelcomeEmail'
import type { Subscriber } from '@/lib/supabase/types'

export interface SubscribeInput {
  email: string
  name?: string
  source?: string
  locale?: 'ko' | 'en'
  /** Honeypot field — must be empty. Bots tend to fill every input. */
  honeypot?: string
  /** Milliseconds between form mount and submit. Bots submit near-instantly. */
  elapsedMs?: number
}

export type SubscribeResult =
  | { success: true; message: string }
  | { success: false; error: string }

// Minimum time a human plausibly needs to fill and submit the form.
const MIN_SUBMIT_MS = 2500

/**
 * Normalize an email so address-aliasing tricks can't be used to register the
 * same mailbox many times. Strips +tags everywhere, and for Gmail also removes
 * dots (Gmail ignores them). This is what bots abused: i.w.ex...@gmail.com.
 */
function normalizeEmail(email: string): string {
  const lower = email.toLowerCase().trim()
  const atIndex = lower.lastIndexOf('@')
  if (atIndex === -1) return lower

  let local = lower.slice(0, atIndex)
  let domain = lower.slice(atIndex + 1)

  // Drop everything after the first + (plus addressing)
  local = local.split('+')[0]

  if (domain === 'googlemail.com') domain = 'gmail.com'
  if (domain === 'gmail.com') {
    local = local.replace(/\./g, '')
  }

  return `${local}@${domain}`
}

export async function subscribe(input: SubscribeInput): Promise<SubscribeResult> {
  const {
    email,
    name,
    source,
    locale = 'ko',
    honeypot,
    elapsedMs,
  } = input

  // --- Bot guards (silently accept so bots can't tell they were blocked) ---
  const silentMessages = {
    ko: '구독해 주셔서 감사합니다! 이메일을 확인해 주세요.',
    en: 'Thank you for subscribing! Please check your email.',
  }
  const silentOk: SubscribeResult = { success: true, message: silentMessages[locale] }

  // 1) Honeypot filled → bot
  if (honeypot && honeypot.trim() !== '') {
    return silentOk
  }

  // 2) Submitted too fast → bot
  if (typeof elapsedMs === 'number' && elapsedMs >= 0 && elapsedMs < MIN_SUBMIT_MS) {
    return silentOk
  }

  const supabase = await createAdminClient()

  const normalizedEmail = normalizeEmail(email)

  // Check if already subscribed (compare against normalized email to catch
  // dot/plus aliasing of the same mailbox).
  const { data: existing } = await supabase
    .from('subscribers')
    .select('id, status')
    .eq('email', normalizedEmail)
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
    await sendWelcomeEmail(normalizedEmail, locale)

    return { success: true, message: t.resubscribed }
  }

  // New subscription
  const { error } = await supabase.from('subscribers').insert({
    email: normalizedEmail,
    name: name || null,
    source: source || 'website',
  })

  if (error) {
    console.error('Error subscribing:', error)
    return { success: false, error: t.error }
  }

  // Send welcome email
  await sendWelcomeEmail(normalizedEmail, locale)

  return { success: true, message: t.subscribed }
}

async function sendWelcomeEmail(email: string, locale: 'ko' | 'en') {
  try {
    if (!isResendConfigured() || !resend) {
      console.warn('Resend not configured, skipping welcome email')
      return
    }

    // Render React component to HTML string
    const html = await render(WelcomeEmail({ email, locale }))

    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: getWelcomeEmailSubject(locale),
      html,
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
