'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { resend, FROM_EMAIL, isResendConfigured } from '@/lib/resend/client'
import { render } from '@react-email/render'
import { WelcomeEmail, getWelcomeEmailSubject } from '@/lib/resend/templates/WelcomeEmail'
import type { Subscriber } from '@/lib/supabase/types'
import { requireAdmin, checkAdmin, ADMIN_FORBIDDEN_MESSAGE } from '@/lib/auth/admin'
import { buildUnsubscribeUrl, verifyUnsubscribeToken } from '@/lib/unsubscribe-token'

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
  /** code — 화면이 상태를 나눠 보여 주기 위한 구분값('already_subscribed' = 이미 구독 중) */
  | { success: false; error: string; code?: 'already_subscribed' }

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
      return { success: false, error: t.alreadySubscribed, code: 'already_subscribed' }
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
    // (UNSUBSCRIBE_TOKEN_SECRET이 없으면 여기서 예외 → 해지 링크 없는 메일은 보내지 않는다)
    const html = await render(WelcomeEmail({ unsubscribeUrl: buildUnsubscribeUrl(email), locale }))

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

/**
 * 구독 해지 — 메일에 담긴 서명 토큰(HMAC)이 맞을 때만 수행한다.
 * 이메일 주소만으로는 남의 구독을 끊을 수 없다.
 */
export async function unsubscribe(
  email: string,
  token: string
): Promise<{ success: true } | { success: false; error: string; expired?: boolean }> {
  let valid = false
  try {
    valid = typeof email === 'string' && typeof token === 'string' && verifyUnsubscribeToken(email, token)
  } catch (error) {
    // 비밀키 미설정 등 서버 설정 문제
    console.error('Unsubscribe token verification failed:', error)
    return { success: false, error: '구독 취소 처리 중 오류가 발생했습니다.' }
  }
  if (!valid) {
    return { success: false, error: '링크가 만료되었습니다.', expired: true }
  }

  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('subscribers')
    .update({
      status: 'unsubscribed',
      unsubscribed_at: new Date().toISOString(),
    })
    .eq('email', email.trim().toLowerCase())

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
  await requireAdmin()
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
  await requireAdmin()
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

/** 관리자 해지 — 구독자 목록의 '해지' 버튼. 기록은 지우지 않고 상태만 바꾼다 */
export async function adminUnsubscribe(id: string): Promise<{ success: boolean; error?: string }> {
  if (!(await checkAdmin()).ok) return { success: false, error: ADMIN_FORBIDDEN_MESSAGE }
  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('subscribers')
    .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
    .eq('id', id)
  if (error) {
    console.error('Error unsubscribing (admin):', error)
    return { success: false, error: '해지하지 못했습니다.' }
  }
  return { success: true }
}
