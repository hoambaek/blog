import { redirect } from 'next/navigation'

/* 카테고리 관리는 연재(/admin/series)로 옮겼다 */
export default function AdminCategoriesRedirect() {
  redirect('/admin/series')
}
