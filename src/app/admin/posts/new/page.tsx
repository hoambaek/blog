import { getAdminSeries, getPublishedIndex } from '@/lib/admin/data'
import { getSeaYearAvg } from '@/lib/journal/data'
import { PostEditor } from '@/components/admin/editor/PostEditor'

/* 새 기록 — 편집 화면과 같은 틀. 연재 목록은 지금 목록이어야 하므로 굽지 않는다. */
export const dynamic = 'force-dynamic'

export default async function NewPostPage() {
  const [series, index, seaAvg] = await Promise.all([getAdminSeries(), getPublishedIndex(), getSeaYearAvg(null)])
  return (
    <PostEditor
      post={null}
      series={series.map((s) => ({ id: s.id, name: s.name, slug: s.slug }))}
      publishedIndex={index}
      number={null}
      seaAvg={seaAvg}
      today={new Date().toISOString()}
    />
  )
}
