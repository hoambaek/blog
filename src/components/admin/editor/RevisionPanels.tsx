'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { replacePublishedWithDraft, restorePostRevision } from '@/lib/actions/revisions'
import { suggestReplaceTarget } from '@/lib/revisions/service'
import type { RevisionItem } from '@/lib/revisions/data'
import type { PublishedIndexItem } from '@/lib/admin/data'
import { recordNo } from '@/lib/journal/format'
import { Button, ConfirmDialog, Label } from '../ui'

/*
 * 발행 탭의 두 영역
 *   ReplacePublished — 초안 편집 화면: "이 초안으로 발행 글 교체"
 *   RevisionHistory  — 이전 버전 목록 + "이 버전으로 되돌리기"
 * 둘 다 DB에 저장된 내용 기준으로 동작하므로, 저장 안 한 변경이 있으면 막는다.
 */

const revisionTimeFmt = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const REASON_LABEL: Record<string, string> = {
  replaced_by_draft: '초안으로 교체되기 전',
  before_restore: '되돌리기 전',
}

function Section({ label, aside, children }: { label: string; aside?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 border-b border-earth/35 pb-3">
      <div className="flex justify-between gap-3">
        <Label>{label}</Label>
        {aside && <span className="font-plex text-[9.5px] leading-3 text-stone-light">{aside}</span>}
      </div>
      {children}
    </div>
  )
}

export function ReplacePublished({
  draft,
  publishedIndex,
  dirty,
  emptySlots,
  disabled,
}: {
  draft: { id: string; slug: string }
  publishedIndex: PublishedIndexItem[]
  dirty: boolean
  emptySlots: number
  disabled?: boolean
}) {
  const router = useRouter()
  const { showToast } = useToast()
  const suggested = suggestReplaceTarget(draft.slug, publishedIndex)
  const [targetId, setTargetId] = useState<string>(suggested ?? '')
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const target = publishedIndex.find((p) => p.id === targetId) ?? null

  const run = async () => {
    if (!target) return
    setBusy(true)
    try {
      const result = await replacePublishedWithDraft(draft.id, target.id)
      if (!result.success) {
        showToast(result.error, 'error')
        return
      }
      showToast(`"${target.title}"을(를) 이 초안으로 교체했습니다. 이전 내용은 보관했습니다.`, 'success')
      setOpen(false)
      router.push(`/admin/posts/${target.id}/edit`)
    } catch (error) {
      console.error('Error replacing published post:', error)
      showToast('교체 중 오류가 발생했습니다.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section label="REPLACE PUBLISHED" aside={suggested ? 'slug로 추천됨' : undefined}>
      <span className="text-[12.5px] font-light leading-5 text-stone">
        이 초안의 내용으로 발행 글을 바꿉니다. 발행 글의 주소는 그대로 남습니다.
      </span>
      <select
        value={targetId}
        onChange={(e) => setTargetId(e.target.value)}
        className="w-full cursor-pointer bg-transparent text-[14px] leading-[18px] text-earth outline-none"
        aria-label="교체할 발행 글"
      >
        <option value="">교체할 발행 글 고르기</option>
        {publishedIndex.map((p) => (
          <option key={p.id} value={p.id}>
            N° {recordNo(p.number)} {p.title}
          </option>
        ))}
      </select>
      {target && <span className="font-plex text-[11px] leading-4 text-stone">/post/{target.slug}</span>}
      {dirty && (
        <span className="text-[12px] leading-5 text-amber-deep">저장하지 않은 변경이 있습니다. 교체는 저장된 초안으로 하므로 먼저 저장하세요.</span>
      )}
      <Button tone="outline" className="mt-1 w-full py-3" onClick={() => setOpen(true)} disabled={!target || dirty || disabled || busy}>
        발행 글 교체
      </Button>

      <ConfirmDialog
        open={open && !!target}
        busy={busy}
        title="이 초안으로 발행 글을 교체할까요?"
        body={
          target && (
            <>
              <p className="text-earth">
                {target.title}
                <span className="ml-2 font-plex text-[11.5px] text-stone">/post/{target.slug}</span>
              </p>
              <p className="mt-2">
                발행 글의 주소·발행일·조회수는 유지하고, 본문·제목·발췌·커버·연재·사진 출처·SEO·영문·다음 기록·읽는 시간이 초안 것으로 바뀝니다. 공개 화면에 바로 반영됩니다.
              </p>
              <p className="mt-2">이전 내용은 보관됩니다(그 글의 발행 탭 · 이전 버전에서 되돌릴 수 있습니다). 이 초안은 지워집니다.</p>
              {emptySlots > 0 && (
                <p className="mt-2 text-amber-deep">
                  비어 있는 이미지 자리가 {emptySlots}곳 있습니다. 공개 화면에서는 보이지 않고 빈자리 없이 이어집니다.
                </p>
              )}
            </>
          )
        }
        confirmLabel={busy ? '교체하는 중…' : emptySlots > 0 ? '그대로 교체' : '교체'}
        onCancel={() => setOpen(false)}
        onConfirm={() => void run()}
      />
    </Section>
  )
}

export function RevisionHistory({
  postId,
  revisions,
  dirty,
  disabled,
}: {
  postId: string
  revisions: { available: boolean; items: RevisionItem[] }
  dirty: boolean
  disabled?: boolean
}) {
  const { showToast } = useToast()
  const [pick, setPick] = useState<RevisionItem | null>(null)
  const [busy, setBusy] = useState(false)

  const run = async () => {
    if (!pick) return
    setBusy(true)
    try {
      const result = await restorePostRevision(postId, pick.id)
      if (!result.success) {
        showToast(result.error, 'error')
        setBusy(false)
        return
      }
      showToast('이전 버전으로 되돌렸습니다. 되돌리기 전 상태도 보관했습니다.', 'success')
      // 편집 화면의 상태(본문 에디터 포함)를 새 내용으로 다시 채운다
      window.location.reload()
    } catch (error) {
      console.error('Error restoring revision:', error)
      showToast('되돌리는 중 오류가 발생했습니다.', 'error')
      setBusy(false)
    }
  }

  return (
    <Section label="PREVIOUS VERSIONS" aside={revisions.items.length ? `${revisions.items.length}개` : undefined}>
      {!revisions.available ? (
        <span className="text-[12.5px] font-light leading-5 text-stone">이전 버전을 불러오지 못했습니다(DB 006 마이그레이션 적용 전이거나 조회 오류).</span>
      ) : revisions.items.length === 0 ? (
        <span className="text-[12.5px] font-light leading-5 text-stone">보관된 이전 버전이 없습니다.</span>
      ) : (
        <ul className="flex flex-col">
          {revisions.items.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-3 border-t border-earth/15 py-2.5 first:border-t-0 first:pt-0">
              <div className="flex min-w-0 flex-col gap-1">
                <span className="font-plex text-[11px] leading-4 text-earth">{revisionTimeFmt.format(new Date(r.createdAt))}</span>
                <span className="text-[11.5px] font-light leading-4 text-stone">{REASON_LABEL[r.reason ?? ''] ?? r.reason ?? '보관'}</span>
                {r.title && <span className="truncate text-[12.5px] font-light leading-5 text-earth">{r.title}</span>}
              </div>
              <button
                type="button"
                onClick={() => setPick(r)}
                disabled={dirty || disabled || busy}
                className="shrink-0 border-b border-earth/40 text-[12px] leading-4 text-earth disabled:cursor-not-allowed disabled:opacity-40"
              >
                이 버전으로 되돌리기
              </button>
            </li>
          ))}
        </ul>
      )}
      {dirty && revisions.items.length > 0 && (
        <span className="text-[12px] leading-5 text-amber-deep">저장하지 않은 변경이 있습니다. 먼저 저장하거나 변경을 버린 뒤 되돌리세요.</span>
      )}

      <ConfirmDialog
        open={!!pick}
        busy={busy}
        title="이 버전으로 되돌릴까요?"
        body={
          pick && (
            <>
              <p className="text-earth">
                {revisionTimeFmt.format(new Date(pick.createdAt))} · {REASON_LABEL[pick.reason ?? ''] ?? '보관'}
              </p>
              {pick.title && <p className="mt-1 text-earth">{pick.title}</p>}
              <p className="mt-2">
                주소·상태·발행일·조회수는 그대로 두고 본문·제목·발췌·커버·연재·사진 출처·SEO·영문·다음 기록·읽는 시간을 이 버전으로 되돌립니다. 발행 글이면 공개 화면에 바로 반영됩니다.
              </p>
              <p className="mt-2">지금 내용은 되돌리기 전에 이전 버전으로 보관됩니다.</p>
            </>
          )
        }
        confirmLabel={busy ? '되돌리는 중…' : '되돌리기'}
        onCancel={() => setPick(null)}
        onConfirm={() => void run()}
      />
    </Section>
  )
}
