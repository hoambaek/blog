import { createHash, timingSafeEqual } from 'node:crypto'

/*
 * Claude 초안 업로드 전용 토큰 — Authorization: Bearer <BLOG_DRAFT_TOKEN>
 * Clerk 세션이 아니라 이 토큰 하나로 들어온다. 토큰으로 할 수 있는 일은 "초안 만들기·Claude 초안 고치기"뿐이다.
 *
 * - 토큰이 없거나 32자 미만이면 라우트 전체를 닫는다(503) — 설정을 빠뜨리면 열리는 게 아니라 닫힌다.
 * - 비교는 양쪽을 SHA-256으로 같은 길이로 만든 뒤 timingSafeEqual (길이 차이도 새지 않게).
 */

export const DRAFT_TOKEN_ENV = 'BLOG_DRAFT_TOKEN'
export const MIN_DRAFT_TOKEN_LENGTH = 32

export type DraftTokenCheck = 'ok' | 'unconfigured' | 'unauthorized'

function digest(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest()
}

export function checkDraftToken(authorization: string | null | undefined, secret: string | undefined): DraftTokenCheck {
  const expected = secret?.trim()
  if (!expected || expected.length < MIN_DRAFT_TOKEN_LENGTH) return 'unconfigured'
  const match = authorization?.match(/^Bearer\s+(\S+)\s*$/i)
  if (!match) return 'unauthorized'
  return timingSafeEqual(digest(match[1]), digest(expected)) ? 'ok' : 'unauthorized'
}
