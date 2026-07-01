import { notFound } from 'next/navigation'
import { getCategoryBySlug } from '@/lib/actions/categories'
import { getPostsByCategory, getAllPublishedPosts } from '@/lib/actions/posts'
import { CategoryContent } from '@/components/category/CategoryContent'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { page } = await searchParams
  const currentPage = Number(page) || 1
  const postsPerPage = 12
  const offset = (currentPage - 1) * postsPerPage

  // Handle "all" category specially
  let category
  let postsData

  if (slug === 'all') {
    category = {
      id: 'all',
      name: 'All Posts',
      slug: 'all',
      description: null,
    }
    postsData = await getAllPublishedPosts(postsPerPage, offset)
  } else {
    category = await getCategoryBySlug(slug)
    if (!category) {
      notFound()
    }
    postsData = await getPostsByCategory(slug, postsPerPage, offset)
  }

  const { posts, total } = postsData
  const totalPages = Math.ceil(total / postsPerPage)

  return (
    <CategoryContent
      category={category}
      posts={posts}
      total={total}
      currentPage={currentPage}
      totalPages={totalPages}
      slug={slug}
    />
  )
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const brandPrefix = '뮤즈드마레(Muse de Marée)'
  const siteUrl = 'https://journal.musedemaree.com'

  if (slug === 'all') {
    const description = `해저숙성 샴페인 ${brandPrefix}의 모든 이야기 — 바다의 일지, 메종, 문화와 예술, 테이블 위에서.`
    return {
      title: `모든 포스트 | ${brandPrefix}`,
      description,
      openGraph: {
        title: `모든 포스트 | ${brandPrefix}`,
        description,
        type: 'website',
        siteName: 'Muse de Marée',
        url: `${siteUrl}/category/all`,
      },
      alternates: { canonical: `${siteUrl}/category/all` },
    }
  }

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
