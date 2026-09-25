import { notFound } from 'next/navigation'
import { getAdminPostById } from '@/lib/actions/posts'
import { getAdminSeries, getPublishedIndex } from '@/lib/admin/data'
import { getPostNumbers, getSeaYearAvg } from '@/lib/journal/data'
import { PostEditor } from '@/components/admin/editor/PostEditor'

/* 기록 편집 — Paper IIL-0. 관측 줄·N°는 공개 화면과 같은 계산(lib/journal/data)을 쓴다. */
export const dynamic = 'force-dynamic'

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await getAdminPostById(id)
  if (!post) notFound()

  const [series, index, numbers, seaAvg] = await Promise.all([
    getAdminSeries(),
    getPublishedIndex(),
    getPostNumbers(),
    getSeaYearAvg(post.status === 'published' ? post.published_at : null),
  ])

  return (
    <PostEditor
      post={post}
      series={series.map((s) => ({ id: s.id, name: s.name, slug: s.slug }))}
      publishedIndex={index}
      number={numbers.get(post.id) ?? null}
      seaAvg={seaAvg}
      today={new Date().toISOString()}
    />
  )
}
