'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation, useLocale } from '@/lib/i18n'
import { NewsletterForm } from '@/components/NewsletterForm'

interface Post {
  id: string
  slug: string
  title: string
  title_en: string | null
  excerpt: string | null
  excerpt_en: string | null
  photo_credits: string | null
  content: unknown
  content_en: unknown
  cover_image_url: string | null
  published_at: string | null
  updated_at: string | null
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
  const rawHtml = typeof rawContent === 'object' && rawContent !== null
    ? (rawContent as { html?: string }).html || ''
    : ''
  // Strip a trailing brand-signature paragraph baked into the body
  // (e.g. <p><em>Muse de Marée</em></p>) — replaced by the logo signature below.
  const emptyParaAtEnd = /(?:\s*<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>)+\s*$/i
  const signatureAtEnd = /\s*<p>\s*(?:<(?:em|strong|b|i)>\s*)?(?:뮤즈드마레|Muse de Marée)\s*[.·]?\s*(?:<\/(?:em|strong|b|i)>\s*)?<\/p>\s*$/i
  const htmlContent = rawHtml
    .replace(emptyParaAtEnd, '')
    .replace(signatureAtEnd, '')
    .replace(emptyParaAtEnd, '')

  // 본문 영상을 Threads식으로 재생: 무음·인라인·루프, 화면에 보일 때만 자동재생.
  // 저장된 HTML(<video controls>)은 그대로 두고 렌더링 시점에만 업그레이드하므로
  // 기존 발행 글의 영상에도 자동 적용된다.
  const contentRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = contentRef.current
    if (!root) return
    const videos = Array.from(root.querySelectorAll('video'))
    if (videos.length === 0) return

    // 탭/클릭으로 일시정지·재생 토글. 사용자가 멈춘 영상은 스크롤로 다시 보여도 자동재생하지 않는다.
    const toggle = (event: Event) => {
      const video = event.currentTarget as HTMLVideoElement
      if (video.paused) {
        delete video.dataset.userPaused
        video.play().catch(() => {})
      } else {
        video.dataset.userPaused = 'true'
        video.pause()
      }
    }

    videos.forEach((video) => {
      // iOS 사파리 무음 자동재생 조건: muted + playsinline (속성과 프로퍼티 둘 다)
      video.muted = true
      video.setAttribute('muted', '')
      video.playsInline = true
      video.setAttribute('playsinline', '')
      video.loop = true
      video.removeAttribute('controls')
      video.preload = 'metadata'
      video.style.cursor = 'pointer'
      video.addEventListener('click', toggle)
    })

    // 화면의 40% 이상 보이면 재생, 벗어나면 일시정지
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target as HTMLVideoElement
          if (entry.isIntersecting) {
            if (video.dataset.userPaused !== 'true') video.play().catch(() => {})
          } else {
            video.pause()
          }
        }
      },
      { threshold: 0.4 },
    )
    videos.forEach((video) => observer.observe(video))

    return () => {
      observer.disconnect()
      videos.forEach((video) => video.removeEventListener('click', toggle))
    }
  }, [htmlContent])

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
      {/* Hero — full-bleed cover with title overlay */}
      <header className="relative h-[82vh] min-h-[560px] w-full bg-black overflow-hidden">
        {post.cover_image_url && (
          <Image
            src={post.cover_image_url}
            alt={post.title}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        )}
        {/* Darkening gradient for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/25" />

        {/* Title block over image */}
        <div className="absolute inset-0 flex items-end justify-center pb-[9vh]">
          <div className="text-center text-white px-6 max-w-3xl">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.22em] text-white/85 mb-4 sm:mb-5">
              {getCategoryName(post.category?.slug)}
            </p>
            <h1 className="font-display-ko text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.15] break-keep mb-4 sm:mb-5">
              {displayTitle.split(/,\s*/).map((part, i, arr) => (
                <span key={i} className="block">
                  {part}{i < arr.length - 1 ? ',' : ''}
                </span>
              ))}
            </h1>
            {displayExcerpt && (
              <p className="aeo-summary font-serif italic text-base sm:text-lg md:text-xl text-white/80 leading-relaxed break-keep max-w-2xl mx-auto mb-5 sm:mb-6">
                {displayExcerpt}
              </p>
            )}
            <p className="text-[11px] sm:text-xs text-white/70 tracking-wide">
              {formatDate(post.published_at, locale)} · {post.reading_time_minutes || 5}{t.post.readingTime}
              {/* 갱신일 — 발행 후 하루 이상 지나 수정된 글만 표기 (검색·AI 신선도 신호) */}
              {post.updated_at &&
                post.published_at &&
                new Date(post.updated_at).getTime() - new Date(post.published_at).getTime() >
                  24 * 60 * 60 * 1000 && (
                  <> · {formatDate(post.updated_at, locale)} {isEn ? 'updated' : '갱신'}</>
                )}
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container-narrow px-5 sm:px-6 py-10 sm:py-12 md:py-16">
        {/* Article Content */}
        <div
          className="prose prose-stone mx-auto post-content
            prose-headings:font-display prose-headings:font-normal prose-headings:tracking-tight
            prose-h2:text-lg prose-h2:sm:text-xl prose-h2:md:text-2xl prose-h2:mt-10 prose-h2:sm:mt-14 prose-h2:md:mt-16 prose-h2:mb-5 prose-h2:sm:mb-6 prose-h2:md:mb-8 prose-h2:text-center
            prose-h3:text-lg prose-h3:sm:text-xl prose-h3:md:text-2xl prose-h3:mt-8 prose-h3:sm:mt-10 prose-h3:md:mt-12 prose-h3:mb-4 prose-h3:sm:mb-5 prose-h3:md:mb-6
            prose-p:text-[15px] prose-p:sm:text-base prose-p:md:text-lg prose-p:leading-[1.85] prose-p:sm:leading-[1.9] prose-p:mb-5 prose-p:sm:mb-6 prose-p:md:mb-8 prose-p:text-muted-foreground prose-p:text-justify
            prose-p:empty:mb-3 prose-p:empty:h-3 prose-p:empty:sm:mb-4 prose-p:empty:sm:h-4
            prose-blockquote:border-l-0 prose-blockquote:border-y prose-blockquote:border-border
            prose-blockquote:px-4 prose-blockquote:sm:px-6 prose-blockquote:md:px-8 prose-blockquote:py-5 prose-blockquote:sm:py-6 prose-blockquote:md:py-8 prose-blockquote:my-8 prose-blockquote:sm:my-10 prose-blockquote:md:my-12
            prose-blockquote:font-display prose-blockquote:text-lg prose-blockquote:sm:text-xl prose-blockquote:md:text-2xl
            prose-blockquote:text-center prose-blockquote:text-foreground
            prose-blockquote:not-italic prose-blockquote:bg-muted/30
            prose-a:text-link prose-a:underline prose-a:underline-offset-4 prose-a:decoration-link/40
            prose-img:my-10 prose-img:sm:my-14 prose-img:md:my-20
            prose-figure:my-10 prose-figure:sm:my-14 prose-figure:md:my-20
            prose-strong:text-foreground prose-strong:font-medium
            prose-li:text-muted-foreground prose-li:leading-relaxed prose-li:text-[15px] prose-li:sm:text-base
          "
          ref={contentRef}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {/* Brand signature — logo, always shown at the end of the article */}
        <div className="mt-12 flex justify-start">
          <Image
            src="/images/logo/logo_text_trim.png"
            alt="Muse de Marée"
            width={161}
            height={26}
            className="h-[26px] w-auto opacity-60"
          />
        </div>

        {/* Photo credits — 값이 있을 때만 로고 서명 아래에 표시 */}
        {post.photo_credits?.trim() && (
          <div className="mt-8 pt-4 border-t border-border">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60 mb-2">
              {isEn ? 'Credits' : '출처'}
            </p>
            <p className="text-xs text-muted-foreground/70 leading-relaxed whitespace-pre-line break-keep">
              {post.photo_credits.trim()}
            </p>
          </div>
        )}
      </div>

      {/* Post-end subscribe — 글을 다 읽은 독자에게 기록 구독 제안 */}
      <section className="border-t border-border py-10 sm:py-12 md:py-16">
        <div className="container-narrow px-5 sm:px-6 text-center">
          <h2 className="font-display text-xl sm:text-2xl mb-2 sm:mb-3">
            {t.newsletter.moreStories}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 break-keep">
            {t.newsletter.moreStoriesDescription}
          </p>
          <NewsletterForm source="post-end" />
        </div>
      </section>

      {/* Related Posts - Compact mobile design */}
      {relatedPosts.length > 0 && (
        <section className="border-t border-border py-10 sm:py-12 md:py-16 bg-muted/20">
          <div className="container-wide px-5 sm:px-6">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <div className="w-6 sm:w-8 h-[1px] bg-foreground" />
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
                  className="tap-dim group flex-shrink-0 w-[75vw] sm:w-[60vw] md:w-auto snap-start"
                >
                  <article className="bg-background overflow-hidden transition-colors">
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
                      <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-foreground font-medium mb-1.5 sm:mb-2">
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
                  className="tap-dim group flex items-center gap-3 sm:gap-4 px-5 sm:px-6 md:px-8 py-5 sm:py-6 md:py-8 md:border-r border-b md:border-b-0 border-border hover:bg-muted/30 transition-colors"
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
                  className="tap-dim group flex items-center justify-end gap-3 sm:gap-4 px-5 sm:px-6 md:px-8 py-5 sm:py-6 md:py-8 hover:bg-muted/30 transition-colors text-right"
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
