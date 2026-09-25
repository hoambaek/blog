'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { saveEnglishReview } from '@/lib/actions/posts'
import { htmlFromContent } from '@/lib/article/parse'
import { blockHash, fieldHash, readReview, reviewState, type BlockReviewState, type EnReview } from '@/lib/article/review'
import { streamTranslation } from '@/lib/admin/translate-client'
import { recordNo } from '@/lib/journal/format'
import { isMediaOnlyBlock, splitTopLevelBlocks } from '@/lib/translation'
import type { PostWithCategory } from '@/lib/supabase/types'
import { Button, ConfirmDialog } from './ui'

/*
 * 번역 검수 — Paper IM8-0
 * 한국어 원문 블록과 영문 블록을 순서대로 나란히 놓고, 블록마다 확인/확인 필요를 표시한다.
 * 상태는 원문 블록 해시로 저장한다(lib/article/review.ts) — 원문이 바뀌어 저장 때 다시 번역된 블록은
 * "다시 번역됨 · 확인 필요"로 강조된다. 영문은 여기서 직접 고칠 수 있다(블록을 벗어나면 반영).
 */

interface Row {
  key: string
  kind: string
  hash: string
  ko: string
  /** 본문 블록이면 영문 블록 HTML, 필드면 글자 */
  en: string | null
  field?: 'title' | 'excerpt'
  koChanged: boolean
}

function blockKind(html: string, headingNo: number): string {
  const tag = /^<(\w+)/.exec(html)?.[1]?.toLowerCase() ?? ''
  if (tag === 'p' && /^<p[^>]*class="[^"]*\blead\b/.test(html)) return 'LEAD'
  if (['h1', 'h2', 'h3'].includes(tag)) return `${String(headingNo).padStart(2, '0')} · HEADING`
  if (['h4', 'h5', 'h6'].includes(tag)) return 'SUBHEADING'
  if (tag === 'p') return 'PARAGRAPH'
  if (tag === 'figure') return /data-slot/.test(html) ? 'IMAGE SLOT · CAPTION' : 'FIGURE · CAPTION'
  if (tag === 'blockquote') return 'QUOTE'
  if (tag === 'dl') return 'TERMS'
  if (tag === 'ul' || tag === 'ol') return 'LIST'
  return tag.toUpperCase() || 'BLOCK'
}

/** 영문 전체 HTML에서 글자 블록 i번째를 바꿔 끼운다(이미지·영상 블록 자리는 그대로) */
function replaceTextBlock(fullHtml: string, textIndex: number, nextBlock: string): string {
  const all = splitTopLevelBlocks(fullHtml)
  let t = -1
  return all
    .map((block) => {
      if (isMediaOnlyBlock(block)) return block
      t++
      return t === textIndex ? nextBlock : block
    })
    .join('')
}

const STATE_LABEL: Record<BlockReviewState, string> = {
  ok: '✓ 확인',
  pending: '확인 필요',
  changed: '다시 번역됨 · 확인 필요',
}

export function TranslationReview({ post, number }: { post: PostWithCategory; number: number | null }) {
  const router = useRouter()
  const { showToast } = useToast()
  const koHtml = htmlFromContent(post.content)
  const [titleEn, setTitleEn] = useState(post.title_en ?? '')
  const [excerptEn, setExcerptEn] = useState(post.excerpt_en ?? '')
  const [enHtml, setEnHtml] = useState(htmlFromContent(post.content_en))
  const [review, setReview] = useState<EnReview>(() => readReview(post.en_review))
  const [busy, setBusy] = useState<null | 'save' | 'retranslate'>(null)
  const [retranslatePct, setRetranslatePct] = useState(0)
  const [confirmRetranslate, setConfirmRetranslate] = useState(false)

  const koBlocks = useMemo(() => splitTopLevelBlocks(koHtml).filter((b) => !isMediaOnlyBlock(b)), [koHtml])
  const enBlocks = useMemo(() => splitTopLevelBlocks(enHtml).filter((b) => !isMediaOnlyBlock(b)), [enHtml])
  const aligned = koBlocks.length === enBlocks.length

  const rows = useMemo<Row[]>(() => {
    const list: Row[] = [
      {
        key: 'title',
        kind: 'TITLE',
        hash: fieldHash('title', post.title),
        ko: post.title,
        en: titleEn,
        field: 'title',
        koChanged: false,
      },
    ]
    if (post.excerpt) {
      list.push({
        key: 'excerpt',
        kind: 'EXCERPT',
        hash: fieldHash('excerpt', post.excerpt),
        ko: post.excerpt,
        en: excerptEn,
        field: 'excerpt',
        koChanged: false,
      })
    }
    let heading = 0
    koBlocks.forEach((block, i) => {
      if (/^<h[1-3]\b/i.test(block)) heading++
      list.push({
        key: `b${i}`,
        kind: blockKind(block, heading),
        hash: blockHash(block),
        ko: block,
        en: enBlocks[i] ?? null,
        koChanged: false,
      })
    })
    return list.map((row) => ({ ...row, koChanged: reviewState(row.hash, review) === 'changed' }))
  }, [post.title, post.excerpt, titleEn, excerptEn, koBlocks, enBlocks, review])

  const pending = rows.filter((r) => reviewState(r.hash, review) !== 'ok').length

  /** 저장 — 지금 보이는 해시만 남기고, 아직 "원문 수정됨" 상태인 것은 known에 넣지 않는다 */
  const persist = async (next: EnReview, extra: { titleEn?: string; excerptEn?: string; enHtml?: string } = {}) => {
    const current = rows.map((r) => r.hash)
    const confirmed = next.confirmed.filter((h) => current.includes(h))
    const known = current.filter((h) => confirmed.includes(h) || next.known.includes(h) || reviewState(h, next) === 'pending')
    const payload = { confirmed, known, completed_at: next.completed_at }
    setBusy('save')
    const result = await saveEnglishReview(post.id, {
      en_review: payload,
      ...(extra.titleEn !== undefined ? { title_en: extra.titleEn || null } : {}),
      ...(extra.excerptEn !== undefined ? { excerpt_en: extra.excerptEn || null } : {}),
      ...(extra.enHtml !== undefined ? { content_en: extra.enHtml || null } : {}),
    })
    setBusy(null)
    if (!result.success) {
      showToast(result.error || '검수 상태를 저장하지 못했습니다.', 'error')
      return false
    }
    setReview(payload)
    return true
  }

  const toggle = (row: Row) => {
    const ok = review.confirmed.includes(row.hash)
    const confirmed = ok ? review.confirmed.filter((h) => h !== row.hash) : [...review.confirmed, row.hash]
    void persist({ ...review, confirmed, completed_at: null })
  }

  const editField = (field: 'title' | 'excerpt', value: string) => {
    const before = field === 'title' ? post.title_en ?? '' : post.excerpt_en ?? ''
    if (value === before) return
    void persist(review, field === 'title' ? { titleEn: value } : { excerptEn: value })
  }

  const editBlock = (index: number, html: string) => {
    if (!enBlocks[index] || html === enBlocks[index]) return
    const nextHtml = replaceTextBlock(enHtml, index, html)
    setEnHtml(nextHtml)
    void persist(review, { enHtml: nextHtml })
  }

  const completeAll = async () => {
    const all = rows.map((r) => r.hash)
    const ok = await persist({ confirmed: all, known: all, completed_at: new Date().toISOString() }, { titleEn, excerptEn, enHtml })
    if (ok) {
      showToast('영문 검수를 마쳤습니다.', 'success')
      router.refresh()
    }
  }

  const retranslateAll = async () => {
    setConfirmRetranslate(false)
    setBusy('retranslate')
    setRetranslatePct(0)
    const translated = await streamTranslation(
      {
        title: post.title,
        excerpt: post.excerpt || undefined,
        content: koHtml || undefined,
        metaTitle: post.meta_title || undefined,
        metaDescription: post.meta_description || undefined,
      },
      setRetranslatePct,
    )
    setBusy(null)
    if (!translated) {
      showToast('다시 번역하지 못했습니다. 영문은 그대로입니다.', 'error')
      return
    }
    const nextTitle = translated.title_en ?? titleEn
    const nextExcerpt = translated.excerpt_en ?? excerptEn
    const nextHtml = translated.content_en ?? enHtml
    setTitleEn(nextTitle)
    setExcerptEn(nextExcerpt)
    setEnHtml(nextHtml)
    setBusy('save')
    const result = await saveEnglishReview(post.id, {
      title_en: nextTitle || null,
      excerpt_en: nextExcerpt || null,
      content_en: nextHtml || null,
      meta_title_en: translated.meta_title_en,
      meta_description_en: translated.meta_description_en,
      // 전부 새 번역 — 확인 기록을 비우고 지금 원문을 기준으로 삼는다
      en_review: { confirmed: [], known: rows.map((r) => r.hash), completed_at: null },
    })
    setBusy(null)
    if (!result.success) {
      showToast(result.error || '번역은 받았지만 저장하지 못했습니다.', 'error')
      return
    }
    setReview({ confirmed: [], known: rows.map((r) => r.hash), completed_at: null })
    showToast('전체를 다시 번역했습니다. 블록마다 확인해 주세요.', 'success')
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 bg-void px-7">
        <div className="flex min-w-0 items-center gap-[22px]">
          <Link href={`/admin/posts/${post.id}/edit`} className="shrink-0 text-[13.5px] font-light leading-[18px] text-paper/70 hover:text-paper">
            ‹ 편집으로
          </Link>
          <span className="h-4 w-px shrink-0 bg-paper/20" />
          <span className="shrink-0 font-plex text-[11.5px] leading-[14px] tracking-[0.1em] text-amber">N° {number ? recordNo(number) : '—'}</span>
          <span className="truncate text-[13px] font-light leading-4 text-paper/55">
            영문 검수 · {rows.length}개 중 {pending ? `${pending}개 확인 필요` : '모두 확인'}
            {busy === 'save' ? ' · 저장 중…' : ''}
            {busy === 'retranslate' ? ` · 다시 번역 중 ${retranslatePct}%` : ''}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Button tone="outlineDark" className="px-[18px] py-[9px] text-[13px]" onClick={() => setConfirmRetranslate(true)} disabled={!!busy}>
            전체 다시 번역
          </Button>
          <Button tone="amber" className="px-[18px] py-2.5 text-[13px]" onClick={() => void completeAll()} disabled={!!busy || !enHtml}>
            검수 완료
          </Button>
        </div>
      </header>

      <div className="flex flex-col px-20 pb-24 pt-10 max-lg:px-6">
        {!enHtml && (
          <p className="mb-6 border border-dashed border-amber-deep/60 px-5 py-4 text-[13.5px] font-light text-earth">
            영문 본문이 없습니다. &lsquo;전체 다시 번역&rsquo;으로 만들 수 있습니다.
          </p>
        )}
        {enHtml && !aligned && (
          <p className="mb-6 border border-dashed border-amber-deep/60 px-5 py-4 text-[13.5px] font-light leading-6 text-earth">
            한국어 {koBlocks.length}블록 · 영문 {enBlocks.length}블록 — 블록 수가 달라 순서대로 맞지 않을 수 있습니다. &lsquo;전체 다시 번역&rsquo;을 권합니다.
          </p>
        )}

        <div className="flex gap-14 border-b border-earth/30 pb-3">
          <span className="flex-1 font-plex text-[10.5px] leading-[14px] tracking-[0.18em] text-stone-light">한국어 · 원문</span>
          <span className="flex-1 font-plex text-[10.5px] leading-[14px] tracking-[0.18em] text-stone-light">ENGLISH · 자동 번역, 직접 수정 가능</span>
        </div>

        {rows.map((row, i) => {
          const state = reviewState(row.hash, review)
          const needsLook = state !== 'ok'
          const blockIndex = row.field ? -1 : i - (post.excerpt ? 2 : 1)
          return (
            <div key={row.key} className="flex gap-14 border-b border-earth/[0.12] py-[22px]">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="font-plex text-[9.5px] leading-3 tracking-[0.14em] text-stone-light">
                  {row.kind}
                  {row.koChanged ? ' · 원문 수정됨' : ''}
                </span>
                {row.field ? (
                  <span className={row.field === 'title' ? 'font-serif-kr text-[22px] leading-7 text-earth' : 'text-[15px] font-light leading-7 text-earth'}>
                    {row.ko}
                  </span>
                ) : (
                  <div className="tr-ko" dangerouslySetInnerHTML={{ __html: row.ko }} />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex justify-between gap-4">
                  <span className="font-plex text-[9.5px] leading-3 tracking-[0.14em] text-stone-light">{row.kind}</span>
                  <button
                    type="button"
                    onClick={() => toggle(row)}
                    disabled={!!busy || row.en === null}
                    title={state === 'ok' ? '눌러서 확인 취소' : '눌러서 확인'}
                    className={`shrink-0 text-[11.5px] leading-[14px] ${needsLook ? 'text-amber-deep hover:text-earth' : 'text-stone hover:text-earth'}`}
                  >
                    {row.en === null ? '영문 없음' : STATE_LABEL[state]}
                  </button>
                </div>
                <div className={needsLook ? '-mx-2 bg-amber/[0.18] px-2 py-0.5' : ''}>
                  {row.field ? (
                    <textarea
                      value={row.field === 'title' ? titleEn : excerptEn}
                      rows={1}
                      onChange={(e) => (row.field === 'title' ? setTitleEn(e.target.value) : setExcerptEn(e.target.value))}
                      onBlur={(e) => editField(row.field!, e.target.value)}
                      className={`block w-full resize-none bg-transparent font-garamond font-light text-earth outline-none [field-sizing:content] ${
                        row.field === 'title' ? 'text-[26px] leading-8' : 'text-[17px] leading-7'
                      }`}
                    />
                  ) : row.en !== null ? (
                    <div
                      className="tr-en outline-none"
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => editBlock(blockIndex, e.currentTarget.innerHTML)}
                      dangerouslySetInnerHTML={{ __html: row.en }}
                    />
                  ) : (
                    <span className="text-[13px] font-light text-stone-light">이 블록에 맞는 영문이 없습니다.</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <ConfirmDialog
        open={confirmRetranslate}
        title="전체를 다시 번역할까요?"
        body="제목·발췌·본문 영문을 새로 만들고 저장합니다. 여기서 직접 고친 영문과 확인 표시는 사라집니다."
        confirmLabel="다시 번역"
        onCancel={() => setConfirmRetranslate(false)}
        onConfirm={() => void retranslateAll()}
      />

      <style>{`
        .tr-ko :is(p, li, dd) { font-family: var(--font-sans-kr); font-size: 15px; font-weight: 300; line-height: 28px; }
        .tr-ko p.lead, .tr-ko blockquote p { font-family: var(--font-serif-kr); font-size: 16px; line-height: 29px; }
        .tr-ko :is(h1, h2, h3, h4, h5, h6), .tr-ko dt { font-family: var(--font-serif-kr); font-size: 18px; line-height: 26px; }
        .tr-en :is(p, li, dd, cite, span) { font-family: var(--font-garamond); font-size: 17px; font-weight: 300; line-height: 28px; }
        .tr-en p.lead, .tr-en blockquote p { font-size: 18px; line-height: 29px; }
        .tr-en :is(h1, h2, h3, h4, h5, h6), .tr-en dt { font-family: var(--font-garamond); font-size: 21px; font-weight: 300; line-height: 26px; }
        .tr-ko img, .tr-en img { display: none; }
        .tr-ko figcaption span, .tr-en figcaption span { display: block; }
        .tr-ko dl > div, .tr-en dl > div { display: flex; gap: 16px; }
        .tr-ko ul, .tr-en ul { list-style: disc; padding-left: 1.2em; }
        .tr-ko ol, .tr-en ol { list-style: decimal; padding-left: 1.4em; }
        .tr-ko cite, .tr-en cite { display: block; font-style: normal; font-size: 12px; color: #8C857B; }
        .tr-ko a, .tr-en a { text-decoration: underline; text-decoration-color: rgb(168 135 79 / 0.6); }
      `}</style>
    </div>
  )
}
