'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { useTranslation, useLocale } from '@/lib/i18n'

interface Post {
  id: string
  slug: string
  title: string
  excerpt: string | null
  cover_image_url: string | null
  published_at: string | null
  category: {
    name: string
    slug: string
  } | null
}

interface HomeContentProps {
  featuredPosts: Post[]
  latestPosts: Post[]
}

function formatDate(dateString: string | null, locale: string) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function HomeContent({ featuredPosts, latestPosts }: HomeContentProps) {
  const t = useTranslation()
  const { locale } = useLocale()

  const mainFeatured = featuredPosts[0]
  const secondaryFeatured = featuredPosts.slice(1, 3)

  return (
    <div className="min-h-screen">
      {/* Hero Section - Full Viewport Immersive */}
      <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/bg.png"
            alt={t.hero.imageAlt}
            fill
            className="object-cover scale-105"
            priority
            quality={90}
          />
        </div>

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />

        {/* Noise Texture */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Hero Content */}
        <div className="relative z-10 text-center text-white px-6 max-w-5xl mx-auto">
          {/* Decorative Element */}
          <div className="flex items-center justify-center gap-6 mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="w-20 h-[1px] bg-gradient-to-r from-transparent to-rose-gold/60" />
            <div className="w-1.5 h-1.5 rotate-45 bg-rose-gold/80" />
            <div className="w-20 h-[1px] bg-gradient-to-l from-transparent to-rose-gold/60" />
          </div>

          {/* Tagline */}
          <p
            className="uppercase text-[11px] md:text-xs tracking-[0.5em] text-white/50 mb-10 font-light animate-fade-in-up"
            style={{ animationDelay: '0.4s' }}
          >
            Le Journal de Marée
          </p>

          {/* Main Title */}
          <h1
            className="font-display text-3xl md:text-4xl lg:text-5xl xl:text-6xl mb-8 leading-[1.2] font-normal animate-fade-in-up"
            style={{ animationDelay: '0.6s' }}
          >
            <span className="block text-white/95">{t.hero.title1}</span>
            <span className="block mt-4 text-rose-gold italic">
              {t.hero.title2}
            </span>
          </h1>

          {/* Description */}
          <p
            className="text-base md:text-lg text-white/50 max-w-xl mx-auto mb-14 font-light leading-relaxed animate-fade-in-up"
            style={{ animationDelay: '0.8s' }}
          >
            {locale === 'ko'
              ? '프랑스 샹파뉴의 전통과 한국 바다의 시간이 만나 탄생한 해저숙성 샴페인, 뮤즈드마레의 이야기.'
              : 'The story of Muse de Marée, where French Champagne tradition meets the passage of time in Korean waters.'}
          </p>

          {/* CTA */}
          <div className="animate-fade-in-up" style={{ animationDelay: '1s' }}>
            {mainFeatured ? (
              <Link
                href={`/post/${mainFeatured.slug}`}
                className="group inline-flex items-center gap-4"
              >
                <span className="relative px-8 py-4 bg-white text-stone-900 text-xs font-semibold uppercase tracking-[0.15em] transition-all duration-300 group-hover:bg-rose-gold group-hover:text-white">
                  {t.hero.cta}
                </span>
                <ArrowRight className="h-5 w-5 text-white/60 transition-all duration-300 group-hover:text-white group-hover:translate-x-1" />
              </Link>
            ) : (
              <Link
                href="/category/all"
                className="group inline-flex items-center gap-4"
              >
                <span className="relative px-8 py-4 bg-white text-stone-900 text-xs font-semibold uppercase tracking-[0.15em] transition-all duration-300 group-hover:bg-rose-gold group-hover:text-white">
                  {t.sections.viewAll}
                </span>
                <ArrowRight className="h-5 w-5 text-white/60 transition-all duration-300 group-hover:text-white group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 animate-fade-in-up" style={{ animationDelay: '1.2s' }}>
          <span className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-light">Scroll</span>
          <div className="w-[1px] h-10 bg-gradient-to-b from-white/40 to-transparent relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-3 bg-white animate-scroll-line" />
          </div>
        </div>

        {/* Corner Accents */}
        <div className="absolute top-10 left-10 w-20 h-20 border-l border-t border-white/[0.08]" />
        <div className="absolute top-10 right-10 w-20 h-20 border-r border-t border-white/[0.08]" />
        <div className="absolute bottom-10 left-10 w-20 h-20 border-l border-b border-white/[0.08]" />
        <div className="absolute bottom-10 right-10 w-20 h-20 border-r border-b border-white/[0.08]" />
      </section>

      {/* Featured Section - Editorial Grid */}
      {featuredPosts.length > 0 && (
        <section className="py-24 md:py-32 bg-background">
          <div className="container-wide">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-16">
              <div className="flex items-center gap-6">
                <div className="w-12 h-[1px] bg-rose-gold" />
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  {t.sections.featured}
                </h2>
              </div>
              <Link
                href="/category/all"
                className="group flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
              >
                {t.sections.viewAll}
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Featured Grid */}
            <div className="grid lg:grid-cols-12 gap-8">
              {/* Main Featured - Large Card */}
              {mainFeatured && (
                <Link href={`/post/${mainFeatured.slug}`} className="lg:col-span-7 group">
                  <article className="relative">
                    <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                      {mainFeatured.cover_image_url ? (
                        <Image
                          src={mainFeatured.cover_image_url}
                          alt={mainFeatured.title}
                          fill
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-300" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 bg-white/10 backdrop-blur-sm text-[10px] font-medium uppercase tracking-wider text-white/80">
                          {mainFeatured.category?.name}
                        </span>
                        <span className="text-[11px] text-white/50">
                          {formatDate(mainFeatured.published_at, locale)}
                        </span>
                      </div>
                      <h3 className="font-display text-2xl md:text-3xl lg:text-4xl text-white mb-3 transition-colors">
                        {mainFeatured.title}
                      </h3>
                      {mainFeatured.excerpt && (
                        <p className="text-sm text-white/60 line-clamp-2 max-w-lg">
                          {mainFeatured.excerpt}
                        </p>
                      )}
                    </div>
                  </article>
                </Link>
              )}

              {/* Secondary Featured - Stacked Cards */}
              <div className="lg:col-span-5 flex flex-col gap-8">
                {secondaryFeatured.map((post, index) => (
                  <Link key={post.id} href={`/post/${post.slug}`} className="group flex-1">
                    <article className="h-full grid md:grid-cols-5 gap-6 p-6 bg-card border border-border hover:border-muted-foreground/20 transition-all duration-300">
                      <div className="md:col-span-2 aspect-square md:aspect-auto relative overflow-hidden bg-muted">
                        {post.cover_image_url ? (
                          <Image
                            src={post.cover_image_url}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-300" />
                        )}
                      </div>
                      <div className="md:col-span-3 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-gold">
                            {post.category?.name}
                          </span>
                        </div>
                        <h3 className="font-display text-xl md:text-2xl mb-3 group-hover:text-muted-foreground transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(post.published_at, locale)}
                        </p>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Latest Section - Magazine Grid */}
      {latestPosts.length > 0 && (
        <section className="py-24 md:py-32 bg-muted/30">
          <div className="container-wide">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-16">
              <div className="flex items-center gap-6">
                <div className="w-12 h-[1px] bg-foreground" />
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground">
                  {t.sections.latest}
                </h2>
              </div>
            </div>

            {/* Latest Grid - 4 columns on desktop */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
              {latestPosts.map((post, index) => (
                <Link key={post.id} href={`/post/${post.slug}`} className="group">
                  <article>
                    <div className="aspect-[4/5] relative overflow-hidden bg-muted mb-5">
                      {post.cover_image_url ? (
                        <Image
                          src={post.cover_image_url}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-300" />
                      )}
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-gold">
                          {post.category?.name}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span className="text-[11px] text-muted-foreground">
                          {formatDate(post.published_at, locale)}
                        </span>
                      </div>
                      <h3 className="font-display text-lg md:text-xl leading-snug group-hover:text-muted-foreground transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {post.excerpt}
                        </p>
                      )}
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {/* View All Button */}
            <div className="mt-16 text-center">
              <Link
                href="/category/all"
                className="group inline-flex items-center gap-3 px-8 py-4 border border-foreground text-foreground text-xs font-semibold uppercase tracking-[0.15em] hover:bg-foreground hover:text-background transition-all duration-300"
              >
                {t.sections.viewAll}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Newsletter Section */}
      <section className="py-24 md:py-32 bg-foreground text-background">
        <div className="container-narrow text-center">
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="w-16 h-[1px] bg-background/20" />
            <div className="w-1.5 h-1.5 rotate-45 bg-rose-gold" />
            <div className="w-16 h-[1px] bg-background/20" />
          </div>
          <h2 className="font-display text-3xl md:text-4xl mb-6">
            {locale === 'ko' ? '뮤즈드마레의 이야기를 받아보세요' : 'Subscribe to Our Stories'}
          </h2>
          <p className="text-background/60 mb-10 max-w-md mx-auto">
            {locale === 'ko'
              ? '바다의 시간이 빚어낸 이야기를 가장 먼저 전해드립니다.'
              : 'Be the first to receive stories crafted by the ocean\'s time.'}
          </p>
          <Link
            href="/subscribe"
            className="inline-flex items-center gap-3 px-8 py-4 bg-rose-gold text-white text-xs font-semibold uppercase tracking-[0.15em] hover:bg-rose-gold/90 transition-colors"
          >
            {t.nav.subscribe}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Empty State */}
      {featuredPosts.length === 0 && latestPosts.length === 0 && (
        <section className="container-wide py-32 text-center">
          <h2 className="font-display text-3xl mb-4">{t.sections.emptyTitle}</h2>
          <p className="text-muted-foreground mb-8">
            {t.sections.emptyDescription}
          </p>
        </section>
      )}
    </div>
  )
}
