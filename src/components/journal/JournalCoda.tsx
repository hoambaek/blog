'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslation, getCategoryName, getCategoryDescription } from '@/lib/i18n'
import { countText } from '@/lib/i18n/dictionaries/journal'
import { seriesFrench } from '@/lib/journal/series'
import { pad2 } from '@/lib/journal/format'
import { useSubscribe } from './SubscribeModal'

/*
 * 푸터 위 어두운 밴드 — 연재 밴드 + 뉴스레터 밴드 (Paper 목록·연재·소개 화면 공통).
 * 뉴스레터 밴드는 사이트에서 구독을 받는 유일한 자리다. 이메일을 받아 구독 모달(①확인)로 넘긴다.
 */

export interface CodaSeries {
  slug: string
  name: string
  description: string | null
  count: number
  index: number
}

export function JournalCoda({
  series,
  currentSlug,
  continued = false,
}: {
  series: CodaSeries[]
  /** 바로 위가 같은 어두운 섹션일 때(소개 화면) 위 여백을 줄여 이어 붙인다 */
  continued?: boolean
  /** 연재 페이지에서는 지금 연재를 빼고 '다른 연재'로 보여 준다 */
  currentSlug?: string
}) {
  const t = useTranslation()
  const j = t.journal
  const { locale } = useLocale()
  const { openSubscribe } = useSubscribe()
  const [email, setEmail] = useState('')

  const shown = currentSlug ? series.filter((s) => s.slug !== currentSlug) : series

  return (
    <section
      className={`flex flex-col gap-10 bg-void px-5 pb-12 text-paper md:gap-[88px] md:px-24 md:pb-[88px] ${
        continued ? 'pt-6' : 'pt-14 md:pt-24'
      }`}
    >
      {shown.length > 0 && (
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-12">
          {shown.map((s) => (
            <Link
              key={s.slug}
              href={`/category/${s.slug}`}
              className="group flex flex-col gap-3 border-t border-paper/20 pt-[18px] md:gap-[18px] md:pt-6"
            >
              <span className="flex justify-between font-plex text-[10.5px] leading-[14px] md:text-[11px]">
                <span className="tracking-[0.18em] text-amber">
                  {currentSlug ? j.series.others : `${j.series.label} ${pad2(s.index)}`}
                </span>
                <span className="tracking-[0.14em] text-paper/50">{countText(j.series.countOne, j.series.count, s.count)}</span>
              </span>
              <span className="font-serif-kr text-[26px] font-light leading-[34px] transition-opacity group-hover:opacity-80 md:text-[32px] md:leading-[42px]">
                {getCategoryName(t, s.slug, s.name)}
              </span>
              {seriesFrench(s.slug) && (
                <span className="hidden font-garamond text-[20px] font-light italic leading-[26px] text-paper/60 md:block">
                  {seriesFrench(s.slug)}
                </span>
              )}
              <span className="font-sans-kr text-[13.5px] font-light leading-[22px] text-paper/70 md:text-[14px] md:leading-6">
                {getCategoryDescription(locale, s.slug, s.description)}
              </span>
            </Link>
          ))}
        </div>
      )}

      <div
        className={`flex flex-col gap-[18px] md:flex-row md:items-end md:justify-between md:gap-16 ${
          shown.length > 0 ? 'border-t border-paper/10 pt-9 md:pt-14' : ''
        }`}
      >
        <div className="flex flex-col gap-[18px] md:gap-3">
          <span className="font-plex text-[10.5px] leading-[14px] tracking-[0.18em] text-amber md:text-[11px]">
            {j.newsletter.label}
          </span>
          <h2 className="font-serif-kr text-[21px] font-light leading-[30px] md:text-[26px] md:leading-9">
            {j.newsletter.title}
          </h2>
        </div>
        <form
          className="flex flex-col gap-[18px] md:flex-row md:items-end md:gap-5"
          onSubmit={(e) => {
            e.preventDefault()
            openSubscribe(email.trim(), 'newsletter-band')
          }}
        >
          <label className="mt-2 flex flex-col gap-2.5 border-b border-paper/45 pb-3 md:mt-0 md:w-[360px] md:shrink-0">
            <span className="font-plex text-[10px] leading-3 tracking-[0.16em] text-paper/55 md:text-[10.5px] md:leading-[14px]">
              {j.newsletter.email}
            </span>
            <input
              type="email"
              name="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={j.newsletter.placeholder}
              className="bg-transparent font-sans-kr text-[15px] leading-[18px] text-paper outline-none placeholder:font-light placeholder:text-paper/40"
            />
          </label>
          <button
            type="submit"
            className="flex items-center justify-center gap-2.5 bg-amber px-6 py-[14px] font-sans-kr text-[14px] leading-[18px] tracking-[0.06em] text-void transition-opacity hover:opacity-90 md:gap-3 md:px-7 md:py-[15px] md:text-[15px]"
          >
            {j.newsletter.submit}
            <span aria-hidden="true">›</span>
          </button>
        </form>
      </div>
    </section>
  )
}
