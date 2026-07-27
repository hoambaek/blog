'use client'

import { useEffect } from 'react'

/*
 * 글 한 편을 열었을 때 한 번만 조회수를 올린다.
 * 화면에 아무것도 그리지 않는다 — 세는 일만 한다.
 *
 * 같은 세션에서 뒤로 갔다 다시 들어오면 컴포넌트가 다시 마운트되므로
 * sessionStorage로 글마다 한 번으로 묶는다(개발 중 StrictMode 이중 마운트도 함께 막힌다).
 */
export function ViewBeacon({ postId }: { postId: string }) {
  useEffect(() => {
    const key = `viewed:${postId}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {
      /* 사파리 비공개 모드 등 저장이 막힌 환경 — 중복을 감수하고 그냥 센다 */
    }
    /* keepalive: 곧바로 다른 글로 넘어가도 요청이 끊기지 않는다 */
    fetch('/api/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId }),
      keepalive: true,
    }).catch(() => {
      /* 조회수는 실패해도 읽는 데 지장이 없다 — 조용히 넘어간다 */
    })
  }, [postId])

  return null
}
