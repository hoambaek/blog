import { notFound } from 'next/navigation'
import { getAdminPostById } from '@/lib/actions/posts'
import { getPostNumbers } from '@/lib/journal/data'
import { TranslationReview } from '@/components/admin/TranslationReview'

/* 번역 검수 — Paper IM8-0 (한/영 블록 정렬, 블록별 확인) */
export const dynamic = 'force-dynamic'

export default async function TranslationReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [post, numbers] = await Promise.all([getAdminPostById(id), getPostNumbers()])
  if (!post) notFound()
  return <TranslationReview post={post} number={numbers.get(post.id) ?? null} />
}
