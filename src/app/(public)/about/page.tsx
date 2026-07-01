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
    },
  }

  const c = locale === 'ko' ? content.ko : content.en

  return (
    <div>
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/bg2.webp"
            alt="Muse de Marée"
            fill
            className="object-cover scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />
        </div>

        <div className="container-narrow relative z-10 text-center text-white">
          {/* Tagline */}
          <p
            className="uppercase text-[10px] md:text-xs tracking-[0.4em] text-white/50 mb-8 font-light animate-fade-in-up"
            style={{ animationDelay: '0.3s' }}
          >
            About the Journal
          </p>

          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl xl:text-6xl mb-6 leading-[1.2] animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            {c.heroTitle}
          </h1>
          <p className="text-base md:text-lg text-white/60 max-w-2xl mx-auto font-light leading-relaxed animate-fade-in-up lg:whitespace-nowrap" style={{ animationDelay: '0.5s' }}>
            {c.heroSubtitle}
          </p>
        </div>

      </section>

      {/* Story Section - Editorial Magazine Style */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="container-wide relative">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-start">
            {/* Left Column - Large Typography */}
            <div className="lg:col-span-5">
              <div className="sticky top-32">
                <p className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-foreground mb-6">{t.footer.aboutJournal}</p>
                <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.1] mb-6">
                  {c.storyTitle}
                </h2>
                <div className="w-20 h-px bg-foreground" />
              </div>
            </div>

            {/* Right Column - Story Content */}
            <div className="lg:col-span-7">
              <div className="space-y-8 text-lg md:text-xl text-muted-foreground leading-[1.8] font-light">
                <p className="font-serif">{c.storyP1}</p>
                <p className="font-serif">{c.storyP2}</p>
              </div>

              {/* Quote */}
              <div className="mt-16 pt-12 border-t border-border">
                <blockquote>
                  <p className="font-display text-2xl md:text-3xl italic text-foreground/80 leading-relaxed whitespace-pre-line">
                    {t.footer.brandQuote}
                  </p>
                  <footer className="mt-6">
                    <Image
                      src="/images/logo/logo_text_trans.png"
                      alt="Muse de Marée"
                      width={260}
                      height={40}
                      className="h-[34px] w-auto opacity-80"
                    />
                  </footer>
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section - Refined Grid */}
      <section className="relative py-24 md:py-32 bg-[#000000] text-white overflow-hidden">
        <div className="container-wide relative">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl">{c.valuesTitle}</h2>
          </div>

          {/* Values Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.06]">
            {c.values.map((value, index) => (
              <div
                key={index}
                className="group relative bg-[#000000] p-10 md:p-12 hover:bg-white/[0.02] transition-colors duration-500"
              >
                {/* Number */}
                <span className="block font-display text-5xl md:text-6xl text-white/40 mb-6 group-hover:text-white/70 transition-colors duration-500">
                  {value.icon}
                </span>

                {/* Content */}
                <h3 className="font-display text-xl md:text-2xl text-white mb-4 break-keep">
                  {value.title}
                </h3>
                <p className="text-sm md:text-base text-white/50 leading-relaxed font-light">
                  {value.desc}
                </p>

                {/* Hover Accent */}
                <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-white group-hover:w-full transition-all duration-700" />
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

    </div>
  )
}
