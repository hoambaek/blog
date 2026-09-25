'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { checkAdmin, requireAdmin, ADMIN_FORBIDDEN_MESSAGE } from '@/lib/auth/admin'
import type { PostWithCategory, InsertTables } from '@/lib/supabase/types'
import Anthropic from '@anthropic-ai/sdk'
import {
  buildTranslationPrompt,
  parseTranslationResponse,
  EMPTY_TRANSLATION,
  TRANSLATION_MODEL,
  TRANSLATION_MAX_TOKENS,
  type TranslatedContent,
} from '@/lib/translation'

// ═══════════════════════════════════════════════════
// Translation Helper for Meta Fields
// ═══════════════════════════════════════════════════

interface TranslationResult {
  content: TranslatedContent
  // true when there was Korean content to translate and translation was attempted
  attempted: boolean
  // true when translation produced usable output; false means English was NOT updated
  ok: boolean
  // human-readable reason (Korean) shown to the admin when ok === false
  error?: string
}

async function translatePost(input: {
  title?: string
  excerpt?: string
  content?: string
  metaTitle?: string
  metaDescription?: string
}): Promise<TranslationResult> {
  const hasAnything = input.title || input.excerpt || input.content || input.metaTitle || input.metaDescription
  if (!hasAnything) {
    return { content: EMPTY_TRANSLATION, attempted: false, ok: true }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY not found, skipping translation')
    return {
      content: EMPTY_TRANSLATION,
      attempted: true,
      ok: false,
      error: 'ANTHROPIC_API_KEY가 설정되지 않아 영문 번역을 건너뛰었습니다. 영문 필드는 갱신되지 않았습니다.',
    }
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await anthropic.messages.create({
      model: TRANSLATION_MODEL,
      max_tokens: TRANSLATION_MAX_TOKENS,
      messages: [{ role: 'user', content: buildTranslationPrompt(input) }],
    })

    // Truncated response → JSON is incomplete and would silently drop content.
    if (response.stop_reason === 'max_tokens') {
      console.error('Translation truncated: hit max_tokens')
      return {
        content: EMPTY_TRANSLATION,
        attempted: true,
        ok: false,
        error: '번역 응답이 최대 길이에 도달해 잘렸습니다. 본문이 너무 깁니다. 영문 필드는 갱신되지 않았습니다.',
      }
    }

    // 모델이 thinking 블록을 먼저 반환할 수 있으므로 text 블록을 찾아서 사용
    const textBlock = response.content.find((block) => block.type === 'text')
    const translated = parseTranslationResponse(textBlock && textBlock.type === 'text' ? textBlock.text : '')
    if (translated) {
      return { content: translated, attempted: true, ok: true }
    }

    console.error('Translation response contained no JSON')
    return {
      content: EMPTY_TRANSLATION,
      attempted: true,
      ok: false,
      error: '번역 응답을 해석하지 못했습니다. 영문 필드는 갱신되지 않았습니다.',
    }
  } catch (error) {
    console.error('Error translating post:', error)
    const message = error instanceof Error ? error.message : String(error)
    return {
      content: EMPTY_TRANSLATION,
      attempted: true,
      ok: false,
      error: `영문 번역 중 오류가 발생했습니다(${message}). 영문 필드는 갱신되지 않았습니다.`,
    }
  }
}

// ═══════════════════════════════════════════════════
// Public Data Fetching (uses anon key with RLS)
// ═══════════════════════════════════════════════════

/**
 * 발행된 글의 slug 목록 — /post/[slug]의 generateStaticParams용.
 * 본문을 가져오지 않는다(빌드 때 전 글을 통째로 읽을 이유가 없다).
 * 실패하면 빈 배열 — 그러면 빌드가 멈추는 대신 글이 요청 시 렌더된다.
 */
export async function getPublishedSlugs(): Promise<string[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('posts')
    .select('slug')
    .eq('status', 'published')
    .is('deleted_at', null)

  if (error) {
    console.error('Error fetching published slugs:', error)
    return []
  }

  return data.map((row) => row.slug).filter((slug): slug is string => !!slug)
}

export async function getFeaturedPosts(limit = 3): Promise<PostWithCategory[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('status', 'published')
    .eq('is_featured', true)
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching featured posts:', error)
    return []
  }

  return data as PostWithCategory[]
}

export async function getLatestPosts(limit = 8, offset = 0): Promise<PostWithCategory[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching latest posts:', error)
    return []
  }

  return data as PostWithCategory[]
}

export async function getPostBySlug(slug: string): Promise<PostWithCategory | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .is('deleted_at', null)
    .single()

  if (error) {
    // PGRST116 means no rows found - this is expected for non-existent posts
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching post:', error.message || error.code || JSON.stringify(error))
    return null
  }

  return data as PostWithCategory
}

export async function getPostsByCategory(
  categorySlug: string,
  limit = 12,
  offset = 0
): Promise<{ posts: PostWithCategory[]; total: number }> {
  const supabase = await createClient()

  // First get the category
  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .single()

  if (!category) {
    return { posts: [], total: 0 }
  }

  // Get posts count
  const { count } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', category.id)
    .eq('status', 'published')
    .is('deleted_at', null)

  // Get posts
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('category_id', category.id)
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching posts by category:', error)
    return { posts: [], total: 0 }
  }

  return { posts: data as PostWithCategory[], total: count || 0 }
}

export async function getAllPublishedPosts(
  limit = 12,
  offset = 0
): Promise<{ posts: PostWithCategory[]; total: number }> {
  const supabase = await createClient()

  // Get posts count
  const { count } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .is('deleted_at', null)

  // Get posts
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching all posts:', error)
    return { posts: [], total: 0 }
  }

  return { posts: data as PostWithCategory[], total: count || 0 }
}

export async function searchPosts(
  query: string,
  limit = 12,
  offset = 0
): Promise<{ posts: PostWithCategory[]; total: number }> {
  const supabase = await createClient()

  // Search in title and excerpt
  const searchQuery = `%${query}%`

  // Get posts count
  const { count } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .is('deleted_at', null)
    .or(`title.ilike.${searchQuery},excerpt.ilike.${searchQuery}`)

  // Get posts
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('status', 'published')
    .is('deleted_at', null)
    .or(`title.ilike.${searchQuery},excerpt.ilike.${searchQuery}`)
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error searching posts:', error)
    return { posts: [], total: 0 }
  }

  return { posts: data as PostWithCategory[], total: count || 0 }
}

export async function getRelatedPosts(
  postId: string,
  categoryId: string | null,
  limit = 3
): Promise<PostWithCategory[]> {
  const supabase = await createClient()

  let query = supabase
    .from('posts')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('status', 'published')
    .is('deleted_at', null)
    .neq('id', postId)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching related posts:', error)
    return []
  }

  return data as PostWithCategory[]
}

export async function getAdjacentPosts(
  publishedAt: string,
  postId: string
): Promise<{ prev: PostWithCategory | null; next: PostWithCategory | null }> {
  const supabase = await createClient()

  // Previous post (older)
  const { data: prevData } = await supabase
    .from('posts')
    .select(`*, category:categories(*)`)
    .eq('status', 'published')
    .is('deleted_at', null)
    .lt('published_at', publishedAt)
    .order('published_at', { ascending: false })
    .limit(1)
    .single()

  // Next post (newer)
  const { data: nextData } = await supabase
    .from('posts')
    .select(`*, category:categories(*)`)
    .eq('status', 'published')
    .is('deleted_at', null)
    .gt('published_at', publishedAt)
    .order('published_at', { ascending: true })
    .limit(1)
    .single()

  return {
    prev: prevData as PostWithCategory | null,
    next: nextData as PostWithCategory | null,
  }
}

/** 발행된 글 하나(id) — 글에 지정한 "다음 기록"을 읽을 때. 발행 글이 아니면 null */
export async function getPublishedPostById(id: string): Promise<PostWithCategory | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('posts')
    .select(`*, category:categories(*)`)
    .eq('id', id)
    .eq('status', 'published')
    .is('deleted_at', null)
    .maybeSingle()
  if (error) {
    console.error('Error fetching post by id:', error)
    return null
  }
  return (data as PostWithCategory | null) ?? null
}

// ═══════════════════════════════════════════════════
// Admin Data Fetching (uses service role, bypasses RLS)
// ═══════════════════════════════════════════════════

export async function getAdminPostById(id: string): Promise<PostWithCategory | null> {
  await requireAdmin()
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    console.error('Error fetching admin post:', error)
    return null
  }

  return data as PostWithCategory
}

/** 관리자 기록 목록 — 지워지지 않은 글 전부(본문 포함: EN 검수 상태·빈 이미지 자리 계산에 쓴다) */
export async function getAdminAllPosts(): Promise<PostWithCategory[]> {
  await requireAdmin()
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('posts')
    .select(`*, category:categories(*)`)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('Error fetching admin posts:', error)
    return []
  }
  return data as PostWithCategory[]
}

// ═══════════════════════════════════════════════════
// Admin CRUD Operations
// ═══════════════════════════════════════════════════

interface CreatePostInput {
  title: string
  slug: string
  excerpt?: string
  /** 사진·자료 출처 수동 추가분 (한 줄에 하나, 그림 크레딧은 본문에서 자동 수집) */
  photo_credits?: string | null
  content: string
  category_id?: string | null
  /** 예약 발행은 없앴다(2026-09-25) — DB enum에는 'scheduled'가 남아 있지만 새로 쓰지 않는다 */
  status: PostStatusInput
  cover_image_url?: string | null
  meta_title?: string | null
  meta_description?: string | null
  author_id?: string
  /** 다음 기록 지정 (null = 발행일 순 자동) — 005 마이그레이션 컬럼 */
  next_post_id?: string | null
}

type PostStatusInput = 'draft' | 'published'
const WRITABLE_STATUSES: readonly string[] = ['draft', 'published']

// 서버 액션은 클라이언트 타입을 믿을 수 없다 — 허용하지 않은 status는 거부
function isInvalidStatus(status: unknown): boolean {
  return status !== undefined && !WRITABLE_STATUSES.includes(status as string)
}

/*
 * 005_admin_redesign 마이그레이션 컬럼. 적용 전 DB에 쓰면 PostgREST가 PGRST204(컬럼 없음)로 거부한다.
 * 그때는 이 컬럼만 빼고 다시 써서 글 저장 자체는 되게 하고, 빠진 것을 경고로 알린다.
 */
const MIGRATION_005_POST_COLUMNS = ['next_post_id', 'en_review', 'draft_source', 'draft_uploaded_at'] as const
const MIGRATION_005_WARNING =
  'DB에 005 마이그레이션이 아직 적용되지 않아 다음 기록 지정·영문 검수 상태는 저장되지 않았습니다.'

function isMissingColumnError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return error.code === 'PGRST204' || error.code === '42703' || /column .* (does not exist|of '.*' in the schema cache)/i.test(error.message ?? '')
}

function stripMigrationColumns<T extends Record<string, unknown>>(data: T): { data: T; stripped: boolean } {
  const copy: Record<string, unknown> = { ...data }
  let stripped = false
  for (const key of MIGRATION_005_POST_COLUMNS) {
    if (key in copy) {
      delete copy[key]
      stripped = true
    }
  }
  return { data: copy as T, stripped }
}

function readingMinutes(html: string): number {
  const wordCount = html.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(wordCount / 200))
}

function revalidatePostPaths(slug?: string) {
  revalidatePath('/')
  if (slug) revalidatePath(`/post/${slug}`)
  revalidatePath('/admin')
  /* 사이트맵도 캐시를 탄다(2026-07-27) — 새 글이 한 시간 늦게 실리지 않도록 같이 비운다 */
  revalidatePath('/sitemap.xml')
}

export async function createPost(input: CreatePostInput, pretranslated?: TranslatedContent | null) {
  if (!(await checkAdmin()).ok) return { success: false, error: ADMIN_FORBIDDEN_MESSAGE }
  if (isInvalidStatus(input.status)) return { success: false, error: '허용되지 않는 상태입니다.' }
  const supabase = await createAdminClient()

  // 클라이언트가 스트리밍 라우트(/api/admin/translate)로 미리 번역한 결과가 있으면 재사용,
  // 없으면(다른 호출 경로·번역 실패 폴백) 여기서 직접 번역
  const translation: TranslationResult = pretranslated
    ? { content: pretranslated, attempted: true, ok: true }
    : await translatePost({
        title: input.title,
        excerpt: input.excerpt,
        content: input.content,
        metaTitle: input.meta_title ?? undefined,
        metaDescription: input.meta_description ?? undefined,
      })
  const translated = translation.content

  const postData: Record<string, unknown> = {
    ...input,
    content: { html: input.content },
    reading_time_minutes: readingMinutes(input.content),
    published_at: input.status === 'published' ? new Date().toISOString() : null,
    title_en: translated.title_en,
    excerpt_en: translated.excerpt_en,
    content_en: translated.content_en ? { html: translated.content_en } : null,
    meta_title_en: translated.meta_title_en,
    meta_description_en: translated.meta_description_en,
  }

  let result = await supabase.from('posts').insert(postData as InsertTables<'posts'>).select().single()
  let migrationWarning: string | undefined
  if (result.error && isMissingColumnError(result.error)) {
    const { data: retryData, stripped } = stripMigrationColumns(postData)
    if (stripped) {
      result = await supabase.from('posts').insert(retryData as InsertTables<'posts'>).select().single()
      migrationWarning = MIGRATION_005_WARNING
    }
  }

  if (result.error) {
    console.error('Error creating post:', result.error)
    return { success: false, error: result.error.message }
  }

  revalidatePostPaths(result.data.slug)

  // Post saved, but flag when the English translation did not go through.
  const warnings = [translation.attempted && !translation.ok ? translation.error : undefined, migrationWarning].filter(Boolean)
  return { success: true, data: result.data, warning: warnings.join(' ') || undefined }
}

/**
 * input.status를 생략하면 현재 상태를 그대로 둔다(일반 저장).
 * 상태는 발행('published')·발행 취소('draft')처럼 명시적으로 넘길 때만 바뀐다.
 */
export async function updatePost(id: string, input: Partial<CreatePostInput>, pretranslated?: TranslatedContent | null) {
  if (!(await checkAdmin()).ok) return { success: false, error: ADMIN_FORBIDDEN_MESSAGE }
  if (isInvalidStatus(input.status)) return { success: false, error: '허용되지 않는 상태입니다.' }
  const supabase = await createAdminClient()

  const updateData: Record<string, unknown> = { ...input }

  // If content is provided, wrap it in object and recalculate reading time
  if (input.content) {
    updateData.content = { html: input.content }
    updateData.reading_time_minutes = readingMinutes(input.content)
  }

  // Translate any changed fields to English
  const needsTranslation = input.title || input.excerpt || input.content || input.meta_title || input.meta_description
  let translationWarning: string | undefined
  if (needsTranslation) {
    // 클라이언트가 미리 번역한 결과가 있으면 재사용, 없으면 여기서 직접 번역 (createPost와 동일한 폴백)
    const translation: TranslationResult = pretranslated
      ? { content: pretranslated, attempted: true, ok: true }
      : await translatePost({
          title: input.title,
          excerpt: input.excerpt,
          content: input.content,
          metaTitle: input.meta_title ?? undefined,
          metaDescription: input.meta_description ?? undefined,
        })
    const translated = translation.content
    // On failure, keep the existing English fields (do not overwrite with null) and warn.
    if (translated.title_en) updateData.title_en = translated.title_en
    if (translated.excerpt_en) updateData.excerpt_en = translated.excerpt_en
    if (translated.content_en) updateData.content_en = { html: translated.content_en }
    if (translated.meta_title_en) updateData.meta_title_en = translated.meta_title_en
    if (translated.meta_description_en) updateData.meta_description_en = translated.meta_description_en
    if (translation.attempted && !translation.ok) {
      translationWarning = translation.error
    }
  }

  // If status changed to published, set published_at
  if (input.status === 'published') {
    const { data: existingPost } = await supabase
      .from('posts')
      .select('published_at')
      .eq('id', id)
      .single()

    if (!existingPost?.published_at) {
      updateData.published_at = new Date().toISOString()
    }
  }

  let result = await supabase.from('posts').update(updateData).eq('id', id).select().single()
  let migrationWarning: string | undefined
  if (result.error && isMissingColumnError(result.error)) {
    const { data: retryData, stripped } = stripMigrationColumns(updateData)
    if (stripped) {
      result = await supabase.from('posts').update(retryData).eq('id', id).select().single()
      migrationWarning = MIGRATION_005_WARNING
    }
  }

  if (result.error) {
    console.error('Error updating post:', result.error)
    return { success: false, error: result.error.message }
  }

  revalidatePostPaths(result.data.slug)

  const warnings = [translationWarning, migrationWarning].filter(Boolean)
  return { success: true, data: result.data, warning: warnings.join(' ') || undefined }
}

/**
 * 영문 검수 저장 — 번역 검수 화면에서 고친 영문과 검수 상태(en_review)만 쓴다. 한국어 원문·상태는 건드리지 않는다.
 * 넘기지 않은 필드는 그대로 둔다.
 */
export async function saveEnglishReview(
  id: string,
  input: {
    title_en?: string | null
    excerpt_en?: string | null
    content_en?: string | null
    meta_title_en?: string | null
    meta_description_en?: string | null
    en_review: { confirmed: string[]; known: string[]; completed_at: string | null }
  },
) {
  if (!(await checkAdmin()).ok) return { success: false, error: ADMIN_FORBIDDEN_MESSAGE }
  const supabase = await createAdminClient()

  const updateData: Record<string, unknown> = {
    en_review: {
      confirmed: [...new Set(input.en_review.confirmed.filter((x) => typeof x === 'string'))],
      known: [...new Set(input.en_review.known.filter((x) => typeof x === 'string'))],
      completed_at: input.en_review.completed_at,
    },
  }
  if (input.title_en !== undefined) updateData.title_en = input.title_en
  if (input.excerpt_en !== undefined) updateData.excerpt_en = input.excerpt_en
  if (input.content_en !== undefined) updateData.content_en = input.content_en ? { html: input.content_en } : null
  if (input.meta_title_en !== undefined) updateData.meta_title_en = input.meta_title_en
  if (input.meta_description_en !== undefined) updateData.meta_description_en = input.meta_description_en

  const { data, error } = await supabase.from('posts').update(updateData).eq('id', id).select('slug').single()
  if (error) {
    console.error('Error saving English review:', error)
    return {
      success: false,
      error: isMissingColumnError(error) ? MIGRATION_005_WARNING : error.message,
    }
  }
  revalidatePostPaths(data.slug)
  return { success: true }
}

export async function deletePost(id: string) {
  if (!(await checkAdmin()).ok) return { success: false, error: ADMIN_FORBIDDEN_MESSAGE }
  const supabase = await createAdminClient()

  // Soft delete
  const { error } = await supabase
    .from('posts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error deleting post:', error)
    return { success: false, error: error.message }
  }

  revalidatePostPaths()

  return { success: true }
}

/* incrementViewCount는 2026-07-27에 여기서 걷어냈다 — 집계 자리가 POST /api/views로 옮겨졌다.
   이 파일은 'use server'라, 남겨 두면 아무 검증 없이 밖에서 부를 수 있는 서버 액션이
   하나 더 열린 채로 남는다. 입구는 origin·uuid를 검사하는 라우트 하나면 된다. */
