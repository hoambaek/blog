'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import Placeholder from '@tiptap/extension-placeholder'
import { articleExtensions } from '@/lib/editor/extensions'
import { cleanArticleHtml } from '@/lib/editor/serialize'
import { editorNodeViews, IMAGE_TYPES, uploadEditorMedia, VIDEO_TYPES } from './nodeViews'
import './editor.css'

/*
 * 기록 본문 에디터 — Paper IIL-0의 가운데 캔버스.
 * 스키마는 src/lib/editor/extensions.ts(왕복 테스트와 공용), 저장 HTML은 cleanArticleHtml로 정리해 onChange로 올린다.
 * "/"로 시작하는 빈 문단에서 블록 메뉴가 뜬다.
 */

interface SlashState {
  query: string
  from: number
  to: number
  left: number
  top: number
  /** 화면 아래쪽이 모자라면 커서 위로 띄운다 */
  flipUp: boolean
}

interface SlashItem {
  key: string
  label: string
  tag: string
  keywords: string
}

const PLACEHOLDERS: Record<string, string> = {
  paragraph: '/ 블록 넣기',
  lead: '리드 문단 — 글의 첫 단락',
  heading: '소제목',
  citation: '출처 (선택) — 이름, 소속',
  termsTerm: '용어',
  termsDesc: '설명',
  figureCaption: '캡션',
  figureCredit: '촬영자',
}

function readSlash(editor: Editor): Omit<SlashState, 'left' | 'top' | 'flipUp'> | null {
  const { selection } = editor.state
  if (!selection.empty) return null
  const $from = selection.$from
  if ($from.parent.type.name !== 'paragraph') return null
  const before = $from.parent.textBetween(0, $from.parentOffset, undefined, '￼')
  const match = /^\/([^\s/]{0,20})$/.exec(before)
  if (!match) return null
  return { query: match[1], from: $from.start(), to: $from.pos }
}

function headingCount(editor: Editor): number {
  let n = 0
  editor.state.doc.forEach((node) => {
    if (node.type.name === 'heading' && node.attrs.level <= 3) n++
  })
  return n
}

export function ArticleEditor({
  initialHtml,
  onChange,
  postNumber,
  fromClaude,
}: {
  initialHtml: string
  onChange: (html: string) => void
  postNumber: number | null
  fromClaude: boolean
}) {
  const [slash, setSlash] = useState<SlashState | null>(null)
  const [slashIndex, setSlashIndex] = useState(0)
  const dismissedAt = useRef<string | null>(null)
  const slashRef = useRef<{ state: SlashState | null; items: SlashItem[]; index: number }>({ state: null, items: [], index: 0 })
  const imageInput = useRef<HTMLInputElement>(null)
  const videoInput = useRef<HTMLInputElement>(null)
  const pendingPos = useRef<number | null>(null)
  const onChangeRef = useRef(onChange)
  const editorRef = useRef<Editor | null>(null)
  const slashQuery = useRef<string | null>(null)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: articleExtensions([
      ...editorNodeViews({ fromClaude }),
      Placeholder.configure({
        includeChildren: true,
        showOnlyCurrent: false,
        placeholder: ({ editor, node, pos }) => {
          if (node.type.name === 'paragraph') {
            const parent = editor.state.doc.resolve(pos).parent.type.name
            if (parent === 'blockquote') return '인용문'
            if (parent === 'listItem') return '목록 항목'
          }
          return PLACEHOLDERS[node.type.name] ?? ''
        },
      }),
    ]),
    content: initialHtml,
    editorProps: {
      attributes: { class: 'ed-prose', spellcheck: 'false' },
      handleKeyDown: (_view, event) => {
        const current = slashRef.current
        if (!current.state || !current.items.length) return false
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          const delta = event.key === 'ArrowDown' ? 1 : -1
          setSlashIndex((i) => (i + delta + current.items.length) % current.items.length)
          return true
        }
        if (event.key === 'Enter' || event.key === 'Tab') {
          runItemRef.current?.(current.items[current.index])
          return true
        }
        if (event.key === 'Escape') {
          dismissedAt.current = `${current.state.from}:${current.state.query}`
          setSlash(null)
          return true
        }
        return false
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false
        const file = event.dataTransfer?.files?.[0]
        if (!file || !(IMAGE_TYPES.includes(file.type) || VIDEO_TYPES.includes(file.type))) return false
        event.preventDefault()
        const at = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos ?? view.state.doc.content.size
        void insertMediaAt(file, at)
        return true
      },
    },
    onUpdate: ({ editor }) => onChangeRef.current(cleanArticleHtml(editor.getHTML())),
  })

  const items = useMemo<SlashItem[]>(() => {
    const next = editor ? headingCount(editor) + 1 : 1
    const all: SlashItem[] = [
      { key: 'figure', label: '그림 · 캡션과 크레딧', tag: 'FIG', keywords: 'figure image 그림 사진 이미지' },
      { key: 'slot', label: '이미지 자리', tag: 'SLOT', keywords: 'slot 자리 이미지 사진 placeholder' },
      { key: 'heading', label: '번호 소제목', tag: String(next).padStart(2, '0'), keywords: 'heading h3 소제목 제목' },
      { key: 'quote', label: '인용 · 출처', tag: '“ ”', keywords: 'quote 인용 출처 cite' },
      { key: 'terms', label: '용어 목록', tag: 'DL', keywords: 'terms dl 용어 정의' },
      { key: 'lead', label: '리드 문단', tag: 'LEAD', keywords: 'lead 리드 첫 문단' },
      { key: 'video', label: '영상', tag: 'MP4', keywords: 'video 영상 동영상' },
      { key: 'rule', label: '구분선', tag: '—', keywords: 'hr rule 구분선 선' },
      { key: 'bullet', label: '목록', tag: 'UL', keywords: 'list ul 목록' },
      { key: 'ordered', label: '번호 목록', tag: 'OL', keywords: 'list ol 번호 목록' },
      { key: 'subheading', label: '작은 소제목 (번호 없음)', tag: 'H4', keywords: 'h4 작은 소제목' },
      { key: 'paragraph', label: '문단', tag: 'P', keywords: 'paragraph 문단 본문' },
    ]
    const q = slash?.query.trim().toLowerCase() ?? ''
    return q ? all.filter((it) => it.label.toLowerCase().includes(q) || it.keywords.includes(q)) : all
    // slash가 바뀔 때마다 번호·필터를 다시 계산한다
  }, [editor, slash])

  const index = Math.min(slashIndex, Math.max(0, items.length - 1))
  useEffect(() => {
    slashRef.current = { state: slash, items, index }
    editorRef.current = editor
  })

  async function insertMediaAt(file: File, pos: number) {
    const editor = editorRef.current
    if (!editor) return
    const isVideo = file.type.startsWith('video/')
    try {
      const src = await uploadEditorMedia(file, isVideo ? 'video' : 'image')
      const chain = editor.chain().focus().setTextSelection(Math.min(pos, editor.state.doc.content.size))
      if (isVideo) chain.setVideo({ src }).run()
      else chain.insertFigure({ src }).run()
    } catch (error) {
      window.dispatchEvent(new CustomEvent('editor-error', { detail: error instanceof Error ? error.message : '업로드 실패' }))
    }
  }

  const runItemRef = useRef<((item: SlashItem) => void) | null>(null)
  const runItem = (item: SlashItem) => {
    if (!editor || !slash) return
    const chain = editor.chain().focus().deleteRange({ from: slash.from, to: slash.to })
    setSlash(null)
    switch (item.key) {
      case 'figure':
        chain.run()
        pendingPos.current = slash.from
        imageInput.current?.click()
        return
      case 'video':
        chain.run()
        pendingPos.current = slash.from
        videoInput.current?.click()
        return
      case 'slot':
        chain.insertImageSlot({ ratio: '4:5' }).run()
        return
      case 'heading':
        chain.setHeading({ level: 3 }).run()
        return
      case 'subheading':
        chain.setHeading({ level: 4 }).run()
        return
      case 'quote':
        // 빈 문단 자리를 인용으로 바꾸고 커서를 인용 본문 첫 칸에 둔다
        chain.insertQuote().setTextSelection(slash.from + 1).run()
        return
      case 'terms':
        chain.insertTerms().setTextSelection(slash.from + 2).run()
        return
      case 'lead':
        chain.setLead().run()
        return
      case 'rule':
        chain.setHorizontalRule().run()
        return
      case 'bullet':
        chain.toggleBulletList().run()
        return
      case 'ordered':
        chain.toggleOrderedList().run()
        return
      default:
        chain.setParagraph().run()
    }
  }
  useEffect(() => {
    runItemRef.current = runItem
  })

  // "/" 블록 메뉴 — 선택이 바뀔 때마다 상태를 다시 읽는다
  useEffect(() => {
    if (!editor) return
    const update = () => {
      const found = readSlash(editor)
      if (!found || dismissedAt.current === `${found.from}:${found.query}`) {
        slashQuery.current = null
        setSlash(null)
        return
      }
      dismissedAt.current = null
      if (slashQuery.current !== found.query) {
        slashQuery.current = found.query
        setSlashIndex(0)
      }
      const coords = editor.view.coordsAtPos(found.from)
      const flipUp = coords.bottom + 400 > window.innerHeight && coords.top > 420
      setSlash({ ...found, left: coords.left, top: flipUp ? coords.top - 6 : coords.bottom + 6, flipUp })
    }
    editor.on('transaction', update)
    return () => {
      editor.off('transaction', update)
    }
  }, [editor])

  const figPrefix = postNumber ? `"${String(postNumber).padStart(3, '0')}–"` : '""'

  return (
    <div className="ed-body" style={{ '--ed-fig-prefix': figPrefix } as CSSProperties}>
      <EditorContent editor={editor} />

      {editor && (
        <BubbleMenu
          editor={editor}
          shouldShow={({ editor: e, state }) =>
            !state.selection.empty && !e.isActive('figure') && !e.isActive('imageSlot') && !e.isActive('htmlBlock') && !e.isActive('video')
          }
          className="flex border border-earth/20 bg-void text-paper shadow-[0_10px_24px_rgb(10_9_8/0.2)]"
        >
          {[
            { label: 'B', title: '굵게', active: editor.isActive('bold'), run: () => editor.chain().focus().toggleBold().run(), className: 'font-medium' },
            { label: 'I', title: '기울임', active: editor.isActive('italic'), run: () => editor.chain().focus().toggleItalic().run(), className: 'italic font-garamond text-[15px]' },
            {
              label: '링크',
              title: '링크',
              active: editor.isActive('link'),
              run: () => {
                const prev = editor.getAttributes('link').href as string | undefined
                const url = window.prompt('링크 주소 (비우면 링크 해제)', prev ?? 'https://')
                if (url === null) return
                if (url.trim() === '' ) editor.chain().focus().extendMarkRange('link').unsetLink().run()
                else editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
              },
              className: '',
            },
            {
              label: '표시',
              title: '형광 표시',
              active: editor.isActive('highlight'),
              run: () => editor.chain().focus().toggleMark('highlight').run(),
              className: '',
            },
          ].map((b) => (
            <button
              key={b.label}
              type="button"
              title={b.title}
              onMouseDown={(e) => e.preventDefault()}
              onClick={b.run}
              className={`px-3 py-1.5 text-[12.5px] ${b.active ? 'text-amber' : 'text-paper/85 hover:text-paper'} ${b.className}`}
            >
              {b.label}
            </button>
          ))}
        </BubbleMenu>
      )}

      {slash && items.length > 0 && (
        <div
          className="fixed z-50 flex w-[300px] flex-col border border-earth/20 bg-paper shadow-[0_18px_40px_rgb(10_9_8/0.14)]"
          style={slash.flipUp ? { left: slash.left, bottom: window.innerHeight - slash.top } : { left: slash.left, top: slash.top }}
          role="listbox"
          aria-label="블록 넣기"
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="border-b border-earth/[0.12] px-4 pb-2 pt-2.5">
            <span className="font-plex text-[9.5px] leading-3 tracking-[0.16em] text-stone-light">BLOCKS</span>
          </div>
          <div className="max-h-[360px] overflow-y-auto pb-1">
            {items.map((item, i) => (
              <button
                key={item.key}
                type="button"
                role="option"
                aria-selected={i === index}
                onMouseEnter={() => setSlashIndex(i)}
                onClick={() => runItem(item)}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[13.5px] leading-[18px] text-earth ${
                  i === index ? 'bg-amber/[0.18]' : 'font-light'
                }`}
              >
                {item.label}
                <span className="font-plex text-[10px] leading-3 text-stone-light">{item.tag}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <input
        ref={imageInput}
        type="file"
        accept={IMAGE_TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file && pendingPos.current !== null) void insertMediaAt(file, pendingPos.current)
          pendingPos.current = null
        }}
      />
      <input
        ref={videoInput}
        type="file"
        accept={VIDEO_TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file && pendingPos.current !== null) void insertMediaAt(file, pendingPos.current)
          pendingPos.current = null
        }}
      />
    </div>
  )
}
