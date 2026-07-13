'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useTranslation, useLocale } from '@/lib/i18n'

export default function AboutPage() {
  const t = useTranslation()
  const { locale } = useLocale()

  const content = {
    ko: {
      heroTitle: '바다가 쓴 시간',
      heroSubtitle: '뮤즈드마레의 저널, 수심 30m에서 보낸 날들의 기록을 전합니다.',
      storyTitle: '우리의 이야기',
      storyP1: '뮤즈드마레는 바다의 시간을 기록하는 브랜드입니다. 프랑스 샹파뉴가 빚은 샴페인이 한국 남해 수심 30m에 잠겨 보내는 모든 날을, 입수일부터 인양까지 지켜보고 기록합니다.',
      storyP2: '뮤즈드마레의 저널은 그 기록을 함께 나누는 자리입니다. 입수일과 좌표, 수온과 해류 같은 바다의 데이터부터, 샴페인과 어울리는 미식, 뮤즈드마레가 함께하는 문화와 예술의 순간까지 담아냅니다.',
      valuesTitle: '우리가 믿는 것',
      values: [
        { title: '기록이 헤리티지다', desc: '모든 병에는 입수일부터 인양까지, 그 병이 보낸 모든 날의 기록이 동봉됩니다.', icon: '01' },
        { title: '바다가 결정한다', desc: '수량도, 출시도, 가격도 사람이 아니라 바다가 정합니다. 인양된 만큼만 세상에 나옵니다.', icon: '02' },
        { title: '인양은 의식이다', desc: '입수에서 인양까지, 한 사이클은 달력에 새겨진 연례 의식입니다.', icon: '03' },
        { title: '소유는 맡아둠이다', desc: '마시는 것이 아니라, 바다가 만든 시간을 맡아두는 일입니다.', icon: '04' },
      ],
      journalTitle: '저널 카테고리',
      journalDesc: '뮤즈드마레의 세계를 다섯 가지 시선으로 탐험합니다.',
      categories: [
        { name: '바다의 일지', desc: '해저 숙성의 기록과 바다의 관측 일지', slug: 'sea-log' },
        { name: '메종 이야기', desc: '브랜드의 철학과 비하인드 스토리', slug: 'maison' },
        { name: '문화와 예술', desc: '뮤즈드마레가 함께하는 문화적 순간들', slug: 'culture' },
        { name: '테이블 위에서', desc: '페어링, 레시피, 미식의 세계', slug: 'table' },
        { name: '뉴스 & 이벤트', desc: '새로운 소식과 특별한 이벤트', slug: 'news' },
      ],
      ctaTitle: '함께하세요',
      ctaDesc: '뮤즈드마레의 새로운 기록을 가장 먼저 만나보세요.',
      ctaButton: '뉴스레터 구독하기',
      data: [
        { label: '위치', value: '한국 남해' },
        { label: '수심', value: '30m' },
        { label: '평균 수온', value: '11.4°C' },
        { label: '인양', value: '연 1회' },
      ],
    },
    en: {
      heroTitle: 'Time Written by the Sea',
      heroSubtitle: 'The journal of Muse de Marée, sharing the record of days spent at 30m below.',
      storyTitle: 'Our Story',
      storyP1: 'Muse de Marée is a brand that records the time of the sea. Champagne crafted in Champagne, France rests at 30m below the South Sea of Korea, and we watch and record every day it spends there — from submersion to retrieval.',
      storyP2: 'This journal is where we share that record — from the sea\'s data of submersion dates, coordinates, temperature and currents, to the gastronomy, culture and art that Muse de Marée accompanies.',
      valuesTitle: 'What We Believe',
      values: [
        { title: 'The Record Is the Heritage', desc: 'Every bottle ships with the record of each day it lived, from submersion to retrieval.', icon: '01' },
        { title: 'The Sea Decides', desc: 'Quantity, release and price are decided by the sea, not by people. Only what is retrieved is released.', icon: '02' },
        { title: 'Retrieval Is a Ritual', desc: 'From submersion to retrieval, one cycle is an annual ritual marked on the calendar.', icon: '03' },
        { title: 'Custody, Not Consumption', desc: 'Not to drink, but to keep the time the sea made.', icon: '04' },
      ],
      journalTitle: 'Journal Categories',
      journalDesc: 'Explore the world of Muse de Marée through five distinct perspectives.',
      categories: [
        { name: 'Sea Log', desc: 'The record of sea-aging and the sea\'s observation log', slug: 'sea-log' },
        { name: 'Maison Stories', desc: 'Brand philosophy and behind-the-scenes stories', slug: 'maison' },
        { name: 'Culture & Art', desc: 'Cultural moments accompanied by Muse de Marée', slug: 'culture' },
        { name: 'At the Table', desc: 'Pairings, recipes, and the world of gastronomy', slug: 'table' },
        { name: 'News & Events', desc: 'Latest news and special events', slug: 'news' },
      ],
      ctaTitle: 'Join Us',
      ctaDesc: 'Be the first to discover the new records of Muse de Marée.',
      ctaButton: 'Subscribe to Newsletter',
      data: [
        { label: 'Location', value: 'South Sea, Korea' },
        { label: 'Depth', value: '30m' },
        { label: 'Mean Temp', value: '11.4°C' },
        { label: 'Retrieval', value: 'Once a year' },
      ],
    },
  }

  const c = locale === 'ko' ? content.ko : content.en

  return (
    <div>
      {/* Masthead - 백지 위 타이포그래피 개막 (홈의 다크 포토 히어로와 대비) */}
      <section className="pt-32 md:pt-44">
        <div className="container-wide">
          <p className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-muted-foreground mb-8">
            About the Journal
          </p>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[1.05] mb-8 break-keep max-w-4xl">
            {c.heroTitle}
          </h1>
          <p className="text-base md:text-xl text-muted-foreground font-light leading-relaxed max-w-2xl mb-14 md:mb-20">
            {c.heroSubtitle}
          </p>

          {/* 관측 데이터 스트립 - 이 저널의 정체성(기록)을 데이터로 선언 */}
          <div className="grid grid-cols-2 md:grid-cols-4 border-t border-b border-border">
            {c.data.map((item, index) => (
              <div
                key={index}
                className={`py-5 md:py-6 pr-4 md:pr-6 border-border ${
                  index % 2 === 0 ? 'pl-0' : 'pl-4 border-l'
                } md:pl-6 md:first:pl-0 ${index > 0 ? 'md:border-l' : ''}`}
              >
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
                  {item.label}
                </p>
                <p className="font-display text-lg md:text-2xl">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Photo Band - 풀블리드 사각 이미지 */}
      <section className="mt-16 md:mt-24">
        <div className="relative h-[320px] md:h-[520px]">
          <Image
            src="/bg2.webp"
            alt="Muse de Marée"
            fill
            className="object-cover"
            priority
          />
        </div>
      </section>

      {/* Story Section - Editorial Magazine Style */}
      <section className="py-24 md:py-32">
        <div className="container-wide">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-start">
            <div className="lg:col-span-4">
              <div className="sticky top-32">
                <p className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-muted-foreground mb-6">
                  Our Story
                </p>
                <h2 className="font-display text-4xl md:text-5xl leading-[1.1]">
                  {c.storyTitle}
                </h2>
              </div>
            </div>

            <div className="lg:col-span-8">
              {/* 리드 문단은 스탠드퍼스트로 크게 */}
              <p className="font-serif text-xl md:text-2xl leading-[1.7] text-foreground mb-10 break-keep">
                {c.storyP1}
              </p>
              <p className="font-serif text-lg md:text-xl leading-[1.8] text-muted-foreground font-light break-keep">
                {c.storyP2}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section - 다크 밴드, 에디토리얼 인덱스 행 */}
      <section className="bg-[#000000] text-white py-24 md:py-32">
        <div className="container-wide">
          <div className="flex items-baseline justify-between mb-14 md:mb-20">
            <h2 className="font-display text-3xl md:text-5xl">{c.valuesTitle}</h2>
            <span className="hidden md:block text-[10px] uppercase tracking-[0.3em] text-white/40">
              Four Pillars
            </span>
          </div>

          <div className="border-t border-white/10">
            {c.values.map((value, index) => (
              <div
                key={index}
                className="grid md:grid-cols-12 gap-3 md:gap-8 py-10 md:py-14 border-b border-white/10"
              >
                <span className="md:col-span-1 text-[10px] tracking-[0.3em] text-white/40 md:pt-3">
                  {value.icon}
                </span>
                <h3 className="md:col-span-5 font-display text-2xl md:text-3xl break-keep">
                  {value.title}
                </h3>
                <p className="md:col-span-6 text-white/50 font-light leading-relaxed text-base md:text-lg break-keep">
                  {value.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journal Categories Section - Magazine Layout */}
      <section className="py-24 md:py-32">
        <div className="container-wide">
          {/* Section Header */}
          <div className="max-w-2xl mb-16">
            <p className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-foreground mb-6">Categories</p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl mb-6">{c.journalTitle}</h2>
            <p className="text-lg text-muted-foreground font-light">{c.journalDesc}</p>
          </div>

          {/* Categories List */}
          <div className="space-y-0 border-t border-border">
            {c.categories.map((cat, index) => (
              <Link
                key={index}
                href={`/category/${cat.slug}`}
                className="group block py-8 md:py-10 border-b border-border hover:bg-muted/30 transition-colors duration-300"
              >
                <div className="flex items-center justify-between gap-8">
                  <div className="flex items-start gap-6 md:gap-10">
                    {/* Index */}
                    <span className="text-xs text-muted-foreground font-light pt-1.5">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    {/* Content */}
                    <div>
                      <h3 className="font-display text-xl md:text-2xl lg:text-3xl mb-2 group-hover:text-muted-foreground transition-colors duration-300">
                        {cat.name}
                      </h3>
                      <p className="text-sm md:text-base text-muted-foreground font-light">
                        {cat.desc}
                      </p>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Colophon - 인용구와 서명으로 페이지를 닫는다 */}
      <section className="py-24 md:py-36 border-t border-border">
        <div className="container-narrow text-center">
          <blockquote>
            <p className="font-display text-2xl md:text-4xl italic text-foreground/80 leading-relaxed whitespace-pre-line break-keep">
              {t.footer.brandQuote}
            </p>
            <footer className="mt-10">
              <Image
                src="/images/logo/logo_text_trans.png"
                alt="Muse de Marée"
                width={260}
                height={40}
                className="h-[28px] w-auto opacity-80 mx-auto"
              />
            </footer>
          </blockquote>
        </div>
      </section>

    </div>
  )
}
