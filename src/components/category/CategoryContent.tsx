'use client'

import Link from 'next/link'
import Image from 'next/image'
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

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
}

interface CategoryContentProps {
  category: Category
  posts: Post[]
  total: number
  currentPage: number
  totalPages: number
  slug: string
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

export function CategoryContent({
  category,
  posts,
  total,
  currentPage,
  totalPages,
  slug,
}: CategoryContentProps) {
  const t = useTranslation()
  const { locale } = useLocale()

  // Translate "all posts" category for display
  const displayName = slug === 'all'
    ? t.post.allPosts
    : category.name

  const displayDescription = slug === 'all'
    ? (locale === 'ko' ? '뮤즈드마레의 모든 이야기를 만나보세요.' : 'Discover all stories from Muse de Marée.')
    : category.description

  return (
    <div>
      {/* Hero with Dark Background */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-28 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/bg.png"
            alt="Muse de Marée"
            fill
            sizes="100vw"
            className="object-cover scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        </div>

        <div className="container-wide relative z-10 text-center text-white">
          {/* Decorative Element */}
          <div className="flex items-center justify-center gap-6 mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-rose-gold/60" />
            <div className="w-1.5 h-1.5 rotate-45 bg-rose-gold/80" />
            <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-rose-gold/60" />
          </div>

          {/* Category Label */}
          <p
            className="uppercase text-[10px] md:text-xs tracking-[0.4em] text-white/50 mb-8 font-light animate-fade-in-up"
            style={{ animationDelay: '0.3s' }}
          >
            {t.sections.category}
          </p>

          <h1
            className="font-display text-3xl md:text-4xl lg:text-5xl xl:text-6xl mb-6 leading-[1.2] animate-fade-in-up"
            style={{ animationDelay: '0.4s' }}
          >
            {displayName}
          </h1>

          {displayDescription && (
            <p
              className="text-base md:text-lg text-white/60 max-w-2xl mx-auto font-light leading-relaxed animate-fade-in-up"
              style={{ animationDelay: '0.5s' }}
            >
              {displayDescription}
            </p>
          )}
        </div>

        {/* Corner Accents */}
        <div className="hidden md:block absolute top-24 left-10 w-16 h-16 border-l border-t border-white/[0.08]" />
        <div className="hidden md:block absolute top-24 right-10 w-16 h-16 border-r border-t border-white/[0.08]" />
      </section>

      {/* Filter/Sort */}
      <section className="container-wide py-6 border-b border-border">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {total}{t.post.postsCount}
          </p>
          <select className="bg-transparent border-none text-sm text-muted-foreground focus:outline-none cursor-pointer">
            <option value="latest">{t.post.sortLatest}</option>
          </select>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="container-wide py-12">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">{t.post.noPosts}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
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
                  <h2 className="font-display text-xl mb-2 group-hover:text-muted-foreground transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {post.excerpt}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">{formatDate(post.published_at, locale)}</p>
                </article>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {currentPage > 1 && (
              <Link
                href={`/category/${slug}?page=${currentPage - 1}`}
                className="w-10 h-10 flex items-center justify-center border border-border text-sm hover:bg-muted transition-colors"
              >
                ←
              </Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <Link
                key={pageNum}
                href={`/category/${slug}?page=${pageNum}`}
                className={`w-10 h-10 flex items-center justify-center border text-sm transition-colors ${
                  pageNum === currentPage
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border hover:bg-muted'
                }`}
              >
                {pageNum}
              </Link>
            ))}
            {currentPage < totalPages && (
              <Link
                href={`/category/${slug}?page=${currentPage + 1}`}
                className="w-10 h-10 flex items-center justify-center border border-border text-sm hover:bg-muted transition-colors"
              >
                →
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
