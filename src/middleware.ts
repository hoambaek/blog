import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function isAdminPath(pathname: string) {
  return pathname.startsWith('/admin') || pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')
}

export default clerkMiddleware(async (auth, request: NextRequest) => {
  // Clerk only processes admin-related routes
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
