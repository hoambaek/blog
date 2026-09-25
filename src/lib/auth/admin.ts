import 'server-only'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { unstable_rethrow } from 'next/navigation'
import { NextResponse } from 'next/server'

/*
 * 서버측 관리자 확인 — 서버 액션과 /api/admin/* 라우트가 공용으로 쓴다.
 *
 * 규칙은 middleware.ts와 같다: Clerk 로그인 + ADMIN_ALLOWED_EMAILS(쉼표 구분) 허용목록.
 * 다른 점 하나: 허용목록이 비어 있으면 middleware는 로그인한 전원을 통과시키지만,
 * 여기서는 전원 거부한다(fail-closed). service role로 RLS를 우회하는 코드의 마지막 관문이라
 * "설정을 빠뜨리면 열린다"가 아니라 "설정을 빠뜨리면 닫힌다"여야 한다.
 *
 * 서버 액션은 어느 경로로든 POST할 수 있어 middleware matcher를 비켜 갈 수 있다.
 * 그 경우 auth()가 예외를 던지는데, 그것도 거부로 처리한다.
 */

function getAllowedEmails(): string[] {
  return (process.env.ADMIN_ALLOWED_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

// Clerk 백엔드 조회를 줄이기 위한 인스턴스 캐시 (허용목록 변경이 늦게 반영되지 않도록 짧게)
const CACHE_TTL_MS = 5 * 60 * 1000
const allowCache = new Map<string, { allowed: boolean; at: number }>()

async function isAllowlisted(userId: string, allowedEmails: string[]): Promise<boolean> {
  const cached = allowCache.get(userId)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.allowed
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const allowed = user.emailAddresses.some((entry) =>
      allowedEmails.includes(entry.emailAddress.toLowerCase()),
    )
    allowCache.set(userId, { allowed, at: Date.now() })
    return allowed
  } catch (error) {
    console.error('Admin allowlist check failed:', error)
    return false // 확인 불가 시 차단
  }
}

type AdminCheck =
  | { ok: true; userId: string }
  | { ok: false; reason: 'unauthenticated' | 'forbidden' }

export async function checkAdmin(): Promise<AdminCheck> {
  let userId: string | null = null
  try {
    ;({ userId } = await auth())
  } catch (error) {
    // 정적 렌더 중단 신호 등 Next 내부 제어 흐름은 삼키지 않는다
    unstable_rethrow(error)
    console.error('Admin auth check failed:', error)
    return { ok: false, reason: 'unauthenticated' }
  }
  if (!userId) return { ok: false, reason: 'unauthenticated' }

  const allowedEmails = getAllowedEmails()
  if (allowedEmails.length === 0) {
    console.error('ADMIN_ALLOWED_EMAILS is not set — denying all server-side admin access (fail-closed).')
    return { ok: false, reason: 'forbidden' }
  }
  if (!(await isAllowlisted(userId, allowedEmails))) return { ok: false, reason: 'forbidden' }
  return { ok: true, userId }
}

export const ADMIN_FORBIDDEN_MESSAGE = '관리자 권한이 없습니다.'

/** 관리자 조회용 서버 액션: 관리자가 아니면 예외를 던진다. */
export async function requireAdmin(): Promise<string> {
  const result = await checkAdmin()
  if (!result.ok) throw new Error(ADMIN_FORBIDDEN_MESSAGE)
  return result.userId
}

/**
 * /api/admin/* 라우트용. 통과하면 { userId }, 아니면 그대로 반환할 응답을 준다.
 *   const guard = await guardAdminApi(); if (!guard.ok) return guard.response
 */
export async function guardAdminApi(): Promise<
  { ok: true; userId: string } | { ok: false; response: NextResponse }
> {
  const result = await checkAdmin()
  if (result.ok) return result
  return result.reason === 'unauthenticated'
    ? { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
    : { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
}
