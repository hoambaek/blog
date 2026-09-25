import { NextRequest, NextResponse } from 'next/server'
import { checkDraftToken, DRAFT_TOKEN_ENV, MIN_DRAFT_TOKEN_LENGTH } from '@/lib/drafts/token'
import { createRateLimiter } from '@/lib/drafts/rate-limit'
import { DRAFT_LIMITS, parseDraftRequest, processDraft } from '@/lib/drafts/service'
import { createDraftDeps } from '@/lib/drafts/deps'

/*
 * POST /api/drafts — Claude 초안 업로드 (npm run draft 가 부른다). 규격: docs/content/article-format.md 2절.
 *
 * 인증: Clerk가 아니라 전용 토큰(BLOG_DRAFT_TOKEN, Authorization: Bearer). middleware matcher 밖이다.
 * 할 수 있는 일: 초안 만들기, Claude가 올린 초안 고치기. 발행·삭제·관리자 글 수정은 없다.
 * 본문: JSON { manuscript: string, images?: [{ path, data(base64) }], force?: boolean } — 한도는 DRAFT_LIMITS.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// 번역이 본문 길이에 따라 20~60초 걸린다(/api/admin/translate 와 같은 여유)
export const maxDuration = 300

// IP당 10분에 12번 (인스턴스 메모리 기준 — 한계는 rate-limit.ts 주석)
const limiter = createRateLimiter({ limit: 12, windowMs: 10 * 60 * 1000 })

function clientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
}

export async function POST(request: NextRequest) {
  const limited = limiter.take(clientIp(request))
  if (!limited.ok)
    return NextResponse.json(
      { ok: false, error: `요청이 너무 잦습니다. ${limited.retryAfterSec}초 뒤에 다시 보내세요.` },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } },
    )

  const auth = checkDraftToken(request.headers.get('authorization'), process.env[DRAFT_TOKEN_ENV])
  if (auth === 'unconfigured') {
    console.error(`${DRAFT_TOKEN_ENV} is not set (or shorter than ${MIN_DRAFT_TOKEN_LENGTH} chars) — /api/drafts is closed.`)
    return NextResponse.json({ ok: false, error: '초안 업로드가 서버에 설정되지 않았습니다.' }, { status: 503 })
  }
  if (auth !== 'ok') return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const declared = Number(request.headers.get('content-length') ?? 0)
  if (declared > DRAFT_LIMITS.maxBodyBytes)
    return NextResponse.json({ ok: false, error: `요청이 너무 큽니다(최대 ${DRAFT_LIMITS.maxBodyBytes / 1e6}MB).` }, { status: 413 })

  let raw: unknown
  try {
    const text = await request.text()
    if (Buffer.byteLength(text) > DRAFT_LIMITS.maxBodyBytes)
      return NextResponse.json({ ok: false, error: `요청이 너무 큽니다(최대 ${DRAFT_LIMITS.maxBodyBytes / 1e6}MB).` }, { status: 413 })
    raw = JSON.parse(text)
  } catch {
    return NextResponse.json({ ok: false, error: '요청 본문이 JSON이 아닙니다.' }, { status: 400 })
  }

  const parsed = parseDraftRequest(raw)
  if (!parsed.ok) return NextResponse.json(parsed.response.body, { status: parsed.response.status })

  try {
    const result = await processDraft(parsed.request, createDraftDeps(), request.nextUrl.origin)
    return NextResponse.json(result.body, { status: result.status })
  } catch (error) {
    console.error('Draft upload failed:', error)
    return NextResponse.json({ ok: false, error: '초안 저장 중 서버 오류가 났습니다.' }, { status: 500 })
  }
}
