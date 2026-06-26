import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function isAdminPath(pathname: string) {
  return pathname.startsWith('/admin')
}

export default clerkMiddleware(async (auth, request: NextRequest) => {
  // Only protect admin routes. /sign-in and /sign-up must stay reachable
  // for unauthenticated users, otherwise auth.protect() redirects them in a loop.
  if (isAdminPath(request.nextUrl.pathname)) {
    await auth.protect()
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
