import { getDashboardStats, getRecentPosts } from '@/lib/actions/posts'
import { getSubscriberStats } from '@/lib/actions/subscribers'
import { AdminDashboardContent } from '@/components/admin/AdminDashboardContent'

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
