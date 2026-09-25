'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLocale, useTranslation, getCategoryName } from '@/lib/i18n'
import { fillText } from '@/lib/i18n/dictionaries/journal'
import { dateline, recordNo } from '@/lib/journal/format'
import { recordExcerpt, recordTitle, type RecordSummary } from '@/lib/journal/records'
import type { ArticleBlock } from '@/lib/article/types'
import { ArticleBody } from './ArticleBody'

/* 글 상세(/post/[slug]) — Paper 'Journal — 글 상세' HEE(데스크톱)·HMT(모바일) */

export interface PostViewData {
  record: RecordSummary
  blocks: ArticleBlock[]
  blocksEn: ArticleBlock[] | null
  /** 글 끝 PHOTO 목록 — 그림 크레딧 자동 수집 + photo_credits 필드 */
  credits: string[]
  next: RecordSummary | null
}

/** 본문 영상: 무음·인라인·루프, 화면에 40% 이상 보일 때만 재생. 탭하면 멈춤/재생 (사용자가 멈춘 영상은 다시 자동재생하지 않는다) */
function useVideoAutoplay(root: React.RefObject<HTMLDivElement | null>, deps: unknown) {
  useEffect(() => {
    const el = root.current
    if (!el) return
    const videos = Array.from(el.querySelectorAll<HTMLVideoElement>('video[data-autoplay]'))
    if (!videos.length) return

    const toggle = (event: Event) => {
      const video = event.currentTarget as HTMLVideoElement
      if (video.paused) {
        delete video.dataset.userPaused
        video.play().catch(() => {})
      } else {
        video.dataset.userPaused = 'true'
        video.pause()
      }
    }
    videos.forEach((video) => {
      // iOS 사파리 무음 자동재생 조건: muted + playsinline (속성과 프로퍼티 둘 다)
      video.muted = true
      video.setAttribute('muted', '')
      video.addEventListener('click', toggle)
    })
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target as HTMLVideoElement
          if (entry.isIntersecting) {
            if (video.dataset.userPaused !== 'true') video.play().catch(() => {})
          } else {
            video.pause()
          }
        }
      },
      { threshold: 0.4 },
    )
    videos.forEach((video) => observer.observe(video))
    return () => {
      observer.disconnect()
      videos.forEach((video) => video.removeEventListener('click', toggle))
    }
  }, [root, deps])
}

export function PostView({ data, preview = false }: { data: PostViewData; preview?: boolean }) {
  const t = useTranslation()
  const j = t.journal
  const { locale } = useLocale()
  const { record, next, credits } = data
  const blocks = locale === 'en' && data.blocksEn?.length ? data.blocksEn : data.blocks
  const title = recordTitle(record, locale)
  const excerpt = recordExcerpt(record, locale)
  const seriesName = record.series ? getCategoryName(t, record.series.slug, record.series.name, record.series.nameEn) : ''
  const bodyRef = useRef<HTMLDivElement>(null)
  useVideoAutoplay(bodyRef, blocks)

  const stats = [
    { label: j.record.published, value: dateline(record.publishedAt) },
    ...(record.seaAvg !== null ? [{ label: j.record.seaAvgLabel, value: `${record.seaAvg.toFixed(1)}°C` }] : []),
    ...(record.readingMinutes
      ? [{ label: j.record.reading, value: fillText(j.record.minutesUpper, { n: record.readingMinutes }), narrow: true }]
      : []),
  ] as { label: string; value: string; narrow?: boolean }[]

  return (
    <article>
      {/* 머리 — 번호·연재·제목·발췌·관측 줄 */}
      <header className="flex flex-col gap-[18px] px-5 pb-9 pt-14 md:items-center md:gap-[26px] md:px-10 md:pb-16 md:pt-[120px] md:text-center">
        <div className="flex items-baseline gap-3.5 md:gap-5">
          {record.number && (
            <span className="font-plex text-[11.5px] leading-[14px] tracking-[0.14em] text-amber-deep md:text-[12px] md:leading-4">
              N° {recordNo(record.number)}
            </span>
          )}
          {seriesName && (
            <Link
              href={`/category/${record.series?.slug}`}
              className="font-sans-kr text-[12px] leading-4 tracking-[0.06em] text-stone hover:text-earth md:text-[12.5px] md:tracking-[0.08em]"
            >
              {seriesName}
            </Link>
          )}
        </div>
        <h1 className="text-balance font-serif-kr text-[36px] font-light leading-[46px] tracking-[-0.01em] md:max-w-[1040px] md:text-[clamp(44px,4.2vw,60px)] md:leading-[1.2] md:tracking-[-0.015em]">
          {title}
        </h1>
        {excerpt && (
          <p className="aeo-summary font-sans-kr text-[15px] font-light leading-[26px] text-earth/75 md:max-w-[560px] md:text-[17px] md:leading-[30px]">
            {excerpt}
          </p>
        )}
        <dl className="mt-2 flex border-y border-earth/20 md:mt-[22px]">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col gap-[5px] py-3 text-left md:w-[180px] md:shrink-0 md:gap-1.5 md:py-4 md:pl-5 ${
                i > 0 ? 'border-l border-earth/15 pl-3.5' : ''
              } ${s.narrow ? 'w-[84px] shrink-0 md:w-[180px]' : 'flex-1 md:flex-none'}`}
            >
              <dt className="font-plex text-[9.5px] leading-3 tracking-[0.16em] text-stone-light md:text-[10px] md:tracking-[0.18em]">
                {s.label}
              </dt>
              <dd className="font-plex text-[12px] leading-4 tracking-[0.04em] text-earth md:text-[13px] md:tracking-[0.06em]">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </header>

      {record.cover && (
        <div className="relative aspect-[390/488] w-full bg-earth/10 md:aspect-[1440/760] md:max-h-[88vh]">
          <Image src={record.cover} alt={title} fill priority sizes="100vw" className="object-cover" />
        </div>
      )}

      <div ref={bodyRef} className="pt-12 md:pt-24">
        <ArticleBody blocks={blocks} postNumber={record.number} showSlots={preview} />
      </div>

      {/* 끝 — 사인오프 심볼 + PHOTO 크레딧 */}
      <footer className="mx-auto flex w-[min(640px,calc(100%-40px))] flex-col items-center gap-10 pb-16 pt-14 md:gap-12 md:pb-[120px] md:pt-20">
        <Image
          src="/images/logo/logo_trans_W.png"
          alt="Muse de Marée"
          width={1000}
          height={829}
          className="h-[25px] w-[30px] object-contain opacity-55 invert md:h-[31px] md:w-[38px]"
        />
        {credits.length > 0 && (
          <dl className="w-full border-t border-earth/20">
            {credits.map((credit) => (
              <div key={credit} className="flex gap-5 border-b border-earth/[0.12] py-3 md:gap-7 md:py-3.5">
                <dt className="w-16 shrink-0 font-plex text-[10px] leading-3 tracking-[0.16em] text-stone-light md:w-[132px] md:text-[10.5px] md:leading-[14px]">
                  {j.record.photo}
                </dt>
                <dd className="font-sans-kr text-[13px] font-light leading-4 text-stone-dark md:text-[13.5px] md:leading-[18px]">
                  {credit}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </footer>

      {next && <NextRecord record={next} />}
    </article>
  )
}

function NextRecord({ record }: { record: RecordSummary }) {
  const j = useTranslation().journal
  const { locale } = useLocale()
  const title = recordTitle(record, locale)
  const excerpt = recordExcerpt(record, locale)

  return (
    <Link href={`/post/${record.slug}`} className="group flex flex-col bg-void text-paper md:flex-row">
      <div className="relative aspect-square w-full overflow-hidden bg-paper/5 md:aspect-[3/2] md:w-1/2 md:shrink-0">
        {record.cover && (
          <Image
            src={record.cover}
            alt=""
            fill
            sizes="(max-width: 767px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col justify-center gap-3.5 px-5 pb-11 pt-8 md:gap-[22px] md:px-24 md:py-12">
        <span className="font-plex text-[10.5px] leading-[14px] tracking-[0.18em] text-amber md:text-[11px]">
          {j.record.next}
          {record.number ? ` · N° ${recordNo(record.number)}` : ''}
        </span>
        <span className="font-serif-kr text-[28px] font-light leading-[38px] transition-opacity group-hover:opacity-80 md:text-[40px] md:leading-[52px]">
          {title}
        </span>
        {excerpt && (
          <span className="font-sans-kr text-[14px] font-light leading-6 text-paper/70 md:text-[15px] md:leading-[27px]">
            {excerpt}
          </span>
        )}
        <span className="mt-2 hidden gap-7 font-plex text-[11.5px] leading-[14px] tracking-[0.08em] text-paper/55 md:flex">
          <span>{dateline(record.publishedAt)}</span>
          {record.seaAvg !== null && <span>{fillText(j.record.seaAvg, { t: record.seaAvg.toFixed(1) })}</span>}
        </span>
      </div>
    </Link>
  )
}
