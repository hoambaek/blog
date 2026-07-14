'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Eye, Send, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TiptapEditor } from '@/components/admin/TiptapEditor'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { DocumentUpload } from '@/components/admin/DocumentUpload'
import { AICoverImageGenerator } from '@/components/admin/AICoverImageGenerator'
import { createPost, updatePost } from '@/lib/actions/posts'
import { useToast } from '@/components/ui/toast'
import type { Category, PostWithCategory } from '@/lib/supabase/types'
import { planContentTranslation, type TranslatedContent, type TranslationInput } from '@/lib/translation'

interface PostEditorFormProps {
  categories: Category[]
  post?: PostWithCategory
}

// 저장 진행 상태: 검증 → 영문 번역(실제 진행률) → 저장
type SaveStep = 'check' | 'translate' | 'save'
interface SaveProgress {
  step: SaveStep
  pct: number
  publishing: boolean
  // 번역 단계 부가 설명 (변경된 문단만 / 변경 없음 등)
  translateNote?: string
}

// /api/admin/translate가 보내는 ndjson 이벤트
type TranslateEvent =
  | { type: 'progress'; pct: number }
  | { type: 'result'; translation: TranslatedContent }
  | { type: 'error'; message: string }

export function PostEditorForm({ categories, post }: PostEditorFormProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [saveProgress, setSaveProgress] = useState<SaveProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const t = {
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
    photoCredits: '사진·자료 출처',
    photoCreditsPlaceholder: '예: 사진 Mignon-Boulard 제공 (한 줄에 하나씩, 비우면 표시되지 않습니다)',
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
    documentUpload: '문서 업로드',
    content: '본문',
    savedSuccess: '포스트가 저장되었습니다.',
    publishedSuccess: '포스트가 발행되었습니다.',
  }

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
    photoCredits: post?.photo_credits || '',
    content: getHtmlContent(),
    categoryId: post?.category_id || '',
    status: (post?.status || 'draft') as 'draft' | 'published' | 'scheduled',
    isFeatured: post?.is_featured || false,
    coverImageUrl: post?.cover_image_url || '',
    metaTitle: post?.meta_title || '',
    metaDescription: post?.meta_description || '',
  })

  const handleTitleChange = (title: string) => {
    setFormData((prev) => {
      // Only auto-generate slug if it's a new post or slug is empty
      let newSlug = prev.slug
      if (!newSlug) {
        // Extract only English characters and numbers for slug
        const englishOnly = title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')

        // If no English characters, generate date-based slug
        if (!englishOnly) {
          const now = new Date()
          const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
          const randomStr = Math.random().toString(36).substring(2, 8)
          newSlug = `post-${dateStr}-${randomStr}`
        } else {
          newSlug = englishOnly
        }
      }

      return {
        ...prev,
        title,
        slug: newSlug,
      }
    })
  }

  const handleDocumentParsed = (post: {
    title: string
    slug: string
    excerpt: string
    metaTitle: string
    metaDescription: string
    category: string
    categoryId: string
    content: string
  }) => {
    // Use provided slug or generate English-only slug
    let finalSlug = post.slug
    if (!finalSlug) {
      const now = new Date()
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
      const randomStr = Math.random().toString(36).substring(2, 8)
      finalSlug = `post-${dateStr}-${randomStr}`
    }

    setFormData((prev) => ({
      ...prev,
      title: post.title || prev.title,
      slug: finalSlug || prev.slug,
      excerpt: post.excerpt || prev.excerpt,
      metaTitle: post.metaTitle || prev.metaTitle,
      metaDescription: post.metaDescription || prev.metaDescription,
      categoryId: post.categoryId || prev.categoryId,
      content: post.content,
    }))
  }

  // Get current category slug for AI assistant
  const getCurrentCategorySlug = () => {
    const category = categories.find(c => c.id === formData.categoryId)
    return category?.slug || 'sea-log'
  }

  // 스트리밍 번역 라우트 호출 — 진행률을 모달에 반영하고 번역 결과를 돌려준다.
  // 실패하면 null을 반환하고 저장 단계(서버 액션 내부 번역)로 폴백한다.
  const runStreamingTranslation = async (input: TranslationInput): Promise<TranslatedContent | null> => {
    try {
      const res = await fetch('/api/admin/translate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok || !res.body) return null

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let translation: TranslatedContent | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        let newlineIndex = buffer.indexOf('\n')
        while (newlineIndex >= 0) {
          const line = buffer.slice(0, newlineIndex).trim()
          buffer = buffer.slice(newlineIndex + 1)
          newlineIndex = buffer.indexOf('\n')
          if (!line) continue
          try {
            const event = JSON.parse(line) as TranslateEvent
            if (event.type === 'progress') {
              // 번역 구간을 전체 진행률 8~88%에 매핑
              const overall = 8 + Math.round(event.pct * 0.8)
              setSaveProgress((prev) => (prev ? { ...prev, step: 'translate', pct: overall } : prev))
            } else if (event.type === 'result') {
              translation = event.translation
            } else if (event.type === 'error') {
              console.error('Streaming translation failed:', event.message)
              return null
            }
          } catch {
            // 손상된 이벤트 라인은 무시
          }
        }
      }
      return translation
    } catch (err) {
      console.error('Streaming translation request failed:', err)
      return null
    }
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
    const publishing = status === 'published'
    setSaveProgress({ step: 'check', pct: 3, publishing })

    try {
      const postData = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt || undefined,
        photo_credits: formData.photoCredits.trim() || null,
        content: formData.content,
        category_id: formData.categoryId || undefined,
        status,
        is_featured: formData.isFeatured,
        cover_image_url: formData.coverImageUrl || undefined,
        meta_title: formData.metaTitle || undefined,
        meta_description: formData.metaDescription || undefined,
      }

      // 1단계: 무엇을 번역할지 결정 — 수정 저장이면 원본과 비교해 바뀐 것만
      let translationInput: TranslationInput = {
        title: formData.title,
        excerpt: formData.excerpt || undefined,
        content: formData.content || undefined,
        metaTitle: formData.metaTitle || undefined,
        metaDescription: formData.metaDescription || undefined,
      }
      let contentPlan: ReturnType<typeof planContentTranslation> | null = null
      let translateNote: string | undefined

      if (post) {
        const oldEnHtml = (post.content_en as { html?: string } | null)?.html || null
        contentPlan = planContentTranslation(getHtmlContent(), formData.content, oldEnHtml)

        const input: TranslationInput = {}
        if (formData.title !== (post.title || '')) input.title = formData.title
        if ((formData.excerpt || '') !== (post.excerpt || '') && formData.excerpt) input.excerpt = formData.excerpt
        if ((formData.metaTitle || '') !== (post.meta_title || '') && formData.metaTitle) input.metaTitle = formData.metaTitle
        if ((formData.metaDescription || '') !== (post.meta_description || '') && formData.metaDescription) {
          input.metaDescription = formData.metaDescription
        }
        if (contentPlan.mode === 'full') input.content = formData.content
        else if (contentPlan.mode === 'partial') input.content = contentPlan.htmlToTranslate

        translationInput = input
        if (contentPlan.mode === 'partial') translateNote = '변경된 문단만 번역'
      }

      const hasTextChanges = Object.values(translationInput).some(Boolean)

      // 2단계: 영문 번역 (실제 생성 진행률 표시). 텍스트 변경이 없으면 건너뛴다.
      let pretranslated: TranslatedContent | null = null
      if (hasTextChanges) {
        setSaveProgress({ step: 'translate', pct: 8, publishing, translateNote })
        const translated = await runStreamingTranslation(translationInput)
        if (translated) {
          // 본문 영문: 부분 번역이면 기존 영문본에 짜깁기, 미디어만 변경이면 이미지 동기화, 전체면 그대로
          let contentEn: string | null = translationInput.content ? translated.content_en : null
          let assembleFailed = false
          if (contentPlan && (contentPlan.mode === 'partial' || contentPlan.mode === 'media-only')) {
            contentEn = contentPlan.assemble?.(translated.content_en ?? undefined) ?? null
            // 짜깁기 실패(블록 수 불일치) → pretranslated 없이 저장해 서버가 전체를 다시 번역
            assembleFailed = contentPlan.mode === 'partial' && !contentEn
          }
          if (!assembleFailed) {
            // 요청한 필드만 반영 (요청 안 한 필드는 null → 서버가 기존 영문을 유지)
            pretranslated = {
              title_en: translationInput.title ? translated.title_en : null,
              excerpt_en: translationInput.excerpt ? translated.excerpt_en : null,
              content_en: contentEn,
              meta_title_en: translationInput.metaTitle ? translated.meta_title_en : null,
              meta_description_en: translationInput.metaDescription ? translated.meta_description_en : null,
            }
          }
        }
      } else {
        // 텍스트 변경 없음 — 번역 건너뜀. 이미지만 바뀐 경우 영문본의 이미지를 동기화.
        const syncedContentEn = contentPlan?.mode === 'media-only' ? (contentPlan.assemble?.() ?? null) : null
        pretranslated = {
          title_en: null,
          excerpt_en: null,
          content_en: syncedContentEn,
          meta_title_en: null,
          meta_description_en: null,
        }
        setSaveProgress({ step: 'save', pct: 90, publishing, translateNote: '변경 없음 — 건너뜀' })
      }

      // 3단계: 저장 (번역 실패 시 pretranslated=null → 서버 액션이 내부에서 번역을 재시도)
      setSaveProgress((prev) => ({ step: 'save', pct: 90, publishing, translateNote: prev?.translateNote }))
      let result
      if (post) {
        result = await updatePost(post.id, postData, pretranslated)
      } else {
        result = await createPost(postData, pretranslated)
      }

      if (result.success) {
        setSaveProgress({ step: 'save', pct: 100, publishing })
        showToast(status === 'published' ? t.publishedSuccess : t.savedSuccess, 'success')
        // Post saved but the English auto-translation failed — surface it instead of silently keeping stale English.
        if (result.warning) {
          showToast(result.warning, 'warning')
        }
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
      setSaveProgress(null)
    }
  }

  // 진행 모달의 단계 정의 (순서 고정)
  const progressSteps: { key: SaveStep; label: string }[] = [
    { key: 'check', label: '내용 확인' },
    { key: 'translate', label: '영문 번역 (Claude Opus)' },
    { key: 'save', label: saveProgress?.publishing ? '저장 및 발행' : '저장' },
  ]
  const stepOrder: SaveStep[] = ['check', 'translate', 'save']

  return (
    <>
      {/* 저장 진행 모달 */}
      {saveProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="w-full max-w-sm border border-border bg-card p-6 shadow-xl">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-base font-semibold">
                {saveProgress.publishing ? '포스트 발행 중' : '포스트 저장 중'}
              </h2>
              <span className="text-sm font-medium tabular-nums text-primary">
                {saveProgress.pct}%
              </span>
            </div>

            {/* 진행 바 */}
            <div className="h-1 w-full bg-muted mb-5">
              <div
                className="h-1 bg-primary transition-all duration-300 ease-out"
                style={{ width: `${saveProgress.pct}%` }}
              />
            </div>

            {/* 단계 목록 */}
            <ul className="space-y-3">
              {progressSteps.map((step) => {
                const currentIndex = stepOrder.indexOf(saveProgress.step)
                const stepIndex = stepOrder.indexOf(step.key)
                const isDone = stepIndex < currentIndex || saveProgress.pct >= 100
                const isActive = stepIndex === currentIndex && saveProgress.pct < 100
                return (
                  <li key={step.key} className="flex items-center gap-3 text-sm">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                      {isDone ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : isActive ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <span className="h-1.5 w-1.5 bg-border" />
                      )}
                    </span>
                    <span
                      className={
                        isDone
                          ? 'text-muted-foreground line-through decoration-border'
                          : isActive
                            ? 'font-medium text-foreground'
                            : 'text-muted-foreground'
                      }
                    >
                      {step.label}
                    </span>
                    {step.key === 'translate' && (isActive || saveProgress.translateNote) && (
                      <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                        {saveProgress.translateNote ?? '번역 생성 중…'}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>

            <p className="mt-5 text-xs text-muted-foreground">
              본문 길이에 따라 20~40초 정도 걸립니다. 창을 닫지 마세요.
            </p>
          </div>
        </div>
      )}

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

          {/* Document Upload - Always visible */}
          <DocumentUpload
            onParsed={handleDocumentParsed}
            currentCategory={getCurrentCategorySlug()}
            categories={categories}
          />

          {/* Content Label */}
          <Label className="text-sm font-medium">{t.content}</Label>

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

          {/* Photo Credits — 값이 있을 때만 본문 끝 로고 아래에 표시된다 */}
          <div className="border border-border p-4 bg-card">
            <Label className="text-sm font-medium mb-2 block">{t.photoCredits}</Label>
            <textarea
              className="w-full px-3 py-2 border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              rows={2}
              value={formData.photoCredits}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, photoCredits: e.target.value }))
              }
              placeholder={t.photoCreditsPlaceholder}
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
