import type { TranslatedContent, TranslationInput } from '@/lib/translation'

/*
 * 브라우저 → /api/admin/translate (ndjson 스트림). 진행률을 onProgress(0~100)로 알리고 번역 결과를 돌려준다.
 * 실패하면 null — 부르는 쪽이 폴백을 정한다(편집 저장은 서버 액션 안에서 다시 번역).
 */
type TranslateEvent =
  | { type: 'progress'; pct: number }
  | { type: 'result'; translation: TranslatedContent }
  | { type: 'error'; message: string }

export async function streamTranslation(
  input: TranslationInput,
  onProgress?: (pct: number) => void,
): Promise<TranslatedContent | null> {
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
      let newline = buffer.indexOf('\n')
      while (newline >= 0) {
        const line = buffer.slice(0, newline).trim()
        buffer = buffer.slice(newline + 1)
        newline = buffer.indexOf('\n')
        if (!line) continue
        try {
          const event = JSON.parse(line) as TranslateEvent
          if (event.type === 'progress') onProgress?.(event.pct)
          else if (event.type === 'result') translation = event.translation
          else if (event.type === 'error') {
            console.error('Streaming translation failed:', event.message)
            return null
          }
        } catch {
          // 손상된 줄은 무시
        }
      }
    }
    return translation
  } catch (error) {
    console.error('Streaming translation request failed:', error)
    return null
  }
}
