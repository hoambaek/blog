'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Eye, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TiptapEditor } from '@/components/admin/TiptapEditor'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { AIWritingAssistant } from '@/components/admin/AIWritingAssistant'
import { AICoverImageGenerator } from '@/components/admin/AICoverImageGenerator'
import { createPost, updatePost } from '@/lib/actions/posts'
import { useLocale } from '@/lib/i18n'
import { useToast } from '@/components/ui/toast'
import type { Category, PostWithCategory } from '@/lib/supabase/types'

interface PostEditorFormProps {
  categories: Category[]
  post?: PostWithCategory
}

export function PostEditorForm({ categories, post }: PostEditorFormProps) {
  const router = useRouter()
  const { locale } = useLocale()
  const { showToast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const text = {
    ko: {
      editPost: '포스트 수정',
      newPost: '새 포스트',
      editPostDesc: '포스트를 수정합니다',
      newPostDesc: '새로운 포스트를 작성합니다',
      view: '보기',
      save: '저장',
      publish: '발행',
      titlePlaceholder: '제목을 입력하세요',
      status: '상태',
      draft: '초안',
      published: '발행',
      scheduled: '예약',
      category: '카테고리',
      selectCategory: '카테고리 선택',
      slug: '슬러그',
      excerpt: '발췌문',
      excerptPlaceholder: '포스트의 간단한 설명...',
      coverImage: '커버 이미지',
      dragOrClick: '이미지를 드래그하거나 클릭하여 업로드',
      orImageUrl: '또는 이미지 URL 입력',
      featuredPost: '피처드 포스트로 설정',
      featuredDesc: '홈페이지 상단에 노출됩니다',
      seoSettings: 'SEO 설정',
      metaTitle: '메타 타이틀',
      metaDescription: '메타 설명',
      postTitle: '포스트 제목',
      postDescription: '포스트 설명',
      titleRequired: '제목을 입력해주세요.',
      slugRequired: '슬러그를 입력해주세요.',
      saveError: '저장 중 오류가 발생했습니다.',
      aiWriting: 'AI 글쓰기',
      content: '본문',
      savedSuccess: '포스트가 저장되었습니다.',
      publishedSuccess: '포스트가 발행되었습니다.',
    },
    en: {
      editPost: 'Edit Post',
      newPost: 'New Post',
      editPostDesc: 'Edit your post',
      newPostDesc: 'Create a new post',
      view: 'View',
      save: 'Save',
      publish: 'Publish',
      titlePlaceholder: 'Enter title',
      status: 'Status',
      draft: 'Draft',
      published: 'Published',
      scheduled: 'Scheduled',
      category: 'Category',
      selectCategory: 'Select category',
      slug: 'Slug',
      excerpt: 'Excerpt',
      excerptPlaceholder: 'Brief description of the post...',
      coverImage: 'Cover Image',
      dragOrClick: 'Drag or click to upload image',
      orImageUrl: 'Or enter image URL',
      featuredPost: 'Set as Featured Post',
      featuredDesc: 'Will be displayed on homepage',
      seoSettings: 'SEO Settings',
      metaTitle: 'Meta Title',
      metaDescription: 'Meta Description',
      postTitle: 'Post title',
      postDescription: 'Post description',
      titleRequired: 'Please enter a title.',
      slugRequired: 'Please enter a slug.',
      saveError: 'An error occurred while saving.',
      aiWriting: 'AI Writing',
      content: 'Content',
      savedSuccess: 'Post saved successfully.',
      publishedSuccess: 'Post published successfully.',
    },
  }

  const t = locale === 'ko' ? text.ko : text.en

  // Get HTML content from post
  const getHtmlContent = () => {
    if (!post?.content) return ''
    if (typeof post.content === 'object' && post.content !== null) {
      return (post.content as { html?: string }).html || ''
    }
    return ''
  }

  const [formData, setFormData] = useState({
    title: post?.title || '',
    slug: post?.slug || '',
    excerpt: post?.excerpt || '',
    content: getHtmlContent(),
    categoryId: post?.category_id || '',
    status: (post?.status || 'draft') as 'draft' | 'published' | 'scheduled',
    isFeatured: post?.is_featured || false,
    coverImageUrl: post?.cover_image_url || '',
    metaTitle: post?.meta_title || '',
    metaDescription: post?.meta_description || '',
  })

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      // Only auto-generate slug if it's a new post or slug is empty
      slug: prev.slug || title
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-'),
    }))
  }

  const handleAIGenerated = (post: {
    title: string
    slug: string
    excerpt: string
    metaTitle: string
    metaDescription: string
    content: string
  }) => {
    setFormData((prev) => ({
      ...prev,
      title: post.title || prev.title,
      slug: post.slug || prev.slug || post.title
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-'),
      excerpt: post.excerpt || prev.excerpt,
      metaTitle: post.metaTitle || prev.metaTitle,
      metaDescription: post.metaDescription || prev.metaDescription,
      content: post.content,
    }))
  }

  // Get current category slug for AI assistant
  const getCurrentCategorySlug = () => {
    const category = categories.find(c => c.id === formData.categoryId)
    return category?.slug || 'sea-log'
  }

  const handleSave = async (status: 'draft' | 'published' = 'draft') => {
    if (!formData.title.trim()) {
      setError(t.titleRequired)
      return
    }
    if (!formData.slug.trim()) {
      setError(t.slugRequired)
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const postData = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt || undefined,
        content: formData.content,
        category_id: formData.categoryId || undefined,
        status,
        is_featured: formData.isFeatured,
        cover_image_url: formData.coverImageUrl || undefined,
        meta_title: formData.metaTitle || undefined,
        meta_description: formData.metaDescription || undefined,
      }

      let result
      if (post) {
        result = await updatePost(post.id, postData)
      } else {
        result = await createPost(postData)
      }

      if (result.success) {
        showToast(status === 'published' ? t.publishedSuccess : t.savedSuccess, 'success')
        router.push('/admin/posts')
      } else {
        setError(result.error || t.saveError)
        showToast(result.error || t.saveError, 'error')
      }
    } catch (err) {
      console.error('Error saving post:', err)
      setError(t.saveError)
      showToast(t.saveError, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/posts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">
              {post ? t.editPost : t.newPost}
            </h1>
            <p className="text-muted-foreground">
              {post ? t.editPostDesc : t.newPostDesc}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post?.status === 'published' && (
            <Link href={`/post/${post.slug}`} target="_blank">
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                {t.view}
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            onClick={() => handleSave('draft')}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {t.save}
          </Button>
          <Button onClick={() => handleSave('published')} disabled={isSaving}>
            <Send className="h-4 w-4 mr-2" />
            {t.publish}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div>
            <Input
              placeholder={t.titlePlaceholder}
              className="text-2xl font-display h-auto py-4 border-0 border-b focus-visible:ring-0 px-0"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
            />
          </div>

          {/* AI Writing Assistant */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{t.content}</Label>
            <AIWritingAssistant
              onGenerated={handleAIGenerated}
              currentCategory={getCurrentCategorySlug()}
            />
          </div>

          {/* Editor */}
          <TiptapEditor
            content={formData.content}
            onChange={(content) => setFormData((prev) => ({ ...prev, content }))}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="border border-border p-4 bg-card">
            <Label className="text-sm font-medium mb-2 block">{t.status}</Label>
            <select
              className="w-full px-3 py-2 border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  status: e.target.value as 'draft' | 'published' | 'scheduled',
                }))
              }
            >
              <option value="draft">{t.draft}</option>
              <option value="published">{t.published}</option>
              <option value="scheduled">{t.scheduled}</option>
            </select>
          </div>

          {/* Category */}
          <div className="border border-border p-4 bg-card">
            <Label className="text-sm font-medium mb-2 block">{t.category}</Label>
            <select
              className="w-full px-3 py-2 border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={formData.categoryId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, categoryId: e.target.value }))
              }
            >
              <option value="">{t.selectCategory}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Slug */}
          <div className="border border-border p-4 bg-card">
            <Label className="text-sm font-medium mb-2 block">{t.slug}</Label>
            <Input
              value={formData.slug}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, slug: e.target.value }))
              }
              placeholder="post-url-slug"
            />
            <p className="text-xs text-muted-foreground mt-1">
              URL: /post/{formData.slug || 'slug'}
            </p>
          </div>

          {/* Excerpt */}
          <div className="border border-border p-4 bg-card">
            <Label className="text-sm font-medium mb-2 block">{t.excerpt}</Label>
            <textarea
              className="w-full px-3 py-2 border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              rows={3}
              value={formData.excerpt}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, excerpt: e.target.value }))
              }
              placeholder={t.excerptPlaceholder}
            />
          </div>

          {/* Cover Image */}
          <div className="border border-border p-4 bg-card">
            <Label className="text-sm font-medium mb-2 block">{t.coverImage}</Label>
            <ImageUpload
              value={formData.coverImageUrl}
              onChange={(url) =>
                setFormData((prev) => ({ ...prev, coverImageUrl: url }))
              }
              folder="covers"
            />
            <div className="mt-3">
              <Label className="text-xs text-muted-foreground mb-1 block">
                {t.orImageUrl}
              </Label>
              <Input
                value={formData.coverImageUrl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, coverImageUrl: e.target.value }))
                }
                placeholder="https://..."
              />
            </div>
            <AICoverImageGenerator
              onImageGenerated={(url) =>
                setFormData((prev) => ({ ...prev, coverImageUrl: url }))
              }
              currentCategory={getCurrentCategorySlug()}
              title={formData.title}
              content={formData.content}
            />
          </div>

          {/* Featured */}
          <div className="border border-border p-4 bg-card">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, isFeatured: e.target.checked }))
                }
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">{t.featuredPost}</span>
            </label>
            <p className="text-xs text-muted-foreground mt-1">
              {t.featuredDesc}
            </p>
          </div>

          {/* SEO */}
          <div className="border border-border p-4 bg-card">
            <Label className="text-sm font-medium mb-4 block">{t.seoSettings}</Label>
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  {t.metaTitle}
                </Label>
                <Input
                  value={formData.metaTitle}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, metaTitle: e.target.value }))
                  }
                  placeholder={formData.title || t.postTitle}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  {t.metaDescription}
                </Label>
                <textarea
                  className="w-full px-3 py-2 border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  rows={2}
                  value={formData.metaDescription}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      metaDescription: e.target.value,
                    }))
                  }
                  placeholder={formData.excerpt || t.postDescription}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
