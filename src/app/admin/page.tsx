import { getDashboardStats, getRecentPosts } from '@/lib/actions/posts'
import { getSubscriberStats } from '@/lib/actions/subscribers'
import { AdminDashboardContent } from '@/components/admin/AdminDashboardContent'

/*
 * 관리자 대시보드는 절대 굽지 않는다 — 볼 때마다 지금 숫자여야 한다.
 *
 * 전에는 Supabase 클라이언트가 cookies()를 읽는 바람에 우연히 동적이었다.
 * 그 배선을 걷어내자(2026-07-27, 블로그 캐시 복구) 이 페이지가 빌드 때
 * 구워지면서 글·구독자 수가 배포 시점 값에 얼어붙었다. 우연에 기대지 말고
 * 명시한다.
 */
export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const [postStats, subscriberStats, recentPosts] = await Promise.all([
    getDashboardStats(),
    getSubscriberStats(),
    getRecentPosts(5),
  ])

  return (
    <AdminDashboardContent
      postStats={postStats}
      subscriberStats={subscriberStats}
      recentPosts={recentPosts}
    />
  )
}
