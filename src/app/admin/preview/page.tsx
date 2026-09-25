import { PreviewClient } from '@/components/admin/preview/PreviewClient'

/* 편집 화면 안 미리보기(iframe) — 내용은 부모 창이 postMessage로 보낸다. 저장 전 상태를 그대로 보여 준다. */
export const dynamic = 'force-dynamic'

export default function AdminLivePreviewPage() {
  return <PreviewClient initial={null} />
}
