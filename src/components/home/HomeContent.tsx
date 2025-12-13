'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
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
  const secondaryFeatured = featuredPosts.slice(1)

  return (
    <div>
      {/* Hero Section - Luxury Editorial Style */}
      <section className="relative h-[calc(100vh-4rem)] min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image with Parallax Effect */}
        <div className="absolute inset-0">
          <Image
            src="/bg.png"
            alt={t.hero.imageAlt}
            fill
            className="object-cover scale-110 animate-slow-zoom"
            priority
            quality={90}
          />
        </div>

        {/* Multi-layer Black Overlay for Depth */}
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />

        {/* Subtle Vignette Effect */}
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0,0,0,0.4) 100%)'
          }}
        />

        {/* Grain Texture Overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Content with Staggered Animation */}
        <div className="relative z-10 text-center text-white px-6 max-w-5xl mx-auto">
          {/* Decorative Line */}
          <div className="flex items-center justify-center gap-4 mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <span className="w-12 h-px bg-gradient-to-r from-transparent via-rose-gold to-transparent" />
            <span className="text-rose-gold text-xs">◆</span>
            <span className="w-12 h-px bg-gradient-to-r from-transparent via-rose-gold to-transparent" />
          </div>

          {/* Subtitle */}
          <p
            className="font-sans uppercase text-[11px] md:text-xs tracking-[0.4em] text-white/60 mb-8 animate-fade-in-up"
            style={{ animationDelay: '0.4s' }}
          >
            Le Journal de Marée
          </p>

          {/* Main Title */}
          <h1
            className="font-serif text-2xl md:text-3xl lg:text-4xl xl:text-5xl mb-8 leading-[1.3] tracking-wide font-light animate-fade-in-up"
            style={{ animationDelay: '0.6s' }}
          >
            <span className="block text-white/90 italic">{t.hero.title1}</span>
            <span className="block mt-3 text-rose-gold/90 italic">
              {t.hero.title2}
            </span>
          </h1>

          {/* Description */}
          <p
            className="text-sm md:text-base lg:text-lg text-white/60 max-w-2xl mx-auto mb-12 font-light leading-relaxed tracking-wide animate-fade-in-up"
            style={{ animationDelay: '0.8s' }}
          >
            <span className="block">{locale === 'ko' ? '프랑스 샹파뉴의 전통과 한국 바다의 시간이 만나 탄생한 해저숙성 샴페인,' : 'The story of Muse de Marée, where French Champagne tradition'}</span>
            <span className="block">{locale === 'ko' ? '뮤즈드마레의 이야기.' : 'meets the passage of time in Korean waters.'}</span>
          </p>

          {/* CTA Button with Elegant Hover */}
          <div className="animate-fade-in-up" style={{ animationDelay: '1s' }}>
            {mainFeatured ? (
              <Link
                href={`/post/${mainFeatured.slug}`}
                className="group relative inline-flex items-center gap-3 overflow-hidden"
              >
                {/* Button Background */}
                <span className="relative px-10 py-4 border border-white/30 backdrop-blur-sm bg-white/5 transition-all duration-500 group-hover:bg-white group-hover:border-white">
                  <span className="relative z-10 flex items-center gap-3 uppercase text-xs tracking-[0.2em] font-medium text-white transition-colors duration-500 group-hover:text-stone-900">
                    {t.hero.cta}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </span>
              </Link>
            ) : (
              <Link
                href="/category/all"
                className="group relative inline-flex items-center gap-3 overflow-hidden"
              >
                <span className="relative px-10 py-4 border border-white/30 backdrop-blur-sm bg-white/5 transition-all duration-500 group-hover:bg-white group-hover:border-white">
                  <span className="relative z-10 flex items-center gap-3 uppercase text-xs tracking-[0.2em] font-medium text-white transition-colors duration-500 group-hover:text-stone-900">
                    {t.sections.viewAll}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* Animated Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 animate-fade-in-up" style={{ animationDelay: '1.2s' }}>
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-light">Scroll</span>
          <div className="relative h-12 w-px">
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent" />
            <div className="absolute top-0 left-0 w-full h-4 bg-white/80 animate-scroll-line" />
          </div>
        </div>

        {/* Corner Decorations */}
        <div className="absolute top-8 left-8 w-16 h-16 border-l border-t border-white/10" />
        <div className="absolute top-8 right-8 w-16 h-16 border-r border-t border-white/10" />
        <div className="absolute bottom-8 left-8 w-16 h-16 border-l border-b border-white/10" />
        <div className="absolute bottom-8 right-8 w-16 h-16 border-r border-b border-white/10" />
      </section>

      {/* Featured Section */}
      {featuredPosts.length > 0 && (
        <section className="container-wide py-20">
          <div className="divider mb-12">
            <span className="label-text">{t.sections.featured}</span>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Main Featured Post */}
            {mainFeatured && (
              <Link href={`/post/${mainFeatured.slug}`} className="group">
                <article className="card-hover">
                  <div className="aspect-[4/3] relative bg-muted overflow-hidden">
                    {mainFeatured.cover_image_url && (
                      <Image
                        src={mainFeatured.cover_image_url}
                        alt={mainFeatured.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6 text-white">
                      <p className="label-text text-white/70 mb-2">
                        {mainFeatured.category?.name}
                      </p>
                      <h2 className="font-display text-2xl md:text-3xl mb-2">
                        {mainFeatured.title}
                      </h2>
                      <p className="text-sm text-white/80">
                        {formatDate(mainFeatured.published_at, locale)}
                      </p>
                    </div>
                  </div>
                </article>
              </Link>
            )}

            {/* Secondary Featured Posts */}
            <div className="space-y-8">
              {mainFeatured?.category && (
                <p className="label-text">{mainFeatured.category.name}</p>
              )}
              {secondaryFeatured.map((post) => (
                <Link key={post.id} href={`/post/${post.slug}`} className="group block">
                  <article className="grid grid-cols-3 gap-4 card-hover">
                    <div className="aspect-square relative bg-muted overflow-hidden">
                      {post.cover_image_url && (
                        <Image
                          src={post.cover_image_url}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <div className="col-span-2 flex flex-col justify-center">
                      <p className="label-text mb-1">{post.category?.name}</p>
                      <h3 className="font-display text-lg md:text-xl mb-1 group-hover:text-muted-foreground transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(post.published_at, locale)}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Section */}
      {latestPosts.length > 0 && (
        <section className="container-wide py-20 border-t border-border">
          <div className="flex justify-between items-center mb-12">
            <h2 className="label-text">{t.sections.latest}</h2>
            <Link
              href="/category/all"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              {t.sections.viewAll}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {latestPosts.map((post) => (
              <Link key={post.id} href={`/post/${post.slug}`} className="group">
                <article className="card-hover">
                  <div className="aspect-[4/3] relative bg-muted mb-4 overflow-hidden">
                    {post.cover_image_url && (
                      <Image
                        src={post.cover_image_url}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <p className="label-text mb-2">{post.category?.name}</p>
                  <h3 className="font-display text-lg group-hover:text-muted-foreground transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {formatDate(post.published_at, locale)}
                  </p>
                </article>
              </Link>
            ))}
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
