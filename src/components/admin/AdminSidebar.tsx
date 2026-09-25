'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { SignOutButton } from '@clerk/nextjs'

/* 관리자 사이드바 — Paper IEU-0 (232px, void #0A0908) */

interface Counts {
  records: number
  newsletters: number
  subscribers: number
  series: number
}

const LINKS: { href: string; label: string; key: keyof Counts }[] = [
  { href: '/admin', label: '기록', key: 'records' },
  { href: '/admin/newsletter', label: '뉴스레터', key: 'newsletters' },
  { href: '/admin/subscribers', label: '구독자', key: 'subscribers' },
  { href: '/admin/series', label: '연재', key: 'series' },
]

export function AdminSidebar({ counts, email }: { counts: Counts; email: string | null }) {
  const pathname = usePathname()
  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href))

  return (
    <>
    {/* 모바일: 깨지지 않을 정도로만 — 한 줄 메뉴 */}
    <nav className="flex items-center gap-5 overflow-x-auto bg-void px-5 py-3 md:hidden">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`shrink-0 text-[13px] ${isActive(link.href) ? 'text-paper' : 'font-light text-paper/60'}`}
        >
          {link.label} <span className="font-plex text-[10.5px] text-amber">{counts[link.key]}</span>
        </Link>
      ))}
    </nav>
    <aside className="sticky top-0 flex h-screen w-[232px] shrink-0 flex-col justify-between bg-void px-6 py-7 max-md:hidden">
      <div className="flex flex-col gap-10">
        <Link href="/admin" className="flex flex-col gap-3" aria-label="Le Journal Admin">
          <Image
            src="/images/logo/logo_text_trim_W.png"
            alt="Muse de Marée"
            width={941}
            height={152}
            className="h-[17px] w-auto self-start opacity-90"
            priority
          />
          <span className="font-garamond text-[17px] italic leading-[22px] text-amber-light">Le Journal · Admin</span>
        </Link>
        <nav className="flex flex-col">
          {LINKS.map((link) => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center justify-between py-[11px] transition-colors ${
                  active
                    ? '-mx-3 border-l border-amber bg-paper/[0.07] px-3 text-paper'
                    : 'font-light text-paper/65 hover:text-paper'
                }`}
              >
                <span className="text-[14px] leading-[18px]">{link.label}</span>
                <span className={`font-plex text-[11px] leading-[14px] ${active ? 'text-amber' : 'text-paper/40'}`}>
                  {counts[link.key]}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="flex flex-col gap-3.5 border-t border-paper/[0.12] pt-[18px]">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] font-light leading-4 text-paper/65 transition-colors hover:text-paper"
        >
          블로그 보기 ↗
        </a>
        {email && (
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate font-plex text-[10.5px] leading-[14px] tracking-[0.04em] text-paper/45">{email}</span>
            <SignOutButton redirectUrl="/">
              <button type="button" className="shrink-0 text-[11px] font-light text-paper/40 hover:text-paper">
                나가기
              </button>
            </SignOutButton>
          </div>
        )}
      </div>
    </aside>
    </>
  )
}
