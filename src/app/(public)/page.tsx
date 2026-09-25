import type { Metadata } from 'next'
import { getAllPublishedPosts } from '@/lib/actions/posts'
import { getFirstPublishedAt, getJournalSeries, toRecords } from '@/lib/journal/data'
import { kstYear } from '@/lib/journal/format'
import { HomeView } from '@/components/journal/HomeView'

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

/**
 * 목록에 한 번에 싣는 기록 수. 전체 기록(/category/all)을 이 화면으로 합쳤으므로
 * 발행 글이 이 수를 넘으면 쪽 나눔을 붙여야 한다(2026-09 기준 4편).
 */
const LIST_LIMIT = 100

export default async function HomePage() {
  const [{ posts, total }, series, firstPublishedAt] = await Promise.all([
    getAllPublishedPosts(LIST_LIMIT, 0),
    getJournalSeries(),
    getFirstPublishedAt(),
  ])

  // 대표 글(가장 최근)만 관측 줄 수온을 계산한다 — 번호 목록에는 수온 열이 없다
  const [featured, rest] = await Promise.all([
    toRecords(posts.slice(0, 1), { withSea: true }),
    toRecords(posts.slice(1)),
  ])

  return (
    <HomeView
      records={[...featured, ...rest]}
      total={total}
      startYear={firstPublishedAt ? kstYear(firstPublishedAt) : null}
      series={series}
    />
  )
}
