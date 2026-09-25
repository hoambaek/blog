'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import { useLocale, useTranslation, type Locale } from '@/lib/i18n'
import { fillText } from '@/lib/i18n/dictionaries/journal'
import { MAIN_MENU, mainSiteHref } from '@/lib/journal/links'

/*
 * 전체 화면 메뉴 — 메인 사이트(landing src/components/layout/Header.tsx) 메뉴 오버레이와 같은 모양.
 * 01 Home … 07 Partnership은 메인 사이트 절대 주소, 08 Journal은 이 블로그(활성).
 * 언어는 KR·EN만(블로그에 FR이 없다). 관측 줄 수온은 메인 사이트 메뉴와 같은 소스, 측정 일수도 같은 기점.
 */

/** 측정 시작일 — landing src/lib/measurement.ts MEASURE_START(2023-02-11 첫 입수)와 같은 값 */
const MEASURE_START = Date.UTC(2023, 1, 11)

/** 오늘 기준 측정 경과일 — 입수 당일이 1일째 */
function computeMeasureDays(): number {
  return Math.floor((Date.now() - MEASURE_START) / 86_400_000) + 1
}

const noopSubscribe = () => () => {}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function MenuOverlay({
  open,
  onClose,
  seaTemp,
}: {
  open: boolean
  onClose: () => void
  seaTemp: number | null
}) {
  const { locale, setLocale } = useLocale()
  const t = useTranslation().journal
  const overlayRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  // 포털·측정 일수는 브라우저에서만 채운다(서버 스냅숏 null → 하이드레이션 불일치 없음).
  // 메뉴는 마운트 뒤에야 열리므로 빈 값이 보이지 않는다.
  const measureDays = useSyncExternalStore(noopSubscribe, computeMeasureDays, () => null)
  const mounted = measureDays !== null

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const raf = requestAnimationFrame(() => closeRef.current?.focus())
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab' && overlayRef.current) {
        const items = overlayRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
        if (!items.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(raf)
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!mounted) return null

  const lang = locale === 'en' ? 'en' : 'ko'
  const recLine =
    seaTemp !== null
      ? `${t.menu.recLocation} · ${fillText(t.menu.recTemp, { t: seaTemp.toFixed(1) })}`
      : t.menu.recLocation
  const locales: { code: Locale; label: string }[] = [
    { code: 'ko', label: 'KR' },
    { code: 'en', label: 'EN' },
  ]

  return createPortal(
    <div
      ref={overlayRef}
      className={`menu-overlay${open ? ' is-open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={t.nav.menuLabel}
      aria-hidden={!open}
    >
      <span className="menu-overlay__watermark" aria-hidden="true">
        <Image src="/images/logo/logo_trans_W_lg.png" alt="" width={820} height={680} />
      </span>

      <div className="menu-overlay__top">
        <Link href="/" className="menu-overlay__logo" onClick={onClose} aria-label={t.nav.home}>
          <Image src="/images/logo/logo_text_trans_W.png" alt="MUSE DE MARÉE" width={1000} height={152} />
        </Link>
        <button ref={closeRef} className="menu-overlay__close" onClick={onClose} aria-label={t.nav.menuClose}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <line x1="1" y1="1" x2="19" y2="19" stroke="#312E2A" strokeWidth="0.8" opacity="0.85" />
            <line x1="19" y1="1" x2="1" y2="19" stroke="#312E2A" strokeWidth="0.8" opacity="0.85" />
          </svg>
        </button>
      </div>

      <nav className="menu-overlay__nav">
        {MAIN_MENU.map((link, i) => (
          <a key={link.anchor} href={mainSiteHref(lang, link.anchor)} className="menu-overlay__link" onClick={onClose}>
            <span className="menu-overlay__link-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="menu-overlay__link-label">{link.label}</span>
          </a>
        ))}
        <Link href="/" className="menu-overlay__link is-active" aria-current="page" onClick={onClose}>
          <span className="menu-overlay__link-num">08</span>
          <span className="menu-overlay__link-label">Journal</span>
        </Link>
      </nav>

      <div className="menu-overlay__bottom">
        <div className="menu-overlay__bottom-left">
          <span className="menu-overlay__creed">{t.menu.brandLine}</span>
          <div className="menu-overlay__rec">
            <span className="menu-overlay__rec-line">{recLine}</span>
            <span className="menu-overlay__rec-days">{fillText(t.menu.recDays, { n: measureDays })}</span>
          </div>
        </div>
        <div className="menu-overlay__lang">
          {locales.map((l) => (
            <button
              key={l.code}
              type="button"
              className={locale === l.code ? 'menu-overlay__lang-active' : ''}
              aria-pressed={locale === l.code}
              onClick={() => setLocale(l.code)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}
