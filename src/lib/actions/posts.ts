'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Post, PostWithCategory, Category } from '@/lib/supabase/types'
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

// ═══════════════════════════════════════════════════
// Admin Data Fetching (uses service role, bypasses RLS)
// ═══════════════════════════════════════════════════

export async function getAdminPosts(
  status?: string,
  categoryId?: string,
  search?: string,
  limit = 20,
  offset = 0
): Promise<{ posts: PostWithCategory[]; total: number }> {
  const supabase = await createAdminClient()

  let query = supabase
    .from('posts')
    .select(`
      *,
      category:categories(*)
    `, { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching admin posts:', error)
    return { posts: [], total: 0 }
  }

  return { posts: data as PostWithCategory[], total: count || 0 }
}

export async function getAdminPostById(id: string): Promise<PostWithCategory | null> {
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

// ═══════════════════════════════════════════════════
// Admin CRUD Operations
// ═══════════════════════════════════════════════════

interface CreatePostInput {
  title: string
  slug: string
  excerpt?: string
  /** 사진·자료 출처 (언어 공용, 비우면 본문에 표시 안 함) */
  photo_credits?: string | null
  content: string
  category_id?: string
  status: 'draft' | 'published' | 'scheduled'
  is_featured?: boolean
  cover_image_url?: string
  meta_title?: string
  meta_description?: string
  scheduled_at?: string
  author_id?: string
}

export async function createPost(input: CreatePostInput, pretranslated?: TranslatedContent | null) {
  const supabase = await createAdminClient()

  // Calculate reading time (roughly 200 words per minute)
  const wordCount = input.content.replace(/<[^>]*>/g, '').split(/\s+/).length
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  // 클라이언트가 스트리밍 라우트(/api/admin/translate)로 미리 번역한 결과가 있으면 재사용,
  // 없으면(다른 호출 경로·번역 실패 폴백) 여기서 직접 번역
  const translation: TranslationResult = pretranslated
    ? { content: pretranslated, attempted: true, ok: true }
    : await translatePost({
        title: input.title,
        excerpt: input.excerpt,
        content: input.content,
        metaTitle: input.meta_title,
        metaDescription: input.meta_description,
      })
  const translated = translation.content

  const postData = {
    ...input,
    content: { html: input.content },
    reading_time_minutes: readingTime,
    published_at: input.status === 'published' ? new Date().toISOString() : null,
    title_en: translated.title_en,
    excerpt_en: translated.excerpt_en,
    content_en: translated.content_en ? { html: translated.content_en } : null,
    meta_title_en: translated.meta_title_en,
    meta_description_en: translated.meta_description_en,
  }

  const { data, error } = await supabase
    .from('posts')
    .insert(postData)
    .select()
    .single()

  if (error) {
    console.error('Error creating post:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/admin/posts')

  // Post saved, but flag when the English translation did not go through.
  const warning = translation.attempted && !translation.ok ? translation.error : undefined
  return { success: true, data, warning }
}

export async function updatePost(id: string, input: Partial<CreatePostInput>, pretranslated?: TranslatedContent | null) {
  const supabase = await createAdminClient()

  const updateData: Record<string, unknown> = { ...input }

  // If content is provided, wrap it in object and recalculate reading time
  if (input.content) {
    updateData.content = { html: input.content }
    const wordCount = input.content.replace(/<[^>]*>/g, '').split(/\s+/).length
    updateData.reading_time_minutes = Math.max(1, Math.ceil(wordCount / 200))
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
          metaTitle: input.meta_title,
          metaDescription: input.meta_description,
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

  const { data, error } = await supabase
    .from('posts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating post:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  revalidatePath(`/post/${data.slug}`)
  revalidatePath('/admin/posts')

  return { success: true, data, warning: translationWarning }
}

export async function deletePost(id: string) {
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

  revalidatePath('/')
  revalidatePath('/admin/posts')

  return { success: true }
}

export async function incrementViewCount(id: string) {
  const supabase = await createAdminClient()

  const { error } = await supabase.rpc('increment_view_count', { post_id: id })

  if (error) {
    // Fallback if RPC doesn't exist
    const { data: post } = await supabase
      .from('posts')
      .select('view_count')
      .eq('id', id)
      .single()

    if (post) {
      await supabase
        .from('posts')
        .update({ view_count: (post.view_count || 0) + 1 })
        .eq('id', id)
    }
  }
}

// ═══════════════════════════════════════════════════
// Dashboard Stats
// ═══════════════════════════════════════════════════

export async function getDashboardStats() {
  const supabase = await createAdminClient()

  // Get total posts count
  const { count: totalPosts } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)

  // Get published posts count
  const { count: publishedPosts } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .is('deleted_at', null)

  // Get draft posts count
  const { count: draftPosts } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'draft')
    .is('deleted_at', null)

  // Get this month's published posts
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: thisMonthPosts } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .gte('published_at', startOfMonth.toISOString())
    .is('deleted_at', null)

  // Get total views this month
  const { data: viewsData } = await supabase
    .from('posts')
    .select('view_count')
    .is('deleted_at', null)

  const totalViews = viewsData?.reduce((sum, post) => sum + (post.view_count || 0), 0) || 0

  return {
    totalPosts: totalPosts || 0,
    publishedPosts: publishedPosts || 0,
    draftPosts: draftPosts || 0,
    thisMonthPosts: thisMonthPosts || 0,
    totalViews,
  }
}

export async function getRecentPosts(limit = 5): Promise<PostWithCategory[]> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      category:categories(*)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent posts:', error)
    return []
  }

  return data as PostWithCategory[]
}
