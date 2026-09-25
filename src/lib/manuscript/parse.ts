import { cleanArticleHtml } from '../editor/serialize'
import { escapeAttr, escapeText, renderInline } from './inline'

/*
 * Claude 원고(.md) → 저장 HTML — docs/content/article-format.md 2절(원고 문법) → 1절(저장 형식).
 * 순수 함수라 CLI(--dry-run)·서버 라우트(/api/drafts)·테스트가 같이 쓴다.
 *
 * 출력은 에디터 직렬화와 같은 모양으로 만든 뒤 cleanArticleHtml로 한 번 정규화한다.
 * (관리자 에디터에서 열고 저장해도 HTML이 바뀌지 않는지는 scripts/manuscript-test.ts가 확인한다.)
 *
 * 오류는 모두 모아서 줄 번호와 함께 돌려준다 — 첫 오류에서 멈추지 않는다.
 */

export interface ManuscriptMeta {
  title: string
  slug: string
  excerpt: string | null
  series: string | null
  cover: string | null
  next: string | null
  metaTitle: string | null
  metaDescription: string | null
}

/** 원고에 적힌 이미지 주소 — http(s)면 그대로 쓰고, 아니면 로컬 파일(업로드 대상) */
export type ImageRef = { kind: 'remote'; url: string } | { kind: 'local'; path: string }

export type ManuscriptBlock = { line: number } & (
  | { type: 'lead'; html: string }
  | { type: 'paragraph'; html: string }
  | { type: 'heading'; html: string }
  | { type: 'figure'; src: ImageRef; alt: string; captionHtml: string; credit: string }
  | { type: 'slot'; hint: string; ratio: string; caption: string; credit: string }
  | { type: 'quote'; paragraphs: string[]; citeHtml: string }
  | { type: 'terms'; items: { term: string; desc: string }[] }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'rule' }
)

export interface ManuscriptIssue {
  line: number
  message: string
}

export interface LocalImage {
  /** 원고에 적힌 경로 그대로 (CLI가 이 값을 키로 파일을 보낸다) */
  path: string
  usage: 'cover' | 'figure'
  line: number
}

export interface ParsedManuscript {
  meta: ManuscriptMeta | null
  blocks: ManuscriptBlock[]
  /** 로컬 이미지는 적힌 경로를 그대로 src로 둔 HTML (업로드 전 확인용) */
  html: string
  images: LocalImage[]
  /** 비어 있는 이미지 자리 수 */
  slots: number
  errors: ManuscriptIssue[]
  warnings: ManuscriptIssue[]
}

const META_KEYS = ['title', 'slug', 'excerpt', 'series', 'cover', 'next', 'meta_title', 'meta_description'] as const
type MetaKey = (typeof META_KEYS)[number]

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const RATIO_PATTERN = /^\d{1,2}:\d{1,2}$/
const DEFAULT_RATIO = '4:5'

export function imageRef(value: string): ImageRef {
  return /^https?:\/\//i.test(value) ? { kind: 'remote', url: value } : { kind: 'local', path: value }
}

/** 한 줄 안의 연속 공백을 하나로 — 에디터도 같은 식으로 접는다 */
function squash(value: string): string {
  return value.replace(/[ \t]+/g, ' ').trim()
}

// ── 프론트매터 ──

function readValue(raw: string): { value: string; error?: string } {
  const text = raw.trim()
  if (text.startsWith('"') || text.startsWith("'")) {
    const quote = text[0]
    const end = text.indexOf(quote, 1)
    if (end === -1) return { value: '', error: '따옴표가 닫히지 않았습니다.' }
    const rest = text.slice(end + 1).trim()
    if (rest && !rest.startsWith('#')) return { value: '', error: '따옴표 뒤에 글자가 더 있습니다.' }
    return { value: text.slice(1, end) }
  }
  // 따옴표 없는 값: 공백 뒤 # 부터는 주석
  return { value: text.replace(/\s+#.*$/, '').trim() }
}

function parseFrontmatter(lines: string[], errors: ManuscriptIssue[], warnings: ManuscriptIssue[]) {
  if (lines[0]?.trim() !== '---') {
    errors.push({ line: 1, message: '파일 첫 줄은 프론트매터 시작 "---" 이어야 합니다.' })
    return { meta: null, bodyStart: 0, coverLine: 1 }
  }
  const end = lines.findIndex((line, i) => i > 0 && line.trim() === '---')
  if (end === -1) {
    errors.push({ line: 1, message: '프론트매터가 "---" 로 닫히지 않았습니다.' })
    return { meta: null, bodyStart: lines.length, coverLine: 1 }
  }

  const values: Partial<Record<MetaKey, { value: string; line: number }>> = {}
  for (let i = 1; i < end; i++) {
    const line = lines[i]
    const lineNo = i + 1
    if (!line.trim() || line.trim().startsWith('#')) continue
    const m = line.match(/^([A-Za-z_]+)\s*:(.*)$/)
    if (!m) {
      errors.push({ line: lineNo, message: `"키: 값" 모양이 아닙니다: ${line.trim()}` })
      continue
    }
    const key = m[1] as MetaKey
    if (!META_KEYS.includes(key)) {
      errors.push({ line: lineNo, message: `알 수 없는 항목 "${m[1]}" — 쓸 수 있는 항목: ${META_KEYS.join(', ')}` })
      continue
    }
    if (values[key]) {
      errors.push({ line: lineNo, message: `"${key}" 가 두 번 적혀 있습니다.` })
      continue
    }
    const { value, error } = readValue(m[2])
    if (error) errors.push({ line: lineNo, message: `${key}: ${error}` })
    values[key] = { value, line: lineNo }
  }

  const get = (key: MetaKey) => values[key]?.value || null
  const lineOf = (key: MetaKey) => values[key]?.line ?? 1

  const title = get('title')
  const slug = get('slug')
  if (!title) errors.push({ line: 1, message: 'title 이 없습니다.' })
  if (!slug) errors.push({ line: 1, message: 'slug 가 없습니다.' })
  else if (!SLUG_PATTERN.test(slug))
    errors.push({ line: lineOf('slug'), message: `slug 는 영문 소문자·숫자·하이픈만 씁니다: ${slug}` })
  for (const key of ['series', 'next'] as const) {
    const value = get(key)
    if (value && !SLUG_PATTERN.test(value))
      errors.push({ line: lineOf(key), message: `${key} 는 slug 모양이어야 합니다: ${value}` })
  }
  if (slug && get('next') === slug) errors.push({ line: lineOf('next'), message: 'next 가 이 글 자신을 가리킵니다.' })
  if (!get('excerpt')) warnings.push({ line: 1, message: 'excerpt(발췌문)가 없습니다.' })
  if (!get('series')) warnings.push({ line: 1, message: 'series(연재)가 없습니다 — 연재 없이 저장됩니다.' })

  const meta: ManuscriptMeta | null =
    title && slug
      ? {
          title,
          slug,
          excerpt: get('excerpt'),
          series: get('series'),
          cover: get('cover'),
          next: get('next'),
          metaTitle: get('meta_title'),
          metaDescription: get('meta_description'),
        }
      : null
  return { meta, bodyStart: end + 1, coverLine: lineOf('cover') }
}

// ── 본문 ──

const LIST_ITEM = /^([-*]|\d+\.)\s+(.*)$/
const NESTED_LIST_ITEM = /^\s+([-*]|\d+\.)\s+/

function isBlockStart(line: string): boolean {
  return (
    /^#{1,6}(\s|$)/.test(line) ||
    line.startsWith(':::') ||
    line.startsWith('>') ||
    LIST_ITEM.test(line) ||
    line.trim() === '---' ||
    line.startsWith('![') ||
    line.startsWith('```') ||
    /^\s*\|.*\|\s*$/.test(line)
  )
}

function parseFigureAttrs(rest: string): { attrs: Record<string, string>; leftover: string } {
  const attrs: Record<string, string> = {}
  const leftover = rest
    .replace(/([a-z]+)="([^"]*)"/g, (_, key: string, value: string) => {
      attrs[key] = value
      return ''
    })
    .trim()
  return { attrs, leftover }
}

export function parseManuscript(source: string): ParsedManuscript {
  const errors: ManuscriptIssue[] = []
  const warnings: ManuscriptIssue[] = []
  const lines = source.replace(/^﻿/, '').replace(/\r\n?/g, '\n').split('\n')

  const front = parseFrontmatter(lines, errors, warnings)
  const blocks: ManuscriptBlock[] = []
  const images: LocalImage[] = []

  if (front.meta?.cover) {
    const ref = imageRef(front.meta.cover)
    if (ref.kind === 'local') images.push({ path: ref.path, usage: 'cover', line: front.coverLine })
  }

  const inline = (text: string, lineNo: number) =>
    renderInline(squash(text), (message) => errors.push({ line: lineNo, message }))

  let i = front.bodyStart
  const lineNo = () => i + 1

  /** ::: 블록의 안쪽 줄들을 닫는 ::: 까지 읽는다. 닫히지 않으면 null */
  const readFenced = (name: string): { line: string; no: number }[] | null => {
    const startNo = lineNo()
    const body: { line: string; no: number }[] = []
    i++
    while (i < lines.length) {
      const line = lines[i]
      if (line.trim() === ':::') {
        i++
        return body
      }
      if (line.trim().startsWith(':::')) break // 다른 블록이 시작됐다 = 닫는 줄이 빠졌다
      body.push({ line, no: i + 1 })
      i++
    }
    errors.push({ line: startNo, message: `:::${name} 블록이 ":::" 로 닫히지 않았습니다.` })
    return null
  }

  while (i < lines.length) {
    const raw = lines[i]
    const line = raw.trimEnd()
    const start = lineNo()

    if (!line.trim()) {
      i++
      continue
    }

    // ::: 블록
    const fence = line.match(/^:::\s*([a-z]+)?(.*)$/)
    if (fence) {
      const name = fence[1] ?? ''
      if (name === 'lead') {
        if (fence[2].trim()) errors.push({ line: start, message: ':::lead 줄에는 다른 글자를 쓰지 않습니다.' })
        const body = readFenced('lead')
        if (!body) continue
        const text = body.map((b) => b.line.trim()).filter(Boolean)
        if (body.some((b) => !b.line.trim()) && text.length > 1)
          errors.push({ line: start, message: '리드는 한 단락입니다 — 빈 줄로 나누지 않습니다.' })
        if (!text.length) {
          errors.push({ line: start, message: '리드 문단이 비어 있습니다.' })
          continue
        }
        if (blocks.some((b) => b.type === 'lead')) errors.push({ line: start, message: '리드 문단은 글당 1개입니다.' })
        else if (blocks.length) errors.push({ line: start, message: '리드 문단은 본문 첫 블록이어야 합니다.' })
        blocks.push({ type: 'lead', html: inline(text.join(' '), start).html, line: start })
        continue
      }

      if (name === 'figure') {
        const { attrs, leftover } = parseFigureAttrs(fence[2])
        if (leftover) errors.push({ line: start, message: `:::figure 속성을 읽지 못했습니다: ${leftover} (예: src="./a.jpg" ratio="4:5")` })
        for (const key of Object.keys(attrs))
          if (!['src', 'ratio', 'alt'].includes(key))
            errors.push({ line: start, message: `:::figure 에 알 수 없는 속성 "${key}" — src·ratio·alt 만 씁니다.` })
        const body = readFenced('figure')
        if (!body) continue
        const fields: Record<string, { value: string; no: number }> = {}
        for (const { line: bodyLine, no } of body) {
          if (!bodyLine.trim()) continue
          const m = bodyLine.trim().match(/^([a-z]+)\s*:\s*(.*)$/)
          if (!m || !['caption', 'credit', 'hint'].includes(m[1])) {
            errors.push({ line: no, message: `:::figure 안에는 caption:·credit:·hint: 줄만 씁니다: ${bodyLine.trim()}` })
            continue
          }
          if (fields[m[1]]) errors.push({ line: no, message: `${m[1]}: 가 두 번 적혀 있습니다.` })
          fields[m[1]] = { value: m[2].trim(), no }
        }
        const caption = fields.caption ? inline(fields.caption.value, fields.caption.no) : { html: '', text: '' }
        const credit = fields.credit ? inline(fields.credit.value, fields.credit.no).text : ''
        const src = attrs.src?.trim()

        if (src) {
          if (fields.hint) warnings.push({ line: fields.hint.no, message: '사진이 있는 그림이라 hint 는 무시합니다.' })
          // ratio는 이미지 자리용 — 사진이 있으면 사진 비율 그대로라 조용히 무시한다
          const ref = imageRef(src)
          if (ref.kind === 'local') images.push({ path: ref.path, usage: 'figure', line: start })
          blocks.push({
            type: 'figure',
            src: ref,
            alt: attrs.alt?.trim() || caption.text,
            captionHtml: caption.html,
            credit,
            line: start,
          })
        } else {
          const hint = fields.hint?.value.trim() ?? ''
          if (!hint) errors.push({ line: start, message: 'src 없는 :::figure(이미지 자리)는 hint: 가 필수입니다 — 어떤 사진이 들어갈지 적습니다.' })
          const ratio = attrs.ratio?.trim() || DEFAULT_RATIO
          if (!RATIO_PATTERN.test(ratio)) errors.push({ line: start, message: `ratio 는 "4:5" 모양이어야 합니다: ${ratio}` })
          if (attrs.alt) warnings.push({ line: start, message: '이미지 자리에는 alt 를 쓰지 않습니다 — 무시합니다.' })
          blocks.push({ type: 'slot', hint, ratio, caption: caption.text, credit, line: start })
        }
        continue
      }

      if (name === 'terms') {
        if (fence[2].trim()) errors.push({ line: start, message: ':::terms 줄에는 다른 글자를 쓰지 않습니다.' })
        const body = readFenced('terms')
        if (!body) continue
        const items: { term: string; desc: string }[] = []
        for (const { line: bodyLine, no } of body) {
          if (!bodyLine.trim()) continue
          const at = bodyLine.indexOf('::')
          const term = at === -1 ? '' : bodyLine.slice(0, at).trim()
          const desc = at === -1 ? '' : bodyLine.slice(at + 2).trim()
          if (!term || !desc) {
            errors.push({ line: no, message: `용어 줄은 "용어 :: 설명" 모양이어야 합니다: ${bodyLine.trim()}` })
            continue
          }
          items.push({ term: inline(term, no).html, desc: inline(desc, no).html })
        }
        if (!items.length) {
          if (!errors.some((e) => e.line > start && e.line <= start + body.length))
            errors.push({ line: start, message: ':::terms 가 비어 있습니다.' })
          continue
        }
        blocks.push({ type: 'terms', items, line: start })
        continue
      }

      if (!name) {
        errors.push({ line: start, message: '여는 줄 없이 ":::" 만 있습니다.' })
        i++
        continue
      }
      errors.push({ line: start, message: `알 수 없는 블록 ":::${name}" — :::lead · :::figure · :::terms 만 씁니다.` })
      readFenced(name) // 안쪽 줄은 건너뛴다
      continue
    }

    // 소제목
    const heading = line.match(/^(#{1,6})(?:\s+(.*))?$/)
    if (heading) {
      if (heading[1].length !== 2) {
        errors.push({
          line: start,
          message: heading[1].length === 1 ? '# 제목은 쓰지 않습니다 — 제목은 프론트매터 title 입니다.' : '소제목은 "## " 한 단계만 씁니다.',
        })
      } else if (!heading[2]?.trim()) errors.push({ line: start, message: '소제목이 비어 있습니다.' })
      else blocks.push({ type: 'heading', html: inline(heading[2], start).html, line: start })
      i++
      continue
    }

    // 구분선
    if (line.trim() === '---') {
      blocks.push({ type: 'rule', line: start })
      i++
      continue
    }

    // 지원하지 않는 마크다운
    if (line.startsWith('![')) {
      errors.push({ line: start, message: '이미지는 ![]() 대신 :::figure 블록으로 넣습니다.' })
      i++
      continue
    }
    if (line.startsWith('```')) {
      errors.push({ line: start, message: '코드 블록(```)은 쓰지 않습니다.' })
      i++
      while (i < lines.length && !lines[i].startsWith('```')) i++
      i++
      continue
    }
    if (/^\s*\|.*\|\s*$/.test(line)) {
      errors.push({ line: start, message: '표는 쓰지 않습니다 — 나열은 :::terms 나 목록으로 씁니다.' })
      i++
      continue
    }

    // 인용
    if (line.startsWith('>')) {
      const quoteLines: { text: string; no: number }[] = []
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push({ text: lines[i].replace(/^>\s?/, '').trim(), no: i + 1 })
        i++
      }
      let cite = ''
      let citeNo = start
      const lastFilled = [...quoteLines].reverse().find((q) => q.text)
      if (lastFilled && /^—\s*/.test(lastFilled.text)) {
        cite = lastFilled.text.replace(/^—\s*/, '')
        citeNo = lastFilled.no
        quoteLines.splice(quoteLines.indexOf(lastFilled), 1)
        if (!cite) errors.push({ line: citeNo, message: '출처 줄("— ")이 비어 있습니다.' })
      }
      const paragraphs: string[] = []
      let current: string[] = []
      let currentNo = start
      const flush = () => {
        if (current.length) paragraphs.push(inline(current.join(' '), currentNo).html)
        current = []
      }
      for (const q of quoteLines) {
        if (!q.text) flush()
        else {
          if (!current.length) currentNo = q.no
          current.push(q.text)
        }
      }
      flush()
      if (!paragraphs.length) {
        errors.push({ line: start, message: '인용 본문이 비어 있습니다.' })
        continue
      }
      blocks.push({ type: 'quote', paragraphs, citeHtml: cite ? inline(cite, citeNo).html : '', line: start })
      continue
    }

    // 목록
    const item = line.match(LIST_ITEM)
    if (item) {
      const ordered = /\d/.test(item[1])
      const items: string[] = []
      while (i < lines.length) {
        const current = lines[i].match(LIST_ITEM)
        if (!current) {
          // 빈 줄 뒤에 같은 종류 항목이 이어지면 같은 목록
          if (!lines[i].trim()) {
            let k = i
            while (k < lines.length && !lines[k].trim()) k++
            const after = lines[k]?.match(LIST_ITEM)
            if (after && /\d/.test(after[1]) === ordered) {
              i = k
              continue
            }
          }
          break
        }
        if (/\d/.test(current[1]) !== ordered) break
        const itemNo = i + 1
        const text = [current[2]]
        i++
        while (i < lines.length && /^\s{2,}\S/.test(lines[i])) {
          if (NESTED_LIST_ITEM.test(lines[i])) errors.push({ line: i + 1, message: '중첩 목록은 쓰지 않습니다.' })
          text.push(lines[i].trim())
          i++
        }
        if (!text.join('').trim()) errors.push({ line: itemNo, message: '빈 목록 항목입니다.' })
        else items.push(inline(text.join(' '), itemNo).html)
      }
      if (items.length) blocks.push({ type: 'list', ordered, items, line: start })
      continue
    }

    // 문단 — 빈 줄이나 다른 블록이 나올 때까지 이어지는 줄
    const text: string[] = []
    while (i < lines.length && lines[i].trim() && (text.length === 0 || !isBlockStart(lines[i]))) {
      text.push(lines[i].trim())
      i++
    }
    blocks.push({ type: 'paragraph', html: inline(text.join(' '), start).html, line: start })
  }

  if (front.meta && !blocks.some((b) => b.type === 'lead'))
    warnings.push({ line: front.bodyStart + 1, message: '리드 문단(:::lead)이 없습니다.' })
  if (front.meta && !blocks.length && !errors.length)
    errors.push({ line: front.bodyStart + 1, message: '본문이 비어 있습니다.' })

  const html = renderManuscriptHtml(blocks, (ref) => (ref.kind === 'remote' ? ref.url : ref.path))
  return {
    meta: front.meta,
    blocks,
    html,
    images,
    slots: blocks.filter((b) => b.type === 'slot').length,
    errors: errors.sort((a, b) => a.line - b.line),
    warnings: warnings.sort((a, b) => a.line - b.line),
  }
}

// ── 렌더: 블록 → 저장 HTML (article-format.md 1절) ──

function blockHtml(block: ManuscriptBlock, resolve: (ref: ImageRef) => string): string {
  switch (block.type) {
    case 'lead':
      return `<p class="lead">${block.html}</p>`
    case 'paragraph':
      return `<p>${block.html}</p>`
    case 'heading':
      return `<h3>${block.html}</h3>`
    case 'figure':
      return (
        `<figure data-block="figure"><img src="${escapeAttr(resolve(block.src))}" alt="${escapeAttr(block.alt)}">` +
        `<figcaption><span data-caption>${block.captionHtml}</span><span data-credit>${escapeText(block.credit)}</span></figcaption></figure>`
      )
    case 'slot': {
      let attrs = ` data-block="figure" data-slot data-hint="${escapeAttr(block.hint)}" data-ratio="${escapeAttr(block.ratio)}"`
      if (block.credit) attrs += ` data-credit="${escapeAttr(block.credit)}"`
      return block.caption ? `<figure${attrs}><figcaption>${escapeText(block.caption)}</figcaption></figure>` : `<figure${attrs}></figure>`
    }
    case 'quote':
      return `<blockquote>${block.paragraphs.map((p) => `<p>${p}</p>`).join('')}<cite>${block.citeHtml}</cite></blockquote>`
    case 'terms':
      return `<dl data-block="terms">${block.items.map((it) => `<div><dt>${it.term}</dt><dd>${it.desc}</dd></div>`).join('')}</dl>`
    case 'list': {
      const tag = block.ordered ? 'ol' : 'ul'
      return `<${tag}>${block.items.map((it) => `<li><p>${it}</p></li>`).join('')}</${tag}>`
    }
    case 'rule':
      return '<hr>'
  }
}

/** 블록 → 저장 HTML. resolve로 이미지 주소를 바꿔 끼운다(업로드 뒤 R2 주소) */
export function renderManuscriptHtml(blocks: ManuscriptBlock[], resolve: (ref: ImageRef) => string): string {
  return cleanArticleHtml(blocks.map((b) => blockHtml(b, resolve)).join(''))
}

/** CLI --dry-run용 블록 요약 한 줄 */
export function describeBlock(block: ManuscriptBlock): string {
  const plain = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  const cut = (text: string, n = 40) => (text.length > n ? `${text.slice(0, n)}…` : text)
  switch (block.type) {
    case 'lead':
      return `리드     ${cut(plain(block.html))}`
    case 'paragraph':
      return `문단     ${cut(plain(block.html))}`
    case 'heading':
      return `소제목   ${cut(plain(block.html))}`
    case 'figure':
      return `그림     ${block.src.kind === 'local' ? block.src.path : block.src.url}${block.credit ? ` · ${block.credit}` : ''}`
    case 'slot':
      return `이미지자리 ${block.ratio} · ${cut(block.hint)}`
    case 'quote':
      return `인용     ${cut(plain(block.paragraphs[0]))}${block.citeHtml ? ` — ${plain(block.citeHtml)}` : ' (출처 없음)'}`
    case 'terms':
      return `용어목록 ${block.items.length}개`
    case 'list':
      return `${block.ordered ? '번호목록' : '목록'}   ${block.items.length}개`
    case 'rule':
      return '구분선'
  }
}
