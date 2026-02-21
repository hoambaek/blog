'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Post, PostWithCategory, Category } from '@/lib/supabase/types'
import Anthropic from '@anthropic-ai/sdk'

// ═══════════════════════════════════════════════════
// Translation Helper for Meta Fields
// ═══════════════════════════════════════════════════

interface TranslatedContent {
  title_en: string | null
  excerpt_en: string | null
  content_en: string | null
  meta_title_en: string | null
  meta_description_en: string | null
}

async function translatePost(input: {
  title?: string
  excerpt?: string
  content?: string
  metaTitle?: string
  metaDescription?: string
}): Promise<TranslatedContent> {
  const empty: TranslatedContent = {
    title_en: null,
    excerpt_en: null,
    content_en: null,
    meta_title_en: null,
    meta_description_en: null,
  }

  const hasAnything = input.title || input.excerpt || input.content || input.metaTitle || input.metaDescription
  if (!hasAnything) return empty

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY not found, skipping translation')
    return empty
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = `You are translating content for a luxury Korean sea-aged champagne brand (Muse de Marée).
Translate the following Korean fields to elegant, natural English, maintaining a sophisticated luxury tone.

${input.title ? `TITLE: ${input.title}` : ''}
${input.excerpt ? `EXCERPT: ${input.excerpt}` : ''}
${input.metaTitle ? `META_TITLE: ${input.metaTitle}` : ''}
${input.metaDescription ? `META_DESC: ${input.metaDescription}` : ''}
${input.content ? `CONTENT_HTML: ${input.content}` : ''}

Respond ONLY with valid JSON:
{
  "title_en": "translated title or null",
  "excerpt_en": "translated excerpt or null",
  "content_en": "translated HTML content or null",
  "meta_title_en": "translated meta title or null",
  "meta_description_en": "translated meta description or null"
}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        title_en: parsed.title_en || null,
        excerpt_en: parsed.excerpt_en || null,
        content_en: parsed.content_en || null,
        meta_title_en: parsed.meta_title_en || null,
        meta_description_en: parsed.meta_description_en || null,
      }
    }

    return empty
  } catch (error) {
    console.error('Error translating post:', error)
    return empty
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

export async function createPost(input: CreatePostInput) {
  const supabase = await createAdminClient()

  // Calculate reading time (roughly 200 words per minute)
  const wordCount = input.content.replace(/<[^>]*>/g, '').split(/\s+/).length
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  // Translate all fields to English in one API call
  const translated = await translatePost({
    title: input.title,
    excerpt: input.excerpt,
    content: input.content,
    metaTitle: input.meta_title,
    metaDescription: input.meta_description,
  })

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

  return { success: true, data }
}

export async function updatePost(id: string, input: Partial<CreatePostInput>) {
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
  if (needsTranslation) {
    const translated = await translatePost({
      title: input.title,
      excerpt: input.excerpt,
      content: input.content,
      metaTitle: input.meta_title,
      metaDescription: input.meta_description,
    })
    if (translated.title_en) updateData.title_en = translated.title_en
    if (translated.excerpt_en) updateData.excerpt_en = translated.excerpt_en
    if (translated.content_en) updateData.content_en = { html: translated.content_en }
    if (translated.meta_title_en) updateData.meta_title_en = translated.meta_title_en
    if (translated.meta_description_en) updateData.meta_description_en = translated.meta_description_en
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

  return { success: true, data }
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
