import { getActiveSubscriberCount, getNewsletterHistory, getPublishedIndex } from '@/lib/admin/data'
import { NewsletterComposer } from '@/components/admin/NewsletterComposer'

/* 뉴스레터 — 기록 기반 작성 (Paper IOR-0) + 발송 기록 */
export const dynamic = 'force-dynamic'

export default async function AdminNewsletterPage() {
  const [records, subscribers, history] = await Promise.all([
    getPublishedIndex(),
    getActiveSubscriberCount(),
    getNewsletterHistory(),
  ])
  return (
    <NewsletterComposer
      records={records}
      subscribers={subscribers}
      history={history.map((n) => ({
        id: n.id,
        subject: n.subject,
        status: n.status,
        sentAt: n.sent_at,
        createdAt: n.created_at,
        total: n.total_recipients,
        accepted: n.delivered_count,
        failed: Array.isArray(n.failed_recipients) ? (n.failed_recipients as { email: string; error: string }[]) : [],
      }))}
    />
  )
}
