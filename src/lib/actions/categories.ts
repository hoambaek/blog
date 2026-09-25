'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { checkAdmin, ADMIN_FORBIDDEN_MESSAGE } from '@/lib/auth/admin'
import type { Category } from '@/lib/supabase/types'

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching category:', error)
    return null
  }

  return data
}

export async function getCategoriesWithPostCount(): Promise<(Category & { post_count: number })[]> {
  const supabase = await createClient()

  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  // Get post counts for each category
  const categoriesWithCount = await Promise.all(
    categories.map(async (category) => {
      const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id)
        .eq('status', 'published')
        .is('deleted_at', null)

      return {
        ...category,
        post_count: count || 0,
      }
    })
  )

  return categoriesWithCount
}

// ═══════════════════════════════════════════════════
// 관리자 — 연재 추가·수정 (/admin/series)
// ═══════════════════════════════════════════════════

export interface SeriesInput {
  name: string
  slug?: string
  name_en?: string | null
  description?: string | null
  description_en?: string | null
}

function cleanSeries(input: SeriesInput) {
  const trim = (v: string | null | undefined) => (typeof v === 'string' && v.trim() ? v.trim() : null)
  return {
    name: input.name.trim(),
    name_en: trim(input.name_en),
    description: trim(input.description),
    description_en: trim(input.description_en),
  }
}

function seriesError(error: { code?: string; message?: string }): string {
  if (error.code === 'PGRST204' || error.code === '42703') {
    return 'DB에 005 마이그레이션이 아직 적용되지 않아 영문 이름·설명을 저장할 수 없습니다.'
  }
  if (error.code === '23505') return '같은 slug의 연재가 이미 있습니다.'
  return error.message ?? '저장하지 못했습니다.'
}

function revalidateSeries(slug?: string) {
  revalidatePath('/')
  revalidatePath('/about')
  if (slug) revalidatePath(`/category/${slug}`)
  revalidatePath('/admin/series')
}

export async function createSeries(input: SeriesInput): Promise<{ success: boolean; error?: string }> {
  if (!(await checkAdmin()).ok) return { success: false, error: ADMIN_FORBIDDEN_MESSAGE }
  const data = cleanSeries(input)
  const slug = (input.slug ?? '').trim().toLowerCase()
  if (!data.name) return { success: false, error: '이름을 입력하세요.' }
  if (!/^[a-z0-9-]+$/.test(slug)) return { success: false, error: 'slug는 영문 소문자·숫자·하이픈만 쓸 수 있습니다.' }
  const supabase = await createAdminClient()
  const { data: last } = await supabase.from('categories').select('sort_order').order('sort_order', { ascending: false }).limit(1)
  const { error } = await supabase
    .from('categories')
    .insert({ ...data, slug, sort_order: (last?.[0]?.sort_order ?? 0) + 1 })
  if (error) {
    console.error('Error creating series:', error)
    return { success: false, error: seriesError(error) }
  }
  revalidateSeries(slug)
  return { success: true }
}

export async function updateSeries(id: string, input: SeriesInput): Promise<{ success: boolean; error?: string }> {
  if (!(await checkAdmin()).ok) return { success: false, error: ADMIN_FORBIDDEN_MESSAGE }
  const data = cleanSeries(input)
  if (!data.name) return { success: false, error: '이름을 입력하세요.' }
  const supabase = await createAdminClient()
  const { data: row, error } = await supabase.from('categories').update(data).eq('id', id).select('slug').single()
  if (error) {
    console.error('Error updating series:', error)
    return { success: false, error: seriesError(error) }
  }
  revalidateSeries(row.slug)
  return { success: true }
}
