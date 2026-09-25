import { dateline } from '@/lib/journal/format'

/** '방금' · 'N분 전' · 'N시간 전' · 'N일 전' · 그 이상은 날짜 */
export function relativeTime(iso: string | null, now: number): string {
  if (!iso) return ''
  const diff = Math.max(0, now - Date.parse(iso))
  const min = Math.floor(diff / 60_000)
  if (min < 1) return '방금'
  if (min < 60) return `${min}분 전`
  const hours = Math.floor(min / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}일 전`
  return dateline(iso)
}
