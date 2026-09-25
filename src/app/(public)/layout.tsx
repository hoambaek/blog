import { Header, Footer } from '@/components/layout'
import { VisibleCategoriesProvider } from '@/components/layout/VisibleCategories'
import { getCategoriesWithPostCount } from '@/lib/actions/categories'

/*
 * 내비게이션의 카테고리 노출 여부가 발행 글 수에 따라 바뀌므로, 이 구간의 정적 페이지
 * (about·subscribe 등)도 글 페이지와 같은 주기로 다시 굽는다.
 */
export const revalidate = 3600

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 발행 글이 1편 이상인 카테고리만 공개 노출. 조회 실패(빈 배열)면 null → 전부 노출.
  const categories = await getCategoriesWithPostCount()
  const visibleSlugs = categories.length > 0
    ? categories.filter((c) => c.post_count > 0).map((c) => c.slug)
    : null

  return (
    <VisibleCategoriesProvider slugs={visibleSlugs}>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </VisibleCategoriesProvider>
  )
}
