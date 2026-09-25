import { getJournalSeries, getPostNumbers } from '@/lib/journal/data'
import { AboutView } from '@/components/journal/AboutView'

export const revalidate = 3600

export default async function AboutPage() {
  const [series, numbers] = await Promise.all([getJournalSeries(), getPostNumbers()])
  return <AboutView recordCount={numbers.size} series={series} />
}
