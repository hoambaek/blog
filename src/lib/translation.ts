// 영문 번역 공용 모듈 — 서버 액션(posts.ts)과 스트리밍 라우트(/api/admin/translate)가 공유

export interface TranslationInput {
  title?: string
  excerpt?: string
  content?: string
  metaTitle?: string
  metaDescription?: string
}

export interface TranslatedContent {
  title_en: string | null
  excerpt_en: string | null
  content_en: string | null
  meta_title_en: string | null
  meta_description_en: string | null
}

export const EMPTY_TRANSLATION: TranslatedContent = {
  title_en: null,
  excerpt_en: null,
  content_en: null,
  meta_title_en: null,
  meta_description_en: null,
}

export const TRANSLATION_MODEL = 'claude-opus-4-8'
export const TRANSLATION_MAX_TOKENS = 16384

export function buildTranslationPrompt(input: TranslationInput): string {
  return `You are translating content for Muse de Marée (뮤즈드마레), Korea's only sea-aged champagne brand.

## Translation Guidelines
- Maintain a sophisticated luxury tone with elegant, natural English.
- ALWAYS use the full brand name "Muse de Marée" consistently — never use pronouns like "we", "our", or "they" to refer to the brand.
- Preserve all specific data, numbers, and measurements exactly (e.g., depths, temperatures, aging periods).
- For META_DESC: Include the brand name "Muse de Marée" and key data points. Keep it factual and specific, not abstract.
  Example: "Muse de Marée ages champagne at 20m depth for 12 months at 10-14°C" instead of "A beautiful champagne from the sea."
- For TITLE: If the original title is poetic/abstract, translate faithfully but ensure it contains the core topic keyword.

## Content to Translate
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
}

// 진행률 추정용 — 한국어 원문 대비 영문 응답(JSON 포함)이 대략 1.9배 길이로 관측됨
export function estimateResponseChars(input: TranslationInput): number {
  const inputChars =
    (input.title?.length || 0) +
    (input.excerpt?.length || 0) +
    (input.content?.length || 0) +
    (input.metaTitle?.length || 0) +
    (input.metaDescription?.length || 0)
  return Math.max(500, Math.round(inputChars * 1.9) + 300)
}

// ═══════════════════════════════════════════════════
// 수정 저장 시 부분 번역 — 바뀐 블록만 번역하고 영문본에 짜깁기
// ═══════════════════════════════════════════════════

// Tiptap 본문은 최상위 블록(<p>, <h2>, <img>, <ul>, <blockquote>…)의 나열이다.
// 같은 태그가 최상위에서 중첩되지 않으므로 non-greedy 매칭으로 안전하게 쪼갤 수 있다.
export function splitTopLevelBlocks(html: string): string[] {
  const blocks: string[] = []
  const re = /<(\w+)(?:\s[^>]*)?\/?>/g
  let match: RegExpExecArray | null
  let cursor = 0
  while ((match = re.exec(html)) !== null) {
    if (match.index < cursor) continue // 이전 블록 내부의 태그는 건너뜀
    const tag = match[1].toLowerCase()
    // 자기 종료형(img 등) 블록
    if (/\/>$/.test(match[0]) || ['img', 'br', 'hr'].includes(tag)) {
      blocks.push(match[0])
      cursor = match.index + match[0].length
      continue
    }
    const closeTag = `</${tag}>`
    const closeIndex = html.indexOf(closeTag, match.index)
    if (closeIndex < 0) return [] // 구조를 못 읽으면 실패 처리 → 전체 번역 폴백
    const end = closeIndex + closeTag.length
    blocks.push(html.slice(match.index, end))
    cursor = end
    re.lastIndex = end
  }
  return blocks
}

// 태그 제거 + 공백 정규화 — "텍스트가 실제로 바뀌었나" 비교용
export function stripToText(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

// 텍스트가 없는 블록(이미지·비디오·빈 문단)은 언어 무관 → 번역 없이 새 한글본 것을 그대로 사용
export function isMediaOnlyBlock(block: string): boolean {
  return stripToText(block) === ''
}

export interface ContentDiffPlan {
  // unchanged: 본문 텍스트·미디어 모두 동일 / media-only: 텍스트 동일, 미디어만 변경
  // partial: 일부 텍스트 블록만 변경 / full: 구조가 달라 전체 재번역 필요
  mode: 'unchanged' | 'media-only' | 'partial' | 'full'
  // partial일 때 번역기에 보낼 HTML(변경된 텍스트 블록들)
  htmlToTranslate?: string
  // 번역 결과(변경 블록들의 영문 HTML)를 받아 완성된 영문 본문을 조립. media-only는 인자 없이 호출.
  assemble?: (translatedHtml?: string) => string | null
}

// 기존 한글본·새 한글본·기존 영문본을 비교해 최소 번역 계획을 세운다.
export function planContentTranslation(
  oldKrHtml: string,
  newKrHtml: string,
  oldEnHtml: string | null | undefined,
): ContentDiffPlan {
  if (oldKrHtml === newKrHtml) return { mode: 'unchanged' }
  if (!oldEnHtml) return { mode: 'full' } // 영문본이 없으면 비교 불가 → 전체 번역

  const oldKr = splitTopLevelBlocks(oldKrHtml)
  const newKr = splitTopLevelBlocks(newKrHtml)
  const oldEn = splitTopLevelBlocks(oldEnHtml)
  if (!oldKr.length || !newKr.length || !oldEn.length) return { mode: 'full' }

  // 텍스트 블록끼리 순서 대응 — 미디어 블록은 위치가 달라져도(추가·삭제·교체) 무관
  const oldKrText = oldKr.filter((b) => !isMediaOnlyBlock(b))
  const newKrText = newKr.filter((b) => !isMediaOnlyBlock(b))
  const oldEnText = oldEn.filter((b) => !isMediaOnlyBlock(b))

  // 문단 추가·삭제나 기존 영문본과의 구조 불일치 → 전체 번역
  if (oldKrText.length !== newKrText.length || oldKrText.length !== oldEnText.length) {
    return { mode: 'full' }
  }

  const changedIndices: number[] = []
  for (let i = 0; i < newKrText.length; i++) {
    if (stripToText(newKrText[i]) !== stripToText(oldKrText[i])) changedIndices.push(i)
  }

  // 새 한글본 순서대로 영문본을 조립: 미디어 블록은 그대로, 텍스트 블록은 기존/신규 번역으로
  const assemble = (translatedHtml?: string): string | null => {
    let translatedBlocks: string[] = []
    if (changedIndices.length > 0) {
      if (!translatedHtml) return null
      translatedBlocks = splitTopLevelBlocks(translatedHtml)
      if (translatedBlocks.length !== changedIndices.length) return null // 블록 수 불일치 → 폴백
    }
    let textIndex = 0
    let translatedIndex = 0
    const result: string[] = []
    for (const block of newKr) {
      if (isMediaOnlyBlock(block)) {
        result.push(block) // 이미지·비디오는 언어 무관 — 새 한글본 것을 그대로
      } else {
        if (changedIndices.includes(textIndex)) {
          result.push(translatedBlocks[translatedIndex])
          translatedIndex++
        } else {
          result.push(oldEnText[textIndex])
        }
        textIndex++
      }
    }
    return result.join('')
  }

  if (changedIndices.length === 0) return { mode: 'media-only', assemble }
  return {
    mode: 'partial',
    htmlToTranslate: changedIndices.map((i) => newKrText[i]).join(''),
    assemble,
  }
}

// 응답 텍스트에서 번역 JSON을 추출. 실패 시 null.
export function parseTranslationResponse(text: string): TranslatedContent | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try {
    const parsed = JSON.parse(jsonMatch[0])
    return {
      title_en: parsed.title_en || null,
      excerpt_en: parsed.excerpt_en || null,
      content_en: parsed.content_en || null,
      meta_title_en: parsed.meta_title_en || null,
      meta_description_en: parsed.meta_description_en || null,
    }
  } catch {
    return null
  }
}
