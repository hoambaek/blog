import { getAdminSeries } from '@/lib/admin/data'
import { SeriesTable } from '@/components/admin/SeriesTable'

/* 연재 — Paper IQZ-0 아래쪽 절반 (이름 KO/EN, 설명 KO/EN, 기록 수, 자동 공개·숨김) */
export const dynamic = 'force-dynamic'

export default async function AdminSeriesPage() {
  const series = await getAdminSeries()
  return <SeriesTable series={series} />
}
