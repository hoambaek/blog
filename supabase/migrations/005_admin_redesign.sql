-- ═══════════════════════════════════════════════════
-- 005 관리자 개편(2단계) — 추가형 변경만 (nullable 컬럼 추가 + 새 컬럼 초기값 채우기)
--   기존 컬럼·데이터는 바꾸지 않는다. 적용 전에도 공개 화면은 그대로 돈다(select * 기반).
--   관리자 저장 경로는 이 컬럼들을 쓰므로, 배포 전에 적용해야 새 필드(다음 기록·검수·연재 영문)가 저장된다.
-- ═══════════════════════════════════════════════════

-- ── posts ──
-- 다음 기록 지정 (비우면 발행일 순 자동). 지정한 글이 지워지면 자동으로 돌아간다.
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS next_post_id UUID REFERENCES posts(id) ON DELETE SET NULL;

-- 초안 출처 — 'claude'면 Claude 초안 업로드(npm run draft)로 들어온 글. 관리자에서 만든 글은 NULL.
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS draft_source TEXT,
  ADD COLUMN IF NOT EXISTS draft_uploaded_at TIMESTAMPTZ;

-- 영문 검수 상태 — 한국어 원문 블록의 해시로 기록한다(블록 순서가 바뀌어도 유지).
--   { "confirmed": [해시…], "known": [해시…], "completed_at": ISO | null }
--   confirmed: 영문을 사람이 확인한 원문 블록 해시
--   known:     마지막 검수 저장 때 존재하던 원문 블록 해시 — 여기에 없는 새 해시 = "원문 수정됨 · 다시 번역됨"
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS en_review JSONB;

COMMENT ON COLUMN posts.next_post_id IS '다음 기록 수동 지정 (NULL = 발행일 순 자동)';
COMMENT ON COLUMN posts.draft_source IS '초안 출처: claude = Claude 초안 업로드, NULL = 관리자 작성';
COMMENT ON COLUMN posts.draft_uploaded_at IS 'Claude 초안이 마지막으로 올라온 시각';
COMMENT ON COLUMN posts.en_review IS '영문 검수 상태 {confirmed, known, completed_at} — 원문 블록 해시 기준';

-- ── categories (연재) ──
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT;

COMMENT ON COLUMN categories.name_en IS '연재 영문 이름 (EN 화면). NULL이면 코드 사전값';
COMMENT ON COLUMN categories.description_en IS '연재 영문 설명 (EN 화면). NULL이면 코드 사전값';

-- 지금 코드(src/lib/i18n)에 박혀 있는 영문 값을 새 컬럼에 옮겨 둔다 — 비어 있을 때만.
UPDATE categories SET name_en = 'Sea Log', description_en = 'Aging diaries, retrieval logs, and data from the sea'
  WHERE slug = 'sea-log' AND name_en IS NULL AND description_en IS NULL;
UPDATE categories SET name_en = 'Maison Stories', description_en = 'Brand philosophy, the founders, and the makers'
  WHERE slug = 'maison' AND name_en IS NULL AND description_en IS NULL;
UPDATE categories SET name_en = 'Culture & Art', description_en = 'Collaborating artists, art and time, and stories of place'
  WHERE slug = 'culture' AND name_en IS NULL AND description_en IS NULL;
UPDATE categories SET name_en = 'At the Table', description_en = 'Pairing guides, chef collaborations, and tasting notes'
  WHERE slug = 'table' AND name_en IS NULL AND description_en IS NULL;
UPDATE categories SET name_en = 'Retrievals & News', description_en = 'Brand news, event recaps, and press'
  WHERE slug = 'news' AND name_en IS NULL AND description_en IS NULL;

-- ── newsletters ──
-- 기록 기반 작성: 담은 기록, 여는 말, 발송 실패 주소
ALTER TABLE newsletters
  ADD COLUMN IF NOT EXISTS post_ids UUID[],
  ADD COLUMN IF NOT EXISTS intro TEXT,
  ADD COLUMN IF NOT EXISTS failed_recipients JSONB;

COMMENT ON COLUMN newsletters.post_ids IS '뉴스레터에 담은 기록(posts.id) 순서대로';
COMMENT ON COLUMN newsletters.intro IS '여는 말 (비우면 기록 발췌문)';
COMMENT ON COLUMN newsletters.failed_recipients IS '발송 실패 [{email, error}]';
