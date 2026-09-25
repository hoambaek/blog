import 'server-only'
import sharp from 'sharp'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { deleteFromR2, generateUniqueFilename, getKeyFromUrl, uploadToR2 } from '@/lib/r2/client'
import { optimizeContentImage, optimizeCoverImage } from '@/lib/image/optimize'
import { translatePost } from '@/lib/translate-post'
import { DraftSetupError, type DraftDeps, type ExistingPost } from './service'

/*
 * /api/drafts 의 실제 의존성 — service role Supabase, R2, 번역.
 * service role은 RLS를 우회하므로, 여기 함수들은 토큰 검사를 통과한 라우트에서만 부른다.
 */

const POST_COLUMNS = 'id, slug, status, draft_source, draft_uploaded_at, updated_at, deleted_at'
const SETUP_MESSAGE = 'DB에 005 마이그레이션(draft_source·draft_uploaded_at 컬럼)이 적용되지 않아 초안 업로드를 받을 수 없습니다.'

/** 올릴 수 있는 원본 형식 — SVG(스크립트 위험)·GIF(움직임이 깨짐)는 받지 않는다 */
const ACCEPTED_FORMATS = new Set(['jpeg', 'png', 'webp', 'avif', 'heif', 'tiff'])

function isMissingColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return error.code === 'PGRST204' || error.code === '42703' || /column .* does not exist/i.test(error.message ?? '')
}

export function createDraftDeps(): DraftDeps {
  return {
    async findPostBySlug(slug) {
      const supabase = await createAdminClient()
      const { data, error } = await supabase.from('posts').select(POST_COLUMNS).eq('slug', slug).maybeSingle()
      if (isMissingColumn(error)) throw new DraftSetupError(SETUP_MESSAGE)
      if (error) throw new Error(`글 조회 실패: ${error.message}`)
      return (data as ExistingPost | null) ?? null
    },

    async findCategoryBySlug(slug) {
      const supabase = await createAdminClient()
      const { data, error } = await supabase.from('categories').select('id').eq('slug', slug).maybeSingle()
      if (error) throw new Error(`연재 조회 실패: ${error.message}`)
      return data ?? null
    },

    async uploadImage(data, { folder, name }) {
      let format: string | undefined
      try {
        format = (await sharp(data).metadata()).format
      } catch {
        throw new Error('이미지 파일이 아닙니다.')
      }
      if (!format || !ACCEPTED_FORMATS.has(format))
        throw new Error(`받지 않는 형식입니다(${format ?? '알 수 없음'}) — JPEG·PNG·WebP·AVIF·HEIC·TIFF만 받습니다.`)
      const optimized = folder === 'covers' ? await optimizeCoverImage(data) : await optimizeContentImage(data)
      const base = name.replace(/\.[^/.]+$/, '')
      const key = `${folder}/${generateUniqueFilename(`${base}.webp`)}`
      return uploadToR2(optimized.buffer, key, optimized.contentType)
    },

    async deleteImage(url) {
      const key = getKeyFromUrl(url)
      if (key) await deleteFromR2(key)
    },

    translate: (input) => translatePost(input),

    async insertDraft(row) {
      const supabase = await createAdminClient()
      const { data, error } = await supabase.from('posts').insert(row).select('id').single()
      if (error?.code === '23505') return { conflict: true }
      if (isMissingColumn(error)) throw new DraftSetupError(SETUP_MESSAGE)
      if (error) throw new Error(`초안 저장 실패: ${error.message}`)
      return { id: data.id }
    },

    async updateDraft(id, row, guard) {
      const supabase = await createAdminClient()
      // 저장 순간에도 조건을 다시 건다 — 확인과 저장 사이에 발행·관리자 수정이 끼어들면 0행이 된다
      let query = supabase
        .from('posts')
        .update(row)
        .eq('id', id)
        .eq('status', 'draft')
        .eq('draft_source', 'claude')
        .is('deleted_at', null)
      if (guard.expectedUpdatedAt) query = query.eq('updated_at', guard.expectedUpdatedAt)
      const { data, error } = await query.select('id')
      if (isMissingColumn(error)) throw new DraftSetupError(SETUP_MESSAGE)
      if (error) throw new Error(`초안 갱신 실패: ${error.message}`)
      return data?.[0] ? { id: data[0].id } : null
    },

    revalidate() {
      // 초안은 공개 화면에 없다 — 관리자 목록만 비운다
      revalidatePath('/admin')
    },

    now: () => new Date(),
  }
}
