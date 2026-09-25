'use client'

import { useRef, useState, type DragEvent } from 'react'
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from '@tiptap/react'
import { Figure, HtmlBlock, ImageSlot, Video } from '@/lib/editor/extensions'
import { uploadMediaFile } from '@/lib/upload/client'

/*
 * 편집 캔버스 노드뷰 — Paper IIL-0의 그림(캡션·크레딧 칸)·이미지 자리(점선 상자)·영상·규격 밖 HTML.
 * 저장 모양은 extensions.ts의 renderHTML이 정한다. 여기는 화면만.
 */

export const IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
]
export const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']
const IMAGE_MAX = 10 * 1024 * 1024
const VIDEO_MAX = 100 * 1024 * 1024

/** 파일 검사 → R2 업로드(기존 /api/upload·/api/upload-url 경로) → 공개 URL */
export async function uploadEditorMedia(file: File, kind: 'image' | 'video'): Promise<string> {
  const types = kind === 'image' ? IMAGE_TYPES : VIDEO_TYPES
  if (!types.includes(file.type)) {
    throw new Error(kind === 'image' ? '이미지 파일(JPEG·PNG·WebP·AVIF·HEIC 등)만 올릴 수 있습니다.' : '영상 파일(MP4·WebM·MOV 등)만 올릴 수 있습니다.')
  }
  if (file.size > (kind === 'image' ? IMAGE_MAX : VIDEO_MAX)) {
    throw new Error(`파일이 ${kind === 'image' ? '10MB' : '100MB'}를 넘습니다.`)
  }
  const { url } = await uploadMediaFile(file, 'posts')
  return url
}

const monoLabel = 'font-plex text-[9px] leading-3 tracking-[0.14em] text-stone-light'

function reportError(error: unknown) {
  window.dispatchEvent(
    new CustomEvent('editor-error', { detail: error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.' }),
  )
}

// ── 그림 ──
function FigureView({ node, updateAttributes, deleteNode, selected }: ReactNodeViewProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const caption = node.child(0)?.textContent ?? ''
  const credit = node.child(1)?.textContent ?? ''
  const labelled = caption.trim() !== '' || credit.trim() !== ''

  const replace = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try {
      updateAttributes({ src: await uploadEditorMedia(file, 'image') })
    } catch (error) {
      reportError(error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <NodeViewWrapper
      className={`ed-figure group ${selected ? 'is-selected' : ''}`}
      data-labelled={labelled ? '' : undefined}
      data-drag-handle=""
    >
      <div className="relative" contentEditable={false}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={node.attrs.src} alt={node.attrs.alt ?? ''} className={`block h-auto w-full ${busy ? 'opacity-40' : ''}`} draggable={false} />
        <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            className="bg-void/85 px-2.5 py-1 text-[11.5px] text-paper hover:bg-void"
            onClick={() => fileRef.current?.click()}
          >
            교체
          </button>
          <button
            type="button"
            className="bg-void/85 px-2.5 py-1 text-[11.5px] text-paper hover:bg-void"
            onClick={() => {
              const alt = window.prompt('대체 텍스트(alt) — 화면 낭독기가 읽습니다', node.attrs.alt ?? '')
              if (alt !== null) updateAttributes({ alt })
            }}
          >
            alt
          </button>
          <button type="button" className="bg-void/85 px-2.5 py-1 text-[11.5px] text-paper hover:bg-void" onClick={deleteNode}>
            삭제
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={IMAGE_TYPES.join(',')}
          className="hidden"
          onChange={(e) => {
            void replace(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>
      <div className="ed-figure-fields">
        <span contentEditable={false} className="shrink-0 pb-[7px] font-plex text-[10.5px] leading-[14px] tracking-[0.14em] text-amber-deep">
          {labelled ? <span className="ed-fig-num" /> : <span className="text-stone-light">FIG. —</span>}
        </span>
        <NodeViewContent className="flex min-w-0 flex-1 items-end gap-3.5" />
      </div>
      <span contentEditable={false} className="block text-[11.5px] font-light leading-[14px] text-stone-light">
        크레딧은 글 끝 사진 출처에 자동으로 모입니다. 캡션·크레딧이 모두 비면 번호 없이 사진만 나갑니다.
      </span>
    </NodeViewWrapper>
  )
}

// ── 이미지 자리 ──
const RATIOS = ['4:5', '1:1', '3:2', '16:9', '2:3']

function ratioLabel(ratio: string | null): string {
  if (!ratio) return '비율 자유'
  const [w, h] = ratio.split(':').map(Number)
  if (!w || !h) return ratio
  return `${w < h ? '세로' : w > h ? '가로' : '정사각'} ${ratio} 권장`
}

function SlotView({ node, updateAttributes, editor, getPos, selected, extension }: ReactNodeViewProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const { hint, ratio, caption, credit } = node.attrs as { hint: string; ratio: string | null; caption: string; credit: string }
  const fromClaude = (extension.options as { fromClaude?: boolean }).fromClaude

  const fill = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try {
      const src = await uploadEditorMedia(file, 'image')
      const pos = typeof getPos === 'function' ? getPos() : undefined
      if (typeof pos !== 'number') return
      // 이 자리를 같은 캡션·크레딧의 그림으로 바꾼다
      editor
        .chain()
        .insertContentAt(
          { from: pos, to: pos + node.nodeSize },
          {
            type: 'figure',
            attrs: { src, alt: caption || hint || '' },
            content: [
              { type: 'figureCaption', content: caption ? [{ type: 'text', text: caption }] : [] },
              { type: 'figureCredit', content: credit ? [{ type: 'text', text: credit }] : [] },
            ],
          },
        )
        .run()
    } catch (error) {
      reportError(error)
    } finally {
      setBusy(false)
    }
  }

  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setDragOver(false)
    void fill(event.dataTransfer.files?.[0])
  }

  return (
    <NodeViewWrapper className={`ed-slot flex flex-col gap-3 ${selected ? 'is-selected' : ''}`} data-labelled="" contentEditable={false}>
      <div
        className="ed-slot-box"
        data-drag-over={dragOver ? '' : undefined}
        role="button"
        tabIndex={0}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('input,select,button')) return
          fileRef.current?.click()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.target as HTMLElement) === e.currentTarget) fileRef.current?.click()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <span className="flex items-center gap-2 font-plex text-[10px] leading-3 tracking-[0.16em] text-amber-deep">
          IMAGE SLOT ·
          <select
            value={ratio ?? ''}
            onChange={(e) => updateAttributes({ ratio: e.target.value || null })}
            className="cursor-pointer bg-transparent font-plex text-[10px] tracking-[0.1em] text-amber-deep outline-none"
            aria-label="권장 비율"
          >
            {RATIOS.map((r) => (
              <option key={r} value={r}>
                {ratioLabel(r)}
              </option>
            ))}
            <option value="">비율 자유</option>
          </select>
        </span>
        <input
          className="ed-input text-center font-serif-kr text-[17px] font-light leading-7 text-earth"
          value={hint}
          placeholder="어떤 사진이 들어갈 자리인지 (예: 인양 직후 갑판 위의 병)"
          onChange={(e) => updateAttributes({ hint: e.target.value })}
        />
        <span className="text-[12.5px] font-light leading-4 text-stone">
          {busy ? '올리는 중…' : '여기에 끌어다 놓기 · 또는 클릭해서 올리기'}
        </span>
        <input
          ref={fileRef}
          type="file"
          accept={IMAGE_TYPES.join(',')}
          className="hidden"
          onChange={(e) => {
            void fill(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>
      <div className="flex items-end gap-3.5">
        <span className="shrink-0 pb-[7px] font-plex text-[10.5px] leading-[14px] tracking-[0.14em] text-stone-light">
          <span className="ed-fig-num" />
        </span>
        <label className="flex min-w-0 flex-1 flex-col gap-1 border-b border-earth/35 pb-1.5">
          <span className={monoLabel}>CAPTION{fromClaude && caption ? ' · CLAUDE 초안' : ''}</span>
          <input
            className="ed-input text-[13px] font-light leading-4 text-earth"
            value={caption}
            placeholder="캡션"
            onChange={(e) => updateAttributes({ caption: e.target.value })}
          />
        </label>
        <label className="flex w-[196px] shrink-0 flex-col gap-1 border-b border-earth/35 pb-1.5">
          <span className={monoLabel}>CREDIT</span>
          <input
            className="ed-input font-plex text-[10.5px] leading-[14px] text-stone-dark"
            value={credit}
            placeholder="촬영자"
            onChange={(e) => updateAttributes({ credit: e.target.value })}
          />
        </label>
        <button
          type="button"
          className="shrink-0 pb-1.5 text-[11.5px] font-light text-stone-light hover:text-earth"
          onClick={() => {
            const pos = typeof getPos === 'function' ? getPos() : undefined
            if (typeof pos === 'number') editor.chain().deleteRange({ from: pos, to: pos + node.nodeSize }).run()
          }}
        >
          자리 삭제
        </button>
      </div>
    </NodeViewWrapper>
  )
}

// ── 영상 ──
function VideoView({ node, deleteNode, selected }: ReactNodeViewProps) {
  return (
    <NodeViewWrapper className={`ed-video group relative ${selected ? 'is-selected' : ''}`} contentEditable={false} data-drag-handle="">
      <span className="mb-2 block font-plex text-[9.5px] tracking-[0.14em] text-stone-light">VIDEO · 공개 화면에서 무음 자동재생</span>
      <video src={node.attrs.src ?? undefined} poster={node.attrs.poster ?? undefined} muted controls playsInline preload="metadata" />
      <button
        type="button"
        onClick={deleteNode}
        className="absolute right-4 top-3 bg-void/85 px-2.5 py-1 text-[11.5px] text-paper opacity-0 transition-opacity group-hover:opacity-100"
      >
        삭제
      </button>
    </NodeViewWrapper>
  )
}

// ── 규격 밖 HTML ──
function HtmlBlockView({ node, deleteNode, selected }: ReactNodeViewProps) {
  return (
    <NodeViewWrapper className={`ed-html group relative ${selected ? 'is-selected' : ''}`} contentEditable={false} data-drag-handle="">
      <span className="mb-2 block font-plex text-[9.5px] tracking-[0.14em] text-stone-light">
        HTML · 규격 밖 블록 — 원문 그대로 보존됩니다(여기서는 고칠 수 없음)
      </span>
      <div className="ed-html-preview" dangerouslySetInnerHTML={{ __html: String(node.attrs.html ?? '') }} />
      <button
        type="button"
        onClick={deleteNode}
        className="absolute right-3 top-3 bg-void/85 px-2.5 py-1 text-[11.5px] text-paper opacity-0 transition-opacity group-hover:opacity-100"
      >
        삭제
      </button>
    </NodeViewWrapper>
  )
}

/** 노드뷰를 덧붙인 편집용 확장 — 스키마(parse/render)는 그대로 */
export function editorNodeViews(options: { fromClaude: boolean }) {
  return [
    Figure.extend({ addNodeView: () => ReactNodeViewRenderer(FigureView) }),
    ImageSlot.extend({
      addOptions: () => ({ fromClaude: options.fromClaude }),
      addNodeView: () => ReactNodeViewRenderer(SlotView, { stopEvent: ({ event }) => event.type.startsWith('drag') || event.type === 'drop' || event.type.startsWith('mouse') || event.type.startsWith('key') || event.type === 'input' }),
    }),
    Video.extend({ addNodeView: () => ReactNodeViewRenderer(VideoView) }),
    HtmlBlock.extend({ addNodeView: () => ReactNodeViewRenderer(HtmlBlockView) }),
  ]
}
