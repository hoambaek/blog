'use client'

import Link from 'next/link'
import { useLocale, useTranslation, getCategoryName, getCategoryDescription } from '@/lib/i18n'
import { countText } from '@/lib/i18n/dictionaries/journal'
import { seriesFrench, seriesHero } from '@/lib/journal/series'
import { pad2 } from '@/lib/journal/format'
import type { RecordSummary } from '@/lib/journal/records'
import { Masthead } from './Masthead'
import { FeaturedRecord, RecordIndex } from './RecordList'
import { JournalCoda, type CodaSeries } from './JournalCoda'

/* 연재 페이지(/category/[slug]) — Paper 'Journal — 연재 페이지 · 메종 이야기' HH7·HP8 */
export function SeriesView({
  category,
  records,
  total,
  currentPage,
  totalPages,
  series,
}: {
  category: { slug: string; name: string; description: string | null; nameEn?: string | null; descriptionEn?: string | null }
  records: RecordSummary[]
  total: number
  currentPage: number
  totalPages: number
  series: CodaSeries[]
}) {
  const t = useTranslation()
  const j = t.journal
  const { locale } = useLocale()
  const index = series.find((s) => s.slug === category.slug)?.index
  const name = getCategoryName(t, category.slug, category.name, category.nameEn)
  const description = getCategoryDescription(locale, category.slug, category.description, category.descriptionEn)
  const french = seriesFrench(category.slug)
  const count = countText(j.series.countOne, j.series.count, total)
  const [featured, ...rest] = currentPage === 1 ? records : [undefined, ...records]

  return (
    <>
      <Masthead
        variant="series"
        hero={seriesHero(category.slug)}
        alt={name}
        kicker={index ? `${j.series.label} ${pad2(index)} · ${count}` : `${j.series.label} · ${count}`}
        title={french || name}
        aside={
          <>
            <p className="font-serif-kr text-[17px] font-light leading-7 text-paper">{name}</p>
            {description && (
              <p className="font-sans-kr text-[13px] font-light leading-4 tracking-[0.02em] text-paper/75">{description}</p>
            )}
          </>
        }
        mobileAside={
          description ? (
            <p className="font-sans-kr text-[13.5px] font-light leading-6 text-paper/80">{description}</p>
          ) : null
        }
      />

      {records.length === 0 ? (
        <section className="px-5 py-24 text-center md:px-24 md:py-32">
          <h2 className="font-serif-kr text-[26px] font-light leading-9">{j.record.empty}</h2>
          <p className="mt-3 font-sans-kr text-[15px] font-light leading-7 text-earth/70">{j.record.emptyDescription}</p>
        </section>
      ) : (
        <>
          {featured && <FeaturedRecord record={featured} />}
          {rest.length > 0 && (
            <section className={`px-5 pb-[72px] md:px-24 md:pb-28 ${featured ? '' : 'pt-10 md:pt-16'}`}>
              <RecordIndex records={rest as RecordSummary[]} showSeries={false} />
            </section>
          )}
          {totalPages > 1 && (
            <nav className="-mt-10 flex justify-between px-5 pb-16 font-sans-kr text-[14px] tracking-[0.06em] md:-mt-16 md:px-24 md:pb-24">
              {currentPage > 1 ? (
                <Link href={`/category/${category.slug}?page=${currentPage - 1}`}>‹ {j.record.newer}</Link>
              ) : (
                <span />
              )}
              {currentPage < totalPages && (
                <Link href={`/category/${category.slug}?page=${currentPage + 1}`}>{j.record.older} ›</Link>
              )}
            </nav>
          )}
        </>
      )}

      <JournalCoda series={series} currentSlug={category.slug} />
    </>
  )
}
