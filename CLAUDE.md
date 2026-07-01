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

### Design System
- Font: Playfair Display (display), Noto Sans (body)
- Brand Color: Rose Gold (#B7916E)
- Angular design (no border-radius)
- Bilingual support (Korean/English)

---

## 블로그 글 Markdown 저장 형식 (필수)

블로그에 올릴 글을 `.md` 파일로 저장할 때는 **반드시 아래 형식**을 따를 것. 관리자 업로드 파서(`src/components/admin/DocumentUpload.tsx`)가 YAML 프론트매터(`---title:---`)를 인식하지 못하므로, **표(table) 기반 메타 정보 + `## 본문` 섹션** 구조를 사용해야 한다. (YAML 프론트매터로 저장하면 "제목을 찾을 수 없습니다" 에러 발생.)

### 템플릿

```markdown
# 글 제목

## 메타 정보

| 항목 | 내용 |
|------|------|
| **제목** | 글 제목 |
| **slug** | english-only-slug |
| **부제** | 한 줄 요약 (excerpt로 사용됨) |
| **카테고리** | 메종 이야기 (Maison Stories) |

## 본문

본문 첫 문단...

## 소제목

본문 내 소제목은 `##`를 그대로 사용 (→ `<h2>` 변환).

## SEO 메타 정보

| 항목 | 내용 |
|------|------|
| **meta title** | SEO 제목 (생략 시 제목 재사용) |
| **meta description** | SEO 설명 (생략 시 부제 재사용) |
```

### 파서 규칙 (요약)
- **제목·slug·부제·카테고리**는 `| **키** | 값 |` 표 행에서 추출. 키 이름은 정확히 `제목`, `slug`, `부제`, `카테고리`.
- **본문**은 `## 본문` 이후부터 `## SEO`(또는 문서 끝) 직전까지. 본문 안의 `##` 소제목은 그대로 유지된다.
- **slug**은 영문·숫자·하이픈만 남고 한글은 제거됨. 지정하지 않으면 `post-{날짜}-{랜덤}`으로 자동 생성.
- **카테고리**는 사이트의 실제 카테고리명/슬러그와 부분 일치로 매칭(예: "메종" → maison, "바다" → sea, "빈티지" → vintage). 매칭 실패 시 비어 있게 되니 실제 카테고리명 확인 필요.
- 저장 위치: `docs/posts/{제목}.md` (작업본). 참고 예시: `docs/posts/왜-바다인가.md`.
