import { getCategories } from '@/lib/actions/categories'
import { PostEditorForm } from '@/components/admin/PostEditorForm'

/* 새 글 폼의 카테고리 목록은 지금 목록이어야 한다 — 빌드 시점에 얼리지 않는다
   (같은 이유: admin/page.tsx 주석) */
export const dynamic = 'force-dynamic'

export default async function NewPostPage() {
  const categories = await getCategories()

  return (
    <div className="max-w-6xl mx-auto">
      <PostEditorForm categories={categories} />
    </div>
  )
}
