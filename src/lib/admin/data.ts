import 'server-only'
import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { htmlFromContent, parseArticleHtml } from '@/lib/article/parse'
import { enStatus, type EnStatus } from '@/lib/article/review'
import { getPostNumbers } from '@/lib/journal/data'
import { getAdminAllPosts } from '@/lib/actions/posts'
import type { Category, Newsletter, Subscriber } from '@/lib/supabase/types'
import { relativeTime } from './format'

/*
 * 관리자 화면 서버 조회 — 서버 컴포넌트에서만 부른다(서버 액션으로 열지 않는다).
 * 모두 requireAdmin()을 먼저 통과해야 한다(service role로 RLS를 우회하므로).
 */

/** 사이드바 숫자: 기록(전체)·뉴스레터(발송 완료)·구독자(활성)·연재(공개 중) */
export const getAdminNavCounts = cache(async () => {
  await requireAdmin()
  const supabase = await createAdminClient()
  const [posts, newsletters, subscribers, categories] = await Promise.all([
    supabase.from('posts').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('newsletters').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
    supabase.from('subscribers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('posts').select('category_id').eq('status', 'published').is('deleted_at', null),
  ])
  const visibleSeries = new Set((categories.data ?? []).map((p) => p.category_id).filter(Boolean))
  return {
    records: posts.count ?? 0,
    newsletters: newsletters.count ?? 0,
    subscribers: subscribers.count ?? 0,
    series: visibleSeries.size,
  }
})

export interface AdminRecordRow {
  id: string
  number: number | null
  title: string
  slug: string
  cover: string | null
  seriesId: string | null
  seriesName: string | null
  status: 'draft' | 'published' | 'scheduled'
  en: EnStatus
  publishedAt: string | null
  views: number
  /** 'claude' = Claude 초안 업로드 */
  draftSource: string | null
  draftUploadedAt: string | null
  /** '3분 전' — 서버에서 한 번 계산(하이드레이션 어긋남 방지) */
  draftUploadedAgo: string | null
  emptySlots: number
  /** 제목·본문 검색용 소문자 글자 */
  searchText: string
}

function plainText(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function getAdminRecordRows(): Promise<AdminRecordRow[]> {
  const [posts, numbers] = await Promise.all([getAdminAllPosts(), getPostNumbers()])
  const now = Date.now()
  return posts.map((p) => {
    const html = htmlFromContent(p.content)
    const htmlEn = htmlFromContent(p.content_en) || null
    return {
      id: p.id,
      number: numbers.get(p.id) ?? null,
      title: p.title,
      slug: p.slug,
      cover: p.cover_image_url,
      seriesId: p.category_id,
      seriesName: p.category?.name ?? null,
      status: (p.status as AdminRecordRow['status']) ?? 'draft',
      en: enStatus({ title: p.title, excerpt: p.excerpt, html, htmlEn, review: p.en_review }),
      publishedAt: p.published_at,
      views: p.view_count ?? 0,
      draftSource: p.draft_source ?? null,
      draftUploadedAt: p.draft_uploaded_at ?? null,
      draftUploadedAgo: p.draft_uploaded_at ? relativeTime(p.draft_uploaded_at, now) : null,
      emptySlots: parseArticleHtml(html).filter((b) => b.type === 'slot').length,
      searchText: `${p.title} ${plainText(html)}`.toLowerCase(),
    }
  })
}

export async function getActiveSubscriberCount(): Promise<number> {
  await requireAdmin()
  const supabase = await createAdminClient()
  const { count } = await supabase.from('subscribers').select('id', { count: 'exact', head: true }).eq('status', 'active')
  return count ?? 0
}

export async function getAllSubscribers(): Promise<Subscriber[]> {
  await requireAdmin()
  const supabase = await createAdminClient()
  const rows: Subscriber[] = []
  const PAGE = 1000
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false })
      .range(from, from + PAGE - 1)
    if (error) {
      console.error('Error fetching subscribers:', error)
      break
    }
    rows.push(...data)
    if (data.length < PAGE) break
  }
  return rows
}

export type AdminSeriesRow = Category & { published: number; drafts: number }

/** 연재 — sort_order 순, 발행 글 수와 초안 수 */
export async function getAdminSeries(): Promise<AdminSeriesRow[]> {
  await requireAdmin()
  const supabase = await createAdminClient()
  const [{ data: categories, error }, { data: posts }] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order', { ascending: true }),
    supabase.from('posts').select('category_id, status').is('deleted_at', null),
  ])
  if (error || !categories) {
    console.error('Error fetching categories:', error)
    return []
  }
  return categories.map((c) => ({
    ...c,
    published: (posts ?? []).filter((p) => p.category_id === c.id && p.status === 'published').length,
    drafts: (posts ?? []).filter((p) => p.category_id === c.id && p.status !== 'published').length,
  }))
}

export async function getNewsletterHistory(limit = 20): Promise<Newsletter[]> {
  await requireAdmin()
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('newsletters')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.error('Error fetching newsletters:', error)
    return []
  }
  return data
}

export interface PublishedIndexItem {
  id: string
  number: number | null
  title: string
  titleEn: string | null
  slug: string
  excerpt: string | null
  excerptEn: string | null
  cover: string | null
  publishedAt: string | null
  readingMinutes: number | null
  series: { slug: string; name: string } | null
}

/** 발행 글 목록(가벼운 필드만) — 다음 기록 선택·미리보기 다음 기록 카드·뉴스레터 선택에 쓴다. 최신 발행 순 */
export async function getPublishedIndex(): Promise<PublishedIndexItem[]> {
  await requireAdmin()
  const supabase = await createAdminClient()
  const [{ data, error }, numbers] = await Promise.all([
    supabase
      .from('posts')
      .select('id, title, title_en, slug, excerpt, excerpt_en, cover_image_url, published_at, reading_time_minutes, category:categories(slug, name)')
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('published_at', { ascending: false }),
    getPostNumbers(),
  ])
  if (error || !data) {
    console.error('Error fetching published index:', error)
    return []
  }
  return data.map((p) => {
    const category = (Array.isArray(p.category) ? p.category[0] : p.category) as { slug: string; name: string } | null
    return {
      id: p.id,
      number: numbers.get(p.id) ?? null,
      title: p.title,
      titleEn: p.title_en,
      slug: p.slug,
      excerpt: p.excerpt,
      excerptEn: p.excerpt_en,
      cover: p.cover_image_url,
      publishedAt: p.published_at,
      readingMinutes: p.reading_time_minutes,
      series: category ? { slug: category.slug, name: category.name } : null,
    }
  })
}
