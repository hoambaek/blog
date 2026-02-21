'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation, useLocale } from '@/lib/i18n'

interface Post {
  id: string
  slug: string
  title: string
  title_en: string | null
  excerpt: string | null
  excerpt_en: string | null
  content: unknown
  content_en: unknown
  cover_image_url: string | null
  published_at: string | null
  reading_time_minutes: number | null
  category: {
    name: string
    slug: string
  } | null
}

interface AdjacentPost {
  slug: string
  title: string
  title_en: string | null
}

interface PostContentProps {
  post: Post
  relatedPosts: Post[]
  prev: AdjacentPost | null
  next: AdjacentPost | null
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

export function PostContent({ post, relatedPosts, prev, next }: PostContentProps) {
  const t = useTranslation()
  const { locale } = useLocale()

  const isEn = locale === 'en'
  const displayTitle = isEn ? (post.title_en || post.title) : post.title
  const displayExcerpt = isEn ? (post.excerpt_en || post.excerpt) : post.excerpt

  const rawContent = isEn && post.content_en ? post.content_en : post.content
  const htmlContent = typeof rawContent === 'object' && rawContent !== null
    ? (rawContent as { html?: string }).html || ''
    : ''

  // Get translated category name based on slug
  const getCategoryName = (slug: string | undefined) => {
    if (!slug) return t.post.allPosts
    const categoryMap: Record<string, string> = {
      'sea-log': t.nav.seaLog,
      'maison': t.nav.maison,
      'culture': t.nav.culture,
      'table': t.nav.table,
      'news': t.nav.news,
    }
    return categoryMap[slug] || t.post.allPosts
  }

  return (
    <article>
      {/* Hero Image - Full image on mobile, cropped on larger screens */}
      <div className="relative bg-muted mt-12 md:mt-[100px]">
        {post.cover_image_url && (
          <Image
            src={post.cover_image_url}
            alt={post.title}
            width={1920}
            height={1080}
            className="w-full h-auto md:aspect-[21/9] md:object-cover"
            priority
          />
        )}
        {/* Gradient overlay - black from bottom to middle */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="container-narrow px-5 sm:px-6 py-8 sm:py-10 md:py-12">
        {/* Meta - Mobile optimized */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          {/* Category & Meta on mobile - stacked elegantly */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-0 mb-5 sm:mb-4">
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-rose-gold font-medium">
              {getCategoryName(post.category?.slug)}
            </span>
            <span className="hidden sm:inline font-serif-mixed text-sm text-muted-foreground mx-3">•</span>
            <span className="font-serif-mixed text-[11px] sm:text-sm text-muted-foreground/80 tracking-wide">
              {formatDate(post.published_at, locale)}
            </span>
            <span className="hidden sm:inline font-serif-mixed text-sm text-muted-foreground mx-3">•</span>
            <span className="font-serif-mixed text-[11px] sm:text-sm text-muted-foreground/80 tracking-wide">
              {post.reading_time_minutes || 5}{t.post.readingTime}
            </span>
          </div>

          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-3 mb-6 sm:mb-8">
            <div className="w-8 sm:w-12 h-[1px] bg-gradient-to-r from-transparent to-rose-gold/40" />
            <div className="w-1 h-1 rotate-45 bg-rose-gold/60" />
            <div className="w-8 sm:w-12 h-[1px] bg-gradient-to-l from-transparent to-rose-gold/40" />
          </div>

          <h1 className="font-display-ko text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-6 sm:mb-8 text-balance leading-[1.3] sm:leading-tight px-2">
            {displayTitle}
          </h1>

          {/* Bottom divider */}
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 sm:w-12 h-[1px] bg-gradient-to-r from-transparent to-border" />
            <div className="w-1 h-1 rotate-45 bg-muted-foreground/30" />
            <div className="w-8 sm:w-12 h-[1px] bg-gradient-to-l from-transparent to-border" />
          </div>
        </div>

        {/* Article Content */}
        <div
          className="prose prose-stone mx-auto post-content
            prose-headings:font-display prose-headings:font-normal prose-headings:tracking-tight
            prose-h2:text-xl prose-h2:sm:text-2xl prose-h2:md:text-3xl prose-h2:mt-10 prose-h2:sm:mt-14 prose-h2:md:mt-16 prose-h2:mb-5 prose-h2:sm:mb-6 prose-h2:md:mb-8 prose-h2:text-center
            prose-h3:text-lg prose-h3:sm:text-xl prose-h3:md:text-2xl prose-h3:mt-8 prose-h3:sm:mt-10 prose-h3:md:mt-12 prose-h3:mb-4 prose-h3:sm:mb-5 prose-h3:md:mb-6
            prose-p:text-[15px] prose-p:sm:text-base prose-p:md:text-lg prose-p:leading-[1.85] prose-p:sm:leading-[1.9] prose-p:mb-5 prose-p:sm:mb-6 prose-p:md:mb-8 prose-p:text-muted-foreground prose-p:text-justify
            prose-p:empty:mb-3 prose-p:empty:h-3 prose-p:empty:sm:mb-4 prose-p:empty:sm:h-4
            prose-blockquote:border-l-0 prose-blockquote:border-y prose-blockquote:border-rose-gold/30
            prose-blockquote:px-4 prose-blockquote:sm:px-6 prose-blockquote:md:px-8 prose-blockquote:py-5 prose-blockquote:sm:py-6 prose-blockquote:md:py-8 prose-blockquote:my-8 prose-blockquote:sm:my-10 prose-blockquote:md:my-12
            prose-blockquote:font-display prose-blockquote:text-lg prose-blockquote:sm:text-xl prose-blockquote:md:text-2xl
            prose-blockquote:text-center prose-blockquote:text-foreground
            prose-blockquote:not-italic prose-blockquote:bg-muted/30
            prose-a:text-navy prose-a:underline prose-a:underline-offset-4 prose-a:decoration-rose-gold/50
            prose-img:my-10 prose-img:sm:my-14 prose-img:md:my-20 prose-img:rounded-lg prose-img:shadow-[0_8px_30px_rgba(0,0,0,0.25)]
            prose-figure:my-10 prose-figure:sm:my-14 prose-figure:md:my-20
            prose-strong:text-foreground prose-strong:font-medium
            prose-li:text-muted-foreground prose-li:leading-relaxed prose-li:text-[15px] prose-li:sm:text-base
            first-letter:text-4xl first-letter:sm:text-5xl first-letter:font-display first-letter:float-left first-letter:mr-2 first-letter:sm:mr-3 first-letter:mt-0.5 first-letter:sm:mt-1 first-letter:text-foreground
          "
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>

      {/* Related Posts - Compact mobile design */}
      {relatedPosts.length > 0 && (
        <section className="border-t border-border py-10 sm:py-12 md:py-16 bg-muted/20">
          <div className="container-wide px-5 sm:px-6">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <div className="w-6 sm:w-8 h-[1px] bg-rose-gold/60" />
              <h2 className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-muted-foreground font-medium">
                {t.sections.relatedStories}
              </h2>
            </div>

            {/* Mobile: Horizontal scroll, Desktop: Grid */}
            <div className="flex md:grid md:grid-cols-3 gap-4 sm:gap-5 md:gap-6 overflow-x-auto md:overflow-visible pb-4 md:pb-0 -mx-5 px-5 md:mx-0 md:px-0 snap-x snap-mandatory md:snap-none scrollbar-hide">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  href={`/post/${relatedPost.slug}`}
                  className="group flex-shrink-0 w-[75vw] sm:w-[60vw] md:w-auto snap-start"
                >
                  <article className="bg-background rounded-sm overflow-hidden border border-border/50 hover:border-border transition-colors">
                    <div className="aspect-[16/10] relative bg-muted overflow-hidden">
                      {relatedPost.cover_image_url && (
                        <Image
                          src={relatedPost.cover_image_url}
                          alt={relatedPost.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <div className="p-3 sm:p-4">
                      <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-rose-gold font-medium mb-1.5 sm:mb-2">
                        {getCategoryName(relatedPost.category?.slug)}
                      </p>
                      <h3 className="font-display text-sm sm:text-base md:text-lg leading-snug group-hover:text-muted-foreground transition-colors line-clamp-2">
                        {isEn ? (relatedPost.title_en || relatedPost.title) : relatedPost.title}
                      </h3>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Post Navigation - Mobile optimized */}
      {(prev || next) && (
        <section className="border-t border-border bg-background">
          <div className="container-wide px-0 sm:px-6">
            {/* Mobile: Stacked, Desktop: Side by side */}
            <div className="flex flex-col md:flex-row md:grid md:grid-cols-2">
              {prev ? (
                <Link
                  href={`/post/${prev.slug}`}
                  className="group flex items-center gap-3 sm:gap-4 px-5 sm:px-6 md:px-8 py-5 sm:py-6 md:py-8 md:border-r border-b md:border-b-0 border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-border flex items-center justify-center group-hover:border-foreground/30 transition-colors">
                    <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-0.5 sm:mb-1">
                      {t.post.prevPost}
                    </p>
                    <p className="font-display text-sm sm:text-base md:text-lg truncate group-hover:text-muted-foreground transition-colors">
                      {isEn ? (prev.title_en || prev.title) : prev.title}
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="hidden md:block" />
              )}
              {next && (
                <Link
                  href={`/post/${next.slug}`}
                  className="group flex items-center justify-end gap-3 sm:gap-4 px-5 sm:px-6 md:px-8 py-5 sm:py-6 md:py-8 hover:bg-muted/30 transition-colors text-right"
                >
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-0.5 sm:mb-1">
                      {t.post.nextPost}
                    </p>
                    <p className="font-display text-sm sm:text-base md:text-lg truncate group-hover:text-muted-foreground transition-colors">
                      {isEn ? (next.title_en || next.title) : next.title}
                    </p>
                  </div>
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-border flex items-center justify-center group-hover:border-foreground/30 transition-colors">
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

    </article>
  )
}
