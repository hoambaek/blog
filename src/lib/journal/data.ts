import 'server-only'
import { cache } from 'react'
import { createClient as createRawClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { getCategoriesWithPostCount } from '@/lib/actions/categories'
import type { PostWithCategory } from '@/lib/supabase/types'
import { kstDate } from './format'
import type { RecordSummary } from './records'

/*
 * 저널 화면이 렌더 시 계산하는 값들 (저장하지 않는다 — docs/content/article-format.md 1절).
 * - 글 번호 N°: 발행 순서(published_at 오름차순, 1부터)
 * - 관측 줄 수온: ocean_data_daily 표층 수온을 월별 40m 보정한 값의, 발행일까지 직전 365일 평균
 * - 연재 목록: 발행 글이 있는 카테고리만, sort_order 순서
 * 한 요청 안에서 여러 번 불려도 한 번만 조회하도록 React cache로 묶는다.
 */

/** 발행 글 타임라인(published_at 오름차순) — 글 번호와 저널 시작 연도를 여기서 뽑는다 */
const getPublishedTimeline = cache(async (): Promise<{ id: string; published_at: string | null }[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('posts')
    .select('id, published_at')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('published_at', { ascending: true })
    .order('id', { ascending: true })
  if (error || !data) {
    console.error('Error fetching post timeline:', error)
    return []
  }
  return data
})

/** 글 id → 발행 순번(1부터). 조회 실패 시 빈 Map — 번호 칸을 숨긴다 */
export async function getPostNumbers(): Promise<Map<string, number>> {
  const rows = await getPublishedTimeline()
  return new Map(rows.map((row, i) => [row.id, i + 1]))
}

/** 첫 발행 글의 날짜(마스트헤드 'JOURNAL · 2025 –') */
export async function getFirstPublishedAt(): Promise<string | null> {
  const rows = await getPublishedTimeline()
  return rows.find((r) => r.published_at)?.published_at ?? null
}

/* ── 수온: landing src/app/b/_lib/data.ts bottomTemp40과 같은 모델 ──
 * 완도 해역 KODC/NIFS 관측 기반 월별 혼합비 + 심층 기저 수온 8.0°C */
const MONTHLY_DEPTH_RATIO_40M: Record<number, number> = {
  1: 0.92, 2: 0.92, 3: 0.88, 4: 0.8, 5: 0.7, 6: 0.58,
  7: 0.5, 8: 0.5, 9: 0.5, 10: 0.55, 11: 0.72, 12: 0.85,
}
const DEEP_BASE_TEMP = 8.0

function bottomTemp40(sst: number | null, month: number): number | null {
  if (sst === null || !Number.isFinite(sst)) return null
  const ratio = MONTHLY_DEPTH_RATIO_40M[month] ?? 0.75
  return Math.max(sst * ratio + DEEP_BASE_TEMP * (1 - ratio), 3.0)
}

/**
 * 직전 365일 창에 이만큼의 관측일이 있어야 평균을 낸다.
 * 관측이 듬성한 구간의 평균은 계절이 한쪽으로 쏠려 연평균이라 부를 수 없다 — 그럴 땐 칸을 숨긴다.
 */
const MIN_DAYS_IN_WINDOW = 300

interface OceanDay {
  date: string // YYYY-MM-DD
  temp40: number
}

const getOceanDays = cache(async (): Promise<OceanDay[]> => {
  // ocean_data_daily는 이 레포의 타입 정의 밖(메인 사이트·plan 앱이 채우는 테이블)이라 타입 없는 클라이언트로 읽는다
  const supabase = createRawClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const days: OceanDay[] = []
  const PAGE = 1000
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('ocean_data_daily')
      .select('date, sea_temperature_avg')
      .order('date', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error || !data) {
      console.error('Error fetching ocean_data_daily:', error)
      return []
    }
    for (const row of data as { date: string; sea_temperature_avg: number | null }[]) {
      const t = bottomTemp40(row.sea_temperature_avg, Number(row.date.slice(5, 7)))
      if (t !== null) days.push({ date: row.date.slice(0, 10), temp40: t })
    }
    if (data.length < PAGE) break
  }
  return days
})

/** 발행일(없으면 오늘)까지 직전 365일의 40m 보정 수온 평균, 소수 1자리. 데이터가 모자라면 null */
export async function getSeaYearAvg(publishedAt: string | null): Promise<number | null> {
  const days = await getOceanDays()
  if (!days.length) return null
  const end = kstDate(publishedAt ?? new Date().toISOString())
  const endMs = Date.parse(`${end}T00:00:00Z`)
  const startMs = endMs - 364 * 86_400_000
  let sum = 0
  let n = 0
  for (const day of days) {
    const t = Date.parse(`${day.date}T00:00:00Z`)
    if (t < startMs || t > endMs) continue
    sum += day.temp40
    n += 1
  }
  if (n < MIN_DAYS_IN_WINDOW) return null
  return Math.round((sum / n) * 10) / 10
}

export interface JournalSeries {
  id: string
  slug: string
  name: string
  description: string | null
  count: number
  /** 발행 글이 있는 연재 중 순번 (SERIES 01, 02…) */
  index: number
}

/** 발행 글이 1편 이상인 연재 — 조회 실패면 빈 배열 */
export const getJournalSeries = cache(async (): Promise<JournalSeries[]> => {
  const categories = await getCategoriesWithPostCount()
  return categories
    .filter((c) => c.post_count > 0)
    .map((c, i) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      count: c.post_count,
      index: i + 1,
    }))
})

/**
 * 메뉴 오버레이 관측 줄 수온 — 메인 사이트 메뉴와 같은 소스(www.musedemaree.com/api/ocean).
 * 실패하면 null → 수온 칸을 숨긴다(값을 지어내지 않는다).
 */
export async function getMenuSeaTemp(): Promise<number | null> {
  try {
    const res = await fetch('https://www.musedemaree.com/api/ocean', {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { seaTemp?: unknown }
    return typeof data.seaTemp === 'number' && Number.isFinite(data.seaTemp) ? data.seaTemp : null
  } catch {
    return null
  }
}

/** DB 글 → 화면용 요약. withSea면 관측 줄 수온까지 계산한다 */
export async function toRecords(
  posts: PostWithCategory[],
  options: { withSea?: boolean } = {},
): Promise<RecordSummary[]> {
  const numbers = await getPostNumbers()
  return Promise.all(
    posts.map(async (p) => ({
      id: p.id,
      slug: p.slug,
      number: numbers.get(p.id) ?? null,
      title: p.title,
      titleEn: p.title_en,
      excerpt: p.excerpt,
      excerptEn: p.excerpt_en,
      cover: p.cover_image_url,
      publishedAt: p.published_at,
      readingMinutes: p.reading_time_minutes,
      series: p.category ? { slug: p.category.slug, name: p.category.name } : null,
      seaAvg: options.withSea ? await getSeaYearAvg(p.published_at) : null,
    })),
  )
}
