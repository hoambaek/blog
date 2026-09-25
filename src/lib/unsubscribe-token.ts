import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

/*
 * 구독 해지 링크 서명 — HMAC-SHA256(비밀키, 버전 접두어 + 이메일).
 * 링크는 /unsubscribe?email=...&token=... 형태다.
 * 예전 링크(?email= 만)는 해지를 수행하지 않고 "만료" 안내로 처리한다.
 *
 * 비밀키: UNSUBSCRIBE_TOKEN_SECRET (32자 이상, 필수). 바꾸면 이미 발송된 링크가 모두 무효가 된다.
 */

export const UNSUBSCRIBE_SECRET_ENV = 'UNSUBSCRIBE_TOKEN_SECRET'
const MIN_SECRET_LENGTH = 32
const TOKEN_PREFIX = 'unsubscribe:v1:'

function getSecret(): string {
  const secret = process.env[UNSUBSCRIBE_SECRET_ENV]
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`${UNSUBSCRIBE_SECRET_ENV} is not set (or shorter than ${MIN_SECRET_LENGTH} chars)`)
  }
  return secret
}

function normalize(email: string): string {
  return email.trim().toLowerCase()
}

export function createUnsubscribeToken(email: string): string {
  return createHmac('sha256', getSecret()).update(TOKEN_PREFIX + normalize(email)).digest('base64url')
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!email || !token) return false
  const expected = Buffer.from(createUnsubscribeToken(email))
  const given = Buffer.from(token)
  return expected.length === given.length && timingSafeEqual(expected, given)
}

/** 발송 메일의 절대 URL 기준 (환영 메일 로고와 같은 기본값) */
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://blog.musedemaree.com'

export function buildUnsubscribeUrl(email: string): string {
  const params = new URLSearchParams({ email: normalize(email), token: createUnsubscribeToken(email) })
  return `${BASE_URL}/unsubscribe?${params.toString()}`
}
