import { redirect } from 'next/navigation'

/* 기록 목록은 /admin으로 합쳤다 — 예전 주소는 그리로 보낸다 */
export default function AdminPostsRedirect() {
  redirect('/admin')
}
