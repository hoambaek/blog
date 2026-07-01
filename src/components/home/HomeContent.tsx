'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ArrowUpRight, ChevronRight } from 'lucide-react'
import { useTranslation, useLocale } from '@/lib/i18n'

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

export function HomeContent({ featuredPosts, latestPosts }: HomeContentProps) {
  const t = useTranslation()
  const { locale } = useLocale()

  const isEn = locale === 'en'
  const postTitle = (p: Post) => isEn ? (p.title_en || p.title) : p.title
  const postExcerpt = (p: Post) => isEn ? (p.excerpt_en || p.excerpt) : p.excerpt

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
            sizes="100vw"
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
          {/* Eyebrow — brand motto */}
          <p
            className="text-[11px] uppercase tracking-[0.4em] text-white/60 mb-8 animate-fade-in-up"
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
            className="text-sm md:text-base text-white/60 max-w-xl mx-auto mt-6 mb-14 font-light leading-relaxed break-keep animate-fade-in-up"
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

      {/* Featured Section — magazine grid (large feature + 2-up rows) */}
      {featuredPosts.length > 0 && (
        <section className="py-16 md:py-24 bg-background">
          <div className="container-wide">
            {/* Section Header — category eyebrow */}
            <div className="flex items-center justify-between mb-10 pb-4 border-b border-foreground">
              <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-foreground">
                {t.sections.featured}
              </h2>
              <Link
                href="/category/all"
                className="group inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-foreground hover:text-muted-foreground transition-colors"
              >
                {t.sections.viewAll}
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Large feature + secondary 2-up */}
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-14">
              {/* Large feature — image above, text below */}
              {mainFeatured && (
                <Link href={`/post/${mainFeatured.slug}`} className="group block">
                  <article>
                    <div className="aspect-[16/9] relative overflow-hidden bg-secondary mb-5">
                      {mainFeatured.cover_image_url ? (
                        <Image
                          src={mainFeatured.cover_image_url}
                          alt={mainFeatured.title}
                          fill
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-secondary" />
                      )}
                    </div>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-foreground mb-3">
                      {mainFeatured.category?.name}
                    </p>
                    <h3 className="font-display text-3xl md:text-4xl leading-tight tracking-tight mb-3 group-hover:underline decoration-1 underline-offset-4">
                      {postTitle(mainFeatured)}
                    </h3>
                    {postExcerpt(mainFeatured) && (
                      <p className="font-serif text-base text-muted-foreground leading-relaxed line-clamp-3 mb-3">
                        {postExcerpt(mainFeatured)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDate(mainFeatured.published_at, locale)}
                    </p>
                  </article>
                </Link>
              )}

              {/* Secondary — two story rows with hairline dividers */}
              <div className="flex flex-col divide-y divide-border">
                {secondaryFeatured.map((post) => (
                  <Link key={post.id} href={`/post/${post.slug}`} className="group block py-6 first:pt-0 last:pb-0">
                    <article className="grid grid-cols-3 gap-5">
                      <div className="col-span-1 aspect-[4/3] relative overflow-hidden bg-secondary">
                        {post.cover_image_url ? (
                          <Image
                            src={post.cover_image_url}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-secondary" />
                        )}
                      </div>
                      <div className="col-span-2">
                        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground mb-2">
                          {post.category?.name}
                        </p>
                        <h3 className="font-display text-xl md:text-2xl leading-snug mb-2 group-hover:underline decoration-1 underline-offset-4 line-clamp-2">
                          {postTitle(post)}
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

      {/* Latest Section — vertical story-row stack */}
      {latestPosts.length > 0 && (
        <section className="py-16 md:py-24 bg-background border-t border-border">
          <div className="container-wide">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-foreground">
              <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-foreground">
                {t.sections.latest}
              </h2>
            </div>

            {/* Story rows */}
            <div className="divide-y divide-border">
              {latestPosts.map((post) => (
                <Link key={post.id} href={`/post/${post.slug}`} className="group block py-6">
                  <article className="grid md:grid-cols-12 gap-5 items-center">
                    <div className="md:col-span-3 aspect-[16/10] relative overflow-hidden bg-secondary">
                      {post.cover_image_url ? (
                        <Image
                          src={post.cover_image_url}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-secondary" />
                      )}
                    </div>
                    <div className="md:col-span-9">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground">
                          {post.category?.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatDate(post.published_at, locale)}
                        </span>
                      </div>
                      <h3 className="font-display text-2xl md:text-3xl leading-snug tracking-tight mb-2 group-hover:underline decoration-1 underline-offset-4 line-clamp-2">
                        {postTitle(post)}
                      </h3>
                      {postExcerpt(post) && (
                        <p className="font-serif text-sm md:text-base text-muted-foreground line-clamp-2 leading-relaxed">
                          {postExcerpt(post)}
                        </p>
                      )}
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {/* View All Button — square primary */}
            <div className="mt-10 text-center">
              <Link
                href="/category/all"
                className="group inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background text-sm font-bold uppercase tracking-[0.1em] hover:bg-foreground/85 transition-colors"
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
