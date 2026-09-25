/*
 * 발행 글 교체·되돌리기 테스트 — `npm run test:revisions`
 *
 *   src/lib/revisions/service.ts 를 DB·권한·캐시 갱신을 목으로 끼워 확인한다.
 *   - 교체: 권한·id 형식·같은 글·초안/대상 상태 검증 실패, RPC 오류 코드 → 안내 문구, 마이그레이션 없음, 성공 시 캐시 경로
 *   - 되돌리기: 권한·id 형식, RPC 오류, 성공 시 연재 slug 조회 + 캐시 경로
 *   - 교체 대상 추천(slug 접미사)
 *
 * 네트워크·운영 DB에 닿지 않는다. SQL 함수 자체는 이 테스트 범위 밖이다.
 */
import assert from 'node:assert/strict'
import {
  MESSAGES,
  baseSlug,
  isMigrationMissing,
  replacePublishedWithDraftCore,
  restorePostRevisionCore,
  revalidationPaths,
  suggestReplaceTarget,
  type DbError,
  type ReplaceCandidate,
  type RevisionDeps,
} from '../src/lib/revisions/service'

const results: { name: string; ok: boolean; error?: string }[] = []
async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn()
    results.push({ name, ok: true })
  } catch (error) {
    results.push({ name, ok: false, error: (error as Error).message })
  }
}

const DRAFT = '11111111-1111-4111-8111-111111111111'
const TARGET = '22222222-2222-4222-8222-222222222222'
const REVISION = '33333333-3333-4333-8333-333333333333'

function draftRow(over: Partial<ReplaceCandidate> = {}): ReplaceCandidate {
  return { id: DRAFT, slug: 'what-is-rev', title: '새 제목', status: 'draft', deleted_at: null, categorySlug: 'maison', ...over }
}
function targetRow(over: Partial<ReplaceCandidate> = {}): ReplaceCandidate {
  return { id: TARGET, slug: 'what-is', title: '옛 제목', status: 'published', deleted_at: null, categorySlug: 'sea-log', ...over }
}

interface MockState {
  admin: boolean
  rows: ReplaceCandidate[]
  findError: DbError | null
  rpcResult: { data: unknown; error: DbError | null }
  categories: Map<string, string>
  rpcCalls: { name: string; args: Record<string, string> }[]
  revalidated: string[]
}

function mockDeps(over: Partial<MockState> = {}): { deps: RevisionDeps; state: MockState } {
  const state: MockState = {
    admin: true,
    rows: [draftRow(), targetRow()],
    findError: null,
    rpcResult: { data: { revision_id: REVISION, target_slug: 'what-is' }, error: null },
    categories: new Map(),
    rpcCalls: [],
    revalidated: [],
    ...over,
  }
  const deps: RevisionDeps = {
    isAdmin: async () => state.admin,
    findPosts: async (ids) =>
      state.findError ? { data: null, error: state.findError } : { data: state.rows.filter((r) => ids.includes(r.id)), error: null },
    rpc: async (name, args) => {
      state.rpcCalls.push({ name, args })
      return state.rpcResult
    },
    categorySlugs: async (ids) => new Map([...state.categories].filter(([id]) => ids.includes(id))),
    revalidate: (paths) => {
      state.revalidated.push(...paths)
    },
  }
  return { deps, state }
}

async function expectReplaceFail(over: Partial<MockState>, draftId: unknown, targetId: unknown, message: string) {
  const { deps, state } = mockDeps(over)
  const result = await replacePublishedWithDraftCore(deps, draftId, targetId)
  assert.equal(result.success, false)
  assert.equal(!result.success && result.error, message)
  return state
}

async function main() {
  // ── 교체: 검증 실패 (RPC를 부르지 않아야 한다) ──
  await test('교체: 관리자가 아니면 거부, 조회·RPC 없음', async () => {
    const state = await expectReplaceFail({ admin: false }, DRAFT, TARGET, MESSAGES.forbidden)
    assert.equal(state.rpcCalls.length, 0)
    assert.equal(state.revalidated.length, 0)
  })
  await test('교체: id 형식이 아니면 거부', async () => {
    const s1 = await expectReplaceFail({}, 'abc', TARGET, MESSAGES.badId)
    const s2 = await expectReplaceFail({}, DRAFT, undefined, MESSAGES.badId)
    const s3 = await expectReplaceFail({}, DRAFT, `${TARGET}' or 1=1`, MESSAGES.badId)
    assert.equal(s1.rpcCalls.length + s2.rpcCalls.length + s3.rpcCalls.length, 0)
  })
  await test('교체: 같은 글이면 거부 (대소문자 달라도)', async () => {
    const state = await expectReplaceFail({}, DRAFT, DRAFT.toUpperCase(), MESSAGES.samePost)
    assert.equal(state.rpcCalls.length, 0)
  })
  await test('교체: 초안이 없음', async () => {
    const state = await expectReplaceFail({ rows: [targetRow()] }, DRAFT, TARGET, MESSAGES.draftNotFound)
    assert.equal(state.rpcCalls.length, 0)
  })
  await test('교체: 초안이 지워짐', async () => {
    await expectReplaceFail({ rows: [draftRow({ deleted_at: '2026-09-01T00:00:00Z' }), targetRow()] }, DRAFT, TARGET, MESSAGES.draftDeleted)
  })
  await test('교체: 초안 자리에 발행 글', async () => {
    await expectReplaceFail({ rows: [draftRow({ status: 'published' }), targetRow()] }, DRAFT, TARGET, MESSAGES.draftNotDraft)
  })
  await test('교체: 초안 자리에 예약(scheduled) 글도 거부', async () => {
    await expectReplaceFail({ rows: [draftRow({ status: 'scheduled' }), targetRow()] }, DRAFT, TARGET, MESSAGES.draftNotDraft)
  })
  await test('교체: 대상이 없음', async () => {
    await expectReplaceFail({ rows: [draftRow()] }, DRAFT, TARGET, MESSAGES.targetNotFound)
  })
  await test('교체: 대상이 지워짐', async () => {
    await expectReplaceFail({ rows: [draftRow(), targetRow({ deleted_at: '2026-09-01T00:00:00Z' })] }, DRAFT, TARGET, MESSAGES.targetDeleted)
  })
  await test('교체: 대상이 발행 글이 아님', async () => {
    const state = await expectReplaceFail({ rows: [draftRow(), targetRow({ status: 'draft' })] }, DRAFT, TARGET, MESSAGES.targetNotPublished)
    assert.equal(state.rpcCalls.length, 0)
  })
  await test('교체: 글 조회 실패는 실패로 보고 (없음으로 바꾸지 않는다)', async () => {
    const { deps, state } = mockDeps({ findError: { code: '08006', message: 'connection failure' } })
    const result = await replacePublishedWithDraftCore(deps, DRAFT, TARGET)
    assert.equal(result.success, false)
    assert.ok(!result.success && result.error.includes('connection failure'))
    assert.ok(!result.success && result.error.startsWith(MESSAGES.lookupFailed))
    assert.equal(state.rpcCalls.length, 0)
  })

  // ── 교체: RPC 오류 (사전 확인 뒤 상태가 바뀐 경우 등) ──
  await test('교체: RPC가 REPLACE:draft_deleted를 던지면 안내 문구로', async () => {
    const state = await expectReplaceFail(
      { rpcResult: { data: null, error: { code: 'P0001', message: 'REPLACE:draft_deleted' } } },
      DRAFT,
      TARGET,
      MESSAGES.draftDeleted,
    )
    assert.equal(state.rpcCalls.length, 1)
    assert.equal(state.revalidated.length, 0, '실패하면 캐시를 비우지 않는다')
  })
  await test('교체: RPC가 REPLACE:target_not_published를 던지면 안내 문구로', async () => {
    await expectReplaceFail(
      { rpcResult: { data: null, error: { code: 'P0001', message: 'REPLACE:target_not_published' } } },
      DRAFT,
      TARGET,
      MESSAGES.targetNotPublished,
    )
  })
  await test('교체: 함수가 없으면(006 미적용) 마이그레이션 안내', async () => {
    await expectReplaceFail(
      {
        rpcResult: {
          data: null,
          error: { code: 'PGRST202', message: 'Could not find the function public.replace_published_with_draft(p_draft_id, p_target_id) in the schema cache' },
        },
      },
      DRAFT,
      TARGET,
      MESSAGES.migrationMissing,
    )
  })
  await test('교체: 알 수 없는 DB 오류는 원문을 붙여 보고', async () => {
    const { deps } = mockDeps({ rpcResult: { data: null, error: { code: '23503', message: 'violates foreign key constraint' } } })
    const result = await replacePublishedWithDraftCore(deps, DRAFT, TARGET)
    assert.equal(result.success, false)
    assert.ok(!result.success && result.error.startsWith(MESSAGES.replaceFailed))
    assert.ok(!result.success && result.error.includes('violates foreign key constraint'))
  })

  // ── 교체: 성공 ──
  await test('교체: 성공 — RPC 인자, 대상 slug·연재(옛·새) 캐시 갱신', async () => {
    const { deps, state } = mockDeps()
    const result = await replacePublishedWithDraftCore(deps, DRAFT, TARGET)
    assert.deepEqual(result, { success: true, postId: TARGET, slug: 'what-is', revisionId: REVISION })
    assert.deepEqual(state.rpcCalls, [{ name: 'replace_published_with_draft', args: { p_draft_id: DRAFT, p_target_id: TARGET } }])
    for (const path of ['/', '/post/what-is', '/admin', '/sitemap.xml', `/admin/posts/${TARGET}/edit`, '/category/sea-log', '/category/maison'])
      assert.ok(state.revalidated.includes(path), `캐시 경로 누락: ${path}`)
    assert.ok(!state.revalidated.includes('/post/what-is-rev'), '초안 주소는 공개 경로가 아니다')
  })
  await test('교체: 같은 연재면 연재 경로는 한 번만', () => {
    const paths = revalidationPaths('a', TARGET, ['sea-log', 'sea-log', null])
    assert.equal(paths.filter((p) => p === '/category/sea-log').length, 1)
  })

  // ── 되돌리기 ──
  await test('되돌리기: 관리자가 아니면 거부', async () => {
    const { deps, state } = mockDeps({ admin: false })
    const result = await restorePostRevisionCore(deps, TARGET, REVISION)
    assert.deepEqual(result, { success: false, error: MESSAGES.forbidden })
    assert.equal(state.rpcCalls.length, 0)
  })
  await test('되돌리기: id 형식이 아니면 거부', async () => {
    const { deps, state } = mockDeps()
    const result = await restorePostRevisionCore(deps, TARGET, 'nope')
    assert.deepEqual(result, { success: false, error: MESSAGES.badId })
    assert.equal(state.rpcCalls.length, 0)
  })
  await test('되돌리기: 다른 글의 버전이면 안내 문구', async () => {
    const { deps, state } = mockDeps({ rpcResult: { data: null, error: { code: 'P0001', message: 'RESTORE:revision_mismatch' } } })
    const result = await restorePostRevisionCore(deps, TARGET, REVISION)
    assert.deepEqual(result, { success: false, error: MESSAGES.revisionMismatch })
    assert.equal(state.revalidated.length, 0)
  })
  await test('되돌리기: 지워진 글이면 안내 문구', async () => {
    const { deps } = mockDeps({ rpcResult: { data: null, error: { message: 'RESTORE:post_deleted' } } })
    assert.deepEqual(await restorePostRevisionCore(deps, TARGET, REVISION), { success: false, error: MESSAGES.postDeleted })
  })
  await test('되돌리기: 테이블·함수 없음(42883)이면 마이그레이션 안내', async () => {
    const { deps } = mockDeps({ rpcResult: { data: null, error: { code: '42883', message: 'function restore_post_revision(uuid, uuid) does not exist' } } })
    assert.deepEqual(await restorePostRevisionCore(deps, TARGET, REVISION), { success: false, error: MESSAGES.migrationMissing })
  })
  await test('되돌리기: 성공 — 연재 id를 slug로 바꿔 캐시 갱신', async () => {
    const OLD_CAT = '44444444-4444-4444-8444-444444444444'
    const NEW_CAT = '55555555-5555-4555-8555-555555555555'
    const { deps, state } = mockDeps({
      rpcResult: { data: { revision_id: REVISION, slug: 'what-is', old_category_id: OLD_CAT, new_category_id: NEW_CAT }, error: null },
      categories: new Map([
        [OLD_CAT, 'maison'],
        [NEW_CAT, 'sea-log'],
      ]),
    })
    const result = await restorePostRevisionCore(deps, TARGET, REVISION)
    assert.deepEqual(result, { success: true, postId: TARGET, slug: 'what-is', revisionId: REVISION })
    assert.deepEqual(state.rpcCalls, [{ name: 'restore_post_revision', args: { p_post_id: TARGET, p_revision_id: REVISION } }])
    for (const path of ['/post/what-is', '/category/maison', '/category/sea-log', '/sitemap.xml'])
      assert.ok(state.revalidated.includes(path), `캐시 경로 누락: ${path}`)
  })

  // ── 보조 ──
  await test('마이그레이션 없음 판정', () => {
    assert.equal(isMigrationMissing({ code: 'PGRST205', message: "Could not find the table 'public.post_revisions'" }), true)
    assert.equal(isMigrationMissing({ code: '42P01', message: 'relation "post_revisions" does not exist' }), true)
    assert.equal(isMigrationMissing({ code: 'P0001', message: 'REPLACE:same_post' }), false)
    assert.equal(isMigrationMissing(null), false)
  })
  await test('교체 대상 추천: -rev·-v2 접미사를 뗀 slug', () => {
    const published = [
      { id: 'a', slug: 'what-is-undersea-aging' },
      { id: 'b', slug: 'sea-log-2026' },
    ]
    assert.equal(baseSlug('what-is-undersea-aging-rev'), 'what-is-undersea-aging')
    assert.equal(baseSlug('what-is-undersea-aging-v2'), 'what-is-undersea-aging')
    assert.equal(baseSlug('what-is-undersea-aging-rev2'), 'what-is-undersea-aging')
    assert.equal(baseSlug('what-is-undersea-aging-v2-rev'), 'what-is-undersea-aging')
    assert.equal(suggestReplaceTarget('what-is-undersea-aging-rev', published), 'a')
    assert.equal(suggestReplaceTarget('what-is-undersea-aging-v3', published), 'a')
    assert.equal(suggestReplaceTarget('what-is-undersea-aging', published), null, '접미사가 없으면 추천하지 않는다')
    assert.equal(suggestReplaceTarget('sea-log-2026-rev', published), 'b', '숫자로 끝나는 slug도 접미사만 뗀다')
    assert.equal(suggestReplaceTarget('other-post-rev', published), null)
  })

  const failed = results.filter((r) => !r.ok)
  for (const r of results) console.log(`${r.ok ? '✓' : '✗'} ${r.name}${r.error ? `\n    ${r.error}` : ''}`)
  console.log(`\n${results.length - failed.length}/${results.length} 통과`)
  if (failed.length) process.exit(1)
}

void main()
