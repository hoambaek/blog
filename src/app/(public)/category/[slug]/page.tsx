import { notFound, permanentRedirect } from 'next/navigation'
import { getCategoryBySlug } from '@/lib/actions/categories'
import { getPostsByCategory } from '@/lib/actions/posts'
import { getJournalSeries, toRecords } from '@/lib/journal/data'
import { SeriesView } from '@/components/journal/SeriesView'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

const POSTS_PER_PAGE = 12

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  // 전체 기록은 목록(/)이 맡는다 — 예전 링크는 목록으로 보낸다
  if (slug === 'all') permanentRedirect('/')

  const { page } = await searchParams
  const currentPage = Math.max(1, Number(page) || 1)
  const offset = (currentPage - 1) * POSTS_PER_PAGE

  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  const [{ posts, total }, series] = await Promise.all([
    getPostsByCategory(slug, POSTS_PER_PAGE, offset),
    getJournalSeries(),
  ])

  // 첫 쪽의 첫 글은 대표 글로 크게 — 관측 줄 수온은 그 글만 계산한다
  const records =
    currentPage === 1
      ? [...(await toRecords(posts.slice(0, 1), { withSea: true })), ...(await toRecords(posts.slice(1)))]
      : await toRecords(posts)

  return (
    <SeriesView
      category={{ slug: category.slug, name: category.name, description: category.description }}
      records={records}
      total={total}
      currentPage={currentPage}
      totalPages={Math.ceil(total / POSTS_PER_PAGE)}
      series={series}
    />
  )
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const brandPrefix = '뮤즈드마레(Muse de Marée)'
  const siteUrl = 'https://blog.musedemaree.com'

  const category = await getCategoryBySlug(slug)

  if (!category) {
    return {
      title: 'Category not found',
    }
  }

  const description = category.description
    ? `${brandPrefix} — ${category.description}`
    : `해저숙성 샴페인 ${brandPrefix}의 ${category.name} — 바다와 샴페인이 만나 빚어낸 이야기.`

  return {
    title: `${category.name} | ${brandPrefix}`,
    description: description.slice(0, 160),
    openGraph: {
      title: `${category.name} | ${brandPrefix}`,
      description: description.slice(0, 160),
      type: 'website',
      siteName: 'Muse de Marée',
      url: `${siteUrl}/category/${slug}`,
    },
    alternates: { canonical: `${siteUrl}/category/${slug}` },
  }
}
