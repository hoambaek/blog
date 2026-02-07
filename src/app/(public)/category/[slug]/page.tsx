import { notFound } from 'next/navigation'
import { getCategoryBySlug } from '@/lib/actions/categories'
import { getPostsByCategory, getAllPublishedPosts } from '@/lib/actions/posts'
import { CategoryContent } from '@/components/category/CategoryContent'

export const revalidate = 60

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

  if (slug === 'all') {
    return {
      title: 'All Posts',
      description: 'Discover all stories from Muse de Marée.',
    }
  }

  const category = await getCategoryBySlug(slug)

  if (!category) {
    return {
      title: 'Category not found',
    }
  }

  return {
    title: category.name,
    description: category.description,
  }
}
