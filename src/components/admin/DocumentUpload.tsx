'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2, FileText, Image as ImageIcon } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface ParsedPost {
  title: string
  slug: string
  excerpt: string
  metaTitle: string
  metaDescription: string
  category: string
  content: string
}

interface DocumentUploadProps {
  onParsed: (post: ParsedPost) => void
  currentCategory?: string
}

export function DocumentUpload({ onParsed, currentCategory }: DocumentUploadProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingImages, setIsGeneratingImages] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' })
  const [error, setError] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [parsedContent, setParsedContent] = useState<ParsedPost | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.md')) {
      setError('마크다운 파일(.md)만 업로드 가능합니다.')
      return
    }

    setUploadedFile(file)
    setError(null)
    setIsLoading(true)

    try {
      const text = await file.text()
      const parsed = parseMarkdown(text)

      if (!parsed.title) {
        setError('제목(title)이 필요합니다.')
        setIsLoading(false)
        return
      }

      setParsedContent(parsed)
    } catch (err) {
      console.error(err)
      setError('마크다운 파일 파싱에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const parseMarkdown = (content: string): ParsedPost => {
    // Parse frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)

    if (!frontmatterMatch) {
      // No frontmatter, treat entire content as body
      return {
        title: '',
        slug: '',
        excerpt: '',
        metaTitle: '',
        metaDescription: '',
        category: currentCategory || 'sea-log',
        content: convertMarkdownToHtml(content),
      }
    }

    const [, frontmatter, body] = frontmatterMatch
    const metadata: Record<string, string> = {}

    // Parse frontmatter key-value pairs
    frontmatter.split('\n').forEach(line => {
      const match = line.match(/^(\w+):\s*(.*)$/)
      if (match) {
        metadata[match[1]] = match[2].trim()
      }
    })

    return {
      title: metadata.title || '',
      slug: metadata.slug || '',
      excerpt: metadata.excerpt || '',
      metaTitle: metadata.meta_title || metadata.title || '',
      metaDescription: metadata.meta_description || metadata.excerpt || '',
      category: metadata.category || currentCategory || 'sea-log',
      content: convertMarkdownToHtml(body.trim()),
    }
  }

  const convertMarkdownToHtml = (markdown: string): string => {
    let html = markdown

    // Convert headers
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>')
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>')
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>')

    // Convert blockquotes
    html = html.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')

    // Convert bold and italic
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')

    // Convert horizontal rules
    html = html.replace(/^---$/gm, '<hr />')

    // Keep image placeholders as special markers
    // [IMAGE: description] will be processed later
    html = html.replace(/\[IMAGE:\s*(.*?)\]/g, '<div class="image-placeholder" data-prompt="$1">[이미지 생성 예정: $1]</div>')

    // Convert paragraphs (lines that aren't already tags)
    html = html
      .split('\n\n')
      .map(block => {
        const trimmed = block.trim()
        if (!trimmed) return ''
        if (trimmed.startsWith('<')) return trimmed
        return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`
      })
      .filter(Boolean)
      .join('\n')

    return html
  }

  const handleGenerateImages = async () => {
    if (!parsedContent) return

    setIsGeneratingImages(true)
    setError(null)

    try {
      // Find all image placeholders
      const placeholderRegex = /<div class="image-placeholder" data-prompt="(.*?)">\[이미지 생성 예정: .*?\]<\/div>/g
      const matches = [...parsedContent.content.matchAll(placeholderRegex)]

      if (matches.length === 0) {
        // No images to generate, just apply content
        onParsed(parsedContent)
        setIsOpen(false)
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
          message: `이미지 생성 중 (${i + 1}/${matches.length}): ${prompt.slice(0, 30)}...`
        })

        try {
          // Generate image using existing cover image API
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
            // Replace placeholder with actual image
            updatedContent = updatedContent.replace(
              match[0],
              `<figure><img src="${data.imageUrl}" alt="${prompt}" /><figcaption>${prompt}</figcaption></figure>`
            )
          } else {
            // Keep placeholder but mark as failed
            updatedContent = updatedContent.replace(
              match[0],
              `<div class="image-error">[이미지 생성 실패: ${prompt}]</div>`
            )
          }
        } catch (err) {
          console.error('Image generation error:', err)
          updatedContent = updatedContent.replace(
            match[0],
            `<div class="image-error">[이미지 생성 실패: ${prompt}]</div>`
          )
        }
      }

      // Apply parsed content with generated images
      onParsed({
        ...parsedContent,
        content: updatedContent,
      })

      setIsOpen(false)
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

    // Remove image placeholders or keep them as text
    const contentWithoutPlaceholders = parsedContent.content.replace(
      /<div class="image-placeholder" data-prompt="(.*?)">\[이미지 생성 예정: .*?\]<\/div>/g,
      '<p><em>[이미지: $1]</em></p>'
    )

    onParsed({
      ...parsedContent,
      content: contentWithoutPlaceholders,
    })

    setIsOpen(false)
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
    const matches = content.match(/\[IMAGE:/g)
    return matches ? matches.length : 0
  }

  if (!isOpen) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Upload className="w-4 h-4" />
        문서 업로드
      </Button>
    )
  }

  return (
    <div className="border border-border bg-muted/30 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Upload className="w-4 h-4" />
          마크다운 문서 업로드
        </h3>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false)
            resetState()
          }}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        마크다운(.md) 파일을 업로드하면 자동으로 폼에 입력됩니다.
        <br />
        <code className="text-xs bg-muted px-1">[IMAGE: 설명]</code> 형식으로 이미지 위치를 지정하면 AI가 이미지를 생성합니다.
      </p>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 border border-destructive/20">
          {error}
        </div>
      )}

      {!parsedContent ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border hover:border-foreground/50 transition-colors p-8 text-center cursor-pointer"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".md"
            onChange={handleFileSelect}
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
                클릭하거나 파일을 드래그하여 업로드
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
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setIsOpen(false)
            resetState()
          }}
          disabled={isLoading || isGeneratingImages}
        >
          취소
        </Button>
        {parsedContent && (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}
