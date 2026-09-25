import { parseDocument, DomUtils } from 'htmlparser2'
import { isTag, isText, type ChildNode, type Element } from 'domhandler'
import type { ArticleBlock, InlineNode, InlineTag } from './types'

/*
 * 글 본문 HTML → 블록 배열 (docs/content/article-format.md 1절).
 * DOM이 필요 없는 순수 함수라 서버·브라우저 어디서나 돈다(관리자 미리보기에서 그대로 재사용).
 *
 * 기존 글 호환:
 * - 빈 <p></p>·<p><br></p>·&nbsp;만 있는 문단은 버린다(예전엔 간격용으로 썼다).
 * - 최상위 <img>나 <p> 안의 <img>는 캡션 없는 그림으로 바꾼다.
 * - 첫 문단은 class="lead"가 있을 때만 리드가 된다.
 * - 본문 끝에 박혀 있던 브랜드 서명 문단(<p><em>Muse de Marée</em></p>)은 떼어 낸다 — 글 끝 사인오프 심볼이 대신한다.
 */

const INLINE_TAGS: Record<string, InlineTag | undefined> = {
  a: 'a',
  strong: 'strong',
  b: 'strong',
  em: 'em',
  i: 'em',
  u: 'u',
  s: 's',
  del: 's',
  code: 'code',
  sup: 'sup',
  sub: 'sub',
  mark: 'mark',
}

/** 본문 링크로 허용하는 주소 — http(s)·mailto·tel·사이트 안 경로·앵커만 */
function safeHref(href: string | undefined): string | undefined {
  if (!href) return undefined
  const value = href.trim()
  if (/^(https?:|mailto:|tel:)/i.test(value) || value.startsWith('/') || value.startsWith('#')) return value
  return undefined
}

const TRAILING_EMPTY = /(?:\s*<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>)+\s*$/i
const TRAILING_SIGNATURE =
  /\s*<p>\s*(?:<(?:em|strong|b|i)>\s*)?(?:뮤즈드마레|Muse de Marée)\s*[.·]?\s*(?:<\/(?:em|strong|b|i)>\s*)?<\/p>\s*$/i

function toInline(nodes: ChildNode[]): InlineNode[] {
  const out: InlineNode[] = []
  for (const node of nodes) {
    if (isText(node)) {
      if (node.data) out.push({ t: 'text', v: node.data })
      continue
    }
    if (!isTag(node)) continue
    const name = node.name.toLowerCase()
    if (name === 'br') {
      out.push({ t: 'br' })
      continue
    }
    // 인라인 자리에 끼어든 이미지·영상은 문단 분리 단계에서 처리한다
    if (name === 'img' || name === 'video') continue
    const tag = INLINE_TAGS[name]
    const children = toInline(node.children)
    if (!tag) {
      out.push(...children) // span 등 규격 밖 인라인은 벗기고 내용만
      continue
    }
    if (tag === 'a') {
      const href = safeHref(node.attribs.href)
      if (!href) {
        out.push(...children)
        continue
      }
      out.push({ t: 'el', tag, href, children })
      continue
    }
    out.push({ t: 'el', tag, children })
  }
  return out
}

function inlineIsEmpty(nodes: InlineNode[]): boolean {
  return nodes.every((node) => {
    if (node.t === 'br') return true
    if (node.t === 'text') return node.v.replace(/ /g, ' ').trim() === ''
    return inlineIsEmpty(node.children)
  })
}

/** 문단 앞뒤의 줄바꿈(<br>)과 공백 텍스트를 다듬는다 */
function trimInline(nodes: InlineNode[]): InlineNode[] {
  const list = [...nodes]
  const blank = (n: InlineNode) => n.t === 'br' || (n.t === 'text' && n.v.replace(/ /g, ' ').trim() === '')
  while (list.length && blank(list[0])) list.shift()
  while (list.length && blank(list[list.length - 1])) list.pop()
  return list
}

function textOf(node: ChildNode): string {
  return DomUtils.textContent(node).replace(/\s+/g, ' ').trim()
}

function findFirst(nodes: ChildNode[], test: (el: Element) => boolean): Element | null {
  return DomUtils.findOne(test, nodes, true)
}

function imageFigure(img: Element): ArticleBlock | null {
  const src = img.attribs.src?.trim()
  if (!src) return null
  return { type: 'figure', src, alt: img.attribs.alt ?? '', caption: null, credit: null }
}

function videoBlock(video: Element): ArticleBlock | null {
  const source = video.attribs.src || findFirst(video.children, (el) => el.name === 'source')?.attribs.src
  if (!source) return null
  return { type: 'video', src: source, poster: video.attribs.poster || null }
}

/** 문단 하나 — 안에 섞인 이미지·영상은 떼어 내 앞뒤 문단과 별도 블록으로 만든다 */
function paragraphBlocks(p: Element, kind: 'lead' | 'paragraph'): ArticleBlock[] {
  const blocks: ArticleBlock[] = []
  let pending: ChildNode[] = []
  const flush = () => {
    const content = trimInline(toInline(pending))
    if (!inlineIsEmpty(content)) blocks.push({ type: kind, content })
    pending = []
  }
  for (const child of p.children) {
    if (isTag(child) && (child.name === 'img' || child.name === 'video')) {
      flush()
      const media = child.name === 'img' ? imageFigure(child) : videoBlock(child)
      if (media) blocks.push(media)
      continue
    }
    // <a><img></a>처럼 감싼 이미지
    if (isTag(child) && child.name === 'a' && findFirst(child.children, (el) => el.name === 'img') && textOf(child) === '') {
      flush()
      const img = findFirst(child.children, (el) => el.name === 'img')
      const media = img ? imageFigure(img) : null
      if (media) blocks.push(media)
      continue
    }
    pending.push(child)
  }
  flush()
  return blocks
}

function figureBlock(fig: Element): ArticleBlock | null {
  const figcaption = findFirst(fig.children, (el) => el.name === 'figcaption')

  if ('data-slot' in fig.attribs) {
    return {
      type: 'slot',
      hint: fig.attribs['data-hint'] ?? '',
      ratio: fig.attribs['data-ratio'] ?? null,
      caption: figcaption ? textOf(figcaption) || null : null,
    }
  }

  const video = findFirst(fig.children, (el) => el.name === 'video')
  if (video) return videoBlock(video)

  const img = findFirst(fig.children, (el) => el.name === 'img')
  if (!img) return null
  const base = imageFigure(img)
  if (!base || base.type !== 'figure') return null

  let caption: InlineNode[] | null = null
  let credit: string | null = null
  if (figcaption) {
    const captionEl = findFirst(figcaption.children, (el) => 'data-caption' in el.attribs)
    const creditEl = findFirst(figcaption.children, (el) => 'data-credit' in el.attribs)
    if (creditEl) credit = textOf(creditEl) || null
    if (captionEl) {
      caption = trimInline(toInline(captionEl.children))
    } else {
      // 규격 이전의 <figcaption>텍스트</figcaption> — 크레딧 칸을 뺀 나머지를 캡션으로
      const rest = figcaption.children.filter((c) => !(isTag(c) && 'data-credit' in c.attribs))
      caption = trimInline(toInline(rest))
    }
    if (caption && inlineIsEmpty(caption)) caption = null
  }
  return { ...base, caption, credit }
}

function quoteBlock(bq: Element): ArticleBlock | null {
  const citeEl = findFirst(bq.children, (el) => el.name === 'cite')
  const cite = citeEl ? trimInline(toInline(citeEl.children)) : null
  if (citeEl) DomUtils.removeElement(citeEl)

  const paragraphs: InlineNode[][] = []
  const ps = bq.children.filter((c): c is Element => isTag(c) && c.name === 'p')
  if (ps.length) {
    for (const p of ps) {
      const content = trimInline(toInline(p.children))
      if (!inlineIsEmpty(content)) paragraphs.push(content)
    }
  } else {
    const content = trimInline(toInline(bq.children))
    if (!inlineIsEmpty(content)) paragraphs.push(content)
  }
  if (!paragraphs.length) return null
  return { type: 'quote', paragraphs, cite: cite && !inlineIsEmpty(cite) ? cite : null }
}

function termsBlock(dl: Element): ArticleBlock | null {
  const items: { term: InlineNode[]; desc: InlineNode[] }[] = []
  // <div><dt/><dd/></div> 묶음과 dt/dd 직속 나열을 모두 받는다
  const flat: Element[] = []
  for (const child of dl.children) {
    if (!isTag(child)) continue
    if (child.name === 'div') flat.push(...child.children.filter((c): c is Element => isTag(c)))
    else flat.push(child)
  }
  let term: InlineNode[] | null = null
  for (const el of flat) {
    if (el.name === 'dt') term = trimInline(toInline(el.children))
    else if (el.name === 'dd') {
      items.push({ term: term ?? [], desc: trimInline(toInline(el.children)) })
      term = null
    }
  }
  return items.length ? { type: 'terms', items } : null
}

function listBlock(list: Element): ArticleBlock | null {
  const items: InlineNode[][] = []
  for (const li of list.children) {
    if (!isTag(li) || li.name !== 'li') continue
    // <li><p>…</p></li>(에디터 출력)는 문단 사이를 줄바꿈으로 잇는다
    const parts: InlineNode[] = []
    const ps = li.children.filter((c): c is Element => isTag(c) && c.name === 'p')
    if (ps.length) {
      ps.forEach((p, i) => {
        if (i > 0) parts.push({ t: 'br' })
        parts.push(...toInline(p.children))
      })
    } else {
      parts.push(...toInline(li.children))
    }
    const content = trimInline(parts)
    if (!inlineIsEmpty(content)) items.push(content)
  }
  return items.length ? { type: 'list', ordered: list.name === 'ol', items } : null
}

function walk(nodes: ChildNode[], blocks: ArticleBlock[]) {
  for (const node of nodes) {
    if (isText(node)) {
      const content = trimInline(toInline([node]))
      if (!inlineIsEmpty(content)) blocks.push({ type: 'paragraph', content })
      continue
    }
    if (!isTag(node)) continue
    const name = node.name.toLowerCase()
    switch (name) {
      case 'p': {
        const classes = (node.attribs.class ?? '').split(/\s+/)
        blocks.push(...paragraphBlocks(node, classes.includes('lead') ? 'lead' : 'paragraph'))
        break
      }
      case 'h1':
      case 'h2':
      case 'h3': {
        const content = trimInline(toInline(node.children))
        if (!inlineIsEmpty(content)) blocks.push({ type: 'heading', content })
        break
      }
      case 'h4':
      case 'h5':
      case 'h6': {
        const content = trimInline(toInline(node.children))
        if (!inlineIsEmpty(content)) blocks.push({ type: 'subheading', content })
        break
      }
      case 'figure': {
        const block = figureBlock(node)
        if (block) blocks.push(block)
        break
      }
      case 'img': {
        const block = imageFigure(node)
        if (block) blocks.push(block)
        break
      }
      case 'video': {
        const block = videoBlock(node)
        if (block) blocks.push(block)
        break
      }
      case 'blockquote': {
        const block = quoteBlock(node)
        if (block) blocks.push(block)
        break
      }
      case 'dl': {
        const block = termsBlock(node)
        if (block) blocks.push(block)
        break
      }
      case 'ul':
      case 'ol': {
        const block = listBlock(node)
        if (block) blocks.push(block)
        break
      }
      case 'hr':
        blocks.push({ type: 'rule' })
        break
      // 감싸기만 하는 상자는 벗겨서 안을 읽는다
      case 'div':
      case 'section':
      case 'article':
      case 'body':
      case 'html':
      case 'main':
        walk(node.children, blocks)
        break
      case 'br':
        break
      default: {
        // 표·iframe 등 규격 밖 요소 — 원문을 그대로 보존한다
        if (INLINE_TAGS[name] || name === 'span') {
          const content = trimInline(toInline([node]))
          if (!inlineIsEmpty(content)) blocks.push({ type: 'paragraph', content })
        } else {
          blocks.push({ type: 'html', html: DomUtils.getOuterHTML(node) })
        }
      }
    }
  }
}

export function parseArticleHtml(html: string | null | undefined): ArticleBlock[] {
  if (!html) return []
  const cleaned = html.replace(TRAILING_EMPTY, '').replace(TRAILING_SIGNATURE, '').replace(TRAILING_EMPTY, '')
  const doc = parseDocument(cleaned)
  const blocks: ArticleBlock[] = []
  walk(doc.children, blocks)
  return blocks
}

/** posts.content / content_en(JSON {html}) 에서 HTML 문자열을 꺼낸다 */
export function htmlFromContent(content: unknown): string {
  if (typeof content === 'object' && content !== null && 'html' in content) {
    const html = (content as { html?: unknown }).html
    return typeof html === 'string' ? html : ''
  }
  return ''
}

/** 그림 크레딧 — 글 끝 PHOTO 목록에 자동으로 모은다(순서 유지, 중복 제거) */
export function collectFigureCredits(blocks: ArticleBlock[]): string[] {
  const credits: string[] = []
  for (const block of blocks) {
    if (block.type === 'figure' && block.credit && !credits.includes(block.credit)) credits.push(block.credit)
  }
  return credits
}
