import { searchPosts } from '@/lib/actions/posts'
import { toRecords } from '@/lib/journal/data'
import { SearchView } from '@/components/journal/SearchView'

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

const POSTS_PER_PAGE = 12

export default async function SearchPage({ searchParams }: PageProps) {
  const { q = '', page } = await searchParams
  const query = q.trim()
  const currentPage = Math.max(1, Number(page) || 1)
  const offset = (currentPage - 1) * POSTS_PER_PAGE

  const { posts, total } = query
    ? await searchPosts(query, POSTS_PER_PAGE, offset)
    : { posts: [], total: 0 }

  const records = await toRecords(posts)

  return (
    <SearchView
      // 검색어가 바뀌면 입력칸 상태를 새로 잡는다
      key={query}
      query={query}
      records={records}
      total={total}
      currentPage={currentPage}
      totalPages={Math.ceil(total / POSTS_PER_PAGE)}
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
