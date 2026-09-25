'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslation, getCategoryName } from '@/lib/i18n'
import { countText, fillText } from '@/lib/i18n/dictionaries/journal'
import { dateline, recordNo } from '@/lib/journal/format'
import { recordExcerpt, recordTitle, type RecordSummary } from '@/lib/journal/records'
import { Highlighted } from './RecordList'

/* 검색 결과(/search) — Paper 'Journal — 검색 결과' I5B·I6X. 검색어는 앰버 배경으로 표시 */
export function SearchView({
  query,
  records,
  total,
  currentPage,
  totalPages,
}: {
  query: string
  records: RecordSummary[]
  total: number
  currentPage: number
  totalPages: number
}) {
  const t = useTranslation()
  const j = t.journal
  const { locale } = useLocale()
  const router = useRouter()
  const [value, setValue] = useState(query)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = value.trim()
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  }

  const pageHref = (page: number) => `/search?q=${encodeURIComponent(query)}&page=${page}`

  return (
    <>
      <section className="flex flex-col gap-4 px-5 pb-10 pt-14 md:gap-[18px] md:px-24 md:pb-16 md:pt-28">
        <span className="font-plex text-[10.5px] leading-[14px] tracking-[0.18em] text-amber-deep md:text-[11px]">
          {j.search.label}
        </span>
        <form
          role="search"
          onSubmit={submit}
          className="flex items-end justify-between gap-4 border-b border-earth pb-3.5 md:pb-[18px]"
        >
          <input
            type="search"
            name="q"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={j.search.placeholder}
            aria-label={j.search.placeholder}
            enterKeyHint="search"
            className="min-w-0 flex-1 bg-transparent font-serif-kr text-[32px] font-light leading-[42px] text-earth caret-amber-deep outline-none placeholder:text-earth/30 md:text-[48px] md:leading-[60px] [&::-webkit-search-cancel-button]:hidden"
          />
          {value && (
            <button
              type="button"
              onClick={() => setValue('')}
              aria-label={j.search.clear}
              className="mb-1.5 p-1 text-stone hover:text-earth md:mb-3"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <line x1="2" y1="2" x2="18" y2="18" stroke="currentColor" strokeWidth="1.1" />
                <line x1="18" y1="2" x2="2" y2="18" stroke="currentColor" strokeWidth="1.1" />
              </svg>
            </button>
          )}
        </form>
        {query && (
          <p className="font-plex text-[11px] leading-[14px] tracking-[0.12em] text-stone md:text-[11.5px]">
            {countText(j.search.countOne, j.search.count, total)}
          </p>
        )}
      </section>

      <section className="px-5 pb-20 md:px-24 md:pb-[120px]">
        {records.length > 0 && (
          <div className="border-t border-earth/30">
            {records.map((r) => {
              const title = recordTitle(r, locale)
              const excerpt = recordExcerpt(r, locale)
              const seriesName = r.series ? getCategoryName(t, r.series.slug, r.series.name, r.series.nameEn) : ''
              return (
                <Link
                  key={r.id}
                  href={`/post/${r.slug}`}
                  className="group flex gap-4 border-b border-earth/15 py-5 md:items-center md:gap-10 md:py-7"
                >
                  <span className="hidden w-20 shrink-0 font-plex text-[13px] leading-4 tracking-[0.08em] text-amber-deep md:block">
                    {recordNo(r.number)}
                  </span>
                  <span className="relative size-[88px] shrink-0 overflow-hidden bg-earth/10 md:h-[117px] md:w-[176px]">
                    {r.cover && (
                      <Image src={r.cover} alt="" fill sizes="(max-width: 767px) 88px, 176px" className="object-cover" />
                    )}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5 md:gap-2.5">
                    <span className="font-plex text-[11px] leading-[14px] tracking-[0.08em] text-amber-deep md:hidden">
                      {r.number ? `N° ${recordNo(r.number)}` : ''}
                    </span>
                    <span className="font-serif-kr text-[19px] font-light leading-[27px] transition-opacity group-hover:opacity-75 md:text-[26px] md:leading-[34px]">
                      <Highlighted text={title} query={query} />
                    </span>
                    {excerpt && (
                      <span className="hidden font-sans-kr text-[14.5px] font-light leading-6 text-earth/70 md:block">
                        <Highlighted text={excerpt} query={query} />
                      </span>
                    )}
                    <span className="font-plex text-[10.5px] leading-[14px] tracking-[0.06em] text-stone-light md:hidden">
                      {dateline(r.publishedAt)}
                      {seriesName ? ` ${seriesName}` : ''}
                    </span>
                  </span>
                  <span className="hidden w-[140px] shrink-0 flex-col items-end gap-1.5 md:flex">
                    <span className="font-plex text-[12px] leading-4 tracking-[0.06em] text-stone-dark">
                      {dateline(r.publishedAt)}
                    </span>
                    <span className="font-sans-kr text-[12.5px] leading-4 text-stone">{seriesName}</span>
                  </span>
                </Link>
              )
            })}
          </div>
        )}

        {query && total === 0 && (
          <div className="flex flex-col gap-2.5 border-t border-earth/30 pt-8 md:pt-10">
            <p className="font-serif-kr text-[20px] font-light leading-7">{fillText(j.search.emptyTitle, { q: query })}</p>
            <p className="font-sans-kr text-[14px] font-light leading-6 text-earth/70">
              {j.search.emptyBody}{' '}
              <Link href="/" className="whitespace-nowrap text-earth underline-offset-4 hover:underline">
                {j.search.allRecords} ›
              </Link>
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <nav className="mt-10 flex justify-between font-sans-kr text-[14px] tracking-[0.06em]">
            {currentPage > 1 ? <Link href={pageHref(currentPage - 1)}>‹ {j.record.newer}</Link> : <span />}
            {currentPage < totalPages && <Link href={pageHref(currentPage + 1)}>{j.record.older} ›</Link>}
          </nav>
        )}
      </section>
    </>
  )
}
