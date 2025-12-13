import { searchPosts } from '@/lib/actions/posts'
import { SearchContent } from '@/components/search/SearchContent'

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q = '', page } = await searchParams
  const currentPage = Number(page) || 1
  const postsPerPage = 12
  const offset = (currentPage - 1) * postsPerPage

  const { posts, total } = q
    ? await searchPosts(q, postsPerPage, offset)
    : { posts: [], total: 0 }

  const totalPages = Math.ceil(total / postsPerPage)

  return (
    <SearchContent
      query={q}
      posts={posts}
      total={total}
      currentPage={currentPage}
      totalPages={totalPages}
    />
  )
}

export async function generateMetadata({ searchParams }: PageProps) {
  const { q = '' } = await searchParams

  return {
    title: q ? `"${q}" 검색 결과` : '검색',
    description: q ? `"${q}"에 대한 검색 결과입니다.` : '포스트를 검색하세요.',
  }
}
