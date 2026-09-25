'use client'

import { createContext, useContext } from 'react'

/*
 * 공개 화면(헤더·모바일 메뉴·푸터·about)에 노출할 카테고리 slug 목록.
 * (public)/layout이 "발행 글이 1편 이상인 카테고리"를 조회해 내려 준다.
 * null은 "조회하지 못함"이라는 뜻 — 이때는 거르지 않고 전부 보여 준다
 * (조회 실패로 내비게이션이 통째로 비는 것을 막는다).
 * 빈 카테고리 URL 자체는 막지 않는다. 노출 지점에서만 뺀다.
 */
const VisibleCategoriesContext = createContext<string[] | null>(null)

export function VisibleCategoriesProvider({
  slugs,
  children,
}: {
  slugs: string[] | null
  children: React.ReactNode
}) {
  return (
    <VisibleCategoriesContext.Provider value={slugs}>
      {children}
    </VisibleCategoriesContext.Provider>
  )
}

/** 노출 대상 카테고리만 남긴다. */
export function useVisibleCategories<T extends { slug: string }>(items: T[]): T[] {
  const slugs = useContext(VisibleCategoriesContext)
  if (!slugs) return items
  return items.filter((item) => slugs.includes(item.slug))
}
