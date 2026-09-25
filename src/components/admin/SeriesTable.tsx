'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { createSeries, updateSeries, type SeriesInput } from '@/lib/actions/categories'
import type { AdminSeriesRow } from '@/lib/admin/data'
import { Button, PageHead, Th } from './ui'

/*
 * 연재 — Paper IQZ-0 아래쪽. 이름 KO/EN, 설명 KO/EN을 여기서 고친다.
 * 공개 여부는 자동: 발행 기록이 1편 이상인 연재만 블로그에 보인다.
 * (디자인 머리글 '이름 · KO / FR'은 오기 — KO / EN으로 둔다)
 */

const pad2 = (n: number) => String(n).padStart(2, '0')

interface Draft {
  name: string
  name_en: string
  description: string
  description_en: string
  slug: string
}

const inputCls = 'w-full border-b border-earth/35 bg-transparent pb-1 outline-none placeholder:text-earth/35 focus:border-earth'

export function SeriesTable({ series }: { series: AdminSeriesRow[] }) {
  const router = useRouter()
  const { showToast } = useToast()
  const [editing, setEditing] = useState<string | null>(null) // 연재 id 또는 'new'
  const [draft, setDraft] = useState<Draft>({ name: '', name_en: '', description: '', description_en: '', slug: '' })
  const [busy, setBusy] = useState(false)

  const start = (row: AdminSeriesRow | null) => {
    setEditing(row ? row.id : 'new')
    setDraft({
      name: row?.name ?? '',
      name_en: row?.name_en ?? '',
      description: row?.description ?? '',
      description_en: row?.description_en ?? '',
      slug: row?.slug ?? '',
    })
  }

  const submit = async () => {
    setBusy(true)
    const input: SeriesInput = { ...draft }
    const result = editing === 'new' ? await createSeries(input) : await updateSeries(editing!, input)
    setBusy(false)
    if (!result.success) {
      showToast(result.error || '저장하지 못했습니다.', 'error')
      return
    }
    showToast(editing === 'new' ? '연재를 추가했습니다.' : '연재를 고쳤습니다.', 'success')
    setEditing(null)
    router.refresh()
  }

  const editor = (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex gap-5">
        <input className={`${inputCls} font-serif-kr text-[16px]`} placeholder="이름 (한국어)" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <input className={`${inputCls} font-garamond text-[16px] italic`} placeholder="Name (English)" value={draft.name_en} onChange={(e) => setDraft({ ...draft, name_en: e.target.value })} />
        {editing === 'new' && (
          <input
            className={`${inputCls} font-plex text-[12.5px]`}
            placeholder="slug (english-only)"
            value={draft.slug}
            onChange={(e) => setDraft({ ...draft, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
          />
        )}
      </div>
      <input className={`${inputCls} text-[13.5px] font-light`} placeholder="설명 (한국어)" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
      <input className={`${inputCls} text-[13px] font-light`} placeholder="Description (English)" value={draft.description_en} onChange={(e) => setDraft({ ...draft, description_en: e.target.value })} />
      <div className="flex gap-3">
        <Button tone="dark" className="px-4 py-2" onClick={() => void submit()} disabled={busy || !draft.name.trim()}>
          {busy ? '저장 중…' : '저장'}
        </Button>
        <Button tone="outline" className="px-4 py-2" onClick={() => setEditing(null)} disabled={busy}>
          취소
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        kicker="SERIES"
        title="연재"
        actions={
          <Button tone="outline" className="px-5 py-3" onClick={() => start(null)} disabled={editing === 'new'}>
            연재 추가
          </Button>
        }
      />
      <div className="flex flex-col">
        <div className="flex gap-5 border-b border-earth/30 pb-2.5">
          <Th className="w-10 shrink-0">N°</Th>
          <Th className="w-[200px] shrink-0">이름 · KO / EN</Th>
          <Th className="flex-1">설명 · KO / EN</Th>
          <Th className="w-[70px] shrink-0">기록</Th>
          <Th className="w-[120px] shrink-0">공개</Th>
          <Th className="w-10 shrink-0" />
        </div>
        {editing === 'new' && (
          <div className="flex gap-5 border-b border-earth/[0.12] py-4">
            <span className="w-10 shrink-0 font-plex text-[12px] text-stone-light">+</span>
            {editor}
          </div>
        )}
        {series.map((s, i) => {
          const visible = s.published > 0
          if (editing === s.id) {
            return (
              <div key={s.id} className="flex gap-5 border-b border-earth/[0.12] py-4">
                <span className="w-10 shrink-0 font-plex text-[12px] leading-4 text-amber-deep">{pad2(i + 1)}</span>
                {editor}
              </div>
            )
          }
          return (
            <div key={s.id} className="flex items-start gap-5 border-b border-earth/[0.12] py-4">
              <span className={`w-10 shrink-0 font-plex text-[12px] leading-4 ${visible ? 'text-amber-deep' : 'text-stone-light'}`}>{pad2(i + 1)}</span>
              <span className="flex w-[200px] shrink-0 flex-col gap-1">
                <span className={`font-serif-kr text-[16px] leading-5 ${visible ? 'text-earth' : 'text-earth/55'}`}>{s.name}</span>
                <span className={`font-garamond text-[15px] italic leading-[18px] ${visible ? 'text-stone' : 'text-stone/60'}`}>
                  {s.name_en || <span className="font-sans-kr text-[12px] not-italic text-stone-light">영문 이름 없음</span>}
                </span>
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className={`text-[13.5px] font-light leading-[18px] ${visible ? 'text-earth' : 'text-earth/55'}`}>{s.description || '—'}</span>
                {s.description_en && <span className="text-[13px] font-light leading-4 text-stone">{s.description_en}</span>}
              </span>
              <span className={`w-[70px] shrink-0 font-plex text-[12px] leading-4 ${visible ? 'text-earth' : 'text-earth/55'}`}>
                {s.published}
                {s.drafts > 0 && <span className="text-stone-light"> +{s.drafts}</span>}
              </span>
              <span className={`w-[120px] shrink-0 text-[13px] font-light leading-4 ${visible ? 'text-earth' : 'text-amber-deep'}`}>
                {visible ? '자동 · 공개 중' : '기록 없음 · 숨김'}
              </span>
              <button type="button" onClick={() => start(s)} className="w-10 shrink-0 text-right text-[12.5px] font-light text-stone-light hover:text-earth">
                고치기
              </button>
            </div>
          )
        })}
      </div>
      <p className="text-[12px] font-light leading-4 text-stone-light">
        기록이 1편 이상 발행된 연재만 블로그에 보입니다. 기록 수의 +N은 초안입니다. 영문 이름·설명은 EN 화면에 쓰입니다(비우면 코드 사전값).
      </p>
    </div>
  )
}
