'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useLocale, useTranslation, getCategoryName } from '@/lib/i18n'
import { fillText } from '@/lib/i18n/dictionaries/journal'
import { dateline, recordNo } from '@/lib/journal/format'
import { recordExcerpt, recordTitle, type RecordSummary } from '@/lib/journal/records'

/* 대표 글(가장 최근 기록) — Paper 목록 데스크톱 792×528 사진 + 384 글 칼럼 / 모바일 350×438 */
export function FeaturedRecord({ record }: { record: RecordSummary }) {
  const t = useTranslation()
  const j = t.journal
  const { locale } = useLocale()
  const title = recordTitle(record, locale)
  const excerpt = recordExcerpt(record, locale)
  const seriesName = record.series ? getCategoryName(t, record.series.slug, record.series.name, record.series.nameEn) : ''

  return (
    <section className="px-5 pb-12 pt-10 md:px-24 md:pb-[88px] md:pt-16">
      <Link
        href={`/post/${record.slug}`}
        className="group flex flex-col gap-[18px] md:grid md:grid-cols-[minmax(0,792fr)_minmax(0,384fr)] md:items-center md:gap-[72px]"
      >
        <div className="relative aspect-[350/438] w-full overflow-hidden bg-earth/10 md:aspect-[3/2]">
          {record.cover && (
            <Image
              src={record.cover}
              alt={title}
              fill
              priority
              sizes="(max-width: 767px) 100vw, 60vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            />
          )}
        </div>
        <div className="flex flex-col gap-[18px] md:gap-[22px]">
          <div className="mt-1.5 flex items-baseline gap-3.5 md:mt-0 md:gap-[18px]">
            {record.number && (
              <span className="font-plex text-[11.5px] leading-[14px] tracking-[0.14em] text-amber-deep md:text-[12px] md:leading-4">
                N° {recordNo(record.number)}
              </span>
            )}
            {seriesName && (
              <span className="font-sans-kr text-[12px] leading-4 tracking-[0.06em] text-stone md:tracking-[0.08em]">
                {seriesName}
              </span>
            )}
          </div>
          <h2 className="font-serif-kr text-[30px] font-light leading-10 md:text-[40px] md:leading-[52px] md:tracking-[-0.01em]">
            {title}
          </h2>
          {excerpt && (
            <p className="font-sans-kr text-[14.5px] font-light leading-[25px] text-earth/80 md:text-[15px] md:leading-[27px]">
              {excerpt}
            </p>
          )}
          <div className="flex flex-wrap gap-x-[22px] gap-y-1 border-y border-earth/15 py-3 font-plex text-[11px] leading-[14px] tracking-[0.06em] text-stone-dark md:mt-1.5 md:gap-x-7 md:py-3.5 md:text-[11.5px] md:tracking-[0.08em]">
            <span>{dateline(record.publishedAt)}</span>
            {record.seaAvg !== null && <span>{fillText(j.record.seaAvg, { t: record.seaAvg.toFixed(1) })}</span>}
            {record.readingMinutes && <span>{fillText(j.record.minutes, { n: record.readingMinutes })}</span>}
          </div>
          <span className="hidden font-sans-kr text-[14px] leading-[18px] tracking-[0.06em] text-earth md:mt-1.5 md:block">
            {j.record.read} <span aria-hidden="true">›</span>
          </span>
        </div>
      </Link>
    </section>
  )
}

/* 번호 기록 목록 — 데스크톱 N° · DATE · RECORD · SERIES / 모바일 RECORDS (수온 열 없음) */
export function RecordIndex({
  records,
  showSeries = true,
  highlight,
}: {
  records: RecordSummary[]
  showSeries?: boolean
  /** 검색어 — 제목·발췌에서 앰버 배경으로 표시 */
  highlight?: string
}) {
  const t = useTranslation()
  const { locale } = useLocale()
  if (!records.length) return null

  const head = 'font-plex text-[10.5px] leading-[14px] tracking-[0.18em] text-stone-light'

  return (
    <div className="flex flex-col">
      <div className="flex items-center border-b border-earth/30 pb-3 md:pb-3.5">
        <span className={`${head} text-[10px] leading-3 md:hidden`}>RECORDS</span>
        <span className={`${head} hidden w-[120px] shrink-0 md:block`}>N°</span>
        <span className={`${head} hidden w-[160px] shrink-0 md:block`}>DATE</span>
        <span className={`${head} hidden flex-1 md:block`}>RECORD</span>
        {showSeries && <span className={`${head} hidden w-[168px] shrink-0 text-right md:block`}>SERIES</span>}
      </div>
      {records.map((r) => {
        const title = recordTitle(r, locale)
        const excerpt = recordExcerpt(r, locale)
        const seriesName = r.series ? getCategoryName(t, r.series.slug, r.series.name, r.series.nameEn) : ''
        return (
          <Link
            key={r.id}
            href={`/post/${r.slug}`}
            className="group flex gap-4 border-b border-earth/15 py-5 md:items-center md:gap-0 md:py-7"
          >
            <span className="hidden w-[120px] shrink-0 font-plex text-[13px] leading-4 tracking-[0.08em] text-amber-deep md:block">
              {recordNo(r.number)}
            </span>
            <span className="hidden w-[160px] shrink-0 font-plex text-[13px] leading-4 tracking-[0.06em] text-stone-dark md:block">
              {dateline(r.publishedAt)}
            </span>
            <span className="flex min-w-0 flex-1 gap-4 md:items-center md:gap-8">
              <span className="relative size-[88px] shrink-0 overflow-hidden bg-earth/10 md:h-[88px] md:w-[132px]">
                {r.cover && (
                  <Image
                    src={r.cover}
                    alt=""
                    fill
                    sizes="(max-width: 767px) 88px, 132px"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                )}
              </span>
              <span className="flex min-w-0 flex-col gap-1.5 md:gap-2">
                <span className="font-plex text-[11px] leading-[14px] tracking-[0.08em] text-amber-deep md:hidden">
                  {r.number ? `N° ${recordNo(r.number)}` : ''}
                </span>
                <span className="font-serif-kr text-[19px] font-light leading-[27px] transition-opacity group-hover:opacity-75 md:text-[24px] md:leading-8">
                  <Highlighted text={title} query={highlight} />
                </span>
                {excerpt && (
                  <span className="hidden font-sans-kr text-[14px] font-light leading-[22px] text-earth/70 md:block">
                    <Highlighted text={excerpt} query={highlight} />
                  </span>
                )}
                <span className="font-plex text-[10.5px] leading-[14px] tracking-[0.06em] text-stone-light md:hidden">
                  {dateline(r.publishedAt)}
                  {seriesName ? ` ${seriesName}` : ''}
                </span>
              </span>
            </span>
            {showSeries && (
              <span className="hidden w-[168px] shrink-0 text-right font-sans-kr text-[13px] leading-4 tracking-[0.04em] text-stone md:block">
                {seriesName}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}

/** 검색어를 앰버 배경으로 표시한다(대소문자 무시) */
export function Highlighted({ text, query }: { text: string; query?: string }) {
  const q = query?.trim()
  if (!q) return <>{text}</>
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark key={i} className="bg-amber/40 text-inherit">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  )
}
