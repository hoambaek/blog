import { getAllSubscribers } from '@/lib/admin/data'
import { SubscribersTable } from '@/components/admin/SubscribersTable'

/*
 * 구독자 — Paper IQZ-0 위쪽 절반.
 * 디자인의 LANG 칸은 뺐다: subscribers 테이블에 언어 컬럼이 없다(2026-09-25 anon REST로 locale·language·lang 조회 → 42703 컬럼 없음).
 */
export const dynamic = 'force-dynamic'

export default async function AdminSubscribersPage() {
  const subscribers = await getAllSubscribers()
  return <SubscribersTable subscribers={subscribers} />
}
