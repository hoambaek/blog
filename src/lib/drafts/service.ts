import { parseManuscript, renderManuscriptHtml, type ImageRef, type ManuscriptIssue } from '@/lib/manuscript/parse'
import { readingMinutes } from '@/lib/admin/records'
import type { TranslatedContent } from '@/lib/translation'

/*
 * Claude 초안 업로드 처리 (POST /api/drafts 의 본체). DB·R2·번역은 deps로 받는다 — 테스트는 목을 끼운다.
 *
 * 순서: 요청 검사 → 원고 파싱 → slug 충돌 판단 → 연재·다음 기록 확인 → 이미지 업로드 → 번역 → 저장
 * (돈·시간이 드는 업로드·번역은 거부할 이유를 모두 확인한 뒤에 한다)
 *
 * 규칙
 * - 상태는 항상 draft. 발행·삭제 경로는 없다.
 * - 같은 slug가 있으면: Claude 초안(draft_source='claude', status='draft')만 갱신한다.
 *   발행 글·관리자가 만든 글·지운 글(slug는 지워도 남는다)은 409.
 * - 관리자가 고친 초안(updated_at이 draft_uploaded_at보다 늦음)은 409, force일 때만 덮어쓴다.
 * - 원고가 정본이다: 갱신 때 원고에 없는 선택 항목(cover·series·next·meta)은 비운다.
 */

// ── 요청 한도 (Vercel 함수 요청 본문 한도 4.5MB 안쪽) ──
export const DRAFT_LIMITS = {
  /** JSON 본문 전체 (base64 이미지 포함) */
  maxBodyBytes: 4_000_000,
  maxManuscriptChars: 200_000,
  maxImages: 20,
  /** 이미지 한 장 (base64를 푼 크기) */
  maxImageBytes: 2_900_000,
}

/** 트리거가 찍는 updated_at(DB 시계)과 앱이 찍는 draft_uploaded_at 사이 오차 허용 */
export const EDIT_TOLERANCE_MS = 10_000

export interface ExistingPost {
  id: string
  slug: string
  status: string
  draft_source: string | null
  draft_uploaded_at: string | null
  updated_at: string
  deleted_at: string | null
}

export interface DraftRow {
  title: string
  slug: string
  excerpt: string | null
  category_id: string | null
  cover_image_url: string | null
  meta_title: string | null
  meta_description: string | null
  content: { html: string }
  reading_time_minutes: number
  status: 'draft'
  published_at: null
  draft_source: 'claude'
  draft_uploaded_at: string
  next_post_id: string | null
  title_en?: string | null
  excerpt_en?: string | null
  content_en?: { html: string } | null
  meta_title_en?: string | null
  meta_description_en?: string | null
}

export interface DraftDeps {
  /** slug로 글 하나 (지운 글 포함). 005 마이그레이션이 없으면 DraftSetupError를 던진다 */
  findPostBySlug(slug: string): Promise<ExistingPost | null>
  findCategoryBySlug(slug: string): Promise<{ id: string } | null>
  /** 최적화 후 R2에 올리고 공개 URL. 이미지가 아니면 예외 */
  uploadImage(data: Buffer, options: { folder: 'posts' | 'covers'; name: string }): Promise<string>
  /** 실패 시 정리용 (best-effort) */
  deleteImage(url: string): Promise<void>
  translate(input: {
    title?: string
    excerpt?: string
    content?: string
    metaTitle?: string
    metaDescription?: string
  }): Promise<{ content: TranslatedContent; ok: boolean; error?: string }>
  insertDraft(row: DraftRow): Promise<{ id: string } | { conflict: true }>
  /** expectedUpdatedAt이 있으면 그 시각 그대로일 때만 쓴다. 조건에 맞는 행이 없으면 null */
  updateDraft(id: string, row: DraftRow, guard: { expectedUpdatedAt: string | null }): Promise<{ id: string } | null>
  revalidate(slug: string): void
  now(): Date
}

export class DraftSetupError extends Error {}

export interface DraftRequest {
  manuscript: string
  images: Map<string, Buffer>
  force: boolean
}

export type DraftResponse =
  | { status: 200 | 201; body: DraftSuccess }
  | { status: 400 | 409 | 413 | 422 | 500 | 503; body: { ok: false; error: string; issues?: ManuscriptIssue[]; reason?: string } }

export interface DraftSuccess {
  ok: true
  action: 'created' | 'updated'
  postId: string
  slug: string
  editUrl: string
  previewUrl: string
  emptySlots: number
  uploadedImages: number
  translation: 'ok' | 'failed'
  warnings: string[]
}

function fail(status: 400 | 409 | 413 | 422 | 500 | 503, error: string, extra: { issues?: ManuscriptIssue[]; reason?: string } = {}): DraftResponse {
  return { status, body: { ok: false, error, ...extra } }
}

/** 요청 JSON 검사 — { manuscript, images?: [{ path, data(base64) }], force? } */
export function parseDraftRequest(raw: unknown): { ok: true; request: DraftRequest } | { ok: false; response: DraftResponse } {
  if (typeof raw !== 'object' || raw === null) return { ok: false, response: fail(400, '요청 본문은 JSON 객체여야 합니다.') }
  const body = raw as Record<string, unknown>
  if (typeof body.manuscript !== 'string' || !body.manuscript.trim())
    return { ok: false, response: fail(400, 'manuscript(원고 텍스트)가 없습니다.') }
  if (body.manuscript.length > DRAFT_LIMITS.maxManuscriptChars)
    return { ok: false, response: fail(413, `원고가 너무 깁니다(최대 ${DRAFT_LIMITS.maxManuscriptChars}자).`) }
  if (body.force !== undefined && typeof body.force !== 'boolean')
    return { ok: false, response: fail(400, 'force는 true/false여야 합니다.') }

  const images = new Map<string, Buffer>()
  const list = body.images ?? []
  if (!Array.isArray(list)) return { ok: false, response: fail(400, 'images는 배열이어야 합니다.') }
  if (list.length > DRAFT_LIMITS.maxImages)
    return { ok: false, response: fail(413, `이미지는 한 번에 ${DRAFT_LIMITS.maxImages}장까지입니다.`) }
  for (const item of list) {
    const entry = item as { path?: unknown; data?: unknown }
    if (typeof entry?.path !== 'string' || typeof entry?.data !== 'string' || !entry.path)
      return { ok: false, response: fail(400, 'images 항목은 { path, data(base64) } 모양이어야 합니다.') }
    const base64 = entry.data.replace(/^data:[^;]+;base64,/, '')
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64))
      return { ok: false, response: fail(400, `이미지 데이터가 base64가 아닙니다: ${entry.path}`) }
    const buffer = Buffer.from(base64, 'base64')
    if (!buffer.length) return { ok: false, response: fail(400, `이미지 데이터가 비어 있습니다: ${entry.path}`) }
    if (buffer.length > DRAFT_LIMITS.maxImageBytes)
      return { ok: false, response: fail(413, `이미지가 너무 큽니다(최대 ${(DRAFT_LIMITS.maxImageBytes / 1e6).toFixed(1)}MB): ${entry.path}`) }
    if (images.has(entry.path)) return { ok: false, response: fail(400, `같은 경로의 이미지가 두 번 왔습니다: ${entry.path}`) }
    images.set(entry.path, buffer)
  }
  return { ok: true, request: { manuscript: body.manuscript, images, force: body.force === true } }
}

/** 관리자가 업로드 뒤 고쳤는지 — 트리거가 updated_at을 갱신하므로 draft_uploaded_at보다 늦으면 사람이 손댄 것 */
export function editedAfterUpload(post: Pick<ExistingPost, 'updated_at' | 'draft_uploaded_at'>): boolean {
  if (!post.draft_uploaded_at) return true
  return Date.parse(post.updated_at) - Date.parse(post.draft_uploaded_at) > EDIT_TOLERANCE_MS
}

function fileName(path: string): string {
  return path.split(/[\\/]/).pop() || 'image'
}

export async function processDraft(request: DraftRequest, deps: DraftDeps, origin: string): Promise<DraftResponse> {
  const parsed = parseManuscript(request.manuscript)
  if (parsed.errors.length || !parsed.meta)
    return fail(422, '원고에 오류가 있습니다.', { issues: parsed.errors })
  const meta = parsed.meta
  const warnings = parsed.warnings.map((w) => `${w.line}행: ${w.message}`)

  // 로컬 이미지가 모두 왔는지
  const missing = [...new Set(parsed.images.map((img) => img.path))].filter((path) => !request.images.has(path))
  if (missing.length) return fail(422, `원고의 로컬 이미지가 요청에 없습니다: ${missing.join(', ')}`)
  for (const path of request.images.keys())
    if (!parsed.images.some((img) => img.path === path)) warnings.push(`원고에 쓰이지 않은 이미지는 무시했습니다: ${path}`)

  // slug 충돌 판단
  let existing: ExistingPost | null
  try {
    existing = await deps.findPostBySlug(meta.slug)
  } catch (error) {
    if (error instanceof DraftSetupError) return fail(503, error.message)
    throw error
  }
  if (existing) {
    if (existing.deleted_at)
      return fail(409, `slug "${meta.slug}" 는 지운 글이 쓰고 있습니다(slug는 지워도 남습니다). 다른 slug를 쓰세요.`, { reason: 'deleted' })
    if (existing.status !== 'draft')
      return fail(409, `slug "${meta.slug}" 는 이미 발행된 글입니다. 발행 글은 초안 업로드로 바꿀 수 없습니다 — 관리자에서 고치세요.`, { reason: 'published' })
    if (existing.draft_source !== 'claude')
      return fail(409, `slug "${meta.slug}" 는 관리자에서 만든 초안입니다. Claude 업로드로 덮어쓰지 않습니다 — 다른 slug를 쓰세요.`, { reason: 'admin-draft' })
    if (!request.force && editedAfterUpload(existing))
      return fail(
        409,
        `이 초안은 마지막 업로드(${existing.draft_uploaded_at ?? '기록 없음'}) 뒤에 관리자에서 수정됐습니다(${existing.updated_at}). ` +
          '관리자 수정을 지우고 원고로 덮어쓰려면 --force 로 다시 보내세요.',
        { reason: 'edited' },
      )
  }

  // 연재·다음 기록
  let categoryId: string | null = null
  if (meta.series) {
    const category = await deps.findCategoryBySlug(meta.series)
    if (!category) return fail(422, `연재 slug "${meta.series}" 를 찾지 못했습니다.`)
    categoryId = category.id
  }
  let nextPostId: string | null = null
  if (meta.next) {
    const nextPost = await deps.findPostBySlug(meta.next)
    if (!nextPost || nextPost.deleted_at) return fail(422, `다음 기록 slug "${meta.next}" 를 찾지 못했습니다.`)
    if (existing && nextPost.id === existing.id) return fail(422, 'next 가 이 글 자신을 가리킵니다.')
    if (nextPost.status !== 'published')
      warnings.push(`다음 기록 "${meta.next}" 는 아직 발행 전이라, 그 글이 발행되기 전까지 공개 화면에서는 발행일 순으로 대신 이어집니다.`)
    nextPostId = nextPost.id
  }

  // 이미지 업로드 (같은 파일이라도 커버·본문은 최적화가 달라 따로 올린다)
  const uploaded = new Map<string, string>()
  const uploadedUrls: string[] = []
  const cleanup = async () => {
    await Promise.all(uploadedUrls.map((url) => deps.deleteImage(url).catch(() => undefined)))
  }
  try {
    for (const image of parsed.images) {
      const key = `${image.usage}:${image.path}`
      if (uploaded.has(key)) continue
      const folder = image.usage === 'cover' ? 'covers' : 'posts'
      let url: string
      try {
        url = await deps.uploadImage(request.images.get(image.path)!, { folder, name: fileName(image.path) })
      } catch (error) {
        await cleanup()
        return fail(422, `이미지를 올리지 못했습니다(${image.path}, ${image.line}행): ${(error as Error).message}`)
      }
      uploaded.set(key, url)
      uploadedUrls.push(url)
    }

    const resolve = (ref: ImageRef) => (ref.kind === 'remote' ? ref.url : uploaded.get(`figure:${ref.path}`)!)
    const html = renderManuscriptHtml(parsed.blocks, resolve)
    const coverUrl = meta.cover ? (/^https?:\/\//i.test(meta.cover) ? meta.cover : uploaded.get(`cover:${meta.cover}`)!) : null

    const translation = await deps.translate({
      title: meta.title,
      excerpt: meta.excerpt ?? undefined,
      content: html,
      metaTitle: meta.metaTitle ?? undefined,
      metaDescription: meta.metaDescription ?? undefined,
    })
    if (!translation.ok)
      warnings.push(
        `${translation.error ?? '영문 번역에 실패했습니다.'}${existing ? ' 기존 영문은 그대로 두었습니다.' : ' 영문은 비어 있습니다.'} 관리자 번역 검수에서 다시 번역하세요.`,
      )

    // 저장 시각은 번역이 끝난 뒤에 찍는다 — 트리거가 찍는 updated_at과 가깝게
    const row: DraftRow = {
      title: meta.title,
      slug: meta.slug,
      excerpt: meta.excerpt,
      category_id: categoryId,
      cover_image_url: coverUrl,
      meta_title: meta.metaTitle,
      meta_description: meta.metaDescription,
      content: { html },
      reading_time_minutes: readingMinutes(html),
      status: 'draft',
      published_at: null,
      draft_source: 'claude',
      draft_uploaded_at: deps.now().toISOString(),
      next_post_id: nextPostId,
    }
    if (translation.ok) {
      const t = translation.content
      Object.assign(row, {
        title_en: t.title_en,
        excerpt_en: t.excerpt_en,
        content_en: t.content_en ? { html: t.content_en } : null,
        meta_title_en: t.meta_title_en,
        meta_description_en: t.meta_description_en,
      })
    } else if (!existing) {
      Object.assign(row, { title_en: null, excerpt_en: null, content_en: null, meta_title_en: null, meta_description_en: null })
    }

    let postId: string
    let action: 'created' | 'updated'
    if (existing) {
      const result = await deps.updateDraft(existing.id, row, {
        expectedUpdatedAt: request.force ? null : existing.updated_at,
      })
      if (!result) {
        await cleanup()
        return fail(409, '업로드하는 사이에 글이 바뀌었습니다(관리자 수정·발행 등). 상태를 확인하고 다시 보내세요.', { reason: 'changed-during-upload' })
      }
      postId = result.id
      action = 'updated'
    } else {
      const result = await deps.insertDraft(row)
      if ('conflict' in result) {
        await cleanup()
        return fail(409, `slug "${meta.slug}" 가 업로드하는 사이에 생겼습니다. 다시 보내세요.`, { reason: 'slug-taken' })
      }
      postId = result.id
      action = 'created'
    }

    deps.revalidate(meta.slug)
    return {
      status: action === 'created' ? 201 : 200,
      body: {
        ok: true,
        action,
        postId,
        slug: meta.slug,
        editUrl: `${origin}/admin/posts/${postId}/edit`,
        previewUrl: `${origin}/admin/posts/${postId}/preview`,
        emptySlots: parsed.slots,
        uploadedImages: uploadedUrls.length,
        translation: translation.ok ? 'ok' : 'failed',
        warnings,
      },
    }
  } catch (error) {
    await cleanup()
    if (error instanceof DraftSetupError) return fail(503, error.message)
    throw error
  }
}
