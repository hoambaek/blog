'use client'

import Image from 'next/image'
import { useTranslation, getCategoryName } from '@/lib/i18n'
import { fillText } from '@/lib/i18n/dictionaries/journal'
import { recordNo, pad2 } from '@/lib/journal/format'
import { MASTHEAD_HERO } from '@/lib/journal/series'
import { JournalCoda, type CodaSeries } from './JournalCoda'

/* 소개(/about) — Paper 'Journal — 소개' HZF(데스크톱)·I2F(모바일) */
export function AboutView({ recordCount, series }: { recordCount: number; series: CodaSeries[] }) {
  const t = useTranslation()
  const a = t.journal.about
  const seriesNames = series.map((s) => getCategoryName(t, s.slug, s.name, s.nameEn))

  const label = 'font-plex text-[10.5px] leading-[14px] tracking-[0.18em] text-stone-light'
  const stats = [
    { label: a.location, value: a.locationValue },
    { label: a.retrieval, value: a.retrievalValue },
    { label: a.records, value: recordNo(recordCount) || '000', mono: true },
    {
      label: a.seriesLabel,
      value: seriesNames.join(', '),
      mobileValue: fillText(t.journal.series.seriesCount, { n: seriesNames.length }),
    },
  ]

  return (
    <>
      <section className="flex flex-col gap-[18px] px-5 pb-8 pt-12 md:gap-[22px] md:px-24 md:pb-14 md:pt-32">
        <span className="font-plex text-[10.5px] leading-[14px] tracking-[0.18em] text-amber-deep md:text-[11px]">
          {a.kicker}
        </span>
        <h1 className="font-garamond text-[56px] font-light leading-[56px] tracking-[-0.01em] md:text-[clamp(72px,7.2vw,104px)] md:leading-[0.96] md:tracking-[-0.015em]">
          <span className="md:hidden">
            Written
            <br />
            by the Sea.
          </span>
          <span className="hidden md:inline">Written by the Sea.</span>
        </h1>
        <div className="flex flex-col gap-3 md:mt-3 md:flex-row md:items-end md:justify-between md:gap-10">
          <p className="font-serif-kr text-[20px] font-light leading-8 md:text-[26px] md:leading-9">{a.subtitle}</p>
          <p className="font-sans-kr text-[14px] font-light leading-6 text-earth/75 md:w-[420px] md:shrink-0 md:text-[15px] md:leading-[27px]">
            {a.intro}
          </p>
        </div>
      </section>

      <dl className="mx-5 grid grid-cols-2 border-y border-earth/30 md:mx-24 md:flex">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`flex flex-col gap-2.5 py-4 md:flex-1 md:py-[22px] ${i % 2 === 1 ? 'border-l border-earth/15 pl-3.5' : ''} ${
              i >= 2 ? 'border-t border-earth/15 md:border-t-0' : ''
            } ${i > 0 ? 'md:border-l md:border-earth/15 md:pl-7' : ''}`}
          >
            <dt className={label}>{s.label}</dt>
            <dd
              className={
                s.mono
                  ? 'font-plex text-[17px] leading-6 text-amber-deep md:text-[22px] md:leading-7'
                  : 'font-serif-kr text-[17px] font-light leading-6 md:text-[22px] md:leading-7'
              }
            >
              {s.mobileValue ? (
                <>
                  <span className="md:hidden">{s.mobileValue}</span>
                  <span className="hidden md:inline">{s.value}</span>
                </>
              ) : (
                s.value
              )}
            </dd>
          </div>
        ))}
      </dl>

      <div className="relative mt-14 h-[380px] w-full md:mt-[88px] md:h-[520px]">
        <Image
          src={MASTHEAD_HERO.desktop}
          alt={t.hero.imageAlt}
          fill
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: '58% 70%' }}
        />
      </div>

      <section className="flex flex-col gap-5 px-5 pb-16 pt-14 md:flex-row md:gap-24 md:px-24 md:pb-[120px] md:pt-28">
        <div className="flex flex-col gap-3 md:w-[344px] md:shrink-0">
          <span className="font-plex text-[10.5px] leading-[14px] tracking-[0.18em] text-amber-deep md:text-[11px]">
            {a.storyKicker}
          </span>
          <h2 className="hidden font-serif-kr text-[30px] font-light leading-10 md:block">{a.storyTitle}</h2>
        </div>
        <div className="flex max-w-[640px] flex-col gap-6 md:gap-7">
          <p className="font-serif-kr text-[18px] font-light leading-[33px] md:text-[21px] md:leading-[38px]">{a.storyLead}</p>
          <p className="font-sans-kr text-[15px] font-light leading-7 md:text-[16.5px] md:leading-[31px]">{a.storyBody}</p>
        </div>
      </section>

      <section className="flex flex-col gap-8 bg-void px-5 pb-16 pt-14 text-paper md:gap-12 md:px-24 md:pb-24 md:pt-[104px]">
        <div className="flex flex-col gap-3">
          <span className="font-plex text-[10.5px] leading-[14px] tracking-[0.18em] text-amber md:text-[11px]">
            {a.beliefKicker}
          </span>
          <h2 className="font-serif-kr text-[24px] font-light leading-8 md:text-[30px] md:leading-10">{a.beliefTitle}</h2>
        </div>
        <ol className="border-t border-paper/20">
          {a.beliefs.map((b, i) => (
            <li
              key={b.title}
              className="grid grid-cols-[36px_1fr] gap-x-0 gap-y-2 border-b border-paper/[0.12] py-6 md:flex md:items-baseline md:py-[30px]"
            >
              <span className="font-plex text-[11px] leading-6 tracking-[0.1em] text-amber md:w-[120px] md:shrink-0 md:text-[13px] md:leading-4">
                {pad2(i + 1)}
              </span>
              <span className="font-serif-kr text-[20px] font-light leading-7 md:w-[420px] md:shrink-0 md:text-[26px] md:leading-8">
                {b.title}
              </span>
              <span className="col-start-2 font-sans-kr text-[13.5px] font-light leading-6 text-paper/70 md:flex-1 md:text-[15px] md:leading-[27px]">
                {b.desc}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <JournalCoda series={series} continued />
    </>
  )
}
