'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import type { PublishedIndexItem } from '@/lib/admin/data'
import { dateline, recordNo } from '@/lib/journal/format'
import { renderNewsletterHtml, type NewsletterContent } from '@/lib/newsletter/template'
import { Button, ConfirmDialog, Label, PageHead } from './ui'

/*
 * 뉴스레터 작성 — Paper IOR-0
 * 1 담을 기록 → 2 제목 → 3 여는 말(비우면 발췌) → 메일 미리보기 → 나에게 테스트 / N명에게 발송(확인 창 한 번 더)
 * 미리보기는 발송 라우트와 같은 템플릿 함수로 그린다(서버는 기록을 다시 읽어 같은 HTML을 만든다).
 */

interface HistoryRow {
  id: string
  subject: string
  status: string
  sentAt: string | null
  createdAt: string
  total: number
  accepted: number
  failed: { email: string; error: string }[]
}

export function NewsletterComposer({
  records,
  subscribers,
  history,
}: {
  records: PublishedIndexItem[]
  subscribers: number
  history: HistoryRow[]
}) {
  const router = useRouter()
  const { showToast } = useToast()
  const [selected, setSelected] = useState<string[]>(() => (records[0] ? [records[0].id] : []))
  const [subjectEdited, setSubjectEdited] = useState(false)
  const [subjectInput, setSubjectInput] = useState('')
  const [intro, setIntro] = useState('')
  const [view, setView] = useState<'pc' | 'mobile'>('pc')
  const [busy, setBusy] = useState<null | 'test' | 'send'>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [openFailed, setOpenFailed] = useState<string | null>(null)

  const chosen = useMemo(
    () => selected.map((id) => records.find((r) => r.id === id)).filter((r): r is PublishedIndexItem => !!r),
    [selected, records],
  )
  const autoSubject = chosen.length ? `새 기록 · ${chosen.map((r) => r.title).join(' · ')}` : ''
  const subject = subjectEdited ? subjectInput : autoSubject

  const content: NewsletterContent = {
    subject,
    intro,
    records: chosen.map((r) => ({
      slug: r.slug,
      number: r.number,
      title: r.title,
      excerpt: r.excerpt,
      cover: r.cover,
      seriesName: r.series?.name ?? null,
    })),
  }
  const previewHtml = renderNewsletterHtml(content)

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const send = async (test: boolean) => {
    if (!chosen.length) {
      showToast('담을 기록을 고르세요.', 'error')
      return
    }
    if (!subject.trim()) {
      showToast('제목을 입력하세요.', 'error')
      return
    }
    setBusy(test ? 'test' : 'send')
    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ postIds: selected, subject: subject.trim(), intro, test }),
      })
      const data = (await res.json().catch(() => null)) as {
        success?: boolean
        message?: string
        error?: string
        warning?: string
        failed?: unknown[]
      } | null
      if (!res.ok || !data?.success) {
        showToast(data?.error || data?.message || '발송하지 못했습니다.', 'error')
      } else {
        showToast(data.message ?? '보냈습니다.', data.failed?.length ? 'warning' : 'success')
        if (data.warning) showToast(data.warning, 'warning')
      }
      if (!test) router.refresh()
    } catch {
      showToast('발송 요청이 실패했습니다.', 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-16">
      <div className="flex gap-12 max-xl:flex-col">
        {/* 작성 */}
        <div className="flex w-[420px] shrink-0 flex-col gap-[26px] max-xl:w-full">
          <PageHead kicker="NEWSLETTER · 새 발송" title="뉴스레터" />

          <div className="flex flex-col gap-2.5">
            <Label>1 · 담을 기록</Label>
            <div className="flex max-h-[320px] flex-col overflow-y-auto border-t border-earth/25">
              {records.length === 0 && <p className="py-4 text-[13px] font-light text-stone">발행된 기록이 없습니다.</p>}
              {records.map((r) => {
                const on = selected.includes(r.id)
                return (
                  <label key={r.id} className="flex cursor-pointer items-center gap-3 border-b border-earth/[0.12] py-3">
                    <input type="checkbox" checked={on} onChange={() => toggle(r.id)} className="peer sr-only" />
                    <span
                      className={`flex size-[15px] shrink-0 items-center justify-center border text-[10px] leading-none peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-amber-deep ${
                        on ? 'border-earth bg-earth text-paper' : 'border-earth/45'
                      }`}
                      aria-hidden
                    >
                      {on ? '✓' : ''}
                    </span>
                    <span className="font-plex text-[11px] leading-[14px] text-amber-deep">{recordNo(r.number)}</span>
                    <span className={`truncate text-[14px] leading-[18px] text-earth ${on ? '' : 'font-light'}`}>{r.title}</span>
                    {on && selected.length > 1 && (
                      <span className="ml-auto font-plex text-[10px] text-stone-light">{selected.indexOf(r.id) + 1}</span>
                    )}
                  </label>
                )
              })}
            </div>
          </div>

          <label className="flex flex-col gap-2 border-b border-earth/40 pb-2.5">
            <Label>2 · 제목</Label>
            <input
              value={subject}
              onChange={(e) => {
                setSubjectEdited(true)
                setSubjectInput(e.target.value)
              }}
              placeholder="메일 제목"
              className="bg-transparent text-[15px] leading-[18px] text-earth outline-none placeholder:text-earth/40"
            />
          </label>

          <label className="flex flex-col gap-2 border-b border-earth/40 pb-2.5">
            <Label>3 · 여는 말 (선택)</Label>
            <textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={2}
              placeholder={chosen.length > 1 ? '한두 줄. 비워 두면 여는 말 없이 기록마다 발췌를 붙입니다' : '한두 줄. 비워 두면 발췌문을 씁니다'}
              className="resize-none bg-transparent text-[14px] font-light leading-[22px] text-earth outline-none [field-sizing:content] placeholder:text-earth/45"
            />
          </label>

          <div className="mt-2 flex flex-col gap-3">
            <div className="flex justify-between">
              <span className="text-[13px] font-light leading-4 text-stone-dark">받는 사람</span>
              <span className="font-plex text-[12px] leading-4 text-earth">활성 구독자 {subscribers}명</span>
            </div>
            <div className="flex gap-3">
              <Button tone="outline" className="flex-1 py-[13px] text-[14px]" onClick={() => void send(true)} disabled={!!busy}>
                {busy === 'test' ? '보내는 중…' : '나에게 테스트 발송'}
              </Button>
              <Button
                tone="dark"
                className="flex-1 py-3.5 text-[14px]"
                onClick={() => setConfirmOpen(true)}
                disabled={!!busy || subscribers === 0}
              >
                {busy === 'send' ? '보내는 중…' : `${subscribers}명에게 발송`} <span aria-hidden>›</span>
              </Button>
            </div>
            <p className="text-[12px] font-light leading-[19px] text-stone-light">
              발송 전 확인 창이 한 번 더 뜹니다. 실패한 주소는 발송 기록에 따로 표시됩니다.
            </p>
          </div>
        </div>

        {/* 메일 미리보기 */}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex justify-between">
            <Label>PREVIEW · 메일</Label>
            <span className="flex gap-2 font-plex text-[9.5px] tracking-[0.12em]">
              {(['pc', 'mobile'] as const).map((v, i) => (
                <span key={v} className="flex gap-2">
                  {i > 0 && <span className="text-stone-light">·</span>}
                  <button type="button" onClick={() => setView(v)} className={view === v ? 'text-earth' : 'text-stone-light hover:text-earth'}>
                    {v === 'pc' ? 'PC' : '모바일'}
                  </button>
                </span>
              ))}
            </span>
          </div>
          <div className="flex justify-center border border-earth/15 bg-sand">
            <iframe
              key={view}
              title="뉴스레터 미리보기"
              srcDoc={previewHtml.replaceAll('{{unsubscribe_url}}', '#')}
              // 스크립트는 막고, 높이를 재기 위해 같은 출처만 허용
              sandbox="allow-same-origin"
              onLoad={(e) => {
                const doc = e.currentTarget.contentDocument
                if (doc) e.currentTarget.style.height = `${doc.documentElement.scrollHeight}px`
              }}
              style={{ width: view === 'pc' ? '100%' : 390, height: 760 }}
              className="block border-0"
            />
          </div>
        </div>
      </div>

      {/* 발송 기록 */}
      <section className="flex flex-col gap-4">
        <Label className="text-[10.5px] tracking-[0.18em] text-amber-deep">HISTORY · 발송 기록</Label>
        {history.length === 0 ? (
          <p className="text-[13px] font-light text-stone">아직 보낸 뉴스레터가 없습니다.</p>
        ) : (
          <div className="flex flex-col border-t border-earth/30">
            {history.map((h) => (
              <div key={h.id} className="border-b border-earth/[0.12] py-3.5">
                <div className="flex items-center gap-5">
                  <span className="w-24 shrink-0 font-plex text-[12px] text-stone-dark">{dateline(h.sentAt ?? h.createdAt)}</span>
                  <span className="min-w-0 flex-1 truncate text-[14px] font-light text-earth">{h.subject}</span>
                  <span className="w-28 shrink-0 text-[13px] font-light text-stone-dark">
                    {h.status === 'sent' ? '발송' : h.status === 'failed' ? '실패' : h.status === 'draft' ? '미완료' : h.status}
                  </span>
                  <span className="w-40 shrink-0 text-right font-plex text-[12px] text-stone-dark">
                    {h.accepted}/{h.total}명 접수
                  </span>
                  <button
                    type="button"
                    disabled={!h.failed.length}
                    onClick={() => setOpenFailed(openFailed === h.id ? null : h.id)}
                    className={`w-24 shrink-0 text-right text-[12.5px] ${h.failed.length ? 'text-amber-deep hover:text-earth' : 'font-light text-stone-light'}`}
                  >
                    {h.failed.length ? `실패 ${h.failed.length}` : '실패 없음'}
                  </button>
                </div>
                {openFailed === h.id && (
                  <ul className="mt-3 flex flex-col gap-1 pl-[116px]">
                    {h.failed.map((f) => (
                      <li key={f.email} className="flex gap-4 font-plex text-[11.5px] text-stone-dark">
                        <span>{f.email}</span>
                        <span className="text-stone-light">{f.error}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="text-[12px] font-light leading-5 text-stone-light">
          접수 = Resend가 받아 간 수입니다. 실제 수신함 도착·열람은 여기서 알 수 없습니다.
        </p>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title={`활성 구독자 ${subscribers}명에게 보낼까요?`}
        body={
          <>
            <p>제목: {subject || '(없음)'}</p>
            <p>기록: {chosen.map((r) => `N° ${recordNo(r.number)} ${r.title}`).join(', ') || '(없음)'}</p>
            <p className="mt-2">보낸 뒤에는 되돌릴 수 없습니다.</p>
          </>
        }
        confirmLabel="발송"
        busy={!!busy}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          void send(false)
        }}
      />
    </div>
  )
}
