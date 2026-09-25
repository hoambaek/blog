import type { RecordSummary } from '@/lib/journal/records'
import type { PublishedIndexItem } from './data'

/*
 * 편집 화면·미리보기가 같이 쓰는 계산 (서버·브라우저 공용 순수 함수)
 */

/**
 * 자동 다음 기록 — 공개 글 화면과 같은 규칙: 발행일 순으로 바로 앞(더 오래된) 글.
 * 아직 발행하지 않은 초안은 발행되면 가장 최신 글이 되므로, 지금 가장 최신 발행 글이 다음 기록이 된다.
 * index는 최신 발행 순(getPublishedIndex).
 */
export function autoNextRecord(
  index: PublishedIndexItem[],
  post: { id: string | null; publishedAt: string | null; status: string },
): PublishedIndexItem | null {
  const others = index.filter((p) => p.id !== post.id)
  if (post.status !== 'published' || !post.publishedAt) return others[0] ?? null
  const at = Date.parse(post.publishedAt)
  return others.find((p) => p.publishedAt && Date.parse(p.publishedAt) < at) ?? null
}

export function resolveNextRecord(
  index: PublishedIndexItem[],
  post: { id: string | null; publishedAt: string | null; status: string; nextPostId: string | null },
): { item: PublishedIndexItem | null; pinned: boolean } {
  if (post.nextPostId && post.nextPostId !== post.id) {
    const pinned = index.find((p) => p.id === post.nextPostId)
    if (pinned) return { item: pinned, pinned: true }
  }
  return { item: autoNextRecord(index, post), pinned: false }
}

export function indexToRecord(item: PublishedIndexItem): RecordSummary {
  return {
    id: item.id,
    slug: item.slug,
    number: item.number,
    title: item.title,
    titleEn: item.titleEn,
    excerpt: item.excerpt,
    excerptEn: item.excerptEn,
    cover: item.cover,
    publishedAt: item.publishedAt,
    readingMinutes: item.readingMinutes,
    series: item.series,
    seaAvg: null,
  }
}

/** 글 끝 PHOTO — 그림 크레딧 자동 수집 + 수동 추가(줄마다 한 항목, 앞의 · - • 기호는 뗀다). 공개 화면과 같은 규칙 */
export function mergeCredits(figureCredits: string[], manual: string | null | undefined): string[] {
  const manualCredits = (manual ?? '')
    .split('\n')
    .map((line) => line.replace(/^\s*[·•\-*]\s*/, '').trim())
    .filter(Boolean)
  return [...new Set([...figureCredits, ...manualCredits])]
}

/** 읽는 시간 — 저장 때(posts.ts)와 같은 셈: 단어 200개에 1분 */
export function readingMinutes(html: string): number {
  const words = html.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}
