'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Search, X } from 'lucide-react'
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

interface SearchContentProps {
  query: string
  posts: Post[]
  total: number
  currentPage: number
  totalPages: number
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

export function SearchContent({
  query,
  posts,
  total,
  currentPage,
  totalPages,
}: SearchContentProps) {
  const t = useTranslation()
  const { locale } = useLocale()
  const router = useRouter()
  const [searchValue, setSearchValue] = useState(query)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchValue.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`)
    }
  }

  const clearSearch = () => {
    setSearchValue('')
    router.push('/search')
  }

  const text = {
    ko: {
      title: '검색',
      placeholder: '검색어를 입력하세요...',
      results: `"${query}"에 대한 검색 결과`,
      count: `${total}개의 결과`,
      noQuery: '검색어를 입력해주세요.',
      noQueryDesc: '제목, 내용, 카테고리로 포스트를 검색할 수 있습니다.',
      noResults: '검색 결과가 없습니다.',
      noResultsDesc: '다른 검색어로 시도해보세요.',
    },
    en: {
      title: 'Search',
      placeholder: 'Enter your search...',
      results: `Search results for "${query}"`,
      count: `${total} results`,
      noQuery: 'Enter a search term.',
      noQueryDesc: 'You can search posts by title, content, or category.',
      noResults: 'No results found.',
      noResultsDesc: 'Try a different search term.',
    },
  }

  const c = locale === 'ko' ? text.ko : text.en

  return (
    <div>
      {/* Search Hero */}
      <section className="bg-muted py-16">
        <div className="container-narrow text-center">
          <h1 className="font-display text-4xl md:text-5xl mb-8">{c.title}</h1>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="relative max-w-xl mx-auto">
            <input
              type="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={c.placeholder}
              className="w-full bg-background border border-border px-6 py-4 pr-24 text-lg focus:outline-none focus:border-foreground transition-colors"
              autoFocus
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchValue && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
              <button
                type="submit"
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Results */}
      <section className="container-wide py-12">
        {!query ? (
          /* No Query State */
          <div className="text-center py-20">
            <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-6" />
            <h2 className="font-display text-2xl mb-2">{c.noQuery}</h2>
            <p className="text-muted-foreground">{c.noQueryDesc}</p>
          </div>
        ) : posts.length === 0 ? (
          /* No Results State */
          <div className="text-center py-20">
            <h2 className="font-display text-2xl mb-2">{c.noResults}</h2>
            <p className="text-muted-foreground">{c.noResultsDesc}</p>
          </div>
        ) : (
          /* Results Grid */
          <>
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-display text-xl">{c.results}</h2>
              <p className="text-sm text-muted-foreground">{c.count}</p>
            </div>

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
                    <h3 className="font-display text-xl mb-2 group-hover:text-muted-foreground transition-colors">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {post.excerpt}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {formatDate(post.published_at, locale)}
                    </p>
                  </article>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                {currentPage > 1 && (
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}&page=${currentPage - 1}`}
                    className="w-10 h-10 flex items-center justify-center border border-border text-sm hover:bg-muted transition-colors"
                  >
                    ←
                  </Link>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <Link
                    key={pageNum}
                    href={`/search?q=${encodeURIComponent(query)}&page=${pageNum}`}
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
                    href={`/search?q=${encodeURIComponent(query)}&page=${currentPage + 1}`}
                    className="w-10 h-10 flex items-center justify-center border border-border text-sm hover:bg-muted transition-colors"
                  >
                    →
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
