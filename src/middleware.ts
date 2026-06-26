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
    // Only run middleware on admin and auth routes
    '/admin(.*)',
    '/sign-in(.*)',
    '/sign-up(.*)',
  ],
}
