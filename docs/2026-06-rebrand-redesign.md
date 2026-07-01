# 리브랜딩 & 리디자인 변경 기록 (2026-06)

> 기간: 2026-06-26 ~ 2026-06-28
> 범위: 버그 수정 · 봇 방지 · 브랜드 전환(Le Journal de Marée → Muse de Marée) · 디자인 시스템 전환(Wired 흑백 에디토리얼) · admin 정비
> 디자인 SSOT: `DESIGN-wired (2).md` (Wired 매거진 디자인 언어) / 브랜드 SSOT: landing `docs/brand/brand-book.md`, `brand-direction-2026.md`

---

## 1. 버그 수정 (커밋 완료)

| 커밋 | 내용 |
|------|------|
| `6f8bacd` | **admin 접근 불가 수정** — `middleware.ts`가 `/sign-in`·`/sign-up`까지 `auth.protect()`로 막아 무한 리다이렉트 루프 발생. `auth.protect()`를 `/admin`에만 적용 |
| `068925c` | **admin API 500 수정** — matcher가 `/api/admin/*`를 제외해 `auth()` 호출 라우트가 전부 실패(구독자·카테고리·뉴스레터·업로드). matcher에 `/api/admin/(.*)`, `/api/upload(.*)` 추가 |

---

## 2. 봇 방지 & 구독자 정리 (커밋 `ba555a1` + DB)

- **봇 구독자 32건 삭제** (DB) — 랜덤 이름 + gmail dot/+ 별칭 트릭으로 가입한 자동봇. 본인 + admin@wgmgolf.com 2건만 보존.
- **`src/lib/actions/subscribers.ts`** 에 봇 방지 추가:
  - 허니팟 필드(빈 값이어야 통과, 채워지면 조용히 무시)
  - 제출 타이밍 가드(폼 로드 후 2.5초 미만 = 봇)
  - 이메일 정규화(`+태그`·gmail dot 제거)로 별칭 중복 가입 차단
- **`NewsletterForm.tsx`, `subscribe/page.tsx`** 폼에 허니팟 + 타이밍 필드 추가
- 한계: 단순 자동봇 차단용. 정교한 봇은 캡차(Turnstile)/rate-limit 필요(미적용).

---

## 3. 브랜드 전환 — Le Journal de Marée → Muse de Marée

### 포지셔닝
- **이전**: "한국 유일의 해저숙성 샴페인 브랜드", "심연의 시간이 조각한 수공예품"
- **이후**: **"바다의 시간을 기록하는 브랜드"** — 샴페인은 샹파뉴가 만들고, 시간(변화)은 한국 남해가 쓴다(정직한 분업)
- **모토**: "바다가 쓴 시간 / Written by the Sea"
- **표기 정본**: 한국 남해 · 수심 30m · 평균 수온 11.4°C (이전 "수심 50m" 폐기)

### 영구 금지어(제거 완료)
- "두 개의 떼루아 / 이중의 떼루아 / Two Souls / dual terroir"
- "luxury / exclusive / timeless / 럭셔리 / 명품 / 프리미엄"
- 인위적 희소성("세계 유일 / 한국 유일 / 한정")
- 풍미·스펙 우위 주장, **수압 가속 숙성 수치(CO₂ 60% 억제, 기포 1.6배, 산화 56.5% 등)**
- 시적 과장("심연의 포옹 / 시간의 결정체 / 마실 수 있는 시간의 예술")

### 브랜드명 표기 통일
- 사이트/저널 표기 전부 `Le Journal de Marée` → `Muse de Marée`
- 본문 한글 표기는 `뮤즈드마레`로 통일(영문 병기 혼용 제거)

### 적용 범위
- i18n 사전(`ko.ts`/`en.ts`): 히어로·구독·푸터·about
- 메타데이터(`layout.tsx`, 홈 `page.tsx`, post/category `siteName`)
- 구조화 데이터(`JsonLd.tsx` — WebSite/Organization)
- AEO/AI 파일(`llms.txt`, `llms-full.txt`) — 떼루아·수압 주장 제거 → 4기둥·관측 데이터
- `feed.xml`, `robots.txt`, admin `settings` 기본값
- 이메일(`WelcomeEmail.tsx`), 뉴스레터 발송 템플릿(`newsletter/page.tsx`)

### 로고
- 텍스트 워드마크 → landing **MUSE DE MARÉE 이미지 로고**(`public/images/logo/`)
  - 헤더: 배경에 따라 흑/백 자동 전환 / 푸터: 화이트
  - 글 하단 서명 · about 인용 출처 · admin: 좌우 여백 크롭본(`logo_text_trim.png`) 사용
- 파비콘·앱 아이콘을 새 브랜드 아이콘으로 교체(`icon-192/512`, `favicon-*`, `apple-touch-icon`)

---

## 4. 디자인 시스템 전환 — Wired 흑백 에디토리얼

`DESIGN-wired (2).md` 기준. **순수 흑백 듀엣 + 무장식 + 사각 + 무그림자.**

### 컬러 토큰 (`globals.css`)
| 역할 | 값 |
|------|-----|
| 배경(canvas) | `#FFFFFF` |
| 잉크(텍스트) | `#000000` |
| 본문 회색(body) | `#757575` |
| 헤어라인(border) | `#E0E0E0` |
| canvas-soft | `#F5F5F5` |
| 다크 밴드(void) | `#000000` (푸터) |
| 인라인 링크 | `#057DBC` (유일한 색, 본문 링크 전용) |

- 이전 브랜드 악센트(로즈골드 `#B7916E`, 브래스 `#CCAD7B`, 네이비) **전부 폐기 → 잉크로 매핑**
- 다크모드 토글 제거

### 폰트 (`layout.tsx` + `globals.css`)
| 역할 | 영문 | 한글 |
|------|------|------|
| 디스플레이(헤드라인) | Playfair Display | Noto Serif KR |
| 본문 세리프 | Lora | Noto Serif KR |
| UI/메타/버튼(sans) | Inter | Pretendard |

(이전 Cormorant/DM Mono/Mrs Saint Delafield 폐기)

### 장식 제거
- 데코 라인·다이아몬드(`rotate-45`)·◆·코너 액센트·스크롤 인디케이터·글로우 — **전 페이지에서 제거**
- 이미지: 사각(radius 0) + 그림자 없음 + 테두리 없음
- 카드/버튼/입력: `shadow` 제거(오버레이 sheet/dialog/toast만 elevation 예외)
- 헤딩 드롭캡(`first-letter`) 제거

---

## 5. 페이지별 적용

- **홈(`HomeContent.tsx`)**: 히어로(다크 이미지 + 모토 eyebrow + 타이틀, 장식 제거) · featured 매거진 그리드(큰 피처 + 2업 story-row) · latest 수직 story-row 스택 · square 버튼
- **헤더(`Header.tsx`)**: 구독/검색/언어를 카테고리와 **한 라인 통합**(좌-구독 / 중앙-카테고리 / 우-검색·언어). post에서도 히어로 위 투명 → 스크롤 시 흰색
- **푸터(`Footer.tsx`)**: 순수 검정 밴드 · 브랜드 인용 컬럼 제거(3컬럼) · 뉴스레터 폼 흰 입력/버튼 · **홈페이지 링크 = 브랜드 공식 사이트(https://musedemaree.com/) 외부 링크**
- **about**: 4기둥(기록/바다 결정/인양/맡아둠), 긍정형 서술, 인용 출처 로고화, values 숫자 가시성
- **subscribe**: 흑백 정리, Sparkles 아이콘 제거, 새 카피(남해 수심 30m / 큐베·인양·관측 일지)
- **글 상세(`PostContent.tsx`)**: **New Yorker 스타일 히어로** — 풀블리드 이미지 위 카테고리→제목→부제→날짜 오버레이. 제목 쉼표(`,`) 줄바꿈. 메타 Wired 스타일. 본문 끝 텍스트 서명 → 로고(본문과 좌측 정렬). "글 요약(AeoSummaryBox)" 박스 제거(AEO는 JSON-LD가 담당)
- **category/search/unsubscribe**: 데코·악센트 제거, 흑백 통일
- **카테고리 메뉴명**: 뉴스 & 이벤트 → **인양과 소식**(나머지 4개 유지)

### 카피 예시 (히어로)
- 타이틀: **바다의 시간을 기록하다**
- 설명: "바다가 만든 시간을 기록하는 곳. 샹파뉴가 빚은 샴페인이 한국 남해 수심 30m에서 보낸 모든 날을 뮤즈드마레가 기록합니다."

---

## 6. Admin 정비

- 로고: 사이드바·모바일 헤더의 "LE JOURNAL" → **Muse de Marée 이미지 로고 + ADMIN 라벨**
- status 배지 흑백 위계: 발행·발송완료 = 검정 채움 / 예약 = 회색 / 초안·해지 = 아웃라인 / 실패만 destructive
- 통계 아이콘 흑백화
- 카드/버튼/입력 그림자 제거(`ui/card`, `ui/button`, `ui/input`)
- **포스트 목록에 조회수(`view_count`) 컬럼 추가**

---

## 7. AI 글 생성 기준 (`generate-post`, `newsletter/generate`, `BLOG_WRITING_GUIDE.md`)

- 시스템 프롬프트를 새 브랜드북 기준으로 전면 재작성: 4기둥 · 콰이어트 럭셔리 · 금지어 · 관측 데이터(남해/30m/11.4°C)
- **"AI 티 제거 — 한국어 휴머나이즈" 섹션 추가** (기계적 병렬·문장 균일성·번역투·상투적 마무리 제거)
  - 참고: generate-post는 서버 API라 Claude Code의 `humanize-korean` 스킬 자체는 런타임 실행 불가 → 스킬 핵심 규칙을 프롬프트에 통합
- `docs/BLOG_WRITING_GUIDE.md` 새 브랜드 기준으로 재작성

---

## 8. 데이터 변경 (Supabase `gbhrvgvsrjhdxtaaztcx`)

- 봇 구독자 32건 삭제 (`subscribers`)
- 글 `post-20260112-vm7g34` excerpt 수정: "Champagne Mignon-Boulard, 뮤즈드마레의 첫 번째 파트너" → "뮤즈드마레의 첫 번째 파트너" (en 동일)

> ⚠️ 기존 발행 글의 본문/제목에 남은 옛 표현(예: "두 개의 떼루아")은 코드가 아닌 DB 콘텐츠라 admin에서 재생성/수정 필요.

---

## 9. 변경 파일 (39개 수정 + 신규)

**핵심 수정**: `globals.css`, `layout.tsx`, `Header.tsx`, `Footer.tsx`, `HomeContent.tsx`, `PostContent.tsx`, `CategoryContent.tsx`, `SearchContent.tsx`, `about/page.tsx`, `subscribe/page.tsx`, `unsubscribe/page.tsx`, i18n(`ko.ts`/`en.ts`), `JsonLd.tsx`, `NewsletterForm.tsx`, `WelcomeEmail.tsx`, `feed.xml`/`llms.txt`/`llms-full.txt`/`robots.txt`, admin(`layout.tsx`, `AdminDashboardContent.tsx`, `AdminPostsListContent.tsx`, `subscribers/page.tsx`, `newsletter/page.tsx`, `settings/page.tsx`), `ui/card.tsx`/`button.tsx`/`input.tsx`, `generate-post`/`newsletter/generate` 프롬프트, `subscribers.ts`

**신규**: `public/images/logo/*` (로고 PNG + 크롭본), `public/icon-192/512*.png`, `docs/BLOG_WRITING_GUIDE.md`, 본 문서

---

## 10. 남은 작업 (미완)

- [ ] 본문(`.post-content`) 텍스트를 Lora 세리프로 적용 (현재 sans 회색)
- [ ] 전체 변경 git 커밋/배포 (브랜드+디자인 변경 일괄 미커밋 상태)
- [ ] 기존 발행 글의 옛 카피(떼루아 등) admin 재생성
- [ ] `.playwright-mcp/` 임시 산출물 `.gitignore` 처리 검토
