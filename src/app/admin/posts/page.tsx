import { getAdminPosts, deletePost } from '@/lib/actions/posts'
import { getCategories } from '@/lib/actions/categories'
import { AdminPostsListContent } from '@/components/admin/AdminPostsListContent'
import { revalidatePath } from 'next/cache'

interface PageProps {
  searchParams: Promise<{
    status?: string
    category?: string
    search?: string
    page?: string
  }>
}

export default async function AdminPostsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const currentPage = Number(params.page) || 1
  const postsPerPage = 20
  const offset = (currentPage - 1) * postsPerPage

  const [{ posts, total }, categories] = await Promise.all([
    getAdminPosts(
      params.status,
      params.category,
      params.search,
      postsPerPage,
      offset
    ),
    getCategories(),
  ])

  const totalPages = Math.ceil(total / postsPerPage)

  async function handleDelete(id: string) {
    'use server'
    await deletePost(id)
    revalidatePath('/admin/posts')
  }

  return (
    <AdminPostsListContent
      posts={posts}
      total={total}
      categories={categories}
      currentPage={currentPage}
      totalPages={totalPages}
      params={params}
      onDelete={handleDelete}
    />
  )
}
