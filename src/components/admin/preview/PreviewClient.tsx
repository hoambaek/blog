'use client'

import { useEffect, useMemo, useState } from 'react'
import { PostView } from '@/components/journal/PostView'
import { parseArticleHtml } from '@/lib/article/parse'
import { PREVIEW_MESSAGE, PREVIEW_READY, type PreviewPayload } from './protocol'
import '@/components/journal/journal.css'

/*
 * 관리자 미리보기 — 공개 글 화면(PostView·ArticleBody)을 그대로 그린다. 다른 점은 이미지 자리를 점선 상자로 보여 주는 것뿐.
 * - 편집 화면 안(iframe): 부모가 postMessage로 저장 전 상태를 보낸다('jdm-preview').
 * - 미리보기 링크(/admin/posts/[id]/preview): 저장된 상태를 서버에서 받아 그린다.
 */

export function PreviewClient({ initial, banner }: { initial: PreviewPayload | null; banner?: string }) {
  const [payload, setPayload] = useState<PreviewPayload | null>(initial)

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const data = event.data as { type?: string; payload?: PreviewPayload }
      if (data?.type === PREVIEW_MESSAGE && data.payload) setPayload(data.payload)
    }
    window.addEventListener('message', onMessage)
    if (window.parent !== window) window.parent.postMessage({ type: PREVIEW_READY }, window.location.origin)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const blocks = useMemo(() => parseArticleHtml(payload?.html ?? ''), [payload?.html])

  if (!payload) {
    return <div className="journal min-h-screen" />
  }

  return (
    <div className="journal min-h-screen">
      {banner && (
        <div className="sticky top-0 z-10 bg-void px-5 py-2 text-center font-plex text-[10.5px] tracking-[0.14em] text-amber">
          {banner}
        </div>
      )}
      <PostView data={{ record: payload.record, blocks, blocksEn: null, credits: payload.credits, next: payload.next }} preview />
    </div>
  )
}
