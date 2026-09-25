import 'server-only'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { isMigrationMissing } from './service'

/* 편집 화면용 이전 버전 목록 — 서버 컴포넌트에서만 부른다(서버 액션으로 열지 않는다). */

export interface RevisionItem {
  id: string
  reason: string | null
  sourceDraftId: string | null
  createdAt: string
  /** 그 버전의 제목·slug (스냅샷에서) */
  title: string | null
  slug: string | null
}

/** available=false: 006 마이그레이션 적용 전이거나 조회 실패 — 편집 화면은 그대로 열리고 목록 자리에 안내만 */
export async function getPostRevisions(postId: string): Promise<{ available: boolean; items: RevisionItem[] }> {
  await requireAdmin()
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('post_revisions')
    .select('id, reason, source_draft_id, created_at, title:snapshot->>title, slug:snapshot->>slug')
    .eq('post_id', postId)
    .order('created_at', { ascending: false })
    .limit(30)
  if (error) {
    if (!isMigrationMissing(error)) console.error('Error fetching post revisions:', error)
    return { available: false, items: [] }
  }
  return {
    available: true,
    items: (data ?? []).map((r) => ({
      id: r.id,
      reason: r.reason,
      sourceDraftId: r.source_draft_id,
      createdAt: r.created_at,
      title: (r.title as string | null) ?? null,
      slug: (r.slug as string | null) ?? null,
    })),
  }
}
