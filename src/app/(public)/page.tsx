import { getFeaturedPosts, getLatestPosts } from '@/lib/actions/posts'
import { HomeContent } from '@/components/home/HomeContent'

export default async function HomePage() {
  const featuredPosts = await getFeaturedPosts(3)
  const latestPosts = await getLatestPosts(4)

  return <HomeContent featuredPosts={featuredPosts} latestPosts={latestPosts} />
}
