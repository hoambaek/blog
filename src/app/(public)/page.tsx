import { getFeaturedPosts, getLatestPosts } from '@/lib/actions/posts'
import { HomeContent } from '@/components/home/HomeContent'

export const revalidate = 3600

export default async function HomePage() {
  const [featuredPosts, latestPosts] = await Promise.all([
    getFeaturedPosts(3),
    getLatestPosts(4),
  ])

  return <HomeContent featuredPosts={featuredPosts} latestPosts={latestPosts} />
}
