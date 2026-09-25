import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import {
  buildTranslationPrompt,
  parseTranslationResponse,
  EMPTY_TRANSLATION,
  TRANSLATION_MODEL,
  TRANSLATION_MAX_TOKENS,
  type TranslatedContent,
} from '@/lib/translation'

/*
 * 글 영문 번역(한 번에 전체) — 관리자 저장(서버 액션 posts.ts)과 Claude 초안 업로드(/api/drafts)가 같이 쓴다.
 * posts.ts는 'use server' 파일이라 거기서 export하면 밖에서 부를 수 있는 서버 액션이 돼 버린다 — 그래서 여기로 뺐다.
 */

export interface TranslationResult {
  content: TranslatedContent
  // true when there was Korean content to translate and translation was attempted
  attempted: boolean
  // true when translation produced usable output; false means English was NOT updated
  ok: boolean
  // human-readable reason (Korean) shown to the admin when ok === false
  error?: string
}

export async function translatePost(input: {
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
