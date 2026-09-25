'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { adminUnsubscribe } from '@/lib/actions/subscribers'
import { dateline } from '@/lib/journal/format'
import type { Subscriber } from '@/lib/supabase/types'
import { Button, ConfirmDialog, PageHead, Tabs, Th } from './ui'

/* 구독자 — Paper IQZ-0 (활성/해지 탭 · 표 · CSV 내보내기). LANG 칸은 DB에 언어 컬럼이 없어 뺐다. */

function csvCell(value: string | null | undefined): string {
  const v = value ?? ''
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function SubscribersTable({ subscribers }: { subscribers: Subscriber[] }) {
  const router = useRouter()
  const { showToast } = useToast()
  const [tab, setTab] = useState<'active' | 'unsubscribed'>('active')
  const [target, setTarget] = useState<Subscriber | null>(null)
  const [busy, setBusy] = useState(false)

  const active = subscribers.filter((s) => s.status === 'active')
  const gone = subscribers.filter((s) => s.status !== 'active')
  const shown = tab === 'active' ? active : gone

  const exportCsv = () => {
    const rows = [
      ['email', 'name', 'status', 'subscribed_at', 'unsubscribed_at', 'source'],
      ...shown.map((s) => [s.email, s.name, s.status, s.subscribed_at, s.unsubscribed_at, s.source]),
    ]
    const csv = '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `subscribers-${tab}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const unsubscribe = async () => {
    if (!target) return
    setBusy(true)
    const result = await adminUnsubscribe(target.id)
    setBusy(false)
    setTarget(null)
    if (result.success) {
      showToast(`${target.email} 구독을 해지했습니다.`, 'success')
      router.refresh()
    } else showToast(result.error || '해지하지 못했습니다.', 'error')
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        kicker="SUBSCRIBERS"
        title="구독자"
        actions={
          <Button tone="outline" className="px-5 py-3" onClick={exportCsv} disabled={!shown.length}>
            CSV 내보내기
          </Button>
        }
      />
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'active', label: `활성 ${active.length}` },
          { value: 'unsubscribed', label: `해지 ${gone.length}` },
        ]}
      />
      <div className="flex flex-col">
        <div className="flex gap-5 border-b border-earth/30 pb-2.5">
          <Th className="flex-1">EMAIL</Th>
          <Th className="w-40 shrink-0">NAME</Th>
          <Th className="w-[120px] shrink-0">SINCE</Th>
          {tab === 'unsubscribed' && <Th className="w-[120px] shrink-0">LEFT</Th>}
          <Th className="w-[60px] shrink-0" />
        </div>
        {shown.length === 0 && (
          <p className="py-8 text-[13px] font-light text-stone">{tab === 'active' ? '활성 구독자가 없습니다.' : '해지한 구독자가 없습니다.'}</p>
        )}
        {shown.map((s) => (
          <div key={s.id} className="flex items-center gap-5 border-b border-earth/[0.12] py-3.5">
            <span className="min-w-0 flex-1 truncate font-plex text-[12.5px] leading-4 text-earth">{s.email}</span>
            <span className="w-40 shrink-0 truncate text-[13.5px] font-light leading-[18px] text-earth">{s.name || '—'}</span>
            <span className="w-[120px] shrink-0 font-plex text-[12px] leading-4 text-stone-dark">{dateline(s.subscribed_at)}</span>
            {tab === 'unsubscribed' && (
              <span className="w-[120px] shrink-0 font-plex text-[12px] leading-4 text-stone-dark">{dateline(s.unsubscribed_at) || '—'}</span>
            )}
            <span className="w-[60px] shrink-0 text-right">
              {s.status === 'active' && (
                <button type="button" onClick={() => setTarget(s)} className="text-[12.5px] font-light text-stone-light hover:text-earth">
                  해지
                </button>
              )}
            </span>
          </div>
        ))}
      </div>
      <ConfirmDialog
        open={!!target}
        title="구독을 해지할까요?"
        body={`${target?.email ?? ''} — 이후 뉴스레터를 받지 않습니다. 기록은 해지 탭에 남습니다.`}
        confirmLabel="해지"
        busy={busy}
        onCancel={() => setTarget(null)}
        onConfirm={() => void unsubscribe()}
      />
    </div>
  )
}
