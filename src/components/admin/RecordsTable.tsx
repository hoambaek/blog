'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { AdminRecordRow } from '@/lib/admin/data'
import { dateline, recordNo } from '@/lib/journal/format'
import { PageHead, Tabs, Th } from './ui'

/* 기록 목록 — Paper IEU-0 (요약 4칸 · 필터 · 표) */

type Filter = 'all' | 'published' | 'draft' | `series:${string}`

function StatusCell({ status }: { status: AdminRecordRow['status'] }) {
  const published = status === 'published'
  return (
    <span className="flex w-24 shrink-0 items-center gap-[7px]">
      <span className={`size-1.5 shrink-0 border border-earth ${published ? 'bg-earth' : ''}`} />
      <span className={`text-[13px] leading-4 text-earth ${published ? '' : 'font-light'}`}>
        {published ? '발행' : status === 'scheduled' ? '예약(옛 상태)' : '초안'}
      </span>
    </span>
  )
}

function EnCell({ en }: { en: AdminRecordRow['en'] }) {
  if (en === 'none') {
    return <span className="w-24 shrink-0 text-[13px] font-light leading-4 text-stone-light">영문 없음</span>
  }
  const done = en === 'done'
  return (
    <span className="flex w-24 shrink-0 items-center gap-[7px]">
      <span className={`size-1.5 shrink-0 border ${done ? 'border-earth bg-earth' : 'border-amber-deep'}`} />
      <span className={`text-[13px] font-light leading-4 ${done ? 'text-earth' : 'text-amber-deep'}`}>
        {done ? '검수 완료' : '검수 대기'}
      </span>
    </span>
  )
}

export function RecordsTable({ rows, subscribers }: { rows: AdminRecordRow[]; subscribers: number }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const published = rows.filter((r) => r.status === 'published').length
  const drafts = rows.length - published
  const enPending = rows.filter((r) => r.en === 'pending').length

  // 글이 있는 연재만 필터로 (등장 순서 = 목록 순서)
  const seriesTabs = useMemo(() => {
    const seen = new Map<string, string>()
    for (const r of rows) if (r.seriesId && r.seriesName && !seen.has(r.seriesId)) seen.set(r.seriesId, r.seriesName)
    return [...seen.entries()]
  }, [rows])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = rows.filter((r) => {
      if (filter === 'published' && r.status !== 'published') return false
      if (filter === 'draft' && r.status === 'published') return false
      if (filter.startsWith('series:') && r.seriesId !== filter.slice(7)) return false
      if (q && !r.searchText.includes(q)) return false
      return true
    })
    // 초안이 위, 그다음 발행 순번 내림차순
    return list.sort((a, b) => {
      if ((a.number === null) !== (b.number === null)) return a.number === null ? -1 : 1
      if (a.number !== null && b.number !== null) return b.number - a.number
      return 0
    })
  }, [rows, filter, query])

  const stats = [
    { label: 'PUBLISHED', value: published },
    { label: 'DRAFTS', value: drafts },
    { label: 'EN 검수 대기', value: enPending, accent: true },
    { label: 'SUBSCRIBERS', value: subscribers },
  ]

  return (
    <div className="flex flex-col gap-8">
      <PageHead
        kicker="RECORDS"
        title="기록"
        actions={
          <Link
            href="/admin/posts/new"
            className="flex items-center gap-2.5 bg-void px-[22px] py-3.5 text-[14px] leading-[18px] tracking-[0.04em] text-paper transition-colors hover:bg-earth"
          >
            새 기록 쓰기 <span aria-hidden>›</span>
          </Link>
        }
      />

      <dl className="flex border-y border-earth/25">
        {stats.map((s, i) => (
          <div key={s.label} className={`flex flex-1 flex-col gap-2 py-[18px] ${i > 0 ? 'border-l border-earth/[0.12] pl-6' : ''}`}>
            <dt className="font-plex text-[10px] leading-3 tracking-[0.16em] text-stone-light">{s.label}</dt>
            <dd className={`font-plex text-[24px] leading-[30px] ${s.accent && s.value > 0 ? 'text-amber-deep' : 'text-earth'}`}>
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-6">
        <Tabs<Filter>
          value={filter}
          onChange={setFilter}
          items={[
            { value: 'all', label: `전체 ${rows.length}` },
            { value: 'published', label: `발행 ${published}` },
            { value: 'draft', label: `초안 ${drafts}` },
            ...seriesTabs.map(([id, name]) => ({ value: `series:${id}` as Filter, label: name })),
          ]}
        />
        <label className="flex w-[260px] shrink-0 items-center justify-between border-b border-earth/35 pb-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="제목·본문 검색"
            className="w-full bg-transparent text-[13.5px] font-light leading-[18px] text-earth outline-none placeholder:text-earth/45"
          />
          <svg width="14" height="14" viewBox="0 0 15 15" aria-hidden className="shrink-0">
            <circle cx="6.5" cy="6.5" r="5.2" fill="none" stroke="#6E675D" strokeWidth="1.1" />
            <line x1="10.4" y1="10.4" x2="14" y2="14" stroke="#6E675D" strokeWidth="1.1" />
          </svg>
        </label>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-5 border-b border-earth/30 pb-2.5">
          <Th className="w-14 shrink-0">N°</Th>
          <Th className="flex-1">RECORD</Th>
          <Th className="w-[110px] shrink-0">SERIES</Th>
          <Th className="w-24 shrink-0">STATUS</Th>
          <Th className="w-24 shrink-0">EN</Th>
          <Th className="w-24 shrink-0">DATE</Th>
          <Th className="w-14 shrink-0 text-right">VIEWS</Th>
        </div>
        {shown.length === 0 && (
          <p className="py-10 text-[13.5px] font-light text-stone">{query ? '검색 결과가 없습니다.' : '기록이 없습니다.'}</p>
        )}
        {shown.map((r) => {
          const fromClaude = r.draftSource === 'claude' && r.status !== 'published'
          return (
            <Link
              key={r.id}
              href={`/admin/posts/${r.id}/edit`}
              className={`flex items-center gap-5 border-b border-earth/[0.12] py-4 transition-colors hover:bg-amber/[0.06] ${
                fromClaude ? 'bg-amber/10' : ''
              }`}
            >
              <span
                className={`w-14 shrink-0 font-plex text-[12.5px] leading-4 ${r.number ? 'text-amber-deep' : 'pl-2 text-stone-light'}`}
              >
                {r.number ? recordNo(r.number) : '—'}
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-4">
                {r.cover ? (
                  <span className="relative h-12 w-[72px] shrink-0 overflow-hidden bg-earth/10">
                    <Image src={r.cover} alt="" fill sizes="72px" className="object-cover" />
                  </span>
                ) : (
                  <span className="flex h-12 w-[72px] shrink-0 items-center justify-center border border-dashed border-earth/35 font-plex text-[9px] leading-3 text-stone-light">
                    NO IMG
                  </span>
                )}
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="truncate font-serif-kr text-[16px] leading-5 text-earth">{r.title || '(제목 없음)'}</span>
                  {fromClaude ? (
                    <span className="flex items-center gap-2.5">
                      <span className="bg-amber px-[7px] py-0.5 font-plex text-[10px] leading-3 tracking-[0.08em] text-void">CLAUDE</span>
                      <span className="truncate text-[12px] font-light leading-4 text-stone">
                        Claude가 올림
                        {r.draftUploadedAgo ? ` · ${r.draftUploadedAgo}` : ''}
                        {r.emptySlots > 0 ? ` · 이미지 자리 ${r.emptySlots}곳 비어 있음` : ''}
                      </span>
                    </span>
                  ) : (
                    <span className="truncate font-plex text-[10.5px] leading-[14px] text-stone-light">
                      /post/{r.slug}
                      {r.emptySlots > 0 ? ` · 이미지 자리 ${r.emptySlots}곳 비어 있음` : ''}
                    </span>
                  )}
                </span>
              </span>
              <span className="w-[110px] shrink-0 truncate text-[13px] font-light leading-4 text-stone-dark">
                {r.seriesName ?? '—'}
              </span>
              <StatusCell status={r.status} />
              <EnCell en={r.en} />
              <span className={`w-24 shrink-0 font-plex text-[12px] leading-4 ${r.publishedAt ? 'text-stone-dark' : 'text-stone-light'}`}>
                {r.status === 'published' && r.publishedAt ? dateline(r.publishedAt) : '—'}
              </span>
              <span
                className={`w-14 shrink-0 text-right font-plex text-[12px] leading-4 ${
                  r.status === 'published' ? 'text-stone-dark' : 'text-stone-light'
                }`}
              >
                {r.status === 'published' ? r.views : '—'}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
