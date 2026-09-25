'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { checkAdmin } from '@/lib/auth/admin'
import {
  replacePublishedWithDraftCore,
  restorePostRevisionCore,
  type ReplaceCandidate,
  type RevisionActionResult,
  type RevisionDeps,
} from '@/lib/revisions/service'

/*
 * 발행 글 교체·되돌리기 서버 액션. 모든 호출은 관리자 확인(checkAdmin)을 먼저 통과해야 한다
 * (service role로 RLS를 우회하므로). 본체·검증은 src/lib/revisions/service.ts.
 */

function createRevisionDeps(): RevisionDeps {
  return {
    async isAdmin() {
      return (await checkAdmin()).ok
    },

    async findPosts(ids) {
      const supabase = await createAdminClient()
      const { data, error } = await supabase
        .from('posts')
        .select('id, slug, title, status, deleted_at, category:categories(slug)')
        .in('id', ids)
      if (error) return { data: null, error }
      const rows: ReplaceCandidate[] = (data ?? []).map((row) => {
        const category = row.category as { slug: string } | { slug: string }[] | null
        const categorySlug = Array.isArray(category) ? (category[0]?.slug ?? null) : (category?.slug ?? null)
        return { id: row.id, slug: row.slug, title: row.title, status: row.status, deleted_at: row.deleted_at, categorySlug }
      })
      return { data: rows, error: null }
    },

    async rpc(name, args) {
      const supabase = await createAdminClient()
      const { data, error } =
        name === 'replace_published_with_draft'
          ? await supabase.rpc(name, { p_draft_id: args.p_draft_id, p_target_id: args.p_target_id })
          : await supabase.rpc(name, { p_post_id: args.p_post_id, p_revision_id: args.p_revision_id })
      return { data, error }
    },

    async categorySlugs(ids) {
      const supabase = await createAdminClient()
      const { data, error } = await supabase.from('categories').select('id, slug').in('id', ids)
      if (error) console.error('Error fetching category slugs:', error)
      return new Map((data ?? []).map((c) => [c.id, c.slug]))
    },

    revalidate(paths) {
      for (const path of paths) revalidatePath(path)
    },
  }
}

/** 초안(draftId)의 내용으로 발행 글(targetId)을 교체한다. 주소·발행일·조회수는 대상 것을 유지, 이전 내용은 보관 */
export async function replacePublishedWithDraft(draftId: string, targetId: string): Promise<RevisionActionResult> {
  try {
    return await replacePublishedWithDraftCore(createRevisionDeps(), draftId, targetId)
  } catch (error) {
    console.error('Error replacing published post:', error)
    return { success: false, error: '교체 중 오류가 발생했습니다.' }
  }
}

/** 보관된 버전(revisionId)으로 글(postId)을 되돌린다. 현재 상태를 먼저 보관한다 */
export async function restorePostRevision(postId: string, revisionId: string): Promise<RevisionActionResult> {
  try {
    return await restorePostRevisionCore(createRevisionDeps(), postId, revisionId)
  } catch (error) {
    console.error('Error restoring post revision:', error)
    return { success: false, error: '되돌리는 중 오류가 발생했습니다.' }
  }
}
