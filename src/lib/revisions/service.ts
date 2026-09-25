/*
 * 발행 글 교체·이전 버전 되돌리기 — 서버 액션(src/lib/actions/revisions.ts)의 본체.
 * DB·권한·캐시 갱신은 deps로 받는다 — 테스트(scripts/revisions-test.ts)는 목을 끼운다.
 *
 * 실제 쓰기는 Postgres 함수 하나(006_post_revisions.sql)가 한 트랜잭션으로 한다:
 *   replace_published_with_draft: ① 대상 행 스냅샷 → ② 초안 내용 복사 → ③ 초안 soft delete
 *   restore_post_revision:        현재 상태 스냅샷 → 버전 복원
 * 여기서 하는 검증은 사람에게 알맞은 안내를 주기 위한 사전 확인이고, 같은 검증을 함수가 행을 잠근 채 다시 한다.
 */

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface ReplaceCandidate {
  id: string
  slug: string
  title: string
  status: string
  deleted_at: string | null
  /** 연재 slug (캐시 갱신용) */
  categorySlug: string | null
}

export interface DbError {
  code?: string
  message?: string
}

export interface RevisionDeps {
  isAdmin(): Promise<boolean>
  /** id로 글 여러 개 (지운 글 포함) */
  findPosts(ids: string[]): Promise<{ data: ReplaceCandidate[] | null; error: DbError | null }>
  rpc(
    name: 'replace_published_with_draft' | 'restore_post_revision',
    args: Record<string, string>,
  ): Promise<{ data: unknown; error: DbError | null }>
  /** 연재 id → slug */
  categorySlugs(ids: string[]): Promise<Map<string, string>>
  revalidate(paths: string[]): void
}

export type RevisionActionResult =
  | { success: true; postId: string; slug: string; revisionId: string | null }
  | { success: false; error: string }

export const MESSAGES = {
  forbidden: '관리자 권한이 없습니다.',
  badId: '잘못된 요청입니다(글 id 형식).',
  samePost: '초안과 교체할 발행 글이 같은 글입니다.',
  draftNotFound: '초안을 찾지 못했습니다.',
  draftDeleted: '이미 지워진 초안입니다(이미 교체에 쓰였을 수 있습니다).',
  draftNotDraft: '초안 상태인 글만 교체에 쓸 수 있습니다.',
  targetNotFound: '교체할 발행 글을 찾지 못했습니다.',
  targetDeleted: '지워진 글은 교체할 수 없습니다.',
  targetNotPublished: '발행된 글만 교체할 수 있습니다.',
  postNotFound: '글을 찾지 못했습니다.',
  postDeleted: '지워진 글은 되돌릴 수 없습니다.',
  revisionNotFound: '이전 버전을 찾지 못했습니다.',
  revisionMismatch: '이 글의 이전 버전이 아닙니다.',
  migrationMissing: 'DB에 006 마이그레이션(post_revisions)이 아직 적용되지 않아 교체·되돌리기를 할 수 없습니다.',
  lookupFailed: '글을 확인하지 못했습니다',
  replaceFailed: '교체하지 못했습니다',
  restoreFailed: '되돌리지 못했습니다',
} as const

/** 함수가 던지는 'REPLACE:코드' / 'RESTORE:코드' → 안내 문구 */
const RPC_CODES: Record<string, string> = {
  'REPLACE:missing_id': MESSAGES.badId,
  'REPLACE:same_post': MESSAGES.samePost,
  'REPLACE:draft_not_found': MESSAGES.draftNotFound,
  'REPLACE:draft_deleted': MESSAGES.draftDeleted,
  'REPLACE:draft_not_draft': MESSAGES.draftNotDraft,
  'REPLACE:target_not_found': MESSAGES.targetNotFound,
  'REPLACE:target_deleted': MESSAGES.targetDeleted,
  'REPLACE:target_not_published': MESSAGES.targetNotPublished,
  'RESTORE:missing_id': MESSAGES.badId,
  'RESTORE:post_not_found': MESSAGES.postNotFound,
  'RESTORE:post_deleted': MESSAGES.postDeleted,
  'RESTORE:revision_not_found': MESSAGES.revisionNotFound,
  'RESTORE:revision_mismatch': MESSAGES.revisionMismatch,
}

/** 테이블·함수가 없을 때 (마이그레이션 적용 전) — PostgREST PGRST202/PGRST205, Postgres 42883/42P01 */
export function isMigrationMissing(error: DbError | null): boolean {
  if (!error) return false
  if (['PGRST202', 'PGRST205', '42883', '42P01'].includes(error.code ?? '')) return true
  return /(function|relation) .* does not exist|could not find the (function|table)/i.test(error.message ?? '')
}

export function rpcErrorMessage(error: DbError, fallback: string): string {
  if (isMigrationMissing(error)) return MESSAGES.migrationMissing
  const match = /(REPLACE|RESTORE):[a-z_]+/.exec(error.message ?? '')
  if (match && RPC_CODES[match[0]]) return RPC_CODES[match[0]]
  return `${fallback}: ${error.message ?? '알 수 없는 오류'}`
}

/** 사전 확인 — 문제가 있으면 안내 문구, 없으면 null */
export function validateReplace(
  draftId: string,
  targetId: string,
  draft: ReplaceCandidate | undefined,
  target: ReplaceCandidate | undefined,
): string | null {
  if (!UUID_RE.test(draftId) || !UUID_RE.test(targetId)) return MESSAGES.badId
  if (draftId.toLowerCase() === targetId.toLowerCase()) return MESSAGES.samePost
  if (!draft) return MESSAGES.draftNotFound
  if (draft.deleted_at) return MESSAGES.draftDeleted
  if (draft.status !== 'draft') return MESSAGES.draftNotDraft
  if (!target) return MESSAGES.targetNotFound
  if (target.deleted_at) return MESSAGES.targetDeleted
  if (target.status !== 'published') return MESSAGES.targetNotPublished
  return null
}

/**
 * 공개 경로 캐시 — 발행·저장(revalidatePostPaths)과 같은 목록에 연재 페이지를 더한다.
 * 교체·되돌리기는 연재가 바뀔 수 있어 옛·새 연재 페이지를 모두 비운다.
 */
export function revalidationPaths(slug: string, postId: string, categorySlugs: (string | null | undefined)[]): string[] {
  const paths = ['/', `/post/${slug}`, '/admin', '/sitemap.xml', `/admin/posts/${postId}/edit`]
  for (const c of new Set(categorySlugs.filter((c): c is string => !!c))) paths.push(`/category/${c}`)
  return paths
}

/** 교체 대상 추천 — 초안 slug에서 -rev·-v2 같은 접미사를 뗀 slug와 같은 발행 글 */
const REVISION_SUFFIX = /-(rev|revised|revision|v\d+|new|draft)\d*$/

export function baseSlug(slug: string): string {
  let base = slug
  while (REVISION_SUFFIX.test(base)) base = base.replace(REVISION_SUFFIX, '')
  return base
}

export function suggestReplaceTarget(draftSlug: string, published: { id: string; slug: string }[]): string | null {
  const base = baseSlug(draftSlug)
  if (!base || base === draftSlug) return null
  return published.find((p) => p.slug === base)?.id ?? null
}

function readRpcResult(data: unknown): Record<string, unknown> {
  return typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {}
}

export async function replacePublishedWithDraftCore(
  deps: RevisionDeps,
  draftId: unknown,
  targetId: unknown,
): Promise<RevisionActionResult> {
  if (!(await deps.isAdmin())) return { success: false, error: MESSAGES.forbidden }
  if (typeof draftId !== 'string' || typeof targetId !== 'string' || !UUID_RE.test(draftId) || !UUID_RE.test(targetId))
    return { success: false, error: MESSAGES.badId }
  if (draftId.toLowerCase() === targetId.toLowerCase()) return { success: false, error: MESSAGES.samePost }

  const found = await deps.findPosts([draftId, targetId])
  if (found.error) return { success: false, error: `${MESSAGES.lookupFailed}: ${found.error.message ?? ''}`.trim() }
  const rows = found.data ?? []
  const draft = rows.find((r) => r.id === draftId)
  const target = rows.find((r) => r.id === targetId)
  const invalid = validateReplace(draftId, targetId, draft, target)
  if (invalid) return { success: false, error: invalid }

  const { data, error } = await deps.rpc('replace_published_with_draft', { p_draft_id: draftId, p_target_id: targetId })
  if (error) return { success: false, error: rpcErrorMessage(error, MESSAGES.replaceFailed) }

  const result = readRpcResult(data)
  const slug = typeof result.target_slug === 'string' ? result.target_slug : target!.slug
  deps.revalidate(revalidationPaths(slug, targetId, [target!.categorySlug, draft!.categorySlug]))
  return {
    success: true,
    postId: targetId,
    slug,
    revisionId: typeof result.revision_id === 'string' ? result.revision_id : null,
  }
}

export async function restorePostRevisionCore(
  deps: RevisionDeps,
  postId: unknown,
  revisionId: unknown,
): Promise<RevisionActionResult> {
  if (!(await deps.isAdmin())) return { success: false, error: MESSAGES.forbidden }
  if (typeof postId !== 'string' || typeof revisionId !== 'string' || !UUID_RE.test(postId) || !UUID_RE.test(revisionId))
    return { success: false, error: MESSAGES.badId }

  const { data, error } = await deps.rpc('restore_post_revision', { p_post_id: postId, p_revision_id: revisionId })
  if (error) return { success: false, error: rpcErrorMessage(error, MESSAGES.restoreFailed) }

  const result = readRpcResult(data)
  const slug = typeof result.slug === 'string' ? result.slug : null
  const categoryIds = [result.old_category_id, result.new_category_id].filter((x): x is string => typeof x === 'string')
  const slugs = categoryIds.length ? await deps.categorySlugs(categoryIds) : new Map<string, string>()
  if (slug) deps.revalidate(revalidationPaths(slug, postId, categoryIds.map((id) => slugs.get(id))))
  else deps.revalidate(['/', '/admin', '/sitemap.xml', `/admin/posts/${postId}/edit`])
  return {
    success: true,
    postId,
    slug: slug ?? '',
    revisionId: typeof result.revision_id === 'string' ? result.revision_id : null,
  }
}
