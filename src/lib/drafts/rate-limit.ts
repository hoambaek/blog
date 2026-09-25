/*
 * 아주 단순한 메모리 레이트 제한 (고정 창 안의 요청 시각 목록).
 *
 * 한계 — 서버 인스턴스마다 따로 센다. Vercel에서는 인스턴스가 여러 개 뜨거나 새로 뜨면 수가 초기화된다.
 * 그래서 "실수로 반복 호출·단순 대입 공격을 늦추는" 정도이고, 전역 보장은 아니다.
 * 진짜 방어선은 32자 이상 무작위 토큰이다.
 */

export interface RateLimiter {
  take(key: string, now?: number): { ok: true } | { ok: false; retryAfterSec: number }
}

export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }): RateLimiter {
  const hits = new Map<string, number[]>()
  return {
    take(key, now = Date.now()) {
      if (hits.size > 1000) {
        for (const [k, list] of hits) if (!list.some((t) => now - t < windowMs)) hits.delete(k)
      }
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
      if (recent.length >= limit) {
        hits.set(key, recent)
        return { ok: false, retryAfterSec: Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000)) }
      }
      recent.push(now)
      hits.set(key, recent)
      return { ok: true }
    },
  }
}
