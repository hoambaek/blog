import { permanentRedirect } from 'next/navigation'

/*
 * 구독은 목록 아래 뉴스레터 밴드와 구독 모달에서만 받는다(2026-09 저널 개편).
 * 예전 /subscribe 링크(메일·외부 게시물)가 끊기지 않도록 목록으로 보낸다.
 */
export default function SubscribePage() {
  permanentRedirect('/')
}
