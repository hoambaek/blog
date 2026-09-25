/*
 * 목록·연재·검색·다음 기록 카드가 쓰는 글 요약 — 서버에서 만들어 클라이언트 화면에 넘긴다(JSON 직렬화 가능).
 * 제목·발췌는 두 언어를 함께 싣고, 화면이 KO/EN 쿠키에 맞춰 고른다.
 */
export interface RecordSummary {
  id: string
  slug: string
  /** 발행 순번 N° — 조회 실패 시 null */
  number: number | null
  title: string
  titleEn: string | null
  excerpt: string | null
  excerptEn: string | null
  cover: string | null
  publishedAt: string | null
  readingMinutes: number | null
  series: { slug: string; name: string; nameEn?: string | null } | null
  /** 발행일까지 직전 365일 40m 보정 수온 평균 — 계산하지 않았거나 데이터가 모자라면 null */
  seaAvg: number | null
}

export function recordTitle(r: Pick<RecordSummary, 'title' | 'titleEn'>, locale: string): string {
  return locale === 'en' ? r.titleEn || r.title : r.title
}

export function recordExcerpt(r: Pick<RecordSummary, 'excerpt' | 'excerptEn'>, locale: string): string {
  return (locale === 'en' ? r.excerptEn || r.excerpt : r.excerpt) ?? ''
}
