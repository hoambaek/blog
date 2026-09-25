'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { createPost, deletePost, updatePost } from '@/lib/actions/posts'
import { collectFigureCredits, htmlFromContent, parseArticleHtml } from '@/lib/article/parse'
import { readReview, reviewHashes } from '@/lib/article/review'
import { indexToRecord, mergeCredits, readingMinutes, resolveNextRecord } from '@/lib/admin/records'
import type { PublishedIndexItem } from '@/lib/admin/data'
import { dateline, recordNo } from '@/lib/journal/format'
import { planContentTranslation, type TranslatedContent, type TranslationInput } from '@/lib/translation'
import { uploadMediaFile } from '@/lib/upload/client'
import { streamTranslation } from '@/lib/admin/translate-client'
import type { PostWithCategory } from '@/lib/supabase/types'
import { PREVIEW_MESSAGE, PREVIEW_READY, type PreviewPayload } from '../preview/protocol'
import { Button, ConfirmDialog, Label } from '../ui'
import { ArticleEditor } from './ArticleEditor'

/*
 * 기록 편집 화면 — Paper IIL-0
 *   상단: ‹ 기록 · N° · 상태·저장 시각 · 편집/미리보기 PC/모바일 · 미리보기 링크 복사 · 저장 · 발행(변경 발행)
 *   가운데: 공개 글과 같은 타이포의 편집 캔버스 (머리 + 블록 본문)
 *   오른쪽: 발행·정보·관측·번역·SEO 탭
 * 저장은 상태를 바꾸지 않는다(긴급 수정 e7352d7의 규칙). 상태는 발행·발행 취소 버튼으로만 바뀐다.
 */

type SeriesOption = { id: string; name: string; slug: string }
type Mode = 'edit' | 'pc' | 'mobile'
type PanelTab = 'publish' | 'info' | 'sea' | 'translate' | 'seo'
type SaveStep = 'check' | 'translate' | 'save'

interface FormState {
  title: string
  slug: string
  excerpt: string
  categoryId: string
  cover: string
  photoCredits: string
  metaTitle: string
  metaDescription: string
  nextPostId: string
  html: string
}

function formFrom(post: PostWithCategory | null): FormState {
  return {
    title: post?.title ?? '',
    slug: post?.slug ?? '',
    excerpt: post?.excerpt ?? '',
    categoryId: post?.category_id ?? '',
    cover: post?.cover_image_url ?? '',
    photoCredits: post?.photo_credits ?? '',
    metaTitle: post?.meta_title ?? '',
    metaDescription: post?.meta_description ?? '',
    nextPostId: post?.next_post_id ?? '',
    html: htmlFromContent(post?.content),
  }
}

function slugFromTitle(title: string): string {
  const english = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  if (english) return english
  const now = new Date()
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  return `post-${date}-${Math.random().toString(36).slice(2, 8)}`
}

const timeFmt = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false })

const EXCERPT_MAX = 120

export function PostEditor({
  post,
  series,
  publishedIndex,
  number,
  seaAvg,
  today,
}: {
  post: PostWithCategory | null
  series: SeriesOption[]
  publishedIndex: PublishedIndexItem[]
  number: number | null
  seaAvg: number | null
  today: string
}) {
  const router = useRouter()
  const { showToast } = useToast()

  // 저장된 기준 — 바뀐 곳 판단·부분 번역 비교에 쓴다
  const [saved, setSaved] = useState<PostWithCategory | null>(post)
  const [form, setForm] = useState<FormState>(() => formFrom(post))
  const [mode, setMode] = useState<Mode>('edit')
  const [tab, setTab] = useState<PanelTab>('info')
  const [progress, setProgress] = useState<{ step: SaveStep; pct: number; publishing: boolean; note?: string } | null>(null)
  const [confirm, setConfirm] = useState<'publish' | 'unpublish' | 'delete' | 'leave' | null>(null)
  const [coverBusy, setCoverBusy] = useState(false)
  const [coverSize, setCoverSize] = useState<string | null>(null)
  const coverInput = useRef<HTMLInputElement>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)

  const status = saved?.status ?? 'draft'
  const isPublished = status === 'published'
  const fromClaude = saved?.draft_source === 'claude'
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }))

  const baseline = useMemo(() => formFrom(saved), [saved])
  const dirty = useMemo(() => (Object.keys(form) as (keyof FormState)[]).some((k) => form[k] !== baseline[k]), [form, baseline])

  // 본문에서 나오는 값들
  const blocks = useMemo(() => parseArticleHtml(form.html), [form.html])
  const emptySlots = blocks.filter((b) => b.type === 'slot').length
  const figureCredits = useMemo(() => collectFigureCredits(blocks), [blocks])
  const credits = useMemo(() => mergeCredits(figureCredits, form.photoCredits), [figureCredits, form.photoCredits])
  const minutes = readingMinutes(form.html)
  const seriesItem = series.find((s) => s.id === form.categoryId) ?? null
  const observedDate = isPublished && saved?.published_at ? saved.published_at : today
  const next = resolveNextRecord(publishedIndex, {
    id: saved?.id ?? null,
    publishedAt: saved?.published_at ?? null,
    status,
    nextPostId: form.nextPostId || null,
  })

  // 번역 탭 — 저장된 영문 기준 검수 현황
  const enSummary = useMemo(() => {
    if (!saved) return null
    const htmlEn = htmlFromContent(saved.content_en)
    if (!htmlEn) return { hasEn: false, total: 0, pending: 0 }
    const hashes = reviewHashes({ title: saved.title, excerpt: saved.excerpt, html: htmlFromContent(saved.content) })
    const review = readReview(saved.en_review)
    return { hasEn: true, total: hashes.length, pending: hashes.filter((h) => !review.confirmed.includes(h)).length }
  }, [saved])

  // ── 미리보기(iframe)에 저장 전 상태 보내기 ──
  const previewPayload = useMemo<PreviewPayload>(
    () => ({
      record: {
        id: saved?.id ?? 'new',
        slug: form.slug,
        number,
        title: form.title,
        titleEn: null,
        excerpt: form.excerpt || null,
        excerptEn: null,
        cover: form.cover || null,
        publishedAt: observedDate,
        readingMinutes: minutes,
        series: seriesItem ? { slug: seriesItem.slug, name: seriesItem.name } : null,
        seaAvg,
      },
      html: form.html,
      credits,
      next: next.item ? indexToRecord(next.item) : null,
    }),
    [saved?.id, form, number, observedDate, minutes, seriesItem, seaAvg, credits, next.item],
  )

  const postPreview = useCallback(() => {
    frameRef.current?.contentWindow?.postMessage({ type: PREVIEW_MESSAGE, payload: previewPayload }, window.location.origin)
  }, [previewPayload])

  useEffect(() => {
    if (mode === 'edit') return
    postPreview()
    const onMessage = (event: MessageEvent) => {
      if (event.origin === window.location.origin && (event.data as { type?: string })?.type === PREVIEW_READY) postPreview()
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [mode, postPreview])

  // 업로드 오류(노드뷰에서 올라옴)
  useEffect(() => {
    const onError = (event: Event) => showToast((event as CustomEvent<string>).detail, 'error')
    window.addEventListener('editor-error', onError)
    return () => window.removeEventListener('editor-error', onError)
  }, [showToast])

  // 저장 안 한 채 나가기 경고
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  // ── 저장 (번역 → 저장). targetStatus 생략 = 현재 상태 유지 ──
  const runStreamingTranslation = (input: TranslationInput) =>
    streamTranslation(input, (pct) =>
      setProgress((prev) => (prev ? { ...prev, step: 'translate', pct: 8 + Math.round(pct * 0.8) } : prev)),
    )

  const save = async (targetStatus?: 'draft' | 'published') => {
    if (!form.title.trim()) {
      showToast('제목을 입력해 주세요.', 'error')
      return
    }
    const slug = (form.slug.trim() || slugFromTitle(form.title)).toLowerCase()
    if (!/^[a-z0-9-]+$/.test(slug)) {
      showToast('slug는 영문 소문자·숫자·하이픈만 쓸 수 있습니다.', 'error')
      setTab('info')
      return
    }
    const publishing = targetStatus === 'published'
    setProgress({ step: 'check', pct: 3, publishing })

    try {
      const postData = {
        title: form.title,
        slug,
        excerpt: form.excerpt || undefined,
        photo_credits: form.photoCredits.trim() || null,
        content: form.html,
        category_id: form.categoryId || null,
        ...(targetStatus ? { status: targetStatus } : {}),
        cover_image_url: form.cover || null,
        meta_title: form.metaTitle || null,
        meta_description: form.metaDescription || null,
        next_post_id: form.nextPostId || null,
      }

      // 무엇을 번역할지 — 수정 저장이면 저장본과 비교해 바뀐 것만 (바뀐 블록만 다시 번역)
      let input: TranslationInput = {
        title: form.title,
        excerpt: form.excerpt || undefined,
        content: form.html || undefined,
        metaTitle: form.metaTitle || undefined,
        metaDescription: form.metaDescription || undefined,
      }
      let plan: ReturnType<typeof planContentTranslation> | null = null
      let note: string | undefined
      if (saved) {
        plan = planContentTranslation(baseline.html, form.html, htmlFromContent(saved.content_en) || null)
        input = {}
        if (form.title !== baseline.title) input.title = form.title
        if (form.excerpt !== baseline.excerpt && form.excerpt) input.excerpt = form.excerpt
        if (form.metaTitle !== baseline.metaTitle && form.metaTitle) input.metaTitle = form.metaTitle
        if (form.metaDescription !== baseline.metaDescription && form.metaDescription) input.metaDescription = form.metaDescription
        if (plan.mode === 'full') input.content = form.html
        else if (plan.mode === 'partial') {
          input.content = plan.htmlToTranslate
          note = '바뀐 블록만 번역'
        }
      }

      let pretranslated: TranslatedContent | null = null
      if (Object.values(input).some(Boolean)) {
        setProgress({ step: 'translate', pct: 8, publishing, note })
        const translated = await runStreamingTranslation(input)
        if (translated) {
          let contentEn: string | null = input.content ? translated.content_en : null
          let assembleFailed = false
          if (plan && (plan.mode === 'partial' || plan.mode === 'media-only')) {
            contentEn = plan.assemble?.(translated.content_en ?? undefined) ?? null
            assembleFailed = plan.mode === 'partial' && !contentEn
          }
          if (!assembleFailed) {
            pretranslated = {
              title_en: input.title ? translated.title_en : null,
              excerpt_en: input.excerpt ? translated.excerpt_en : null,
              content_en: contentEn,
              meta_title_en: input.metaTitle ? translated.meta_title_en : null,
              meta_description_en: input.metaDescription ? translated.meta_description_en : null,
            }
          }
        }
      } else {
        // 글자 변경 없음 — 번역을 건너뛰고, 이미지만 바뀌었으면 영문본 이미지를 맞춘다
        pretranslated = {
          title_en: null,
          excerpt_en: null,
          content_en: plan?.mode === 'media-only' ? (plan.assemble?.() ?? null) : null,
          meta_title_en: null,
          meta_description_en: null,
        }
        note = '글자 변경 없음 — 번역 건너뜀'
      }

      setProgress({ step: 'save', pct: 90, publishing, note })
      const result = saved
        ? await updatePost(saved.id, postData, pretranslated)
        : await createPost({ ...postData, status: postData.status ?? 'draft' }, pretranslated)

      if (!result.success || !('data' in result) || !result.data) {
        showToast(result.error || '저장 중 오류가 발생했습니다.', 'error')
        return
      }
      setProgress({ step: 'save', pct: 100, publishing })
      showToast(
        targetStatus === 'published'
          ? isPublished
            ? '변경 사항을 발행했습니다.'
            : '발행했습니다.'
          : targetStatus === 'draft'
            ? '발행을 취소하고 초안으로 돌렸습니다.'
            : '저장했습니다.',
        'success',
      )
      if (result.warning) showToast(result.warning, 'warning')

      const next = { ...(result.data as PostWithCategory), category: saved?.category ?? null }
      setSaved(next)
      setForm((prev) => ({ ...prev, slug: next.slug }))
      if (!saved) router.replace(`/admin/posts/${next.id}/edit`)
      else router.refresh()
    } catch (error) {
      console.error('Error saving post:', error)
      showToast('저장 중 오류가 발생했습니다.', 'error')
    } finally {
      setProgress(null)
    }
  }

  // ⌘S / Ctrl+S = 저장
  const saveRef = useRef(save)
  useEffect(() => {
    saveRef.current = save
  })
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void saveRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const uploadCover = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('이미지 파일만 커버로 쓸 수 있습니다.', 'error')
      return
    }
    setCoverBusy(true)
    try {
      const { url } = await uploadMediaFile(file, 'covers')
      set('cover', url)
    } catch (error) {
      showToast(error instanceof Error ? error.message : '커버 업로드에 실패했습니다.', 'error')
    } finally {
      setCoverBusy(false)
    }
  }

  const copyPreviewLink = async () => {
    if (!saved) return
    const url = `${window.location.origin}/admin/posts/${saved.id}/preview`
    try {
      await navigator.clipboard.writeText(url)
      showToast(dirty ? '미리보기 링크를 복사했습니다. 링크는 저장된 내용을 보여 줍니다.' : '미리보기 링크를 복사했습니다.', 'success')
    } catch {
      window.prompt('미리보기 링크 (관리자 로그인 필요)', url)
    }
  }

  const doDelete = async () => {
    if (!saved) return
    const result = await deletePost(saved.id)
    if (result.success) {
      showToast('기록을 지웠습니다.', 'success')
      router.push('/admin')
    } else showToast(result.error || '삭제하지 못했습니다.', 'error')
  }

  const savedTime = saved?.updated_at ? timeFmt.format(new Date(saved.updated_at)) : null
  const statusLine = [
    isPublished ? '발행됨' : saved ? '초안' : '새 기록',
    dirty ? '저장 안 한 변경 있음' : savedTime ? `저장됨 ${savedTime}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const stats = [
    { label: 'PUBLISHED', value: dateline(observedDate) },
    ...(seaAvg !== null ? [{ label: 'SEA · 1Y AVG', value: `${seaAvg.toFixed(1)}°C · 1Y` }] : []),
    { label: 'READING', value: `${minutes} MIN` },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-sand">
      {/* ── 상단 바 ── */}
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-4 bg-void px-7">
        <div className="flex min-w-0 items-center gap-[22px]">
          <Link
            href="/admin"
            onClick={(e) => {
              if (dirty) {
                e.preventDefault()
                setConfirm('leave')
              }
            }}
            className="shrink-0 text-[13.5px] font-light leading-[18px] text-paper/70 hover:text-paper"
          >
            ‹ 기록
          </Link>
          <span className="h-4 w-px shrink-0 bg-paper/20" />
          <span className="shrink-0 font-plex text-[11.5px] leading-[14px] tracking-[0.1em] text-amber">
            N° {number ? recordNo(number) : '—'}
          </span>
          <span className="truncate text-[13px] font-light leading-4 text-paper/55">{statusLine}</span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex border border-paper/25" role="tablist" aria-label="보기">
            {(
              [
                ['edit', '편집'],
                ['pc', '미리보기 · PC'],
                ['mobile', '모바일'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={mode === value}
                onClick={() => setMode(value)}
                className={`px-3.5 py-2 text-[12.5px] leading-4 ${mode === value ? 'bg-paper text-void' : 'font-light text-paper/70 hover:text-paper'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <Button tone="ghostDark" className="px-4 py-[9px] text-[12.5px] font-light" onClick={copyPreviewLink} disabled={!saved}>
            미리보기 링크 복사
          </Button>
          <Button tone="outlineDark" className="px-[18px] py-[9px] text-[13px]" onClick={() => void save()} disabled={!!progress}>
            저장
          </Button>
          <Button tone="amber" className="px-[18px] py-2.5 text-[13px]" onClick={() => setConfirm('publish')} disabled={!!progress}>
            {isPublished ? '변경 발행' : '발행'} <span aria-hidden>›</span>
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* ── 가운데: 편집 캔버스 / 미리보기 ── */}
        <section className="min-w-0 flex-1">
          <div className={mode === 'edit' ? 'flex flex-col items-center px-10 pb-24 pt-16' : 'hidden'}>
            <div className="flex w-full max-w-[640px] flex-col items-center gap-5">
              <div className="flex items-baseline gap-4">
                <span className="font-plex text-[12px] leading-4 tracking-[0.14em] text-amber-deep">
                  N° {number ? recordNo(number) : '—'}
                </span>
                <span className="text-[12.5px] leading-4 text-stone">{seriesItem?.name ?? '연재 없음'}</span>
              </div>
              <textarea
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="제목"
                rows={1}
                className="w-full resize-none bg-transparent text-center font-serif-kr text-[48px] font-light leading-[60px] text-earth outline-none [field-sizing:content] placeholder:text-earth/30"
              />
              <textarea
                value={form.excerpt}
                onChange={(e) => set('excerpt', e.target.value)}
                placeholder="발췌문 — 목록과 글 머리에 나가는 한두 줄"
                rows={1}
                className="w-full resize-none bg-transparent text-center text-[16px] font-light leading-7 text-earth/75 outline-none [field-sizing:content] placeholder:text-earth/35"
              />
              <div className="mt-1.5 flex items-center gap-6 border border-dashed border-amber-deep/60 px-[18px] py-3" title="관측 줄은 저장하지 않고 렌더 때 계산합니다">
                <span className="font-plex text-[10px] leading-3 tracking-[0.16em] text-amber-deep">AUTO</span>
                {stats.map((s) => (
                  <span key={s.label} className="font-plex text-[12px] leading-4 text-earth">
                    {s.value}
                  </span>
                ))}
              </div>
              {form.cover ? (
                <button
                  type="button"
                  onClick={() => coverInput.current?.click()}
                  className="group relative mt-5 block w-full"
                  title="클릭해서 커버 교체"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.cover}
                    alt=""
                    className={`block aspect-[16/9] w-full object-cover ${coverBusy ? 'opacity-40' : ''}`}
                    onLoad={(e) => setCoverSize(`${e.currentTarget.naturalWidth} × ${e.currentTarget.naturalHeight}`)}
                  />
                  <span className="absolute right-3 top-3 bg-void/85 px-2.5 py-1 text-[11.5px] text-paper opacity-0 transition-opacity group-hover:opacity-100">
                    커버 교체
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => coverInput.current?.click()}
                  className="mt-5 flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 border border-dashed border-earth/40 bg-paper/50 text-[12.5px] font-light text-stone"
                >
                  <span className="font-plex text-[10px] tracking-[0.16em] text-amber-deep">COVER</span>
                  {coverBusy ? '올리는 중…' : '커버 이미지 올리기'}
                </button>
              )}
            </div>
            <div className="w-full max-w-[640px] pt-14">
              <ArticleEditor
                initialHtml={form.html}
                onChange={(html) => set('html', html)}
                postNumber={number}
                fromClaude={fromClaude}
              />
            </div>
          </div>

          {mode !== 'edit' && <PreviewFrame frameRef={frameRef} mode={mode} />}
        </section>

        {/* ── 오른쪽 패널 ── */}
        <aside className="sticky top-14 h-[calc(100vh-56px)] w-[360px] shrink-0 overflow-y-auto border-l border-earth/15 bg-paper">
          <div className="flex gap-[22px] border-b border-earth/15 px-6 pt-5" role="tablist">
            {(
              [
                ['publish', '발행'],
                ['info', '정보'],
                ['sea', '관측'],
                ['translate', '번역'],
                ['seo', 'SEO'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={tab === value}
                onClick={() => setTab(value)}
                className={`pb-3 text-[13px] leading-4 ${tab === value ? 'border-b border-earth text-earth' : 'border-b border-transparent font-light text-stone hover:text-earth'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-6 px-6 py-7">
            {tab === 'info' && (
              <>
                <Field label="SERIES">
                  <select
                    value={form.categoryId}
                    onChange={(e) => set('categoryId', e.target.value)}
                    className="w-full cursor-pointer bg-transparent text-[14px] leading-[18px] text-earth outline-none"
                  >
                    <option value="">연재 없음</option>
                    {series.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="SLUG" aside={isPublished ? '바꾸면 옛 주소가 끊깁니다' : undefined}>
                  <input
                    value={form.slug}
                    onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    placeholder={form.title ? slugFromTitle(form.title).replace(/-[a-z0-9]{6}$/, '-…') : 'english-slug'}
                    className="w-full bg-transparent font-plex text-[12.5px] leading-4 text-earth outline-none placeholder:text-earth/35"
                  />
                </Field>
                <Field label="EXCERPT" aside={`${form.excerpt.length} / ${EXCERPT_MAX}`} warn={form.excerpt.length > EXCERPT_MAX}>
                  <textarea
                    value={form.excerpt}
                    onChange={(e) => set('excerpt', e.target.value)}
                    rows={3}
                    className="w-full resize-none bg-transparent text-[13.5px] font-light leading-[22px] text-earth outline-none [field-sizing:content]"
                  />
                </Field>
                <div className="flex flex-col gap-2.5">
                  <Label>COVER</Label>
                  <div className="flex items-center gap-3.5">
                    {form.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.cover} alt="" className="h-16 w-24 shrink-0 object-cover" />
                    ) : (
                      <span className="flex h-16 w-24 shrink-0 items-center justify-center border border-dashed border-earth/35 font-plex text-[9px] text-stone-light">
                        NO IMG
                      </span>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => coverInput.current?.click()}
                        className="self-start border-b border-earth/40 text-[13px] leading-4 text-earth"
                        disabled={coverBusy}
                      >
                        {coverBusy ? '올리는 중…' : form.cover ? '교체' : '올리기'}
                      </button>
                      {form.cover && coverSize && <span className="font-plex text-[10px] leading-3 text-stone-light">{coverSize}</span>}
                      {form.cover && (
                        <button type="button" onClick={() => set('cover', '')} className="self-start text-[11.5px] font-light text-stone-light hover:text-earth">
                          빼기
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <Field label="NEXT RECORD">
                  <select
                    value={form.nextPostId}
                    onChange={(e) => set('nextPostId', e.target.value)}
                    className="w-full cursor-pointer bg-transparent text-[14px] leading-[18px] text-earth outline-none"
                  >
                    <option value="">자동 · 발행일 순</option>
                    {publishedIndex
                      .filter((p) => p.id !== saved?.id)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          N° {recordNo(p.number)} {p.title}
                        </option>
                      ))}
                  </select>
                  <span className="text-[12px] font-light leading-4 text-stone-light">
                    {next.item ? `지금 연결: N° ${recordNo(next.item.number)} ${next.item.title}` : '지금 연결: 없음 (가장 오래된 기록)'}
                  </span>
                </Field>
                <div className="flex flex-col gap-2.5">
                  <div className="flex justify-between">
                    <Label>PHOTO CREDITS</Label>
                    <Label className="tracking-normal">자동 수집</Label>
                  </div>
                  {figureCredits.length === 0 && <span className="text-[12px] font-light text-stone-light">그림 크레딧이 아직 없습니다.</span>}
                  {figureCredits.map((c) => (
                    <span key={c} className="text-[13px] font-light leading-4 text-earth">
                      {c}
                    </span>
                  ))}
                  <label className="mt-1 flex flex-col gap-1.5 border-b border-earth/35 pb-2.5">
                    <Label>수동 추가 · 한 줄에 하나</Label>
                    <textarea
                      value={form.photoCredits}
                      onChange={(e) => set('photoCredits', e.target.value)}
                      rows={2}
                      placeholder="예: © Veuve Clicquot"
                      className="w-full resize-none bg-transparent text-[13px] font-light leading-5 text-earth outline-none [field-sizing:content] placeholder:text-earth/35"
                    />
                  </label>
                </div>
              </>
            )}

            {tab === 'publish' && (
              <>
                <Field label="STATUS">
                  <span className="text-[14px] leading-[18px] text-earth">
                    {isPublished ? `발행됨 · ${dateline(saved?.published_at)}` : status === 'scheduled' ? '예약(없어진 기능) — 초안처럼 다룹니다' : '초안'}
                  </span>
                  {isPublished && saved && (
                    <a href={`/post/${saved.slug}`} target="_blank" rel="noopener noreferrer" className="font-plex text-[11px] text-stone hover:text-earth">
                      /post/{saved.slug} ↗
                    </a>
                  )}
                </Field>
                {fromClaude && (
                  <Field label="SOURCE">
                    <span className="flex items-center gap-2 text-[13px] font-light text-earth">
                      <span className="bg-amber px-[7px] py-0.5 font-plex text-[10px] tracking-[0.08em] text-void">CLAUDE</span>
                      Claude가 올린 초안
                    </span>
                  </Field>
                )}
                <Field label="IMAGE SLOTS">
                  <span className={`text-[13px] leading-5 ${emptySlots ? 'text-amber-deep' : 'font-light text-stone'}`}>
                    {emptySlots ? `비어 있는 이미지 자리 ${emptySlots}곳 — 공개 화면에서는 보이지 않습니다` : '비어 있는 이미지 자리 없음'}
                  </span>
                </Field>
                <div className="flex flex-col gap-3">
                  <Button tone="dark" className="w-full py-3" onClick={() => setConfirm('publish')} disabled={!!progress}>
                    {isPublished ? '변경 발행' : '발행'}
                  </Button>
                  {isPublished && (
                    <Button tone="outline" className="w-full py-3" onClick={() => setConfirm('unpublish')} disabled={!!progress}>
                      발행 취소 (초안으로)
                    </Button>
                  )}
                  <p className="text-[12px] font-light leading-5 text-stone-light">
                    저장은 상태를 바꾸지 않습니다. 발행된 글을 저장하면 바로 공개 화면에 반영됩니다.
                  </p>
                </div>
                {saved && (
                  <button
                    type="button"
                    onClick={() => setConfirm('delete')}
                    className="self-start text-[12px] font-light text-stone-light underline-offset-4 hover:text-earth hover:underline"
                  >
                    기록 지우기
                  </button>
                )}
              </>
            )}

            {tab === 'sea' && (
              <>
                <Field label="PUBLISHED">
                  <span className="font-plex text-[13px] text-earth">{dateline(observedDate)}</span>
                  <span className="text-[12px] font-light leading-5 text-stone-light">{isPublished ? '발행일' : '초안은 오늘 기준으로 보여 줍니다'}</span>
                </Field>
                <Field label="SEA · 1Y AVG">
                  <span className="font-plex text-[13px] text-earth">{seaAvg !== null ? `${seaAvg.toFixed(1)}°C` : '— (칸 숨김)'}</span>
                  <span className="text-[12px] font-light leading-5 text-stone-light">
                    완도 해역 표층 수온을 월별 40m로 보정한 값의, 발행일까지 직전 365일 평균. 관측일이 모자라면 칸을 숨깁니다(값을 지어내지 않음).
                  </span>
                </Field>
                <Field label="READING">
                  <span className="font-plex text-[13px] text-earth">{minutes} MIN</span>
                  <span className="text-[12px] font-light leading-5 text-stone-light">단어 200개에 1분. 저장할 때 다시 셉니다.</span>
                </Field>
              </>
            )}

            {tab === 'translate' && (
              <>
                <Field label="ENGLISH">
                  {!saved ? (
                    <span className="text-[13px] font-light text-stone">처음 저장할 때 영문이 자동으로 만들어집니다.</span>
                  ) : !enSummary?.hasEn ? (
                    <span className="text-[13px] font-light text-stone">영문본이 없습니다. 저장하면 번역합니다.</span>
                  ) : (
                    <span className={`text-[13px] leading-5 ${enSummary.pending ? 'text-amber-deep' : 'text-earth'}`}>
                      {enSummary.pending ? `검수 대기 · ${enSummary.total}개 중 ${enSummary.pending}개 확인 필요` : `검수 완료 · ${enSummary.total}개 모두 확인`}
                    </span>
                  )}
                  {saved?.title_en && <span className="font-garamond text-[17px] font-light leading-6 text-earth">{saved.title_en}</span>}
                </Field>
                <p className="text-[12px] font-light leading-5 text-stone-light">
                  저장할 때 바뀐 블록만 다시 번역합니다. 다시 번역된 블록은 검수 화면에서 &lsquo;다시 번역됨 · 확인 필요&rsquo;로 표시됩니다. 검수 현황은 저장된 내용 기준입니다.
                </p>
                {saved && (
                  <Link
                    href={`/admin/posts/${saved.id}/translation`}
                    className="flex items-center justify-center gap-2 bg-void py-3 text-[13.5px] text-paper hover:bg-earth"
                  >
                    번역 검수 열기 <span aria-hidden>›</span>
                  </Link>
                )}
              </>
            )}

            {tab === 'seo' && (
              <>
                <Field label="META TITLE" aside={`${form.metaTitle.length} / 60`} warn={form.metaTitle.length > 60}>
                  <input
                    value={form.metaTitle}
                    onChange={(e) => set('metaTitle', e.target.value)}
                    placeholder={form.title || '비우면 제목을 씁니다'}
                    className="w-full bg-transparent text-[13.5px] font-light leading-5 text-earth outline-none placeholder:text-earth/35"
                  />
                </Field>
                <Field label="META DESCRIPTION" aside={`${form.metaDescription.length} / 160`} warn={form.metaDescription.length > 160}>
                  <textarea
                    value={form.metaDescription}
                    onChange={(e) => set('metaDescription', e.target.value)}
                    rows={3}
                    placeholder={form.excerpt || '비우면 발췌문을 씁니다'}
                    className="w-full resize-none bg-transparent text-[13.5px] font-light leading-[22px] text-earth outline-none [field-sizing:content] placeholder:text-earth/35"
                  />
                </Field>
                <Field label="SEARCH PREVIEW">
                  <span className="text-[15px] leading-5 text-[#1a0dab]">{form.metaTitle || form.title || '제목'}</span>
                  <span className="font-plex text-[11px] text-stone">blog.musedemaree.com/post/{form.slug || 'slug'}</span>
                  <span className="text-[12.5px] font-light leading-5 text-stone-dark">
                    {(form.metaDescription || form.excerpt || '').slice(0, 160) || '설명'}
                  </span>
                </Field>
              </>
            )}
          </div>
        </aside>
      </div>

      <input
        ref={coverInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void uploadCover(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      {/* ── 확인 창 ── */}
      <ConfirmDialog
        open={confirm === 'publish'}
        title={isPublished ? '변경 사항을 발행할까요?' : '이 기록을 발행할까요?'}
        body={
          <>
            {emptySlots > 0 && (
              <p className="mb-2 text-amber-deep">
                비어 있는 이미지 자리가 {emptySlots}곳 있습니다. 공개 화면에서는 보이지 않고 빈자리 없이 이어집니다.
              </p>
            )}
            <p>{isPublished ? '저장과 함께 공개 화면에 바로 반영됩니다.' : '공개 화면과 목록에 바로 올라갑니다.'}</p>
          </>
        }
        confirmLabel={emptySlots > 0 ? '그대로 발행' : '발행'}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null)
          void save('published')
        }}
      />
      <ConfirmDialog
        open={confirm === 'unpublish'}
        title="발행을 취소할까요?"
        body="초안으로 돌리고 공개 화면에서 내립니다."
        confirmLabel="발행 취소"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null)
          void save('draft')
        }}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        title="이 기록을 지울까요?"
        body="목록과 공개 화면에서 사라집니다. (DB에는 삭제 표시만 남습니다)"
        confirmLabel="지우기"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null)
          void doDelete()
        }}
      />
      <ConfirmDialog
        open={confirm === 'leave'}
        title="저장하지 않은 변경이 있습니다"
        body="이대로 나가면 변경 사항이 사라집니다."
        confirmLabel="나가기"
        cancelLabel="계속 편집"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null)
          router.push('/admin')
        }}
      />

      {progress && <SaveProgress {...progress} />}
    </div>
  )
}

function Field({
  label,
  aside,
  warn,
  children,
}: {
  label: string
  aside?: string
  warn?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-earth/35 pb-2.5">
      <div className="flex justify-between gap-3">
        <Label>{label}</Label>
        {aside && <span className={`font-plex text-[9.5px] leading-3 ${warn ? 'text-amber-deep' : 'text-stone-light'}`}>{aside}</span>}
      </div>
      {children}
    </div>
  )
}

function PreviewFrame({ frameRef, mode }: { frameRef: React.RefObject<HTMLIFrameElement | null>; mode: 'pc' | 'mobile' }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const el = boxRef.current
    if (!el || mode !== 'pc') return
    const observer = new ResizeObserver(() => setScale(Math.min(1, (el.clientWidth - 48) / 1440)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [mode])

  const height = 'calc(100vh - 56px - 48px)'
  return (
    <div ref={boxRef} className="flex justify-center overflow-hidden px-6 pt-6">
      {mode === 'pc' ? (
        <div style={{ width: 1440 * scale, height }} className="relative shrink-0 bg-sand shadow-[0_0_0_1px_rgb(49_46_42/0.12)]">
          <iframe
            ref={frameRef}
            title="미리보기 PC 1440"
            src="/admin/preview"
            style={{ width: 1440, height: `calc((100vh - 104px) / ${scale || 1})`, transform: `scale(${scale})`, transformOrigin: '0 0' }}
            className="absolute left-0 top-0 border-0"
          />
        </div>
      ) : (
        <iframe
          ref={frameRef}
          title="미리보기 모바일 390"
          src="/admin/preview"
          style={{ width: 390, height }}
          className="shrink-0 border-0 bg-sand shadow-[0_0_0_1px_rgb(49_46_42/0.12)]"
        />
      )}
    </div>
  )
}

function SaveProgress({ step, pct, publishing, note }: { step: SaveStep; pct: number; publishing: boolean; note?: string }) {
  const steps: { key: SaveStep; label: string }[] = [
    { key: 'check', label: '내용 확인' },
    { key: 'translate', label: '영문 번역 (바뀐 블록만)' },
    { key: 'save', label: publishing ? '저장 및 발행' : '저장' },
  ]
  const order: SaveStep[] = ['check', 'translate', 'save']
  const current = order.indexOf(step)
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-void/40">
      <div className="w-full max-w-[380px] border border-earth/20 bg-paper p-7">
        <div className="mb-5 flex items-baseline justify-between">
          <span className="font-serif-kr text-[18px] font-light text-earth">{publishing ? '발행하는 중' : '저장하는 중'}</span>
          <span className="font-plex text-[12px] text-amber-deep">{pct}%</span>
        </div>
        <div className="mb-5 h-px w-full bg-earth/15">
          <div className="h-px bg-amber-deep transition-[width] duration-300" style={{ width: `${pct}%` }} />
        </div>
        <ul className="flex flex-col gap-3">
          {steps.map((s, i) => {
            const done = i < current || pct >= 100
            const active = i === current && pct < 100
            return (
              <li key={s.key} className="flex items-center gap-3 text-[13px]">
                <span className={`size-1.5 shrink-0 border ${done ? 'border-earth bg-earth' : active ? 'border-amber-deep bg-amber-deep' : 'border-earth/30'}`} />
                <span className={done ? 'font-light text-stone-light line-through' : active ? 'text-earth' : 'font-light text-stone-light'}>{s.label}</span>
                {s.key === 'translate' && (active || note) && (
                  <span className="ml-auto text-[11.5px] font-light text-stone">{note ?? '번역 중…'}</span>
                )}
              </li>
            )
          })}
        </ul>
        <p className="mt-5 text-[11.5px] font-light leading-5 text-stone-light">본문 길이에 따라 20~40초 걸립니다. 창을 닫지 마세요.</p>
      </div>
    </div>
  )
}
