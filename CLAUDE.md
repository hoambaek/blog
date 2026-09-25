# Le Journal de Marée - Claude Code Instructions

## 🚨 TOP PRIORITY - MUST READ FIRST 🚨

### Git Operations Policy (최우선 규칙)
**⛔ 절대 자동으로 커밋/푸시/배포하지 말 것 ⛔**

- 커밋(commit)은 사용자가 "커밋해줘"라고 명시적으로 요청할 때만 수행
- 푸시(push/배포)는 사용자가 "배포해줘" 또는 "푸시해줘"라고 명시적으로 요청할 때만 수행
- 작업 완료 후 자동으로 커밋하거나 배포하지 않음
- 사용자 요청 없이 git 명령어 실행 금지
- **이 규칙을 어기면 안됨**

---

## Project Overview

Le Journal de Marée (뮤즈드마레) - 럭셔리 샴페인 브랜드 블로그

### Tech Stack
- Next.js 16 with App Router
- TypeScript
- Tailwind CSS
- Supabase (Database & Auth)
- Lucide React (Icons)

### Key Directories
- `/src/app` - Next.js App Router pages
- `/src/components` - React components
- `/src/lib` - Utilities, i18n, Supabase client
- `/public` - Static assets

### Design System (Le Journal de Marée, 2026-09 개편)
- 색: void `#0A0908`(다크 바탕·푸터), 라이트 바탕 `#E8E5E1`, 앰버 `#CCAD7B`(다크 위 강조). 토큰은 `src/app/globals.css`
- 서체: Cormorant Garamond(영문 디스플레이), Noto Serif KR(한글 본문·제목), Noto Sans KR(한글 UI), IBM Plex Mono(관측 줄·번호·라벨). 불러오기는 `src/app/layout.tsx`
- 관리자 화면도 같은 4종만 쓴다. 옛 Rose Gold `#B7916E`·Playfair Display 체계는 새로 쓰지 않는다(Playfair는 서체를 불러오지 않고 `globals.css` 폴백 이름으로만 남아 있다)
- Angular design (no border-radius)
- Bilingual support (Korean/English)
- 디자인 정본: Paper `Muse de Marée 웹` → `Blog — Le Journal de Marée`(공개) · `Blog Admin`(관리자). 글 서식 규격: `docs/content/article-format.md`

---

## 블로그 글 작성 워크플로우 (필수)

사용자가 **블로그 글 작성/수정**을 요청하면 (신규 작성·기존 글 리라이트 모두) 반드시 아래 3단계를 순서대로 수행한다.

### 1단계 — 브랜드 문서 기반 주제 분석
- **먼저 `docs/brand/brand-north-star.md`(브랜드 북극성)를 읽는다.** 이 문서가 모든 콘텐츠 판단의 심판이다.
- 주제/기존 글을 북극성에 비춰 분석한다: 브랜드 정의("샴페인 하우스가 아니라 바다의 시간을 **기록**하는 브랜드"), 네 개의 기둥(기록이 헤리티지 / 바다가 결정 / 인양은 의식 / 소유는 맡아둠), 표현 원칙(§7), **하지 말 것(§9)**.
- 특히 🔴 **풍미 우위 주장 영구 금지** ("바다가 더 좋게/깊게/완성한다" 류 전부 금지 — VC 2023 수렴 데이터가 공개 반박 근거). 바다의 역할은 **기록**이지 개선이 아니다.

### 2단계 — 브랜드 방향 기반 작성
- 분석 결과를 바탕으로 브랜드 톤(조용하고 시적·절제된 럭셔리, "숫자는 형용사보다 조용하다")으로 작성한다.
- 정직한 분업(샹파뉴가 만들고, 바다가 기록한다) · "바다가 정한다"(수량·시간·출시) · 측정=헌신 프레임을 반영한다.
- 사실·수치·고유명사·직접 인용은 절대 변경 금지. 특수기호 줄표(—)는 쓰지 말고 자연스러운 한국어 문장부호 사용.
- 숙성 기간은 **1년 단위**(180일 아님). 수심 30m는 자랑거리로 쓰지 않는다(깊이 경쟁 금지, §9.2).

### 3단계 — humanize로 다듬기
- 작성이 끝나면 **반드시 `humanize-korean` 스킬**로 윤문한다 (AI 티 제거, 의미 불변). 과윤문 금지.

### 산출/반영
- 글은 아래 "블로그 글 원고 형식과 업로드"대로 `docs/posts/*.md` 원고로 저장하고 `npm run draft` 로 **초안**을 올린다.
- DB(프로덕션)에 직접 쓰지 않는다. 글이 들어가는 길은 초안 업로드(`POST /api/drafts`) 하나이고, 발행·기존 발행 글 수정은 대표가 관리자에서 한다. (영문 번역도 업로드 때 서버가 같은 번역 규칙으로 만든다: 풀네임 "Muse de Marée", we/our 대명사 금지, 수치 보존, 풍미 주장 금지 — 검수는 관리자 번역 검수 화면)

> 브랜드 원본은 `landing/docs/plans/2026-06-10-brand-north-star.md`. blog 프로젝트용 사본이 `docs/brand/brand-north-star.md`에 있으며, 원본이 갱신되면 사본도 다시 복사해 동기화한다.

---

## 블로그 글 원고 형식과 업로드 (필수)

원고 문법은 **`docs/content/article-format.md` 2절**이 정본이다(YAML 프론트매터 + `:::lead` · `## 소제목` · `:::figure` · 인용 `>`/`— 출처` · `:::terms` · 목록 · `---`). 쓰는 기준은 같은 문서 3절. 예시: `docs/posts/_example-draft.md`.
옛 형식(표 기반 메타 + `## 본문`)과 관리자 md 업로드(`DocumentUpload.tsx`)는 없앴다.

### 절차
1. **작성** — 위 "블로그 글 작성 워크플로우" 1~2단계대로 `docs/posts/{slug}.md` 에 원고를 쓴다. 사진이 없으면 `:::figure` 이미지 자리(`hint` 필수)로 둔다. 로컬 사진은 원고 파일 기준 상대경로.
2. **humanize** — `humanize-korean` 스킬로 윤문한다.
3. **점검** — `npm run draft -- docs/posts/{slug}.md --dry-run` (서버에 보내지 않음). 오류는 줄 번호로 나온다. 블록 요약·이미지 목록·경고를 확인한다.
4. **업로드** — `npm run draft -- docs/posts/{slug}.md` (기본 운영 `https://blog.musedemaree.com`, 로컬은 `--target=local --port=3000`). 서버가 이미지를 R2에 올리고 영문 번역까지 해서 **초안**으로 저장한다.
5. **전달** — 출력된 **미리보기 링크**(`/admin/posts/{id}/preview`)를 대표에게 전달한다.
6. **대표 몫** — 이미지 자리 채우기, 번역 검수, 발행은 대표가 관리자에서 한다. Claude는 발행·삭제하지 않는다(경로도 없다).

### 규칙
- 토큰: `BLOG_DRAFT_TOKEN`(32자 이상). 로컬 `.env.local` 과 Vercel Production 에 같은 값. 없으면 서버가 503으로 닫힌다.
- 같은 slug로 다시 올리면 **Claude가 올린 초안만** 갱신된다. 발행 글·관리자가 만든 글·지운 글의 slug면 409로 거부된다.
- 대표가 관리자에서 고친 초안은 409로 거부된다. 원고로 덮어써도 된다고 **대표가 확인한 경우에만** `--force` 를 붙인다.
- 원고가 정본이다: 갱신 때 원고에 없는 선택 항목(cover·series·next·meta)은 비워진다.
- 한도: 요청 4MB(이미지 base64 포함), 이미지 20장, 한 장 2.9MB(2MB 넘는 사진은 CLI가 긴 변 2400px로 줄여 보낸다). 넘으면 이미지 자리로 두고 관리자에서 올린다.
- 테스트: `npm run test:manuscript`(파서·에디터 왕복·업로드 로직), `npm run test:editor`(에디터 왕복).
