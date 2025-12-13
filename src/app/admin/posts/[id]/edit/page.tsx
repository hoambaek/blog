import { notFound } from 'next/navigation'
import { getCategories } from '@/lib/actions/categories'
import { getAdminPostById } from '@/lib/actions/posts'
import { PostEditorForm } from '@/components/admin/PostEditorForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: PageProps) {
  const { id } = await params

  const [post, categories] = await Promise.all([
    getAdminPostById(id),
    getCategories(),
  ])

  if (!post) {
    notFound()
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PostEditorForm categories={categories} post={post} />
    </div>
  )
}
