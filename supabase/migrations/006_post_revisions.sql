-- ═══════════════════════════════════════════════════
-- 006 발행 글 교체·이전 버전 — 추가형 변경만 (새 테이블 + 새 함수)
--   기존 테이블·컬럼·데이터는 바꾸지 않는다. 005 적용 뒤에 적용한다(next_post_id·en_review를 쓴다).
--
--   post_revisions: 발행 글이 덮어써지기 직전의 행 전체(to_jsonb)를 보관한다.
--   replace_published_with_draft: 초안 내용으로 발행 글을 교체 (스냅샷 → 복사 → 초안 soft delete)
--   restore_post_revision:        보관한 버전으로 되돌림 (현재 상태 스냅샷 → 복원)
--   두 함수 모두 plpgsql 함수 하나 = 트랜잭션 하나다. 중간에 예외가 나면 전부 되돌아간다.
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS post_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL,
  reason TEXT,
  source_draft_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_revisions_post_created ON post_revisions(post_id, created_at DESC);

COMMENT ON TABLE post_revisions IS '글의 이전 버전 — 덮어쓰기 직전 posts 행 전체(jsonb). 관리자(service role) 전용';
COMMENT ON COLUMN post_revisions.reason IS 'replaced_by_draft = 초안으로 교체 직전, before_restore = 되돌리기 직전';
COMMENT ON COLUMN post_revisions.source_draft_id IS '교체에 쓴 초안(posts.id, soft delete됨)';

-- RLS: 공개 정책을 두지 않는다 → anon·authenticated는 읽기·쓰기 모두 불가. service role은 RLS를 우회한다.
ALTER TABLE post_revisions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE post_revisions FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON TABLE post_revisions FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON TABLE post_revisions FROM authenticated';
  END IF;
END $$;

-- ── 초안으로 발행 글 교체 ──
-- 오류는 'REPLACE:<코드>' 메시지로 던진다(앱이 코드로 안내 문구를 고른다).
-- slug·id·published_at·status·view_count·author_id·created_at·is_featured·draft_source는 대상 것을 유지한다.
CREATE OR REPLACE FUNCTION replace_published_with_draft(p_draft_id UUID, p_target_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  d posts%ROWTYPE;
  t posts%ROWTYPE;
  locked INTEGER;
  rev_id UUID;
BEGIN
  IF p_draft_id IS NULL OR p_target_id IS NULL THEN
    RAISE EXCEPTION 'REPLACE:missing_id';
  END IF;
  IF p_draft_id = p_target_id THEN
    RAISE EXCEPTION 'REPLACE:same_post';
  END IF;

  -- 두 행을 id 순서로 잠근다(동시에 반대 순서로 부르는 요청과 교착하지 않게)
  SELECT count(*) INTO locked FROM (
    SELECT id FROM posts WHERE id IN (p_draft_id, p_target_id) ORDER BY id FOR UPDATE
  ) AS l;

  SELECT * INTO d FROM posts WHERE id = p_draft_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'REPLACE:draft_not_found'; END IF;
  IF d.deleted_at IS NOT NULL THEN RAISE EXCEPTION 'REPLACE:draft_deleted'; END IF;
  IF d.status IS DISTINCT FROM 'draft' THEN RAISE EXCEPTION 'REPLACE:draft_not_draft'; END IF;

  SELECT * INTO t FROM posts WHERE id = p_target_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'REPLACE:target_not_found'; END IF;
  IF t.deleted_at IS NOT NULL THEN RAISE EXCEPTION 'REPLACE:target_deleted'; END IF;
  IF t.status IS DISTINCT FROM 'published' THEN RAISE EXCEPTION 'REPLACE:target_not_published'; END IF;

  -- ① 대상의 현재 행 전체 보관
  INSERT INTO post_revisions (post_id, snapshot, reason, source_draft_id)
  VALUES (t.id, to_jsonb(t), 'replaced_by_draft', d.id)
  RETURNING id INTO rev_id;

  -- ② 초안의 내용 필드를 대상에 복사 (updated_at은 기존 트리거가 찍는다)
  UPDATE posts SET
    content = d.content,
    content_en = d.content_en,
    title = d.title,
    title_en = d.title_en,
    excerpt = d.excerpt,
    excerpt_en = d.excerpt_en,
    cover_image_url = d.cover_image_url,
    og_image_url = d.og_image_url,
    category_id = d.category_id,
    photo_credits = d.photo_credits,
    meta_title = d.meta_title,
    meta_title_en = d.meta_title_en,
    meta_description = d.meta_description,
    meta_description_en = d.meta_description_en,
    -- 초안이 교체 대상 자신을 "다음 기록"으로 가리키면 자기 자신을 가리키게 되므로 자동(NULL)으로 둔다
    next_post_id = CASE WHEN d.next_post_id = t.id THEN NULL ELSE d.next_post_id END,
    reading_time_minutes = d.reading_time_minutes,
    en_review = d.en_review
  WHERE id = t.id;

  -- ③ 초안 soft delete
  UPDATE posts SET deleted_at = NOW() WHERE id = d.id;

  RETURN jsonb_build_object(
    'revision_id', rev_id,
    'target_id', t.id,
    'target_slug', t.slug,
    'old_category_id', t.category_id,
    'new_category_id', d.category_id
  );
END;
$$;

-- ── 보관한 버전으로 되돌리기 ──
-- 오류는 'RESTORE:<코드>'. 되돌리는 필드는 교체와 같은 내용 필드뿐이다(slug·상태·발행일·조회수는 그대로).
CREATE OR REPLACE FUNCTION restore_post_revision(p_post_id UUID, p_revision_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  cur posts%ROWTYPE;
  snap posts%ROWTYPE;
  rev post_revisions%ROWTYPE;
  new_rev_id UUID;
  safe_next UUID;
  safe_category UUID;
BEGIN
  IF p_post_id IS NULL OR p_revision_id IS NULL THEN
    RAISE EXCEPTION 'RESTORE:missing_id';
  END IF;

  SELECT * INTO cur FROM posts WHERE id = p_post_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'RESTORE:post_not_found'; END IF;
  IF cur.deleted_at IS NOT NULL THEN RAISE EXCEPTION 'RESTORE:post_deleted'; END IF;

  SELECT * INTO rev FROM post_revisions WHERE id = p_revision_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'RESTORE:revision_not_found'; END IF;
  IF rev.post_id <> p_post_id THEN RAISE EXCEPTION 'RESTORE:revision_mismatch'; END IF;

  -- 스냅샷에 없는 키는 현재 값을 유지한다(현재 행을 바탕으로 스냅샷 키만 덮는다)
  snap := jsonb_populate_record(cur, rev.snapshot);

  -- 스냅샷 뒤에 지워진(하드 삭제) 글·연재를 가리키면 외래키 오류가 나므로 비운다
  safe_next := snap.next_post_id;
  IF safe_next IS NOT NULL AND (safe_next = cur.id OR NOT EXISTS (SELECT 1 FROM posts WHERE id = safe_next)) THEN
    safe_next := NULL;
  END IF;
  safe_category := snap.category_id;
  IF safe_category IS NOT NULL AND NOT EXISTS (SELECT 1 FROM categories WHERE id = safe_category) THEN
    safe_category := NULL;
  END IF;

  -- 현재 상태를 먼저 보관
  INSERT INTO post_revisions (post_id, snapshot, reason, source_draft_id)
  VALUES (cur.id, to_jsonb(cur), 'before_restore', NULL)
  RETURNING id INTO new_rev_id;

  UPDATE posts SET
    content = snap.content,
    content_en = snap.content_en,
    title = snap.title,
    title_en = snap.title_en,
    excerpt = snap.excerpt,
    excerpt_en = snap.excerpt_en,
    cover_image_url = snap.cover_image_url,
    og_image_url = snap.og_image_url,
    category_id = safe_category,
    photo_credits = snap.photo_credits,
    meta_title = snap.meta_title,
    meta_title_en = snap.meta_title_en,
    meta_description = snap.meta_description,
    meta_description_en = snap.meta_description_en,
    next_post_id = safe_next,
    reading_time_minutes = snap.reading_time_minutes,
    en_review = snap.en_review
  WHERE id = cur.id;

  RETURN jsonb_build_object(
    'revision_id', new_rev_id,
    'post_id', cur.id,
    'slug', cur.slug,
    'old_category_id', cur.category_id,
    'new_category_id', safe_category
  );
END;
$$;

COMMENT ON FUNCTION replace_published_with_draft(UUID, UUID) IS '초안 내용으로 발행 글 교체 (이전 내용은 post_revisions에 보관, 초안 soft delete) — service role 전용';
COMMENT ON FUNCTION restore_post_revision(UUID, UUID) IS 'post_revisions의 버전으로 되돌림 (현재 상태를 먼저 보관) — service role 전용';

-- 실행 권한: service role만. (Supabase는 public 스키마 함수에 anon·authenticated 실행 권한을 기본으로 준다)
REVOKE EXECUTE ON FUNCTION replace_published_with_draft(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION restore_post_revision(UUID, UUID) FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION replace_published_with_draft(UUID, UUID) FROM anon';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION restore_post_revision(UUID, UUID) FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION replace_published_with_draft(UUID, UUID) FROM authenticated';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION restore_post_revision(UUID, UUID) FROM authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION replace_published_with_draft(UUID, UUID) TO service_role';
    EXECUTE 'GRANT EXECUTE ON FUNCTION restore_post_revision(UUID, UUID) TO service_role';
    EXECUTE 'GRANT ALL ON TABLE post_revisions TO service_role';
  END IF;
END $$;
