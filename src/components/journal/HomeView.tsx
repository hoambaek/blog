'use client'

import { useTranslation } from '@/lib/i18n'
import { countText } from '@/lib/i18n/dictionaries/journal'
import { MASTHEAD_HERO } from '@/lib/journal/series'
import type { RecordSummary } from '@/lib/journal/records'
import { Masthead } from './Masthead'
import { FeaturedRecord, RecordIndex } from './RecordList'
import { JournalCoda, type CodaSeries } from './JournalCoda'

/* 목록(/) — Paper 'Journal — 목록' HAR(데스크톱)·HK8(모바일) */
export function HomeView({
  records,
  total,
  startYear,
  series,
}: {
  records: RecordSummary[]
  total: number
  startYear: string | null
  series: CodaSeries[]
}) {
  const t = useTranslation()
  const j = t.journal
  const [featured, ...rest] = records
  const count = countText(j.masthead.recordCountOne, j.masthead.recordCount, total)

  return (
    <>
      <Masthead
        variant="journal"
        hero={MASTHEAD_HERO}
        alt={t.hero.imageAlt}
        kicker={startYear ? `JOURNAL · ${startYear} –` : 'JOURNAL'}
        title="Le Journal de Marée"
        mobileTitle={
          <>
            Le Journal
            <br />
            de Marée
          </>
        }
        aside={
          <>
            <p className="font-serif-kr text-[17px] font-light leading-7 text-paper">{j.masthead.tagline}</p>
            <p className="font-plex text-[11px] leading-[14px] tracking-[0.14em] text-paper/60">{count}</p>
          </>
        }
        mobileAside={<p className="font-serif-kr text-[15px] font-light leading-6 text-paper">{j.masthead.tagline}</p>}
      />

      {featured ? (
        <>
          <FeaturedRecord record={featured} />
          {rest.length > 0 && (
            <section className="px-5 pb-[72px] md:px-24 md:pb-28">
              <RecordIndex records={rest} />
            </section>
          )}
        </>
      ) : (
        <section className="px-5 py-24 text-center md:px-24 md:py-32">
          <h2 className="font-serif-kr text-[26px] font-light leading-9">{j.record.empty}</h2>
          <p className="mt-3 font-sans-kr text-[15px] font-light leading-7 text-earth/70">{j.record.emptyDescription}</p>
        </section>
      )}

      <JournalCoda series={series} />
    </>
  )
}
