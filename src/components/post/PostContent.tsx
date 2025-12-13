'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Share2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NewsletterForm } from '@/components/NewsletterForm'
import { useTranslation, useLocale } from '@/lib/i18n'

interface Post {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: unknown
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

  const htmlContent = typeof post.content === 'object' && post.content !== null
    ? (post.content as { html?: string }).html || ''
    : ''

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt || '',
          url: window.location.href,
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <article>
      {/* Header */}
      <div className="container-wide pt-16 md:pt-28 pb-4 flex justify-between items-center border-b border-border">
        <Link
          href={post.category ? `/category/${post.category.slug}` : '/category/all'}
          className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />
          {post.category?.name || t.post.allPosts}
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleShare} className="h-8 w-8 md:h-9 md:w-9">
            <Share2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="sr-only">{t.common.share}</span>
          </Button>
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative aspect-[21/9] bg-muted">
        {post.cover_image_url && (
          <Image
            src={post.cover_image_url}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      </div>

      {/* Content */}
      <div className="container-narrow py-12">
        {/* Meta */}
        <div className="text-center mb-12">
          <p className="label-text mb-4">
            {post.category?.name} • {formatDate(post.published_at, locale)} • {post.reading_time_minutes || 5}{t.post.readingTime}
          </p>
          <div className="divider max-w-xs mx-auto" />
          <h1 className="font-display text-4xl md:text-5xl mt-8 mb-6 text-balance">
            {post.title}
          </h1>
          <div className="divider max-w-xs mx-auto" />
        </div>

        {/* Article Content */}
        <div
          className="prose prose-lg prose-stone mx-auto
            prose-headings:font-display prose-headings:font-normal
            prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6
            prose-p:text-base prose-p:md:text-lg prose-p:leading-relaxed prose-p:mb-6
            prose-blockquote:border-l-2 prose-blockquote:border-rose-gold
            prose-blockquote:pl-6 prose-blockquote:py-4 prose-blockquote:my-8
            prose-blockquote:font-display prose-blockquote:text-xl prose-blockquote:md:text-2xl
            prose-blockquote:italic prose-blockquote:text-muted-foreground
            prose-blockquote:not-italic
            prose-a:text-navy prose-a:underline prose-a:underline-offset-4
          "
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="border-t border-border py-16">
          <div className="container-wide">
            <h2 className="label-text mb-8">{t.sections.relatedStories}</h2>
            <div className="grid sm:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost.id} href={`/post/${relatedPost.slug}`} className="group">
                  <article className="card-hover">
                    <div className="aspect-[4/3] relative bg-muted mb-4 overflow-hidden">
                      {relatedPost.cover_image_url && (
                        <Image
                          src={relatedPost.cover_image_url}
                          alt={relatedPost.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <p className="label-text mb-2">{relatedPost.category?.name}</p>
                    <h3 className="font-display text-lg group-hover:text-muted-foreground transition-colors">
                      {relatedPost.title}
                    </h3>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Post Navigation */}
      {(prev || next) && (
        <section className="border-t border-border">
          <div className="container-wide grid md:grid-cols-2">
            {prev ? (
              <Link
                href={`/post/${prev.slug}`}
                className="flex items-center gap-4 p-8 md:border-r border-border hover:bg-muted/50 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="label-text mb-1">{t.post.prevPost}</p>
                  <p className="font-display text-lg">{prev.title}</p>
                </div>
              </Link>
            ) : (
              <div className="hidden md:block" />
            )}
            {next && (
              <Link
                href={`/post/${next.slug}`}
                className="flex items-center justify-end gap-4 p-8 hover:bg-muted/50 transition-colors text-right"
              >
                <div>
                  <p className="label-text mb-1">{t.post.nextPost}</p>
                  <p className="font-display text-lg">{next.title}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Newsletter CTA */}
      <section className="bg-card border-t border-border">
        <div className="container-narrow py-16 text-center">
          <h2 className="font-display text-2xl md:text-3xl mb-4">
            {t.newsletter.moreStories}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t.newsletter.moreStoriesDescription}
          </p>
          <NewsletterForm source="post-detail" />
        </div>
      </section>
    </article>
  )
}
