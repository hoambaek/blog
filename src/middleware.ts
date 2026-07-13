import { clerkMiddleware, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function isAdminPath(pathname: string) {
  return pathname.startsWith('/admin')
}

// 관리자 API도 이메일 허용목록의 보호를 받아야 한다 (라우트 자체는 로그인만 검사)
function isAdminApiPath(pathname: string) {
  return pathname.startsWith('/api/admin') || pathname.startsWith('/api/upload')
}

// ADMIN_ALLOWED_EMAILS(쉼표 구분)가 설정되면 그 계정만 admin 접근 허용.
// 미설정이면 기존 동작(로그인한 사용자 전원 허용) — 로컬 개발 편의용.
const ALLOWED_EMAILS = (process.env.ADMIN_ALLOWED_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

// 요청마다 Clerk 백엔드 조회를 피하기 위한 인스턴스 수명 캐시
const allowCache = new Map<string, boolean>()

async function isAllowedAdmin(userId: string): Promise<boolean> {
  if (ALLOWED_EMAILS.length === 0) return true
  const cached = allowCache.get(userId)
  if (cached !== undefined) return cached
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const allowed = user.emailAddresses.some((entry) =>
      ALLOWED_EMAILS.includes(entry.emailAddress.toLowerCase()),
    )
    allowCache.set(userId, allowed)
    return allowed
  } catch (error) {
    console.error('Admin allowlist check failed:', error)
    return false // 확인 불가 시 차단 (fail-closed)
  }
}

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { pathname } = request.nextUrl

  // Only protect admin routes. /sign-in and /sign-up must stay reachable
  // for unauthenticated users, otherwise auth.protect() redirects them in a loop.
  if (isAdminPath(pathname) || isAdminApiPath(pathname)) {
    const { userId } = await auth.protect()
    if (!(await isAllowedAdmin(userId))) {
      if (isAdminApiPath(pathname)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
  return NextResponse.next()
})

export const config = {
  matcher: [
    // Run middleware on admin pages, auth pages, and the admin/upload API
    // routes. The API routes call auth() internally, which requires
    // clerkMiddleware to run on them — otherwise auth() throws and the
    // request fails with a 500.
    '/admin(.*)',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/admin/(.*)',
    '/api/upload(.*)',
  ],
}
