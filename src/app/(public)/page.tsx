import type { Metadata } from 'next'
import { getFeaturedPosts, getLatestPosts } from '@/lib/actions/posts'
import { HomeContent } from '@/components/home/HomeContent'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Muse de Marée | 바다가 쓴 시간',
  description: '샴페인은 샹파뉴가 만들고, 그 시간은 한국 남해가 씁니다. 수심 30m에서 보낸 날들을 기록하는 뮤즈드마레(Muse de Marée)의 저널.',
  openGraph: {
    title: 'Muse de Marée | 바다가 쓴 시간',
    description: '샴페인은 샹파뉴가 만들고, 그 시간은 한국 남해가 씁니다. 수심 30m에서 보낸 날들을 기록하는 뮤즈드마레의 저널.',
    type: 'website',
    siteName: 'Muse de Marée',
    url: 'https://blog.musedemaree.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Muse de Marée | 바다가 쓴 시간',
    description: '샴페인은 샹파뉴가 만들고, 그 시간은 한국 남해가 씁니다. 수심 30m에서 보낸 날들을 기록하는 뮤즈드마레의 저널.',
  },
  alternates: {
    canonical: 'https://blog.musedemaree.com',
  },
}

export default async function HomePage() {
  const [featuredPosts, latestPosts] = await Promise.all([
    getFeaturedPosts(3),
    getLatestPosts(4),
  ])

  return <HomeContent featuredPosts={featuredPosts} latestPosts={latestPosts} />
}
