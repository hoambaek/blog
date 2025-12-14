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
