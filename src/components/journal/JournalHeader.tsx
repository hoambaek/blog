'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale, useTranslation, getCategoryName, type Locale } from '@/lib/i18n'
import { useVisibleCategories } from '@/components/layout/VisibleCategories'
import { MenuOverlay } from './MenuOverlay'

/*
 * 저널 헤더 — 브랜드 줄(심볼·워드마크·메뉴) + 저널 줄(Le Journal de Marée · 전체 기록 · 연재들 · 소개 · 검색 · KO/EN).
 * 스크롤 동작은 journal.css 머리말(Paper SPEC '헤더 스크롤 동작') 참고.
 * 검색이 펼쳐져 있거나, 메뉴가 열려 있거나, 키보드 포커스가 헤더 안에 있으면 접지 않는다.
 */

type HeaderState = 'full' | 'journal' | 'hidden'

const BRAND_FOLD_AT = 64
const JOURNAL_FOLD_AT = 240
const DIRECTION_THRESHOLD = 8

export interface HeaderSeries {
  slug: string
  name: string
}

function SearchIcon({ color }: { color: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="5.2" fill="none" stroke={color} strokeWidth="1.1" />
      <line x1="10.4" y1="10.4" x2="14" y2="14" stroke={color} strokeWidth="1.1" />
    </svg>
  )
}

function Burger() {
  return (
    <span className="jh-burger" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  )
}

export function JournalHeader({ series, seaTemp }: { series: HeaderSeries[]; seaTemp: number | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslation()
  const j = t.journal
  const { locale, setLocale } = useLocale()
  // 발행 글이 있는 연재만 (VisibleCategoriesProvider — (public)/layout)
  const visibleSeries = useVisibleCategories(series)

  const [state, setState] = useState<HeaderState>('full')
  const [dir, setDir] = useState<'fold' | 'unfold' | undefined>(undefined)
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [focusInside, setFocusInside] = useState(false)
  const [query, setQuery] = useState('')

  const headerRef = useRef<HTMLElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchButtonRef = useRef<HTMLButtonElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const stateRef = useRef<HeaderState>('full')
  const pinnedRef = useRef(false)

  const pinned = searchOpen || menuOpen || focusInside
  useEffect(() => {
    pinnedRef.current = pinned
  }, [pinned])

  const apply = useCallback((next: HeaderState) => {
    const prev = stateRef.current
    if (prev === next) return
    const rank = { full: 0, journal: 1, hidden: 2 }
    setDir(rank[next] > rank[prev] ? 'fold' : 'unfold')
    stateRef.current = next
    setState(next)
  }, [])

  // 스크롤 방향 판정 — 8px 이상 움직였을 때만 방향을 바꾼다
  useEffect(() => {
    let anchor = window.scrollY
    let direction: 'down' | 'up' = 'down'
    let ticking = false

    const update = () => {
      ticking = false
      const y = Math.max(0, window.scrollY)
      if (y <= BRAND_FOLD_AT) {
        anchor = y
        apply('full')
        return
      }
      const delta = y - anchor
      if (Math.abs(delta) >= DIRECTION_THRESHOLD) {
        direction = delta > 0 ? 'down' : 'up'
        anchor = y
      } else if (direction === 'down' && y < anchor) {
        anchor = y // 아래로 가다 멈칫한 작은 되돌림은 기준점만 옮긴다
      } else if (direction === 'up' && y > anchor) {
        anchor = y
      }

      const current = stateRef.current
      if (direction === 'down') {
        if (pinnedRef.current) return
        apply(y > JOURNAL_FOLD_AT ? 'hidden' : 'journal')
      } else if (current !== 'journal') {
        apply('journal')
      }
    }

    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [apply])

  // 고정 사유(검색·메뉴·포커스)가 생길 때 사라진 헤더를 저널 줄까지 되살린다
  const reveal = useCallback(() => {
    if (stateRef.current === 'hidden') apply('journal')
  }, [apply])

  // 페이지를 옮기면 검색·메뉴를 닫는다 (렌더 중 이전 경로와 비교 — effect에서 상태를 바꾸지 않는다)
  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setSearchOpen(false)
    setMenuOpen(false)
  }

  useEffect(() => {
    if (!searchOpen) return
    const raf = requestAnimationFrame(() => searchInputRef.current?.focus())
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false)
        searchButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [searchOpen])

  const closeMenu = useCallback(() => {
    setMenuOpen(false)
    requestAnimationFrame(() => menuButtonRef.current?.focus())
  }, [])

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setSearchOpen(false)
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  // 활성 항목: 목록·글 상세 → 전체 기록 / 연재 → 해당 연재 / 소개
  const active =
    pathname === '/' || pathname.startsWith('/post/')
      ? 'all'
      : pathname.startsWith('/category/')
        ? decodeURIComponent(pathname.split('/')[2] ?? '')
        : pathname === '/about'
          ? 'about'
          : ''

  const links = [
    { key: 'all', href: '/', label: j.nav.allRecords },
    ...visibleSeries.map((s) => ({ key: s.slug, href: `/category/${s.slug}`, label: getCategoryName(t, s.slug, s.name) })),
    { key: 'about', href: '/about', label: j.nav.about },
  ]

  const langs: { code: Locale; label: string }[] = [
    { code: 'ko', label: 'KO' },
    { code: 'en', label: 'EN' },
  ]

  return (
    <>
      <div className="jh-safe" aria-hidden="true" />
      <div className="jh-spacer" aria-hidden="true" />
      <header
        ref={headerRef}
        className="jh"
        data-state={state}
        data-dir={dir}
        onFocus={() => {
          setFocusInside(true)
          reveal()
        }}
        onBlur={(e) => {
          if (!headerRef.current?.contains(e.relatedTarget as Node | null)) setFocusInside(false)
        }}
      >
        {/* 브랜드 줄 */}
        <div className="jh-brand flex items-center justify-between px-5 md:px-12">
          <Link href="/" aria-label="Muse de Marée" className="block shrink-0 opacity-[0.92]">
            <Image
              src="/images/logo/logo_trans_W.png"
              alt=""
              width={1000}
              height={829}
              priority
              className="h-[25px] w-[30px] object-contain md:h-[31px] md:w-[38px]"
            />
          </Link>
          <Link href="/" className="absolute left-1/2 block -translate-x-1/2 opacity-[0.92]" aria-label={j.nav.home}>
            <Image
              src="/images/logo/logo_text_trans_W.png"
              alt="MUSE DE MARÉE"
              width={1000}
              height={152}
              priority
              className="h-[17px] w-[110px] object-contain md:h-[22px] md:w-[145px]"
            />
          </Link>
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={j.nav.menuOpen}
            aria-expanded={menuOpen}
            className="-mr-2 flex w-[46px] shrink-0 justify-end p-2 md:w-[54px]"
          >
            <Burger />
          </button>
        </div>

        {/* 저널 줄 */}
        <div className="jh-journal">
          <div className="flex h-full items-center justify-between gap-6 px-5 md:px-12">
            <Link
              href="/"
              className="hidden shrink-0 font-garamond text-[19px] italic leading-[22px] tracking-[0.01em] text-amber-light md:block"
            >
              Le Journal de Marée
            </Link>
            <div className="jh-shift-desktop flex min-w-0 flex-1 items-center gap-5 md:flex-none md:gap-9">
            <nav
              aria-label="Journal"
              className="jh-scroll flex min-w-0 flex-1 items-center gap-6 overflow-x-auto md:flex-none md:gap-9 md:overflow-visible"
            >
              {links.map((link) => {
                const isActive = active === link.key
                return (
                  <Link
                    key={link.key}
                    href={link.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`jh-link font-sans-kr text-[13px] leading-4 md:tracking-[0.04em] ${
                      isActive ? 'font-normal text-paper' : 'font-light text-paper/60 hover:text-paper'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>
            <div className="flex shrink-0 items-center gap-5 md:gap-9">
              <button
                ref={searchButtonRef}
                type="button"
                onClick={() => setSearchOpen((v) => !v)}
                aria-label={j.nav.search}
                aria-expanded={searchOpen}
                className="jh-shift-mobile -m-2 p-2"
              >
                <SearchIcon color={searchOpen ? '#CCAD7B' : 'rgb(241 239 235 / 75%)'} />
              </button>
              <div className="hidden items-center gap-[0.5em] font-plex text-[11px] leading-[14px] tracking-[0.14em] text-paper/60 md:flex">
                {langs.map((l, i) => (
                  <span key={l.code} className="flex items-center gap-[0.5em]">
                    {i > 0 && <span aria-hidden="true">/</span>}
                    <button
                      type="button"
                      onClick={() => setLocale(l.code)}
                      aria-pressed={locale === l.code}
                      className={locale === l.code ? 'text-paper' : 'hover:text-paper'}
                    >
                      {l.label}
                    </button>
                  </span>
                ))}
              </div>
            </div>
            </div>
          </div>
          {/* 브랜드 줄이 접혀 있을 때만 보이는 메뉴 버튼 — 비키는 묶음 밖에 두어야 오른쪽 끝에 고정된다 */}
          <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label={j.nav.menuOpen}
                tabIndex={state === 'full' ? -1 : 0}
                aria-hidden={state === 'full'}
                className="jh-journal-menu py-2"
              >
                <Burger />
              </button>

          {searchOpen && (
            <div className="jh-search">
              <form
                onSubmit={submitSearch}
                role="search"
                className="flex items-center gap-3.5 px-5 pb-[18px] pt-4 md:gap-6 md:px-12 md:pb-6 md:pt-[22px]"
              >
                <span className="hidden md:block">
                  <svg width="17" height="17" viewBox="0 0 15 15" aria-hidden="true">
                    <circle cx="6.5" cy="6.5" r="5.2" fill="none" stroke="#CCAD7B" strokeWidth="1.1" />
                    <line x1="10.4" y1="10.4" x2="14" y2="14" stroke="#CCAD7B" strokeWidth="1.1" />
                  </svg>
                </span>
                <input
                  ref={searchInputRef}
                  type="search"
                  name="q"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={j.search.placeholder}
                  aria-label={j.search.placeholder}
                  enterKeyHint="search"
                  className="min-w-0 flex-1 border-b border-paper/45 bg-transparent pb-2 font-serif-kr text-[18px] font-light leading-[22px] text-paper caret-amber outline-none placeholder:text-paper/35 md:pb-2.5 md:text-[22px] md:leading-7 [&::-webkit-search-cancel-button]:hidden"
                />
                <button
                  type="submit"
                  className="hidden font-plex text-[10.5px] leading-[14px] tracking-[0.16em] text-paper/50 hover:text-paper md:block"
                >
                  {j.search.enter}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false)
                    searchButtonRef.current?.focus()
                  }}
                  aria-label={j.search.close}
                  className="-m-2 p-2 text-paper/75 hover:text-paper"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <line x1="2" y1="2" x2="18" y2="18" stroke="currentColor" strokeWidth="1.2" />
                    <line x1="18" y1="2" x2="2" y2="18" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                </button>
              </form>
            </div>
          )}
        </div>
      </header>
      {searchOpen && <div className="jh-dim" aria-hidden="true" onClick={() => setSearchOpen(false)} />}
      <MenuOverlay open={menuOpen} onClose={closeMenu} seaTemp={seaTemp} />
    </>
  )
}
