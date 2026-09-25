import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { ToastProvider } from '@/components/ui/toast'

/*
 * 관리자 공통 틀 — Clerk·토스트·.admin 톤(globals.css).
 * 사이드바가 있는 화면은 (main)/layout, 편집·검수·미리보기는 사이드바 없이 전체 화면을 쓴다(Paper 'Blog Admin').
 * 서체는 공개 화면과 같은 4종(root layout)만 쓴다 — 옛 관리자 서체(legacy-fonts)는 걷어냈다.
 */
export const metadata: Metadata = {
  title: 'Le Journal · Admin',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ToastProvider>
        <div className="admin">{children}</div>
      </ToastProvider>
    </ClerkProvider>
  )
}
