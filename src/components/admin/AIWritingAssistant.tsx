'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, X, Loader2 } from 'lucide-react'

const CATEGORIES = [
  { value: 'sea-log', label: '바다의 일지' },
  { value: 'maison', label: '메종 이야기' },
  { value: 'culture', label: '문화와 예술' },
  { value: 'table', label: '테이블 위에서' },
  { value: 'news', label: '뉴스 & 이벤트' },
]

interface AIGeneratedPost {
  title: string
  slug: string
  excerpt: string
  metaTitle: string
  metaDescription: string
  content: string
}

interface AIWritingAssistantProps {
  onGenerated: (post: AIGeneratedPost) => void
  currentCategory?: string
}

export function AIWritingAssistant({ onGenerated, currentCategory }: AIWritingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    category: currentCategory || 'sea-log',
    topic: '',
    keyMessage: '',
    facts: '',
    length: 'normal' as 'short' | 'normal' | 'long',
    specialInstructions: '',
  })

  // 분량 옵션: 짧게(500자), 보통(900자), 길게(1500자)
  const LENGTH_OPTIONS = {
    short: { label: '짧게 (~500자)', wordCount: 500 },
    normal: { label: '보통 (~900자)', wordCount: 900 },
    long: { label: '길게 (~1500자)', wordCount: 1500 },
  }

  const handleGenerate = async () => {
    if (!formData.topic || !formData.keyMessage) {
      setError('주제와 핵심 메시지는 필수입니다.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          wordCount: LENGTH_OPTIONS[formData.length].wordCount,
        }),
      })

      const data = await response.json()

      if (data.success) {
        onGenerated({
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          content: data.content,
        })
        setIsOpen(false)
        // Reset form
        setFormData({
          category: currentCategory || 'sea-log',
          topic: '',
          keyMessage: '',
          facts: '',
          length: 'normal',
          specialInstructions: '',
        })
      } else {
        setError(data.error || '글 생성에 실패했습니다.')
      }
    } catch (err) {
      console.error(err)
      setError('오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Sparkles className="w-4 h-4" />
        AI 글쓰기
      </Button>
    )
  }

  return (
    <div className="border border-border bg-muted/30 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI 글쓰기 도우미
        </h3>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        뮤즈드마레 브랜드 가이드라인에 맞춰 글을 자동으로 생성합니다.
      </p>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 border border-destructive/20">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground block mb-1.5">카테고리</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-muted-foreground block mb-1.5">분량</label>
          <select
            value={formData.length}
            onChange={(e) => setFormData({ ...formData, length: e.target.value as 'short' | 'normal' | 'long' })}
            className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
          >
            <option value="short">{LENGTH_OPTIONS.short.label}</option>
            <option value="normal">{LENGTH_OPTIONS.normal.label}</option>
            <option value="long">{LENGTH_OPTIONS.long.label}</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm text-muted-foreground block mb-1.5">
          주제 / 제목 <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={formData.topic}
          onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
          placeholder="예: 2026년 2월 숙성 현황 리포트"
          className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
        />
      </div>

      <div>
        <label className="text-sm text-muted-foreground block mb-1.5">
          핵심 메시지 <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={formData.keyMessage}
          onChange={(e) => setFormData({ ...formData, keyMessage: e.target.value })}
          placeholder="예: 한 달간의 변화와 바다의 안정적인 품"
          className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
        />
      </div>

      <div>
        <label className="text-sm text-muted-foreground block mb-1.5">포함할 정보 (선택)</label>
        <textarea
          value={formData.facts}
          onChange={(e) => setFormData({ ...formData, facts: e.target.value })}
          placeholder="날짜, 수치, 인물, 장소 등 팩트 정보&#10;예:&#10;- 기간: 2026.01.15 ~ 2026.02.15&#10;- 수온: 평균 7.8°C&#10;- 수심: 30m"
          rows={4}
          className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
        />
      </div>

      <div>
        <label className="text-sm text-muted-foreground block mb-1.5">특별 지시 (선택)</label>
        <input
          type="text"
          value={formData.specialInstructions}
          onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
          placeholder="예: 인용구 포함, 질문으로 마무리, 더 시적으로"
          className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setIsOpen(false)}
          disabled={isLoading}
        >
          취소
        </Button>
        <Button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading || !formData.topic || !formData.keyMessage}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              글 생성하기
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
