import { isMediaOnlyBlock, splitTopLevelBlocks, stripToText } from '@/lib/translation'

/*
 * 영문 검수 상태 — posts.en_review (supabase/migrations/005_admin_redesign.sql)
 *
 * 한국어 원문 블록마다 글자(태그 제외)의 해시를 만든다. 블록 순서가 바뀌어도 해시로 맞춘다.
 *   confirmed: 사람이 영문을 확인한 원문 해시
 *   known:     마지막 검수 저장 때 있던 원문 해시
 * 원문 블록의 상태:
 *   ok          confirmed에 있음                          → "✓ 확인"
 *   changed     known이 있는데 그 안에 없는 해시(원문이 바뀜) → "다시 번역됨 · 확인 필요" (저장 때 바뀐 블록만 다시 번역됨)
 *   pending     그 밖(한 번도 확인 안 함)                   → "확인 필요"
 * 서버·브라우저 어디서나 도는 순수 함수만 둔다.
 */

export interface EnReview {
  confirmed: string[]
  known: string[]
  completed_at: string | null
}

export type BlockReviewState = 'ok' | 'changed' | 'pending'

export const EMPTY_REVIEW: EnReview = { confirmed: [], known: [], completed_at: null }

export function readReview(value: unknown): EnReview {
  if (typeof value !== 'object' || value === null) return EMPTY_REVIEW
  const v = value as Partial<EnReview>
  return {
    confirmed: Array.isArray(v.confirmed) ? v.confirmed.filter((x): x is string => typeof x === 'string') : [],
    known: Array.isArray(v.known) ? v.known.filter((x): x is string => typeof x === 'string') : [],
    completed_at: typeof v.completed_at === 'string' ? v.completed_at : null,
  }
}

/** FNV-1a 32bit → base36. 보안용이 아니라 "글자가 바뀌었나" 비교용 */
export function textHash(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

/** 원문 블록 해시 — 태그를 빼고 공백을 접은 글자 기준 */
export function blockHash(blockHtml: string): string {
  return textHash(stripToText(blockHtml))
}

/** 필드(제목·발췌 등) 해시 — 본문 블록과 섞이지 않게 접두어를 붙인다 */
export function fieldHash(field: string, value: string): string {
  return `${field}:${textHash(value.replace(/\s+/g, ' ').trim())}`
}

/** 번역 대상 블록(글자가 있는 최상위 블록)만 */
export function textBlocks(html: string | null | undefined): string[] {
  if (!html) return []
  return splitTopLevelBlocks(html).filter((b) => !isMediaOnlyBlock(b))
}

export function reviewState(hash: string, review: EnReview): BlockReviewState {
  if (review.confirmed.includes(hash)) return 'ok'
  if (review.known.length > 0 && !review.known.includes(hash)) return 'changed'
  return 'pending'
}

/** 검수 대상 해시 전부 — 제목·발췌 + 본문 글자 블록 */
export function reviewHashes(input: { title: string; excerpt: string | null; html: string }): string[] {
  const hashes = [fieldHash('title', input.title)]
  if (input.excerpt) hashes.push(fieldHash('excerpt', input.excerpt))
  for (const block of textBlocks(input.html)) hashes.push(blockHash(block))
  return hashes
}

export type EnStatus = 'none' | 'pending' | 'done'

/** 기록 목록의 EN 칸 — 영문 본문이 없으면 none, 확인 안 된 항목이 하나라도 있으면 pending */
export function enStatus(input: {
  title: string
  excerpt: string | null
  html: string
  htmlEn: string | null
  review: unknown
}): EnStatus {
  if (!input.htmlEn) return 'none'
  const review = readReview(input.review)
  const hashes = reviewHashes(input)
  return hashes.every((h) => review.confirmed.includes(h)) ? 'done' : 'pending'
}
