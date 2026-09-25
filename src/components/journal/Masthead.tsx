'use client'

import { getImageProps } from 'next/image'
import type { ReactNode } from 'react'
import type { SeriesHero } from '@/lib/journal/series'

/*
 * 사진 마스트헤드 — 목록(560/460)과 연재(440/400) 공용. Paper HE6(목록)·HJL(연재).
 * 모바일은 따로 자른 이미지를 <picture>로 내준다(데스크톱 원본을 받지 않는다).
 */
export function Masthead({
  hero,
  kicker,
  title,
  mobileTitle,
  aside,
  mobileAside,
  alt,
  variant,
}: {
  hero: SeriesHero
  kicker: string
  title: ReactNode
  mobileTitle?: ReactNode
  aside: ReactNode
  mobileAside: ReactNode
  alt: string
  variant: 'journal' | 'series'
}) {
  const common = { alt, fill: true, priority: true, quality: 90 } as const
  const {
    props: { srcSet: desktop },
  } = getImageProps({ ...common, src: hero.desktop, sizes: '100vw' })
  const {
    props: { srcSet: mobile, ...rest },
  } = getImageProps({ ...common, src: hero.mobile, sizes: '100vw' })

  const isJournal = variant === 'journal'
  // Paper 그라데이션: 목록은 아래쪽만 72~78%, 연재는 위부터 조금 더 눌러 86~88%
  const shade = isJournal
    ? 'linear-gradient(180deg, rgb(10 9 8 / 0.10) 0%, rgb(10 9 8 / 0.05) 42%, rgb(10 9 8 / 0.75) 100%)'
    : 'linear-gradient(180deg, rgb(10 9 8 / 0.12) 0%, rgb(10 9 8 / 0.25) 38%, rgb(10 9 8 / 0.87) 100%)'

  return (
    <section
      className={`relative flex flex-col justify-end overflow-hidden bg-void px-5 pb-9 md:flex-row md:items-end md:justify-between md:px-24 md:pb-14 ${
        isJournal ? 'h-[460px] md:h-[560px]' : 'h-[400px] md:h-[440px]'
      }`}
    >
      <picture className="absolute inset-0">
        <source media="(max-width: 767px)" srcSet={mobile} />
        <source media="(min-width: 768px)" srcSet={desktop} />
        {/* eslint-disable-next-line jsx-a11y/alt-text -- alt는 rest에 들어 있다 */}
        <img
          {...rest}
          className="absolute inset-0 h-full w-full object-cover md:[object-position:var(--hero-pos)]"
          style={{ ...rest.style, ['--hero-pos' as string]: hero.position }}
        />
      </picture>
      <div className="absolute inset-0" style={{ background: shade }} aria-hidden="true" />

      <div className="relative flex flex-col gap-3.5 md:gap-[18px]">
        <span className="font-plex text-[10.5px] leading-[14px] tracking-[0.18em] text-amber-light md:text-[11px]">
          {kicker}
        </span>
        <h1 className="font-garamond text-[52px] font-light leading-[52px] text-paper md:text-[clamp(64px,6.67vw,96px)] md:leading-[1] md:tracking-[-0.01em]">
          {mobileTitle ? (
            <>
              <span className="md:hidden">{mobileTitle}</span>
              <span className="hidden md:inline">{title}</span>
            </>
          ) : (
            title
          )}
        </h1>
        <div className="mt-1.5 md:hidden">{mobileAside}</div>
      </div>
      <div className="relative hidden flex-col items-end gap-2.5 pb-3 text-right md:flex">{aside}</div>
    </section>
  )
}
