'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ArrowUpRight, ChevronRight } from 'lucide-react'
import { useTranslation, useLocale, getCategoryName } from '@/lib/i18n'

interface Post {
  id: string
  slug: string
  title: string
  title_en: string | null
  excerpt: string | null
  excerpt_en: string | null
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

// Compact numeric dateline for editorial meta rows — 2026.01.13
function formatDateline(dateString: string | null) {
  if (!dateString) return ''
  const d = new Date(dateString)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

// Ruled kicker — a short hairline lead-in before a category label (Wired editorial)
function Kicker({ children }: { children: ReactNode }) {
  if (!children) return null
  return (
    <span className="inline-flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
      <span className="h-px w-5 bg-foreground" aria-hidden />
      {children}
    </span>
  )
}

// Section eyebrow with a solid ink tick
function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="inline-flex items-center gap-3.5 text-[11px] font-bold uppercase tracking-[0.28em] text-foreground">
      <span className="h-2 w-2 bg-foreground" aria-hidden />
      {children}
    </h2>
  )
}

export function HomeContent({ featuredPosts, latestPosts }: HomeContentProps) {
  const t = useTranslation()
  const { locale } = useLocale()

  const isEn = locale === 'en'
  const postTitle = (p: Post) => isEn ? (p.title_en || p.title) : p.title
  const postExcerpt = (p: Post) => isEn ? (p.excerpt_en || p.excerpt) : p.excerpt

  const mainFeatured = featuredPosts[0]
  const featured = featuredPosts.slice(0, 3)
  // Column count adapts to how many featured entries exist so the row always fills
  const featuredCols =
    featured.length >= 3
      ? 'sm:grid-cols-2 lg:grid-cols-3'
      : featured.length === 2
        ? 'sm:grid-cols-2'
        : 'sm:grid-cols-1 sm:max-w-xl'

  return (
    <div className="min-h-screen">
      {/* Hero Section - Full Viewport Immersive */}
      <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/bg2.webp"
            alt={t.hero.imageAlt}
            fill
            sizes="100vw"
            className="object-cover scale-105"
            priority
            quality={90}
          />
        </div>

        {/* Gradient Overlay — darkest at top, fading toward the bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/35 to-black/5" />

        {/* Noise Texture */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Hero Content */}
        <div className="relative z-10 text-center text-white px-6 max-w-5xl mx-auto">
          {/* Eyebrow — brand motto */}
          <p
            className="font-motto text-2xl md:text-3xl text-white/85 mb-6 animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            {t.hero.subtitle}
          </p>

          {/* Main Title */}
          <h1
            className="font-display text-4xl md:text-5xl lg:text-6xl mb-8 leading-[1.05] font-normal tracking-tight text-white break-keep lg:whitespace-nowrap animate-fade-in-up"
            style={{ animationDelay: '0.6s' }}
          >
            {t.hero.title1}
          </h1>

          {/* Description */}
          <p
            className="text-sm md:text-base text-white/80 max-w-xl mx-auto mt-6 mb-14 font-light leading-relaxed break-keep animate-fade-in-up [text-shadow:0_1px_16px_rgba(0,0,0,0.65)]"
            style={{ animationDelay: '0.8s' }}
          >
            {t.hero.description}
          </p>

          {/* CTA */}
          <div className="animate-fade-in-up" style={{ animationDelay: '1s' }}>
            {mainFeatured ? (
              <Link
                href={`/post/${mainFeatured.slug}`}
                className="group inline-flex items-center gap-2 md:gap-3 px-5 py-3 md:px-8 md:py-4 bg-white text-stone-900 text-[10px] md:text-xs font-semibold uppercase tracking-[0.15em] transition-all duration-300 hover:bg-white/80"
              >
                {t.hero.cta}
                <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <Link
                href="/category/all"
                className="group inline-flex items-center gap-2 md:gap-3 px-5 py-3 md:px-8 md:py-4 bg-white text-stone-900 text-[10px] md:text-xs font-semibold uppercase tracking-[0.15em] transition-all duration-300 hover:bg-white/80"
              >
                {t.sections.viewAll}
                <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>
        </div>

      </section>

      {/* Featured Section — editorial lead story + ruled secondary column */}
      {featuredPosts.length > 0 && (
        <section className="py-20 md:py-28 bg-background">
          <div className="container-wide">
            {/* Section Header */}
            <div className="flex items-baseline justify-between mb-12 md:mb-16">
              <SectionLabel>{t.sections.featured}</SectionLabel>
              <Link
                href="/category/all"
                className="group inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors"
              >
                {t.sections.viewAll}
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Balanced editorial grid — columns adapt to entry count, no dominant tile */}
            <div className={`grid gap-x-8 gap-y-12 lg:gap-x-10 ${featuredCols}`}>
              {featured.map((post, i) => (
                <Link
                  key={post.id}
                  href={`/post/${post.slug}`}
                  className="group block"
                >
                  <article>
                    <div className="aspect-[4/3] relative overflow-hidden bg-secondary mb-5">
                      {post.cover_image_url ? (
                        <Image
                          src={post.cover_image_url}
                          alt={post.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                          priority={i === 0}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-secondary" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 mb-3">
                      <Kicker>{getCategoryName(t, post.category?.slug, post.category?.name)}</Kicker>
                      <span className="text-[11px] tracking-[0.1em] text-muted-foreground tabular-nums">
                        {formatDateline(post.published_at)}
                      </span>
                    </div>
                    <h3 className="font-display text-2xl lg:text-[1.7rem] leading-snug tracking-tight mb-2 line-clamp-2 transition-colors group-hover:text-muted-foreground">
                      {postTitle(post)}
                    </h3>
                    {postExcerpt(post) && (
                      <p className="font-serif text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {postExcerpt(post)}
                      </p>
                    )}
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Section — numbered journal index (running entries) */}
      {latestPosts.length > 0 && (
        <section className="py-20 md:py-28 bg-background border-t border-border">
          <div className="container-wide">
            {/* Section Header */}
            <div className="flex items-baseline justify-between mb-12 md:mb-14">
              <SectionLabel>{t.sections.latest}</SectionLabel>
            </div>

            {/* Typographic index — department · headline · dateline */}
            <div className="border-t border-border">
              {latestPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/post/${post.slug}`}
                  className="group block border-b border-border"
                >
                  <article className="grid grid-cols-12 gap-x-6 gap-y-1.5 md:gap-8 items-baseline py-6 md:py-7 px-4 -mx-4 transition-colors duration-300 group-hover:bg-secondary/60">
                    {/* Department */}
                    <div className="col-span-12 md:col-span-3">
                      <Kicker>{getCategoryName(t, post.category?.slug, post.category?.name)}</Kicker>
                    </div>

                    {/* Headline */}
                    <div className="col-span-12 md:col-span-7">
                      <h3 className="font-display text-2xl md:text-[1.9rem] leading-[1.15] tracking-tight transition-colors group-hover:text-muted-foreground">
                        {postTitle(post)}
                      </h3>
                    </div>

                    {/* Dateline + hover arrow */}
                    <div className="col-span-12 md:col-span-2 flex items-center justify-start md:justify-end gap-3 mt-1 md:mt-0">
                      <span className="text-[11px] tracking-[0.1em] text-muted-foreground tabular-nums">
                        {formatDateline(post.published_at)}
                      </span>
                      <ArrowUpRight className="hidden md:block h-4 w-4 shrink-0 text-foreground opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {/* View All Button — square primary */}
            <div className="mt-14 text-center">
              <Link
                href="/category/all"
                className="group inline-flex items-center gap-2 px-7 py-3.5 bg-foreground text-background text-xs font-bold uppercase tracking-[0.15em] hover:bg-foreground/85 transition-colors"
              >
                {t.sections.viewAll}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>
      )}

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
