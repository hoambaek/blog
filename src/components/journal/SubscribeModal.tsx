'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { sendGAEvent } from '@next/third-parties/google'
import { subscribe } from '@/lib/actions/subscribers'
import { useLocale, useTranslation } from '@/lib/i18n'
import { fillText } from '@/lib/i18n/dictionaries/journal'
import { PRIVACY_URL } from '@/lib/journal/links'

/*
 * 구독 — 사이트에서 구독을 받는 곳은 뉴스레터 밴드(푸터 위)와 이 모달뿐이다.
 * 흐름: 밴드에서 이메일 → ① 확인(이메일·이름 선택·개인정보 동의 필수) → ② 완료 / ③ 이미 구독 중.
 * 데스크톱은 가운데 모달(520px), 모바일(767px 이하)은 바텀 시트. Paper HRN·HSC·HT0 / HTO·HUF·HV5.
 */

type Step = 'form' | 'done' | 'already'

interface SubscribeContextValue {
  openSubscribe: (email?: string, source?: string) => void
}

const SubscribeContext = createContext<SubscribeContextValue | null>(null)

export function useSubscribe() {
  const ctx = useContext(SubscribeContext)
  if (!ctx) throw new Error('useSubscribe must be used within SubscribeProvider')
  return ctx
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'

export function SubscribeProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('form')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [consent, setConsent] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')
  const [error, setError] = useState('')
  const [source, setSource] = useState('newsletter-band')
  /* 봇 판별용 — 페이지에 들어온 뒤 제출까지 걸린 시간 (subscribe 액션 MIN_SUBMIT_MS 참고) */
  const mountedAt = useRef(0)
  const dialogRef = useRef<HTMLDivElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const { locale } = useLocale()
  const t = useTranslation().journal.newsletter

  useEffect(() => {
    mountedAt.current = Date.now()
  }, [])

  const openSubscribe = useCallback((initialEmail?: string, from?: string) => {
    returnFocus.current = document.activeElement as HTMLElement | null
    setEmail(initialEmail ?? '')
    setName('')
    setConsent(false)
    setError('')
    setStatus('idle')
    setStep('form')
    setSource(from ?? 'newsletter-band')
    setOpen(true)
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    requestAnimationFrame(() => returnFocus.current?.focus?.())
  }, [])

  // 열려 있는 동안: 본문 스크롤 잠금, ESC 닫기, 포커스 가두기
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
        return
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const items = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
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
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, close])

  // 단계가 바뀔 때마다 첫 입력(또는 주 버튼)으로 포커스
  useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => {
      const root = dialogRef.current
      if (!root) return
      const target =
        step === 'form'
          ? root.querySelector<HTMLInputElement>(email ? 'input[name="name"]' : 'input[name="email"]')
          : root.querySelector<HTMLElement>('[data-primary]')
      target?.focus()
    })
    return () => cancelAnimationFrame(id)
    // email은 처음 열릴 때의 값만 본다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = email.trim()
    if (!EMAIL_RE.test(value)) {
      setError(t.invalidEmail)
      return
    }
    if (!consent) {
      setError(t.consentRequired)
      return
    }
    setError('')
    setStatus('loading')
    try {
      const result = await subscribe({
        email: value,
        name: name.trim() || undefined,
        source,
        locale,
        honeypot,
        elapsedMs: Date.now() - mountedAt.current,
      })
      if (result.success) {
        setEmail(value)
        setStep('done')
        if ('dataLayer' in window) sendGAEvent('event', 'subscribe_submit', { source })
      } else if (result.code === 'already_subscribed') {
        setEmail(value)
        setStep('already')
      } else {
        setError(result.error || t.error)
      }
    } catch {
      setError(t.error)
    } finally {
      setStatus('idle')
    }
  }

  const body = (template: string) =>
    fillText(template, { email }).split('\n').map((line, i) => (
      <span key={i} className="block">
        {line}
      </span>
    ))

  return (
    <SubscribeContext.Provider value={{ openSubscribe }}>
      {children}
      <div
        className={`subscribe-layer${open ? ' is-open' : ''}`}
        aria-hidden={!open}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) close()
        }}
      >
        {/* 닫혀 있을 때도 DOM에 두고 visibility로 감춘다 — 닫힘 전환이 끊기지 않게 */}
        <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="subscribe-title"
            className="subscribe-sheet flex flex-col gap-6 bg-paper px-5 pb-9 pt-3.5 text-earth md:w-[520px] md:gap-7 md:px-[52px] md:pb-11 md:pt-12"
          >
            {/* 모바일 시트 손잡이 */}
            <div className="flex justify-center md:hidden" aria-hidden="true">
              <span className="h-[3px] w-9 bg-earth/25" />
            </div>

            <div className="flex items-center justify-between">
              <span className="font-plex text-[10.5px] leading-[14px] tracking-[0.18em] text-amber-deep md:text-[11px]">
                {t.label}
              </span>
              <button
                type="button"
                onClick={close}
                aria-label={t.close}
                className="-m-2 p-2 text-stone transition-colors hover:text-earth"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <line x1="2" y1="2" x2="18" y2="18" stroke="currentColor" strokeWidth="1" />
                  <line x1="18" y1="2" x2="2" y2="18" stroke="currentColor" strokeWidth="1" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-2.5 md:gap-3">
              <span className="font-garamond text-[18px] italic leading-[22px] text-stone-light md:text-[20px] md:leading-6">
                Le Journal de Marée
              </span>
              <h2
                id="subscribe-title"
                className="font-serif-kr text-[23px] font-light leading-8 md:text-[28px] md:leading-[38px]"
              >
                {step === 'form' ? t.title : step === 'done' ? t.doneTitle : t.alreadyTitle}
              </h2>
              <p className="font-sans-kr text-[13.5px] font-light leading-[22px] text-earth/70 md:text-[14px] md:leading-6">
                {step === 'form' ? t.subtitle : body(step === 'done' ? t.doneBody : t.alreadyBody)}
              </p>
            </div>

            {step === 'form' ? (
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6 md:gap-7">
                <input
                  type="text"
                  name="company"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute left-[-9999px] h-0 w-0 opacity-0"
                />
                <div className="mt-1 flex flex-col gap-5 md:gap-[22px]">
                  <label className="flex flex-col gap-[9px] border-b border-earth/45 pb-[11px] md:gap-2.5 md:pb-3">
                    <span className="font-plex text-[10px] leading-3 tracking-[0.16em] text-stone-light md:text-[10.5px] md:leading-[14px]">
                      {t.email}
                    </span>
                    <input
                      type="email"
                      name="email"
                      inputMode="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.placeholder}
                      className="bg-transparent font-sans-kr text-[15px] leading-[18px] text-earth outline-none placeholder:font-light placeholder:text-earth/40"
                    />
                  </label>
                  <label className="flex flex-col gap-[9px] border-b border-earth/25 pb-[11px] md:gap-2.5 md:pb-3">
                    <span className="font-plex text-[10px] leading-3 tracking-[0.16em] text-stone-light md:text-[10.5px] md:leading-[14px]">
                      {t.name}
                    </span>
                    <input
                      type="text"
                      name="name"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t.namePlaceholder}
                      className="bg-transparent font-sans-kr text-[15px] leading-[18px] text-earth outline-none placeholder:font-light placeholder:text-earth/40"
                    />
                  </label>
                </div>

                <label className="flex cursor-pointer items-start gap-[11px] md:gap-3">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    required
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center border border-earth bg-transparent text-[11px] leading-[11px] text-paper transition-colors peer-checked:bg-earth peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amber-deep"
                  >
                    {consent ? '✓' : ''}
                  </span>
                  <span className="font-sans-kr text-[12.5px] font-light leading-5 text-stone-dark md:text-[13px] md:leading-[21px]">
                    {t.consent}{' '}
                    <a
                      href={PRIVACY_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-earth/30 underline-offset-[3px] hover:decoration-earth"
                    >
                      {t.privacy}
                    </a>
                  </span>
                </label>

                {error && (
                  <p role="alert" className="-my-2 font-sans-kr text-[12.5px] font-light leading-5 text-[#8A3B2E]">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="flex items-center justify-center gap-2.5 bg-void px-6 py-[14px] font-sans-kr text-[14px] leading-[18px] tracking-[0.06em] text-paper transition-opacity hover:opacity-90 disabled:opacity-60 md:mt-1 md:gap-3 md:px-7 md:py-[15px] md:text-[15px]"
                >
                  {status === 'loading' ? t.processing : t.submit}
                  {status !== 'loading' && <span aria-hidden="true">›</span>}
                </button>
                <p className="text-center font-sans-kr text-[11.5px] font-light leading-[18px] text-stone-light md:text-[12px]">
                  {t.unsubscribeNote}
                </p>
              </form>
            ) : (
              <>
                <button
                  type="button"
                  data-primary
                  onClick={close}
                  className="mt-1 flex items-center justify-center border border-earth/45 px-7 py-[14px] font-sans-kr text-[14px] leading-[18px] tracking-[0.06em] text-earth transition-colors hover:border-earth md:text-[15px]"
                >
                  {t.back}
                </button>
                <p className="text-center font-sans-kr text-[11.5px] font-light leading-[18px] text-stone-light md:text-[12px]">
                  {step === 'done' ? t.doneNote : t.alreadyNote}
                </p>
              </>
            )}
          </div>
      </div>
    </SubscribeContext.Provider>
  )
}
