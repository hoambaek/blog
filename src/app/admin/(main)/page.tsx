import { getActiveSubscriberCount, getAdminRecordRows } from '@/lib/admin/data'
import { RecordsTable } from '@/components/admin/RecordsTable'

/*
 * 기록 목록 = 관리자 첫 화면 (예전 대시보드를 합쳤다) — Paper IEU-0
 * 볼 때마다 지금 숫자여야 한다 — 절대 굽지 않는다(2026-07-27 캐시 복구 때의 교훈).
 */
export const dynamic = 'force-dynamic'

export default async function AdminRecordsPage() {
  const [rows, subscribers] = await Promise.all([getAdminRecordRows(), getActiveSubscriberCount()])
  return <RecordsTable rows={rows} subscribers={subscribers} />
}
