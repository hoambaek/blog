import { Mark, Node, mergeAttributes, type Extensions } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Blockquote from '@tiptap/extension-blockquote'
import { TextSelection } from '@tiptap/pm/state'

/*
 * 기록 에디터 스키마 — docs/content/article-format.md 1절(저장 형식)을 Tiptap 노드로 옮긴 것.
 * React에 기대지 않는다: 관리자 에디터(노드뷰를 덧붙여 씀)와 왕복 테스트(scripts/editor-roundtrip.ts)가 같이 쓴다.
 *
 * 원칙
 * - 규격 블록은 전용 노드로 받는다(리드·그림·이미지 자리·인용 출처·용어 목록·영상).
 * - 규격 밖 블록(표·iframe·pre 등)은 htmlBlock으로 원문 HTML을 통째로 보존한다 — 지우지 않는다.
 * - 규격 밖 인라인(span 등)은 태그만 벗기고 글자는 남긴다(공개 렌더러 parse.ts와 같은 처리).
 * - 번호(소제목 01·02, FIG)는 저장하지 않는다. 에디터 화면에서만 CSS·노드뷰로 보여 준다.
 */

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lead: { setLead: () => ReturnType }
    figure: { insertFigure: (options: { src: string; alt?: string; caption?: string; credit?: string }) => ReturnType }
    imageSlot: { insertImageSlot: (options?: { hint?: string; ratio?: string }) => ReturnType }
    termsList: { insertTerms: () => ReturnType }
    articleQuote: { insertQuote: () => ReturnType }
    video: { setVideo: (options: { src: string; poster?: string | null }) => ReturnType }
  }
}

/** 첫 img — figure 안이든 img 자신이든 */
function findImg(el: HTMLElement): HTMLElement | null {
  return el.tagName === 'IMG' ? el : el.querySelector('img')
}

// ── 리드 문단 <p class="lead"> ──
export const Lead = Node.create({
  name: 'lead',
  group: 'block',
  content: 'inline*',
  defining: true,
  parseHTML() {
    return [{ tag: 'p.lead', priority: 60 }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(HTMLAttributes, { class: 'lead' }), 0]
  },
  addCommands() {
    return {
      setLead:
        () =>
        ({ commands }) =>
          commands.setNode(this.name),
    }
  },
})

// ── 그림: <figure data-block="figure"><img><figcaption><span data-caption/><span data-credit/></figcaption></figure> ──
export const FigureCaption = Node.create({
  name: 'figureCaption',
  content: 'inline*',
  defining: true,
  parseHTML() {
    return [{ tag: 'span[data-caption]', context: 'figure/|figure/figureCaption/' }]
  },
  renderHTML() {
    return ['span', { 'data-caption': '' }, 0]
  },
})

export const FigureCredit = Node.create({
  name: 'figureCredit',
  content: 'text*',
  marks: '',
  defining: true,
  parseHTML() {
    return [{ tag: 'span[data-credit]', context: 'figure/|figure/figureCaption/' }]
  },
  renderHTML() {
    return ['span', { 'data-credit': '' }, 0]
  },
})

export const Figure = Node.create({
  name: 'figure',
  group: 'block',
  content: 'figureCaption figureCredit',
  isolating: true,
  draggable: true,
  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (el) => findImg(el)?.getAttribute('src') ?? null,
        rendered: false,
      },
      alt: {
        default: '',
        parseHTML: (el) => findImg(el)?.getAttribute('alt') ?? '',
        rendered: false,
      },
    }
  },
  parseHTML() {
    return [
      {
        tag: 'figure',
        getAttrs: (el) => {
          const node = el as HTMLElement
          if (node.hasAttribute('data-slot')) return false
          if (node.querySelector('video')) return false // 영상 figure는 안의 video 노드로 받는다
          return findImg(node)?.getAttribute('src') ? null : false
        },
        contentElement: (el) =>
          (el as HTMLElement).querySelector('figcaption') ?? (el as HTMLElement).ownerDocument.createElement('figcaption'),
      },
      // 예전 글: 문단 안이나 최상위에 놓인 맨 이미지 → 캡션 없는 그림
      { tag: 'img[src]' },
    ]
  },
  renderHTML({ node }) {
    return [
      'figure',
      { 'data-block': 'figure' },
      ['img', { src: node.attrs.src, alt: node.attrs.alt ?? '' }],
      ['figcaption', 0],
    ]
  },
  addCommands() {
    return {
      insertFigure:
        ({ src, alt = '', caption = '', credit = '' }) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { src, alt },
            content: [
              { type: 'figureCaption', content: caption ? [{ type: 'text', text: caption }] : [] },
              { type: 'figureCredit', content: credit ? [{ type: 'text', text: credit }] : [] },
            ],
          }),
    }
  },
})

// ── 이미지 자리: <figure data-block="figure" data-slot data-hint data-ratio><figcaption>…</figcaption></figure> ──
export const ImageSlot = Node.create({
  name: 'imageSlot',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      hint: { default: '', parseHTML: (el) => el.getAttribute('data-hint') ?? '', rendered: false },
      ratio: { default: null, parseHTML: (el) => el.getAttribute('data-ratio') || null, rendered: false },
      caption: {
        default: '',
        parseHTML: (el) => el.querySelector('figcaption')?.textContent?.trim() ?? '',
        rendered: false,
      },
      // 규격 밖 속성 — 자리를 채울 때 그림 크레딧으로 옮긴다. 공개 렌더러는 무시한다.
      credit: { default: '', parseHTML: (el) => el.getAttribute('data-credit') ?? '', rendered: false },
    }
  },
  parseHTML() {
    return [{ tag: 'figure[data-slot]', priority: 60 }]
  },
  renderHTML({ node }) {
    const { hint, ratio, caption, credit } = node.attrs as { hint: string; ratio: string | null; caption: string; credit: string }
    const attrs: Record<string, string> = { 'data-block': 'figure', 'data-slot': '', 'data-hint': hint ?? '' }
    if (ratio) attrs['data-ratio'] = ratio
    if (credit) attrs['data-credit'] = credit
    return caption ? ['figure', attrs, ['figcaption', caption]] : ['figure', attrs]
  },
  addCommands() {
    return {
      insertImageSlot:
        (options = {}) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { hint: options.hint ?? '', ratio: options.ratio ?? '4:5' } }),
    }
  },
})

// ── 인용·출처: <blockquote><p>…</p><cite>…</cite></blockquote> ──
export const Citation = Node.create({
  name: 'citation',
  content: 'inline*',
  defining: true,
  parseHTML() {
    return [{ tag: 'cite', context: 'blockquote/|blockquote/paragraph/' }]
  },
  renderHTML() {
    return ['cite', 0]
  },
})

export const ArticleQuote = Blockquote.extend({
  name: 'blockquote',
  content: 'block+ citation?',
  addCommands() {
    return {
      ...this.parent?.(),
      insertQuote:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            content: [{ type: 'paragraph' }, { type: 'citation' }],
          }),
    }
  },
})

// ── 용어 목록: <dl data-block="terms"><div><dt/><dd/></div>…</dl> ──
export const TermsTerm = Node.create({
  name: 'termsTerm',
  content: 'inline*',
  defining: true,
  parseHTML() {
    return [{ tag: 'dt' }]
  },
  renderHTML() {
    return ['dt', 0]
  },
})

export const TermsDesc = Node.create({
  name: 'termsDesc',
  content: 'inline*',
  defining: true,
  parseHTML() {
    return [{ tag: 'dd' }]
  },
  renderHTML() {
    return ['dd', 0]
  },
})

export const TermsItem = Node.create({
  name: 'termsItem',
  content: 'termsTerm termsDesc',
  defining: true,
  parseHTML() {
    return [{ tag: 'div', context: 'termsList/' }]
  },
  renderHTML() {
    return ['div', 0]
  },
})

export const TermsList = Node.create({
  name: 'termsList',
  group: 'block',
  content: 'termsItem+',
  defining: true,
  parseHTML() {
    return [{ tag: 'dl' }]
  },
  renderHTML() {
    return ['dl', { 'data-block': 'terms' }, 0]
  },
  addCommands() {
    return {
      insertTerms:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            content: [{ type: 'termsItem', content: [{ type: 'termsTerm' }, { type: 'termsDesc' }] }],
          }),
    }
  },
  addKeyboardShortcuts() {
    return {
      // 용어 → 설명 칸으로, 설명 → 다음 행. 비어 있는 마지막 행에서 한 번 더 누르면 목록 밖으로 나간다.
      Enter: ({ editor }) => {
        const { $from, empty } = editor.state.selection
        if (!empty) return false
        const parent = $from.parent
        if (parent.type.name === 'termsTerm') {
          const descStart = $from.after() + 1
          return editor.commands.command(({ tr }) => {
            tr.setSelection(TextSelection.create(tr.doc, descStart))
            return true
          })
        }
        if (parent.type.name === 'termsDesc') {
          const item = $from.node(-1)
          const list = $from.node(-2)
          const itemEnd = $from.after(-1)
          const isLast = $from.index(-2) === list.childCount - 1
          if (isLast && item.textContent.trim() === '') {
            // 빈 행을 지우고 목록 뒤에 문단을 만든다
            return editor.commands.command(({ tr, state }) => {
              const itemStart = $from.before(-1)
              const listEnd = $from.after(-2)
              const paragraph = state.schema.nodes.paragraph.create()
              if (list.childCount === 1) {
                tr.replaceWith($from.before(-2), listEnd, paragraph)
                tr.setSelection(TextSelection.create(tr.doc, $from.before(-2) + 1))
              } else {
                tr.delete(itemStart, itemEnd)
                const insertAt = listEnd - (itemEnd - itemStart)
                tr.insert(insertAt, paragraph)
                tr.setSelection(TextSelection.create(tr.doc, insertAt + 1))
              }
              return true
            })
          }
          return editor.commands.command(({ tr, state }) => {
            const newItem = state.schema.nodes.termsItem.create(null, [
              state.schema.nodes.termsTerm.create(),
              state.schema.nodes.termsDesc.create(),
            ])
            tr.insert(itemEnd, newItem)
            tr.setSelection(TextSelection.create(tr.doc, itemEnd + 2))
            return true
          })
        }
        return false
      },
    }
  },
})

// ── 영상: 기존 video 노드 유지(속성: src, poster) ──
export const Video = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (el) => el.getAttribute('src') || el.querySelector('source')?.getAttribute('src') || null,
      },
      poster: { default: null },
    }
  },
  parseHTML() {
    return [{ tag: 'video' }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'video',
      mergeAttributes(HTMLAttributes, {
        controls: 'true',
        playsinline: 'true',
        preload: 'metadata',
        style: 'display: block; max-width: 100%; margin: 2.5rem auto;',
      }),
    ]
  },
  addCommands() {
    return {
      setVideo:
        (options) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: options }),
    }
  },
})

// ── 규격 밖 블록: 원문 HTML을 그대로 보존 ──
const RAW_BLOCK_TAGS = 'table, iframe, pre, embed, object, svg, audio, canvas, form, details, address'

export const HtmlBlock = Node.create({
  name: 'htmlBlock',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      html: { default: '', parseHTML: (el) => el.outerHTML, rendered: false },
    }
  },
  parseHTML() {
    return [{ tag: RAW_BLOCK_TAGS, priority: 60 }]
  },
  renderHTML({ node }) {
    const html = String(node.attrs.html ?? '')
    if (typeof document !== 'undefined') {
      const template = document.createElement('template')
      template.innerHTML = html
      const el = template.content.firstElementChild
      if (el) return el as unknown as HTMLElement
    }
    return ['div', { 'data-html-block': '' }]
  },
})

// ── 인라인 표시 (parse.ts가 받는 sup·sub·mark) ──
function simpleMark(name: string, tag: string) {
  return Mark.create({
    name,
    parseHTML() {
      return [{ tag }]
    },
    renderHTML({ HTMLAttributes }) {
      return [tag, HTMLAttributes, 0]
    },
  })
}

export const Superscript = simpleMark('superscript', 'sup')
export const Subscript = simpleMark('subscript', 'sub')
export const Highlight = simpleMark('highlight', 'mark')

/**
 * 스키마 확장 목록 — 에디터와 왕복 테스트가 같은 것을 쓴다.
 * overrides: 같은 이름의 확장을 바꿔 끼운다(에디터가 노드뷰를 붙인 Figure 등). 스키마는 그대로여야 한다.
 */
export function articleExtensions(overrides: Extensions = []): Extensions {
  const base: Extensions = [
    StarterKit.configure({
      blockquote: false,
      codeBlock: false,
      heading: { levels: [1, 2, 3, 4, 5, 6] },
      link: {
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { target: null, rel: null, class: null },
      },
    }),
    Lead,
    Figure,
    FigureCaption,
    FigureCredit,
    ImageSlot,
    ArticleQuote,
    Citation,
    TermsList,
    TermsItem,
    TermsTerm,
    TermsDesc,
    Video,
    HtmlBlock,
    Superscript,
    Subscript,
    Highlight,
  ]
  const byName = new Map(overrides.map((ext) => [ext.name, ext]))
  const replaced = base.map((ext) => byName.get(ext.name) ?? ext)
  const extra = overrides.filter((ext) => !base.some((b) => b.name === ext.name))
  return [...replaced, ...extra]
}
