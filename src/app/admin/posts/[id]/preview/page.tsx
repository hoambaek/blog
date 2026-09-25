import { notFound } from 'next/navigation'
import { getAdminPostById } from '@/lib/actions/posts'
import { getPublishedIndex } from '@/lib/admin/data'
import { indexToRecord, mergeCredits, resolveNextRecord } from '@/lib/admin/records'
import { collectFigureCredits, htmlFromContent, parseArticleHtml } from '@/lib/article/parse'
import { toRecords } from '@/lib/journal/data'
import { PreviewClient } from '@/components/admin/preview/PreviewClient'

/*
 * 미리보기 링크 — 관리자 인증(middleware + requireAdmin)이 걸린 주소. 저장된 상태를 공개 화면과 같은 모양으로 보여 준다.
 * 초안은 발행 전이라 N°가 없고, 관측 줄은 오늘 기준으로 계산한다.
 */
export const dynamic = 'force-dynamic'

export default async function AdminPostPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await getAdminPostById(id)
  if (!post) notFound()

  const html = htmlFromContent(post.content)
  const [[record], index] = await Promise.all([toRecords([post], { withSea: true }), getPublishedIndex()])
  const { item } = resolveNextRecord(index, {
    id: post.id,
    publishedAt: post.published_at,
    status: post.status,
    nextPostId: post.next_post_id ?? null,
  })

  return (
    <PreviewClient
      banner={`PREVIEW · ${post.status === 'published' ? '발행된 글' : '초안'} · 저장된 내용 기준`}
      initial={{
        record: { ...record, publishedAt: record.publishedAt ?? new Date().toISOString() },
        html,
        credits: mergeCredits(collectFigureCredits(parseArticleHtml(html)), post.photo_credits),
        next: item ? indexToRecord(item) : null,
      }}
    />
  )
}
