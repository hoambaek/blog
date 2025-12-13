'use client'

import { useState, useEffect } from 'react'
import { Sparkles, X, Loader2, Wand2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

// 카테고리별 커버 이미지 예시 프롬프트
const COVER_EXAMPLES: Record<string, string[]> = {
  'sea-log': [
    'Champagne bottles resting on sandy ocean floor, dramatic underwater lighting from above, mysterious deep sea atmosphere',
    'Abstract underwater seascape with light rays penetrating deep blue water, peaceful and serene',
    'Close-up of champagne bottle encrusted with sea minerals, underwater texture, cinematic lighting',
  ],
  'maison': [
    'Panoramic view of champagne vineyard at golden hour, misty morning atmosphere, rolling hills',
    'Ancient chalk cellar with rows of aging bottles, candlelit ambiance, heritage feel',
    'Artisan hands working in traditional workshop, warm natural light, craftsmanship focus',
  ],
  'culture': [
    'Minimalist gallery space with single champagne bottle as art installation, museum lighting',
    'Abstract art piece inspired by ocean waves and champagne bubbles, contemporary aesthetic',
    'Luxury exhibition space with dramatic shadows and golden accents, cultural sophistication',
  ],
  'table': [
    'Elegant table setting with champagne and fine dining, soft candlelight, intimate atmosphere',
    'Champagne being poured into crystal glass, bubbles rising, celebration moment',
    'Luxurious pairing of champagne and gourmet cuisine, overhead shot, editorial style',
  ],
  'news': [
    'Sophisticated event space with champagne reception, ambient lighting, anticipation mood',
    'Luxury invitation card with embossed details, rose gold accents, exclusive feel',
    'Celebratory toast silhouettes against warm ambient lighting, elegant gathering',
  ],
}

interface AICoverImageGeneratorProps {
  onImageGenerated: (imageUrl: string) => void
  currentCategory?: string
  title?: string
  content?: string
}

export function AICoverImageGenerator({ onImageGenerated, currentCategory = 'sea-log', title, content }: AICoverImageGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [category, setCategory] = useState(currentCategory)
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:3' | '3:4'>('16:9')
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if there's enough content to analyze
  const hasContent = Boolean(title?.trim() || content?.trim())

  // Auto-generate prompt from title and content
  const handleAutoGenerate = async () => {
    if (!hasContent) {
      setError('제목이나 본문 내용을 먼저 입력해주세요.')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/analyze-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          category,
        }),
      })

      const data = await response.json()

      if (data.success && data.prompt) {
        setPrompt(data.prompt)
      } else {
        setError(data.error || '프롬프트 생성에 실패했습니다.')
      }
    } catch (err) {
      console.error('Error analyzing content:', err)
      setError('콘텐츠 분석 중 오류가 발생했습니다.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('이미지 설명을 입력해주세요.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Step 1: Generate image with AI
      const generateResponse = await fetch('/api/admin/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          category,
          aspectRatio,
        }),
      })

      const generateData = await generateResponse.json()

      if (!generateData.success || !generateData.image?.base64) {
        setError(generateData.error || '이미지 생성에 실패했습니다.')
        return
      }

      // Step 2: Upload to R2 with optimization
      const uploadResponse = await fetch('/api/upload-base64', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64: generateData.image.base64,
          folder: 'covers',
          type: 'cover',
          filename: `ai-cover-${Date.now()}`,
        }),
      })

      const uploadData = await uploadResponse.json()

      if (uploadData.success && uploadData.url) {
        onImageGenerated(uploadData.url)
        setIsOpen(false)
        setPrompt('')
        setError(null)
        console.log(`Cover image optimized: ${uploadData.optimization?.savings}% size reduction`)
      } else {
        setError(uploadData.error || '이미지 업로드에 실패했습니다.')
      }
    } catch (err) {
      console.error('Error generating cover image:', err)
      setError('이미지 생성 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // Update category when prop changes
  if (currentCategory !== category && !isOpen) {
    setCategory(currentCategory)
  }

  return (
    <div className="mt-3">
      {!isOpen ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="w-full"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          AI로 커버 이미지 생성
        </Button>
      ) : (
        <div className="border border-border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI 커버 이미지 생성
            </h4>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                setPrompt('')
                setError(null)
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-xs p-2 border border-destructive/20">
              {error}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-muted-foreground">
                이미지 설명 (영어 권장)
              </label>
              {hasContent && (
                <button
                  type="button"
                  onClick={handleAutoGenerate}
                  disabled={isLoading || isAnalyzing}
                  className="text-xs px-2 py-0.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      분석 중...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-3 w-3" />
                      본문 분석으로 생성
                    </>
                  )}
                </button>
              )}
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="예: Champagne bottles on ocean floor with soft light rays"
              rows={2}
              className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
              disabled={isLoading || isAnalyzing}
            />
            {!hasContent && (
              <p className="text-xs text-muted-foreground/70 mt-1 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                제목과 본문을 입력하면 자동 프롬프트 생성이 가능합니다
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[120px]">
              <label className="text-xs text-muted-foreground block mb-1">
                카테고리
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:border-foreground"
                disabled={isLoading}
              >
                <option value="sea-log">바다의 일지</option>
                <option value="maison">메종 이야기</option>
                <option value="culture">문화와 예술</option>
                <option value="table">테이블 위에서</option>
                <option value="news">뉴스 & 이벤트</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                비율
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as typeof aspectRatio)}
                className="border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:border-foreground"
                disabled={isLoading}
              >
                <option value="16:9">16:9 (권장)</option>
                <option value="4:3">4:3</option>
                <option value="3:4">3:4 (세로)</option>
              </select>
            </div>
          </div>

          {/* Example prompts */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">예시 (클릭하여 사용):</p>
            <div className="flex flex-col gap-1">
              {COVER_EXAMPLES[category]?.map((example, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(example)}
                  className="text-xs px-2 py-1.5 bg-background hover:bg-muted border border-border/50 transition-colors text-left truncate"
                  disabled={isLoading}
                  title={example}
                >
                  {example.length > 60 ? example.slice(0, 60) + '...' : example}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                커버 이미지 생성
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            Imagen 4를 사용하여 뮤즈드마레 브랜드 스타일의 커버 이미지를 생성합니다.
          </p>
        </div>
      )}
    </div>
  )
}
