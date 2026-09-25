import { currentUser } from '@clerk/nextjs/server'
import { getAdminNavCounts } from '@/lib/admin/data'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

/* 사이드바 화면(기록·뉴스레터·구독자·연재) — Paper IEU·IOR·IQZ의 232px void 사이드바 */
export const dynamic = 'force-dynamic'

export default async function AdminMainLayout({ children }: { children: React.ReactNode }) {
  const [counts, user] = await Promise.all([getAdminNavCounts(), currentUser()])
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? null

  return (
    <div className="flex min-h-screen max-md:flex-col">
      <AdminSidebar counts={counts} email={email} />
      <main className="min-w-0 flex-1 px-14 pb-16 pt-10 max-lg:px-6">{children}</main>
    </div>
  )
}
