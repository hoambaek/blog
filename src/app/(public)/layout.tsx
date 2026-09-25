import { VisibleCategoriesProvider } from '@/components/layout/VisibleCategories'
import { getCategoriesWithPostCount } from '@/lib/actions/categories'
import { getMenuSeaTemp } from '@/lib/journal/data'
import { JournalHeader } from '@/components/journal/JournalHeader'
import { JournalFooter } from '@/components/journal/JournalFooter'
import { SubscribeProvider } from '@/components/journal/SubscribeModal'
import '@/components/journal/journal.css'

/*
 * 내비게이션의 카테고리 노출 여부가 발행 글 수에 따라 바뀌므로, 이 구간의 정적 페이지
 * (about 등)도 글 페이지와 같은 주기로 다시 굽는다.
 */
export const revalidate = 3600

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [categories, seaTemp] = await Promise.all([getCategoriesWithPostCount(), getMenuSeaTemp()])
  // 발행 글이 1편 이상인 카테고리만 공개 노출. 조회 실패(빈 배열)면 null → 거르지 않는다.
  const visibleSlugs = categories.length > 0
    ? categories.filter((c) => c.post_count > 0).map((c) => c.slug)
    : null

  return (
    <VisibleCategoriesProvider slugs={visibleSlugs}>
      <div className="journal flex min-h-screen flex-col">
        <SubscribeProvider>
          <JournalHeader
            series={categories.map((c) => ({ slug: c.slug, name: c.name }))}
            seaTemp={seaTemp}
          />
          <main className="flex-1">{children}</main>
          <JournalFooter />
        </SubscribeProvider>
      </div>
    </VisibleCategoriesProvider>
  )
}
