'use client'

import { useState, useRef, useCallback } from 'react'
import { X, Loader2, FileText, Image as ImageIcon, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

interface ParsedPost {
  title: string
  slug: string
  excerpt: string
  metaTitle: string
  metaDescription: string
  category: string
  categoryId: string
  content: string
}

interface Category {
  id: string
  name: string
  slug: string
}

interface DocumentUploadProps {
  onParsed: (post: ParsedPost) => void
  currentCategory?: string
  categories?: Category[]
}

export function DocumentUpload({ onParsed, currentCategory, categories = [] }: DocumentUploadProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingImages, setIsGeneratingImages] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' })
  const [error, setError] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [parsedContent, setParsedContent] = useState<ParsedPost | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.md')) {
      setError('마크다운 파일(.md)만 업로드 가능합니다.')
      return
    }

    setUploadedFile(file)
    setError(null)
    setIsLoading(true)

    try {
      const text = await file.text()
      console.log('=== 파일 파싱 시작 ===')
      console.log('파일 내용 (처음 1000자):', text.substring(0, 1000))
      const parsed = parseMarkdown(text)

      if (!parsed.title) {
        setError('제목을 찾을 수 없습니다. 마크다운 형식을 확인해주세요.')
        setIsLoading(false)
        return
      }

      console.log('=== 파싱 결과 ===', parsed)
      setParsedContent(parsed)
    } catch (err) {
      console.error(err)
      setError('마크다운 파일 파싱에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await handleFileSelect(file)
    }
  }

  // Drag and Drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true)
    }
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      await handleFileSelect(file)
      e.dataTransfer.clearData()
    }
  }, [])

  // Helper to extract value from table row: | **항목** | 값 |
  const extractTableValue = (content: string, key: string): string => {
    // Match patterns like: | **제목** | 왜 바다인가 | or | **meta title** | ... |
    const patterns = [
      new RegExp(`\\|\\s*\\*\\*${key}\\*\\*\\s*\\|\\s*(.+?)\\s*\\|`, 'i'),
      new RegExp(`\\|\\s*${key}\\s*\\|\\s*(.+?)\\s*\\|`, 'i'),
    ]

    for (const pattern of patterns) {
      const match = content.match(pattern)
      if (match) {
        return match[1].trim()
      }
    }
    return ''
  }

  const parseMarkdown = (content: string): ParsedPost => {
    // Normalize line endings (CRLF -> LF)
    const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

    // 1. Extract title from 메타 정보 table: | **제목** | 왜 바다인가 |
    const title = extractTableValue(normalizedContent, '제목')
    console.log('추출된 제목:', title)

    // 1.5. Extract slug if provided: | **slug** | why-the-sea |
    let slug = extractTableValue(normalizedContent, 'slug')
    console.log('추출된 slug:', slug)

    // 2. Extract subtitle/excerpt from: | **부제** | ... |
    const subtitle = extractTableValue(normalizedContent, '부제')
    console.log('추출된 부제:', subtitle)

    // 3. Extract category from: | **카테고리** | 메종 이야기 (Maison Stories) |
    const categoryText = extractTableValue(normalizedContent, '카테고리')
    console.log('추출된 카테고리:', categoryText)
    console.log('사용 가능한 카테고리:', categories.map(c => `${c.name} (${c.slug})`))

    // Find matching category from the available categories
    let categoryId = ''
    let categorySlug = currentCategory || ''

    if (categoryText && categories.length > 0) {
      const lowerCategoryText = categoryText.toLowerCase()

      // Try to find a matching category
      const matchedCategory = categories.find(c => {
        const lowerName = c.name.toLowerCase()
        const lowerSlug = c.slug.toLowerCase()

        // Check if category text contains the category name or slug
        return lowerCategoryText.includes(lowerName) ||
               lowerName.includes(lowerCategoryText.split('(')[0].trim().toLowerCase()) ||
               lowerCategoryText.includes(lowerSlug) ||
               // Also check for common patterns
               (lowerCategoryText.includes('메종') && lowerSlug.includes('maison')) ||
               (lowerCategoryText.includes('maison') && lowerSlug.includes('maison')) ||
               (lowerCategoryText.includes('바다') && lowerSlug.includes('sea')) ||
               (lowerCategoryText.includes('sea') && lowerSlug.includes('sea')) ||
               (lowerCategoryText.includes('빈티지') && lowerSlug.includes('vintage')) ||
               (lowerCategoryText.includes('vintage') && lowerSlug.includes('vintage'))
      })

      if (matchedCategory) {
        categoryId = matchedCategory.id
        categorySlug = matchedCategory.slug
        console.log('매칭된 카테고리:', matchedCategory.name, matchedCategory.id)
      }
    }

    // 4. Extract meta title from SEO 메타 정보: | **meta title** | ... |
    const metaTitle = extractTableValue(normalizedContent, 'meta title') || title
    console.log('추출된 meta title:', metaTitle)

    // 5. Extract meta description from: | **meta description** | ... |
    const metaDescription = extractTableValue(normalizedContent, 'meta description') || subtitle
    console.log('추출된 meta description:', metaDescription)

    // 6. Generate slug if not provided - English only
    if (!slug) {
      // Generate English-only slug using date and random string
      const now = new Date()
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
      const randomStr = Math.random().toString(36).substring(2, 8)
      slug = `post-${dateStr}-${randomStr}`
    }
    // Ensure slug is English-only (remove Korean characters)
    slug = slug
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    console.log('생성된 slug:', slug)

    // 7. Extract body content - everything after ## 본문
    let bodyContent = ''
    const bodyMatch = normalizedContent.match(/##\s*본문\s*\n([\s\S]*?)(?=\n##\s*SEO|$)/i)
    if (bodyMatch) {
      bodyContent = bodyMatch[1].trim()
      console.log('본문 추출됨, 길이:', bodyContent.length)
    } else {
      // Fallback: try to get content after the meta info section
      const fallbackMatch = normalizedContent.match(/---\s*\n\n([\s\S]*?)(?=\n##\s*SEO|$)/)
      if (fallbackMatch) {
        bodyContent = fallbackMatch[1].trim()
      }
    }

    // 8. Also extract hero image and include it at the beginning
    const heroImageMatch = normalizedContent.match(/##\s*히어로 이미지\s*\n\n```[\s\S]*?\[IMAGE:\s*HERO\][\s\S]*?PROMPT:\s*\n?"?([\s\S]*?)"?\s*```/i)
    let heroPrompt = ''
    if (heroImageMatch) {
      heroPrompt = heroImageMatch[1].trim().replace(/\n/g, ' ').replace(/"/g, '')
      console.log('히어로 이미지 프롬프트:', heroPrompt.substring(0, 50) + '...')
    }

    return {
      title,
      slug,
      excerpt: subtitle || metaDescription,
      metaTitle,
      metaDescription: metaDescription || subtitle,
      category: categorySlug,
      categoryId,
      content: convertMarkdownToHtml(bodyContent, heroPrompt),
    }
  }

  const convertMarkdownToHtml = (markdown: string, heroPrompt?: string): string => {
    let html = markdown

    // Convert code blocks with IMAGE prompts to image placeholders
    // Format: ```\n[IMAGE: HERO]\n...\nPROMPT:\n"prompt text"\n```
    html = html.replace(/```\s*\n?\[IMAGE:\s*(.*?)\][\s\S]*?PROMPT:\s*\n?"?([\s\S]*?)"?\s*```/gi, (match, imageType, prompt) => {
      const cleanPrompt = prompt.trim().replace(/\n/g, ' ').replace(/"/g, '').replace(/,\s*$/, '')
      return `<figure style="margin: 2.5rem 0;"><div class="image-placeholder" data-prompt="${cleanPrompt}">[이미지 생성 중...]</div></figure>`
    })

    // Convert headers
    html = html.replace(/^###\s+(.*$)/gm, '<h3>$1</h3>')
    html = html.replace(/^##\s+(.*$)/gm, '<h2>$1</h2>')
    html = html.replace(/^#\s+(.*$)/gm, '<h1>$1</h1>')

    // Convert blockquotes
    html = html.replace(/^>\s*"?(.*?)"?$/gm, '<blockquote>$1</blockquote>')

    // Convert bold and italic
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')

    // Remove standalone <br> tags
    html = html.replace(/^<br\s*\/?>$/gm, '')
    html = html.replace(/<br\s*\/?>/gi, '')

    // Convert horizontal rules (---) but not in code blocks
    html = html.replace(/^---$/gm, '<hr />')

    // Remove remaining code blocks
    html = html.replace(/```[\s\S]*?```/g, '')

    // Split into paragraphs and clean up
    const lines = html.split('\n')
    const processedLines: string[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      if (trimmed.startsWith('<')) {
        processedLines.push(trimmed)
      } else if (!trimmed.match(/^\|/) && !trimmed.match(/^[-|]+$/)) {
        processedLines.push(`<p>${trimmed}</p>`)
      }
    }

    html = processedLines.join('\n')

    // Add hero image placeholder at the beginning if exists
    if (heroPrompt) {
      html = `<figure style="margin: 2.5rem 0;"><div class="image-placeholder" data-prompt="${heroPrompt}">[이미지 생성 중...]</div></figure>\n` + html
    }

    return html
  }

  const handleGenerateImages = async () => {
    if (!parsedContent) return

    setIsGeneratingImages(true)
    setError(null)

    try {
      // Find all image placeholders (with figure wrapper)
      const placeholderRegex = /<figure style="margin: 2\.5rem 0;"><div class="image-placeholder" data-prompt="(.*?)">\[이미지 생성 중\.\.\.\]<\/div><\/figure>/g
      const matches = [...parsedContent.content.matchAll(placeholderRegex)]

      if (matches.length === 0) {
        // No images to generate, just apply content
        onParsed(parsedContent)
        showToast('문서가 적용되었습니다.', 'success')
        resetState()
        return
      }

      setProgress({ current: 0, total: matches.length, message: '이미지 생성 준비 중...' })

      let updatedContent = parsedContent.content

      for (let i = 0; i < matches.length; i++) {
        const match = matches[i]
        const prompt = match[1]

        setProgress({
          current: i + 1,
          total: matches.length,
          message: `이미지 생성 중 (${i + 1}/${matches.length})`
        })

        try {
          const response = await fetch('/api/admin/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: prompt,
              category: parsedContent.category,
            }),
          })

          const data = await response.json()

          if (data.success && data.imageUrl) {
            updatedContent = updatedContent.replace(
              match[0],
              `<figure style="margin: 2.5rem 0;"><img src="${data.imageUrl}" alt="" style="display: block; width: 100%;" /></figure>`
            )
          } else {
            updatedContent = updatedContent.replace(
              match[0],
              `<div class="image-error">[이미지 생성 실패]</div>`
            )
          }
        } catch (err) {
          console.error('Image generation error:', err)
          updatedContent = updatedContent.replace(
            match[0],
            `<div class="image-error">[이미지 생성 실패]</div>`
          )
        }
      }

      onParsed({
        ...parsedContent,
        content: updatedContent,
      })

      showToast('문서와 이미지가 적용되었습니다.', 'success')
      resetState()
    } catch (err) {
      console.error(err)
      setError('이미지 생성 중 오류가 발생했습니다.')
      showToast('이미지 생성에 실패했습니다.', 'error')
    } finally {
      setIsGeneratingImages(false)
      setProgress({ current: 0, total: 0, message: '' })
    }
  }

  const handleApplyWithoutImages = () => {
    if (!parsedContent) return

    // Remove image placeholders completely (with figure wrapper)
    const contentWithoutPlaceholders = parsedContent.content.replace(
      /<figure style="margin: 2\.5rem 0;"><div class="image-placeholder" data-prompt="(.*?)">\[이미지 생성 중\.\.\.\]<\/div><\/figure>/g,
      ''
    )

    onParsed({
      ...parsedContent,
      content: contentWithoutPlaceholders,
    })

    showToast('문서가 적용되었습니다. (이미지 없음)', 'success')
    resetState()
  }

  const resetState = () => {
    setUploadedFile(null)
    setParsedContent(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const countImagePlaceholders = (content: string): number => {
    const matches = content.match(/image-placeholder/g)
    return matches ? matches.length : 0
  }

  return (
    <div className="border border-border bg-muted/30 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Upload className="w-4 h-4" />
          마크다운 문서 업로드
        </h3>
        {(uploadedFile || parsedContent) && (
          <button
            type="button"
            onClick={resetState}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        <code className="text-xs bg-muted px-1">docs/blog-post-01.md</code> 형식의 마크다운 파일을 업로드하세요.
      </p>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 border border-destructive/20">
          {error}
        </div>
      )}

      {!parsedContent ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed transition-colors p-8 text-center cursor-pointer
            ${isDragActive
              ? 'border-foreground bg-muted'
              : 'border-border hover:border-foreground/50'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".md"
            onChange={handleInputChange}
            className="hidden"
          />
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">파일 읽는 중...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <FileText className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isDragActive ? '여기에 파일을 놓으세요' : '클릭하거나 파일을 드래그하여 업로드'}
              </p>
              <p className="text-xs text-muted-foreground">
                .md 파일만 지원됩니다
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* File Info */}
          <div className="flex items-center gap-3 p-3 bg-background border border-border">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{uploadedFile?.name}</p>
              <p className="text-xs text-muted-foreground">
                {parsedContent.title || '제목 없음'}
              </p>
            </div>
            <button
              type="button"
              onClick={resetState}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Parsed Preview */}
          <div className="bg-background border border-border p-4 space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground">제목:</span>{' '}
                <span className="font-medium">{parsedContent.title || '-'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">슬러그:</span>{' '}
                <span className="font-medium">{parsedContent.slug || '-'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">카테고리:</span>{' '}
                <span className="font-medium">{parsedContent.category}</span>
              </div>
              <div className="flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">이미지:</span>{' '}
                <span className="font-medium">
                  {countImagePlaceholders(parsedContent.content)}개
                </span>
              </div>
            </div>
            {parsedContent.excerpt && (
              <div className="pt-2 border-t border-border">
                <span className="text-muted-foreground">발췌문:</span>{' '}
                <span className="text-xs">{parsedContent.excerpt.slice(0, 100)}...</span>
              </div>
            )}
            {parsedContent.metaTitle && (
              <div className="pt-2 border-t border-border">
                <span className="text-muted-foreground">Meta Title:</span>{' '}
                <span className="text-xs">{parsedContent.metaTitle}</span>
              </div>
            )}
          </div>

          {/* Progress */}
          {isGeneratingImages && progress.total > 0 && (
            <div className="bg-background border border-border p-4">
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">{progress.message}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-foreground h-2 rounded-full transition-all"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={resetState}
              disabled={isLoading || isGeneratingImages}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleApplyWithoutImages}
              disabled={isLoading || isGeneratingImages}
            >
              이미지 없이 적용
            </Button>
            <Button
              type="button"
              onClick={handleGenerateImages}
              disabled={isLoading || isGeneratingImages}
            >
              {isGeneratingImages ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  이미지 생성 및 적용
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
