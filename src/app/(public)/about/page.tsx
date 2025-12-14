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
      heroTitle: '바다가 빚어낸 시간의 예술',
      heroSubtitle: 'Le Journal de Marée는 해저숙성 샴페인 뮤즈드마레의 이야기를 전하는 디지털 저널입니다.',
      storyTitle: '우리의 이야기',
      storyP1: '프랑스 샹파뉴 지방의 전통과 한국 바다의 신비로운 시간이 만나, 세상에 없던 새로운 샴페인이 탄생했습니다. 뮤즈드마레는 해저 깊은 곳에서 숙성되며, 바다의 압력과 온도, 그리고 시간이 만들어낸 독특한 풍미를 담고 있습니다.',
      storyP2: 'Le Journal de Marée는 이 특별한 여정의 기록입니다. 바다 아래에서 일어나는 숙성의 과학, 샴페인과 어울리는 미식의 세계, 그리고 뮤즈드마레가 함께하는 문화와 예술의 순간들을 담아냅니다.',
      valuesTitle: '우리가 믿는 가치',
      values: [
        { title: '시간의 예술', desc: '서두르지 않습니다. 최고의 결과는 충분한 시간과 인내에서 비롯됩니다.', icon: '01' },
        { title: '자연과의 조화', desc: '바다의 힘을 빌려 자연이 선사하는 최상의 맛을 담아냅니다.', icon: '02' },
        { title: '장인 정신', desc: '모든 병에는 수공예품과 같은 정성과 세심함이 담겨 있습니다.', icon: '03' },
        { title: '특별한 순간', desc: '일상을 특별하게 만드는 순간들을 함께 나눕니다.', icon: '04' },
      ],
      journalTitle: '저널 카테고리',
      journalDesc: '뮤즈드마레의 세계를 다섯 가지 시선으로 탐험합니다.',
      categories: [
        { name: '바다의 일지', desc: '해저숙성의 과학과 뮤즈드마레의 제작 과정', slug: 'sea-log' },
        { name: '메종 이야기', desc: '브랜드의 철학과 비하인드 스토리', slug: 'maison' },
        { name: '문화와 예술', desc: '뮤즈드마레가 함께하는 문화적 순간들', slug: 'culture' },
        { name: '테이블 위에서', desc: '페어링, 레시피, 미식의 세계', slug: 'table' },
        { name: '뉴스 & 이벤트', desc: '새로운 소식과 특별한 이벤트', slug: 'news' },
      ],
      ctaTitle: '함께하세요',
      ctaDesc: '뮤즈드마레의 이야기를 가장 먼저 만나보세요.',
      ctaButton: '뉴스레터 구독하기',
    },
    en: {
      heroTitle: 'The Art of Time, Crafted by the Sea',
      heroSubtitle: 'Le Journal de Marée is the digital journal sharing the story of Muse de Marée, the sea-aged champagne.',
      storyTitle: 'Our Story',
      storyP1: 'Where the traditions of France\'s Champagne region meet the mysterious depths of Korean waters, a new kind of champagne was born. Muse de Marée matures in the deep sea, capturing unique flavors created by oceanic pressure, temperature, and time.',
      storyP2: 'Le Journal de Marée is a record of this extraordinary journey. We document the science of underwater aging, the world of gastronomy that pairs with champagne, and the moments of culture and art that Muse de Marée accompanies.',
      valuesTitle: 'Our Values',
      values: [
        { title: 'The Art of Time', desc: 'We never rush. The finest results come from patience and time.', icon: '01' },
        { title: 'Harmony with Nature', desc: 'We harness the power of the sea to capture nature\'s finest flavors.', icon: '02' },
        { title: 'Craftsmanship', desc: 'Every bottle contains the care and precision of a handcrafted work of art.', icon: '03' },
        { title: 'Special Moments', desc: 'We share the moments that transform the ordinary into extraordinary.', icon: '04' },
      ],
      journalTitle: 'Journal Categories',
      journalDesc: 'Explore the world of Muse de Marée through five distinct perspectives.',
      categories: [
        { name: 'Sea Log', desc: 'The science of sea-aging and the making of Muse de Marée', slug: 'sea-log' },
        { name: 'Maison Stories', desc: 'Brand philosophy and behind-the-scenes stories', slug: 'maison' },
        { name: 'Culture & Art', desc: 'Cultural moments accompanied by Muse de Marée', slug: 'culture' },
        { name: 'At the Table', desc: 'Pairings, recipes, and the world of gastronomy', slug: 'table' },
        { name: 'News & Events', desc: 'Latest news and special events', slug: 'news' },
      ],
      ctaTitle: 'Join Us',
      ctaDesc: 'Be the first to discover the stories of Muse de Marée.',
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
            src="/bg.png"
            alt="Muse de Marée"
            fill
            className="object-cover scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />
        </div>

        <div className="container-narrow relative z-10 text-center text-white">
          {/* Decorative Element */}
          <div className="flex items-center justify-center gap-6 mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-rose-gold/60" />
            <div className="w-1.5 h-1.5 rotate-45 bg-rose-gold/80" />
            <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-rose-gold/60" />
          </div>

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

        {/* Corner Accents */}
        <div className="hidden md:block absolute top-24 left-10 w-16 h-16 border-l border-t border-white/[0.08]" />
        <div className="hidden md:block absolute top-24 right-10 w-16 h-16 border-r border-t border-white/[0.08]" />
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
                <p className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-rose-gold mb-6">{t.footer.aboutJournal}</p>
                <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.1] mb-6">
                  {c.storyTitle}
                </h2>
                <div className="w-20 h-[2px] bg-gradient-to-r from-rose-gold to-transparent" />
              </div>
            </div>

            {/* Right Column - Story Content */}
            <div className="lg:col-span-7">
              <div className="space-y-8 text-lg md:text-xl text-muted-foreground leading-[1.8] font-light">
                <p className="first-letter:text-5xl first-letter:font-display first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-foreground">
                  {c.storyP1}
                </p>
                <p>{c.storyP2}</p>
              </div>

              {/* Decorative Quote */}
              <div className="mt-16 pt-12 border-t border-border">
                <blockquote className="relative">
                  <div className="absolute -top-6 left-0 text-6xl text-rose-gold/20 font-display">"</div>
                  <p className="font-display text-2xl md:text-3xl italic text-foreground/80 leading-relaxed pl-8">
                    심연의 시간이 조각한<br />바다의 수공예품
                  </p>
                  <footer className="mt-6 pl-8">
                    <cite className="text-sm uppercase tracking-[0.2em] text-muted-foreground not-italic">
                      — Muse de Marée
                    </cite>
                  </footer>
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section - Refined Grid */}
      <section className="relative py-24 md:py-32 bg-[#0a0a0a] text-white overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-rose-gold/[0.03] blur-[120px] rounded-full" />

        <div className="container-wide relative">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-white/20" />
              <div className="w-1.5 h-1.5 rotate-45 bg-rose-gold" />
              <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-white/20" />
            </div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl">{c.valuesTitle}</h2>
          </div>

          {/* Values Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.06]">
            {c.values.map((value, index) => (
              <div
                key={index}
                className="group relative bg-[#0a0a0a] p-10 md:p-12 hover:bg-white/[0.02] transition-colors duration-500"
              >
                {/* Number */}
                <span className="block font-display text-5xl md:text-6xl text-rose-gold/20 mb-6 group-hover:text-rose-gold/40 transition-colors duration-500">
                  {value.icon}
                </span>

                {/* Content */}
                <h3 className="font-display text-xl md:text-2xl text-white mb-4">
                  {value.title}
                </h3>
                <p className="text-sm md:text-base text-white/50 leading-relaxed font-light">
                  {value.desc}
                </p>

                {/* Hover Accent */}
                <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-rose-gold group-hover:w-full transition-all duration-700" />
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
            <p className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-rose-gold mb-6">Categories</p>
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
                      <h3 className="font-display text-xl md:text-2xl lg:text-3xl mb-2 group-hover:text-rose-gold transition-colors duration-300">
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
