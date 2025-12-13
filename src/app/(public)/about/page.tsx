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
        { title: '시간의 예술', desc: '서두르지 않습니다. 최고의 결과는 충분한 시간과 인내에서 비롯됩니다.' },
        { title: '자연과의 조화', desc: '바다의 힘을 빌려 자연이 선사하는 최상의 맛을 담아냅니다.' },
        { title: '장인 정신', desc: '모든 병에는 수공예품과 같은 정성과 세심함이 담겨 있습니다.' },
        { title: '특별한 순간', desc: '일상을 특별하게 만드는 순간들을 함께 나눕니다.' },
      ],
      journalTitle: '저널 소개',
      categories: [
        { name: '바다의 일지', desc: '해저숙성의 과학과 뮤즈드마레의 제작 과정' },
        { name: '메종 이야기', desc: '브랜드의 철학과 비하인드 스토리' },
        { name: '문화와 예술', desc: '뮤즈드마레가 함께하는 문화적 순간들' },
        { name: '테이블 위에서', desc: '페어링, 레시피, 미식의 세계' },
        { name: '뉴스 & 이벤트', desc: '새로운 소식과 특별한 이벤트' },
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
        { title: 'The Art of Time', desc: 'We never rush. The finest results come from patience and time.' },
        { title: 'Harmony with Nature', desc: 'We harness the power of the sea to capture nature\'s finest flavors.' },
        { title: 'Craftsmanship', desc: 'Every bottle contains the care and precision of a handcrafted work of art.' },
        { title: 'Special Moments', desc: 'We share the moments that transform the ordinary into extraordinary.' },
      ],
      journalTitle: 'About the Journal',
      categories: [
        { name: 'Sea Log', desc: 'The science of sea-aging and the making of Muse de Marée' },
        { name: 'Maison Stories', desc: 'Brand philosophy and behind-the-scenes stories' },
        { name: 'Culture & Art', desc: 'Cultural moments accompanied by Muse de Marée' },
        { name: 'At the Table', desc: 'Pairings, recipes, and the world of gastronomy' },
        { name: 'News & Events', desc: 'Latest news and special events' },
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
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/bg.png"
            alt="Muse de Marée"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div className="container-narrow relative z-10 text-center text-white">
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className="w-12 h-px bg-gradient-to-r from-transparent via-rose-gold to-transparent" />
            <span className="text-rose-gold text-xs">◆</span>
            <span className="w-12 h-px bg-gradient-to-r from-transparent via-rose-gold to-transparent" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl mb-6 animate-fade-in-up">
            {c.heroTitle}
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {c.heroSubtitle}
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="container-narrow py-20">
        <div className="max-w-2xl mx-auto text-center">
          <p className="label-text mb-4">{t.footer.aboutJournal}</p>
          <h2 className="font-display text-3xl md:text-4xl mb-8">{c.storyTitle}</h2>
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p>{c.storyP1}</p>
            <p>{c.storyP2}</p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="container-narrow">
        <div className="divider">
          <span className="text-rose-gold">◆</span>
        </div>
      </div>

      {/* Values Section */}
      <section className="container-wide py-20">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl">{c.valuesTitle}</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {c.values.map((value, index) => (
            <div key={index} className="text-center p-6">
              <div className="w-12 h-12 mx-auto mb-6 border border-rose-gold flex items-center justify-center">
                <span className="text-rose-gold font-display text-xl">{index + 1}</span>
              </div>
              <h3 className="font-display text-xl mb-3">{value.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{value.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Journal Categories Section */}
      <section className="bg-muted py-20">
        <div className="container-wide">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl">{c.journalTitle}</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {c.categories.map((cat, index) => (
              <div
                key={index}
                className="bg-background p-8 border border-border hover:border-rose-gold transition-colors group"
              >
                <h3 className="font-display text-lg mb-2 group-hover:text-rose-gold transition-colors">
                  {cat.name}
                </h3>
                <p className="text-sm text-muted-foreground">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container-narrow py-24 text-center">
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className="w-12 h-px bg-border" />
          <span className="text-rose-gold text-xs">◆</span>
          <span className="w-12 h-px bg-border" />
        </div>
        <h2 className="font-display text-3xl md:text-4xl mb-4">{c.ctaTitle}</h2>
        <p className="text-muted-foreground mb-8">{c.ctaDesc}</p>
        <Link
          href="/subscribe"
          className="inline-flex items-center gap-3 bg-foreground text-background px-8 py-4 uppercase text-sm tracking-wider font-medium hover:bg-foreground/90 transition-colors"
        >
          {c.ctaButton}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  )
}
