/*
 * 원고 인라인 문법 → 저장 HTML 인라인 (docs/content/article-format.md 2절)
 *   **강조** → <strong>, *기울임* → <em>, [글](주소) → <a href>, \* 처럼 역슬래시로 기호 그대로
 *
 * 출력 모양은 에디터(ProseMirror) 직렬화와 글자 단위로 같게 맞춘다 — 그래야 관리자에서 한 번 열고 저장해도 HTML이 바뀌지 않는다.
 *   - 표시 순서: 링크 > 강조 > 기울임 (스키마 순위). **[글](주소)** 도 <a><strong>…</strong></a>로 나간다.
 *   - 겹친 표시는 조각마다 다시 연다: *가 **나** 다* → <em>가 </em><strong><em>나</em></strong><em> 다</em>
 *   - 글자 이스케이프: & < > 와 줄바꿈 없는 공백(&nbsp;). 속성: & "
 */

type Mark = { type: 'link'; href: string } | { type: 'strong' } | { type: 'em' }

interface Segment {
  text: string
  marks: Mark[]
}

const MARK_RANK: Record<Mark['type'], number> = { link: 0, strong: 1, em: 2 }

/** 링크로 허용하는 주소 — 공개 렌더러(parse.ts safeHref)와 같은 규칙 */
export function isSafeHref(href: string): boolean {
  return /^(https?:|mailto:|tel:)/i.test(href) || href.startsWith('/') || href.startsWith('#')
}

export function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ /g, '&nbsp;')
}

export function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/ /g, '&nbsp;')
}

const ESCAPABLE = new Set(['\\', '*', '_', '[', ']', '(', ')', '#', '>', '-', '!', ':', '`'])

/** 역슬래시를 건너뛰며 from 이후 첫 needle 위치 */
function findUnescaped(src: string, needle: string, from: number): number {
  for (let i = from; i < src.length; i++) {
    if (src[i] === '\\') {
      i++
      continue
    }
    if (src.startsWith(needle, i)) return i
  }
  return -1
}

function segmentsOf(src: string, marks: Mark[], onError: (message: string) => void): Segment[] {
  const out: Segment[] = []
  let text = ''
  const flush = () => {
    if (text) out.push({ text, marks })
    text = ''
  }
  let i = 0
  while (i < src.length) {
    const ch = src[i]
    if (ch === '\\' && i + 1 < src.length && ESCAPABLE.has(src[i + 1])) {
      text += src[i + 1]
      i += 2
      continue
    }
    if (src.startsWith('**', i)) {
      const end = findUnescaped(src, '**', i + 2)
      if (end > i + 2) {
        flush()
        out.push(...segmentsOf(src.slice(i + 2, end), [...marks, { type: 'strong' }], onError))
        i = end + 2
        continue
      }
    }
    if (ch === '*' && src[i + 1] !== '*' && src[i + 1] !== ' ' && src[i + 1] !== undefined) {
      let end = findUnescaped(src, '*', i + 1)
      // 안쪽 **…** 를 건너뛴 뒤의 단독 * 를 닫는 표시로 본다
      while (end !== -1 && src[end + 1] === '*') {
        const close = findUnescaped(src, '**', end + 2)
        if (close === -1) break
        end = findUnescaped(src, '*', close + 2)
      }
      if (end > i + 1 && src[end - 1] !== ' ') {
        flush()
        out.push(...segmentsOf(src.slice(i + 1, end), [...marks, { type: 'em' }], onError))
        i = end + 1
        continue
      }
    }
    if (ch === '[') {
      const close = findUnescaped(src, ']', i + 1)
      if (close !== -1 && src[close + 1] === '(') {
        const paren = findUnescaped(src, ')', close + 2)
        if (paren !== -1) {
          const href = src.slice(close + 2, paren).trim()
          const label = src.slice(i + 1, close)
          if (!isSafeHref(href)) onError(`링크 주소는 http(s)·mailto·tel·/·# 로 시작해야 합니다: ${href || '(빈 주소)'}`)
          if (!label.trim()) onError('링크 글자가 비어 있습니다.')
          flush()
          out.push(...segmentsOf(label, [...marks.filter((m) => m.type !== 'link'), { type: 'link', href }], onError))
          i = paren + 1
          continue
        }
      }
    }
    text += ch
    i++
  }
  flush()
  return out
}

function sameMark(a: Mark, b: Mark): boolean {
  return a.type === b.type && (a.type !== 'link' || a.href === (b as { href: string }).href)
}

function openTag(mark: Mark): string {
  return mark.type === 'link' ? `<a href="${escapeAttr(mark.href)}">` : `<${mark.type}>`
}

function closeTag(mark: Mark): string {
  return mark.type === 'link' ? '</a>' : `</${mark.type}>`
}

export interface InlineResult {
  html: string
  /** 표시를 뺀 글자 — alt·자리 캡션(글자만 받는 칸)에 쓴다 */
  text: string
}

/** 인라인 문법을 HTML로. onError에 문법 오류를 알린다(줄 번호는 호출부가 붙인다) */
export function renderInline(src: string, onError: (message: string) => void = () => {}): InlineResult {
  const segments = segmentsOf(src, [], onError).map((s) => ({
    text: s.text,
    marks: [...s.marks].sort((a, b) => MARK_RANK[a.type] - MARK_RANK[b.type]),
  }))

  // 같은 표시가 이어지는 조각은 하나로 (ProseMirror 텍스트 노드 병합과 같다)
  const merged: Segment[] = []
  for (const seg of segments) {
    const last = merged[merged.length - 1]
    if (last && last.marks.length === seg.marks.length && last.marks.every((m, k) => sameMark(m, seg.marks[k]))) {
      last.text += seg.text
    } else merged.push({ ...seg })
  }

  let html = ''
  let active: Mark[] = []
  for (const seg of merged) {
    let keep = 0
    while (keep < active.length && keep < seg.marks.length && sameMark(active[keep], seg.marks[keep])) keep++
    for (let k = active.length - 1; k >= keep; k--) html += closeTag(active[k])
    for (let k = keep; k < seg.marks.length; k++) html += openTag(seg.marks[k])
    active = seg.marks
    html += escapeText(seg.text)
  }
  for (let k = active.length - 1; k >= 0; k--) html += closeTag(active[k])

  return { html, text: merged.map((s) => s.text).join('') }
}
