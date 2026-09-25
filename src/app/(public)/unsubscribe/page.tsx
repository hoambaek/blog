'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { unsubscribe } from '@/lib/actions/subscribers'
import { useTranslation } from '@/lib/i18n'
import { fillText } from '@/lib/i18n/dictionaries/journal'
import { useSubscribe } from '@/components/journal/SubscribeModal'

/*
 * 구독 해지 — Paper 'Journal — 구독 해지' I86·I98.
 * 해지 판단은 서버 액션(unsubscribe)의 HMAC 토큰 검증이 한다. 이 화면은 결과만 보여 준다.
 * ?email=만 있는 옛 링크는 해지하지 않고 '만료' 안내.
 */
function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const token = searchParams.get('token') || ''
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'expired'>(
    email && token ? 'idle' : 'expired',
  )
  const [message, setMessage] = useState('')
  const u = useTranslation().journal.unsubscribe
  const { openSubscribe } = useSubscribe()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !token) return
    setStatus('loading')
    try {
      const result = await unsubscribe(email, token)
      if (result.success) {
        setStatus('success')
      } else if (result.expired) {
        setStatus('expired')
      } else {
        setStatus('error')
        setMessage(u.error)
      }
    } catch {
      setStatus('error')
      setMessage(u.error)
    }
  }

  const lines = (template: string) =>
    fillText(template, { email }).split('\n').map((line, i) => (
      <span key={i} className="block">
        {line}
      </span>
    ))

  const title =
    status === 'success' ? u.doneTitle : status === 'expired' ? u.expiredTitle : u.confirmTitle
  const body =
    status === 'success' ? lines(u.doneBody) : status === 'expired' ? u.expiredBody : lines(u.confirmBody)

  const outline =
    'flex items-center justify-center border border-earth/45 px-7 py-[14px] font-sans-kr text-[14px] leading-[18px] tracking-[0.06em] text-earth transition-colors hover:border-earth md:text-[15px]'
  const solid =
    'flex items-center justify-center gap-3 bg-void px-7 py-[14px] font-sans-kr text-[14px] leading-[18px] tracking-[0.06em] text-paper transition-opacity hover:opacity-90 disabled:opacity-60 md:py-[15px] md:text-[15px]'

  return (
    <section className="flex min-h-[calc(100svh-260px)] flex-col items-center justify-center gap-[18px] px-5 py-20 text-center md:min-h-[688px] md:gap-[22px] md:pb-10">
      <span className="font-plex text-[10.5px] leading-[14px] tracking-[0.18em] text-amber-deep md:text-[11px]">
        NEWSLETTER
      </span>
      <h1 className="font-serif-kr text-[30px] font-light leading-10 md:text-[40px] md:leading-[52px]">{title}</h1>
      <p className="max-w-[560px] font-sans-kr text-[14.5px] font-light leading-[26px] text-earth/75 md:text-[15.5px] md:leading-7">
        {body}
      </p>

      {status === 'success' && (
        <div className="mt-2 flex w-full flex-col gap-3.5 sm:w-auto sm:flex-row md:mt-[18px]">
          <button type="button" className={outline} onClick={() => openSubscribe(email, 'unsubscribe-page')}>
            {u.resubscribe}
          </button>
          <Link href="/" className={solid}>
            {u.toJournal} <span aria-hidden="true">›</span>
          </Link>
        </div>
      )}

      {status === 'expired' && (
        <div className="mt-2 flex md:mt-[18px]">
          <Link href="/" className={solid}>
            {u.toJournal} <span aria-hidden="true">›</span>
          </Link>
        </div>
      )}

      {(status === 'idle' || status === 'loading' || status === 'error') && (
        <form onSubmit={handleSubmit} className="mt-2 flex w-full flex-col gap-3.5 sm:w-auto sm:flex-row md:mt-[18px]">
          <Link href="/" className={outline}>
            {u.cancel}
          </Link>
          <button type="submit" disabled={status === 'loading'} className={solid}>
            {status === 'loading' ? u.processing : u.submit}
          </button>
        </form>
      )}

      {status === 'error' && (
        <p role="alert" className="font-sans-kr text-[13px] font-light leading-5 text-[#8A3B2E]">
          {message}
        </p>
      )}
    </section>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<section className="min-h-[60vh]" />}>
      <UnsubscribeContent />
    </Suspense>
  )
}
