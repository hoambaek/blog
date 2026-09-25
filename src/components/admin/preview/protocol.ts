import type { RecordSummary } from '@/lib/journal/records'

/* 편집 화면 ↔ 미리보기 iframe 사이 메시지 (같은 출처끼리만) */
export interface PreviewPayload {
  record: RecordSummary
  html: string
  credits: string[]
  next: RecordSummary | null
}

export const PREVIEW_MESSAGE = 'jdm-preview'
export const PREVIEW_READY = 'jdm-preview-ready'
