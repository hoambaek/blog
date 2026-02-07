'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClerkProvider, UserButton } from '@clerk/nextjs'
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Mail,
  Users,
  Settings,
  Menu,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ToastProvider } from '@/components/ui/toast'
import { useLocale } from '@/lib/i18n'

function SidebarContent() {
  const pathname = usePathname()
  const { locale } = useLocale()

  const text = {
    ko: {
      dashboard: '대시보드',
      posts: '포스트',
      categories: '카테고리',
      newsletter: '뉴스레터',
      subscribers: '구독자',
      settings: '설정',
      backToSite: '← 사이트로 돌아가기',
      openMenu: '메뉴 열기',
    },
    en: {
      dashboard: 'Dashboard',
      posts: 'Posts',
      categories: 'Categories',
      newsletter: 'Newsletter',
      subscribers: 'Subscribers',
      settings: 'Settings',
      backToSite: '← Back to Site',
      openMenu: 'Open menu',
    },
  }

  const t = locale === 'ko' ? text.ko : text.en

  const sidebarLinks = [
    { name: t.dashboard, href: '/admin', icon: LayoutDashboard },
    { name: t.posts, href: '/admin/posts', icon: FileText },
    { name: t.categories, href: '/admin/categories', icon: FolderOpen },
    { name: t.newsletter, href: '/admin/newsletter', icon: Mail },
    { name: t.subscribers, href: '/admin/subscribers', icon: Users },
    { name: t.settings, href: '/admin/settings', icon: Settings },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/admin" className="font-display text-lg">
          LE JOURNAL
        </Link>
        <p className="text-xs text-muted-foreground mt-1">Admin</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href ||
            (link.href !== '/admin' && pathname.startsWith(link.href))
          const Icon = link.icon

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`
                flex items-center gap-3 px-3 py-2 text-sm transition-colors
                ${isActive
                  ? 'bg-muted text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }
              `}
            >
              <Icon className="h-4 w-4" />
              {link.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t.backToSite}
        </Link>
      </div>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { locale } = useLocale()

  const text = {
    ko: { openMenu: '메뉴 열기' },
    en: { openMenu: 'Open menu' },
  }

  const t = locale === 'ko' ? text.ko : text.en

  return (
    <ClerkProvider>
    <ToastProvider>
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b border-border bg-background px-4 lg:hidden">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">{t.openMenu}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
        <div className="flex-1">
          <Link href="/admin" className="font-display text-lg">
            LE JOURNAL ADMIN
          </Link>
        </div>
        <UserButton afterSignOutUrl="/" />
      </header>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-border bg-card">
          <SidebarContent />
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:pl-64">
          {/* Desktop header */}
          <header className="hidden lg:flex h-14 items-center justify-end gap-4 border-b border-border bg-background px-6">
            <UserButton afterSignOutUrl="/" />
          </header>

          {/* Page content */}
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
    </ToastProvider>
    </ClerkProvider>
  )
}
