import { getCategories } from '@/lib/actions/categories'
import { PostEditorForm } from '@/components/admin/PostEditorForm'

export default async function NewPostPage() {
  const categories = await getCategories()

  return (
    <div className="max-w-6xl mx-auto">
      <PostEditorForm categories={categories} />
    </div>
  )
}
