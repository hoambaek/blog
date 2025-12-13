# 뮤즈드마레 블로그 (Le Journal de Marée) PRD

## Product Requirements Document
**Version:** 1.0  
**Date:** 2024년 12월  
**Project Name:** Le Journal de Marée (바다의 일지)

---

## 1. 개요 (Overview)

### 1.1 프로젝트 배경

뮤즈드마레는 해저숙성 샴페인 브랜드로, 브랜드 철학과 스토리텔링이 핵심 자산입니다. 단순한 제품 홍보가 아닌, **"시간의 예술"**이라는 브랜드 세계관을 깊이 있게 전달할 수 있는 디지털 저널/매거진 형태의 블로그가 필요합니다.

### 1.2 레퍼런스 분석

#### 벤치마킹 브랜드

| 브랜드 | 특징 | 적용 포인트 |
|--------|------|-------------|
| **Aesop** | 문학적 스토리텔링, 미니멀 디자인, 제품보다 철학 강조 | 서정적 글쓰기, 여백의 미학 |
| **Le Labo (Le Journal)** | 신문/저널 형태, 아날로그 감성, 브랜드 커뮤니티 | 저널 포맷, 뉴스레터 연동 |
| **Krug** | 에디션 넘버링, 숙성 기록, 와인메이커 스토리 | 숙성 일지, 빈티지 아카이브 |
| **Dom Pérignon** | 빈티지 스토리, 셰프 콜라보, 예술가 협업 | 콜라보레이션 콘텐츠 |
| **Diptyque** | 향기와 장소의 연결, 여행 서사 | 바다/장소 스토리텔링 |

#### 디자인 트렌드 (2024 럭셔리 웹사이트)

- **Expansive Imagery**: 화면 가득 채우는 고품질 이미지/비디오
- **Bold Typography**: 대담한 타이포그래피로 브랜드 아이덴티티 강조
- **Muted Color Palette**: 절제된 중성 컬러로 우아함 표현
- **Storytelling First**: 제품 판매보다 서사 중심
- **Immersive Experience**: 패럴랙스, 부드러운 스크롤 애니메이션

### 1.3 프로젝트 목표

1. **브랜드 세계관 확장**: "바다의 시간"이라는 철학을 깊이 있게 전달
2. **콘텐츠 허브 구축**: 숙성 일지, 문화 콘텐츠, 협업 스토리의 중앙 저장소
3. **커뮤니티 형성**: 뉴스레터 구독자, 충성 고객과의 관계 구축
4. **SEO 최적화**: 브랜드 검색 유입 증가

### 1.4 성공 지표 (KPIs)

| 지표 | 목표 (런칭 6개월) |
|------|------------------|
| 월간 방문자 | 10,000+ |
| 평균 체류 시간 | 3분+ |
| 뉴스레터 구독자 | 2,000+ |
| 페이지당 조회수 | 2.5+ |
| 바운스율 | 40% 이하 |

---

## 2. 사용자 정의 (User Definition)

### 2.1 사용자 유형

| 유형 | 설명 | 주요 행동 |
|------|------|----------|
| **탐색자 (Explorer)** | 브랜드를 처음 접하는 잠재 고객 | 브랜드 스토리 탐색, 철학 이해 |
| **애호가 (Enthusiast)** | 와인/샴페인에 관심 있는 사람 | 숙성 과정, 테이스팅 노트 탐독 |
| **컬렉터 (Collector)** | 구매 고객, 충성 팬 | 뉴스레터 구독, 신규 콘텐츠 확인 |
| **관리자 (Admin)** | 내부 콘텐츠 담당자 | 글 작성/수정/발행, 이미지 관리 |

### 2.2 사용 환경

- **데스크탑**: Chrome, Safari, Edge (최신 버전)
- **모바일**: iOS Safari, Android Chrome
- **최소 지원 해상도**: 375px (모바일) ~ 1920px (데스크탑)

---

## 3. 정보 구조 (Information Architecture)

### 3.1 콘텐츠 카테고리

```
Le Journal de Marée
│
├── 🌊 바다의 일지 (Sea Log)
│   ├── 숙성 다이어리 (숙성 과정 정기 업데이트)
│   ├── 인양 기록 (인양 시즌 스토리)
│   └── 바다의 데이터 (수온, 해류, 압력 기록)
│
├── 🍾 메종 이야기 (Maison Stories)
│   ├── 브랜드 철학
│   ├── 창업자 이야기
│   └── 장인들 (샹파뉴 와인메이커, 한국 어부 등)
│
├── 🎨 문화와 예술 (Culture & Art)
│   ├── 협업 아티스트
│   ├── 예술과 시간
│   └── 공간 이야기 (아틀리에, 시음회 장소)
│
├── 🍽️ 테이블 위에서 (At the Table)
│   ├── 페어링 가이드
│   ├── 셰프 콜라보
│   └── 테이스팅 노트
│
└── 📰 뉴스 & 이벤트 (News & Events)
    ├── 브랜드 뉴스
    ├── 이벤트 후기
    └── 미디어 보도
```

### 3.2 사이트맵

```
/
├── / (홈 - 저널 메인)
├── /category/[slug] (카테고리별 아카이브)
│   ├── /category/sea-log
│   ├── /category/maison
│   ├── /category/culture
│   ├── /category/table
│   └── /category/news
├── /post/[slug] (개별 포스트)
├── /about (저널 소개)
├── /subscribe (뉴스레터 구독)
├── /search (검색)
│
└── /admin (관리자 페이지 - Clerk 인증)
    ├── /admin/posts (포스트 관리)
    ├── /admin/posts/new (새 포스트 작성)
    ├── /admin/posts/[id]/edit (포스트 수정)
    ├── /admin/categories (카테고리 관리)
    ├── /admin/media (미디어 라이브러리)
    └── /admin/subscribers (구독자 관리)
```

---

## 4. 기능 요구사항 (Functional Requirements)

### 4.1 공개 페이지 (Public Pages)

#### 4.1.1 홈페이지 (Journal Main)
**우선순위: P0**

| 요구사항 ID | 설명 |
|------------|------|
| HOME-001 | 히어로 섹션: 전면 이미지/비디오 + 브랜드 태그라인 |
| HOME-002 | 피처드 포스트: 편집자 선정 주요 콘텐츠 3-5개 |
| HOME-003 | 최신 포스트: 최근 발행 콘텐츠 그리드 |
| HOME-004 | 카테고리 네비게이션: 주요 카테고리 바로가기 |
| HOME-005 | 뉴스레터 구독 CTA: 이메일 수집 폼 |
| HOME-006 | 인스타그램 피드 연동 (선택) |

**UI 와이어프레임:**
```
┌─────────────────────────────────────────────────────────────────────┐
│                                                      [검색] [구독]   │
│  LE JOURNAL DE MARÉE                                               │
│  ─────────────────────────────────────────────────────────────────  │
│  바다의 일지  │  메종 이야기  │  문화와 예술  │  테이블 위에서  │  뉴스  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │                    [HERO IMAGE/VIDEO]                       │   │
│  │                                                             │   │
│  │         "심연의 시간이 조각한 바다의 수공예품"                  │   │
│  │                                                             │   │
│  │                   [최신 포스트 읽기 →]                        │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│  FEATURED                                                          │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  ┌─────────────────────┐  ┌─────────────────────────────────────┐  │
│  │                     │  │                                     │  │
│  │   [LARGE IMAGE]     │  │  바다의 일지                         │  │
│  │                     │  │                                     │  │
│  │   2026년 1월,       │  │  ┌───────────┐  ┌───────────┐       │  │
│  │   첫 번째 입수       │  │  │ [IMAGE]   │  │ [IMAGE]   │       │  │
│  │                     │  │  │           │  │           │       │  │
│  │   바다의 일지        │  │  │ 포스트 2  │  │ 포스트 3  │       │  │
│  │   2024.01.15       │  │  └───────────┘  └───────────┘       │  │
│  │                     │  │                                     │  │
│  └─────────────────────┘  └─────────────────────────────────────┘  │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│  LATEST                                                            │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐       │
│  │ [IMAGE]   │  │ [IMAGE]   │  │ [IMAGE]   │  │ [IMAGE]   │       │
│  │           │  │           │  │           │  │           │       │
│  │ 제목 1    │  │ 제목 2    │  │ 제목 3    │  │ 제목 4    │       │
│  │ 카테고리  │  │ 카테고리  │  │ 카테고리  │  │ 카테고리  │       │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘       │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │  바다의 소식을 받아보세요                                     │   │
│  │                                                             │   │
│  │  [이메일 입력                              ] [구독하기]       │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│  © 2026 Muse de Marée. All rights reserved.                        │
│  Instagram  │  YouTube  │  Newsletter                              │
└─────────────────────────────────────────────────────────────────────┘
```

#### 4.1.2 포스트 상세 페이지 (Post Detail)
**우선순위: P0**

| 요구사항 ID | 설명 |
|------------|------|
| POST-001 | 히어로 이미지: 전면 커버 이미지 |
| POST-002 | 메타 정보: 카테고리, 발행일, 예상 읽기 시간 |
| POST-003 | 본문 콘텐츠: 리치 텍스트, 이미지, 인용구, 비디오 |
| POST-004 | 관련 포스트: 같은 카테고리 또는 태그 기반 추천 |
| POST-005 | 공유 버튼: SNS 공유 (링크 복사, 카카오톡, 트위터) |
| POST-006 | 뉴스레터 구독 CTA |
| POST-007 | 이전/다음 포스트 네비게이션 |

**본문 지원 요소:**
- 제목 (H1, H2, H3)
- 본문 텍스트 (Paragraph)
- 인용구 (Blockquote) - 브랜드 톤에 맞는 스타일
- 이미지 (Single, Gallery, Full-width)
- 비디오 임베드 (YouTube, Vimeo)
- 구분선 (Divider)
- 캡션 텍스트

**UI 와이어프레임:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  ← 바다의 일지                                          [공유] [구독] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │                                                             │   │
│  │                    [FULL-WIDTH HERO IMAGE]                  │   │
│  │                                                             │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│          바다의 일지  •  2026년 1월 15일  •  5분 읽기               │
│                                                                     │
│                    ─────────────────────────                        │
│                                                                     │
│                 첫 번째 항해: 심연으로의 입수                         │
│                                                                     │
│                    ─────────────────────────                        │
│                                                                     │
│     2026년 1월의 어느 차가운 아침, 프랑스 샹파뉴에서 긴 여정을        │
│     마치고 도착한 샴페인 병들이 마침내 한국의 바다로 향했습니다.       │
│                                                                     │
│     ┌─────────────────────────────────────────────────────────┐   │
│     │                                                         │   │
│     │  "가장 어두운 곳에서, 가장 찬란한 맛이 태어납니다."        │   │
│     │                                                         │   │
│     └─────────────────────────────────────────────────────────┘   │
│                                                                     │
│     수심 30미터, 수온 8°C. 이 차가운 심연에서 샴페인은 6개월간       │
│     잠들게 됩니다. 인간의 시간과는 다른, 바다의 시간이 시작되는       │
│     순간입니다.                                                     │
│                                                                     │
│     ┌───────────────────┐  ┌───────────────────┐                   │
│     │                   │  │                   │                   │
│     │  [IMAGE 1]        │  │  [IMAGE 2]        │                   │
│     │                   │  │                   │                   │
│     └───────────────────┘  └───────────────────┘                   │
│                 입수 준비 중인 샴페인 케이지                         │
│                                                                     │
│     ...                                                             │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  RELATED STORIES                                                   │
│                                                                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐                       │
│  │ [IMAGE]   │  │ [IMAGE]   │  │ [IMAGE]   │                       │
│  │ 제목 1    │  │ 제목 2    │  │ 제목 3    │                       │
│  └───────────┘  └───────────┘  └───────────┘                       │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  ← 이전 포스트                              다음 포스트 →            │
│  "샹파뉴의 떼루아"                          "바다의 데이터: 1월"      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 4.1.3 카테고리 아카이브 페이지
**우선순위: P0**

| 요구사항 ID | 설명 |
|------------|------|
| CAT-001 | 카테고리 히어로: 카테고리명 + 설명 + 대표 이미지 |
| CAT-002 | 포스트 그리드: 해당 카테고리 포스트 목록 |
| CAT-003 | 필터/정렬: 최신순, 인기순 |
| CAT-004 | 페이지네이션: 무한 스크롤 또는 페이지 번호 |

#### 4.1.4 검색 페이지
**우선순위: P1**

| 요구사항 ID | 설명 |
|------------|------|
| SEARCH-001 | 검색 입력 필드: 실시간 검색 제안 |
| SEARCH-002 | 검색 결과: 포스트 카드 그리드 |
| SEARCH-003 | 필터: 카테고리별 필터 |
| SEARCH-004 | 빈 결과 처리: 추천 콘텐츠 표시 |

#### 4.1.5 뉴스레터 구독 페이지
**우선순위: P1**

| 요구사항 ID | 설명 |
|------------|------|
| SUB-001 | 구독 폼: 이메일, 이름 (선택) |
| SUB-002 | 구독 혜택 설명: 받게 될 콘텐츠 미리보기 |
| SUB-003 | 개인정보 동의: 체크박스 |
| SUB-004 | 성공/실패 피드백: 토스트 메시지 |

---

### 4.2 관리자 페이지 (Admin Pages)

#### 4.2.1 인증 (Authentication)
**우선순위: P0**

| 요구사항 ID | 설명 |
|------------|------|
| AUTH-001 | Clerk 기반 로그인/로그아웃 |
| AUTH-002 | 이메일 + 비밀번호 로그인 |
| AUTH-003 | 소셜 로그인 (Google) - 선택 |
| AUTH-004 | 권한 관리: Admin, Editor 역할 구분 |
| AUTH-005 | 보호된 라우트: 미인증 시 로그인 페이지로 리다이렉트 |

#### 4.2.2 포스트 관리 (Post Management)
**우선순위: P0**

| 요구사항 ID | 설명 |
|------------|------|
| PM-001 | 포스트 목록: 테이블 형태, 상태/카테고리 필터 |
| PM-002 | 포스트 작성: 리치 텍스트 에디터 (Tiptap/Editor.js) |
| PM-003 | 이미지 업로드: 드래그 앤 드롭, Supabase Storage |
| PM-004 | 메타 데이터 입력: 제목, 슬러그, 발췌문, 카테고리, 태그 |
| PM-005 | SEO 설정: 메타 타이틀, 메타 설명, OG 이미지 |
| PM-006 | 발행 상태: 초안(Draft), 발행(Published), 예약(Scheduled) |
| PM-007 | 피처드 설정: 홈페이지 피처드 여부 토글 |
| PM-008 | 미리보기: 발행 전 미리보기 기능 |
| PM-009 | 포스트 삭제: 소프트 삭제 (휴지통) |

**포스트 에디터 UI:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  ← 포스트 목록                              [미리보기] [저장] [발행]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────┐  ┌─────────────────────────┐  │
│  │                                 │  │ 설정                     │  │
│  │  제목을 입력하세요...            │  │                         │  │
│  │                                 │  │ 상태: [초안 ▼]           │  │
│  │  ─────────────────────────────  │  │                         │  │
│  │                                 │  │ 카테고리: [바다의 일지 ▼] │  │
│  │  [B] [I] [H2] [H3] ["] [🔗] [📷] │  │                         │  │
│  │                                 │  │ 태그:                    │  │
│  │  ─────────────────────────────  │  │ [숙성] [입수] [+]        │  │
│  │                                 │  │                         │  │
│  │  본문을 작성하세요...            │  │ ─────────────────────── │  │
│  │                                 │  │                         │  │
│  │                                 │  │ 슬러그:                  │  │
│  │                                 │  │ [first-voyage-2026    ] │  │
│  │                                 │  │                         │  │
│  │                                 │  │ 발췌문:                  │  │
│  │                                 │  │ [                     ] │  │
│  │                                 │  │ [                     ] │  │
│  │                                 │  │                         │  │
│  │                                 │  │ ─────────────────────── │  │
│  │                                 │  │                         │  │
│  │                                 │  │ 커버 이미지              │  │
│  │                                 │  │ ┌───────────────────┐  │  │
│  │                                 │  │ │ [이미지 업로드]    │  │  │
│  │                                 │  │ └───────────────────┘  │  │
│  │                                 │  │                         │  │
│  │                                 │  │ ─────────────────────── │  │
│  │                                 │  │                         │  │
│  │                                 │  │ ☐ 피처드 포스트로 설정   │  │
│  │                                 │  │                         │  │
│  └─────────────────────────────────┘  └─────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 4.2.3 미디어 라이브러리 (Media Library)
**우선순위: P1**

| 요구사항 ID | 설명 |
|------------|------|
| MEDIA-001 | 이미지 목록: 그리드 뷰, 업로드 날짜별 정렬 |
| MEDIA-002 | 이미지 업로드: 다중 파일 업로드, 드래그 앤 드롭 |
| MEDIA-003 | 이미지 정보: 파일명, 크기, URL 복사 |
| MEDIA-004 | 이미지 삭제 |
| MEDIA-005 | 폴더 구조 (선택) |

#### 4.2.4 카테고리 관리
**우선순위: P1**

| 요구사항 ID | 설명 |
|------------|------|
| CAT-ADMIN-001 | 카테고리 목록: 이름, 슬러그, 포스트 수 |
| CAT-ADMIN-002 | 카테고리 추가/수정/삭제 |
| CAT-ADMIN-003 | 카테고리 설명 및 대표 이미지 설정 |

#### 4.2.5 구독자 관리
**우선순위: P2**

| 요구사항 ID | 설명 |
|------------|------|
| SUB-ADMIN-001 | 구독자 목록: 이메일, 가입일, 상태 |
| SUB-ADMIN-002 | 구독자 내보내기: CSV 다운로드 |
| SUB-ADMIN-003 | 수동 구독 취소 처리 |

---

## 5. 데이터베이스 설계 (Supabase)

### 5.1 ERD 개요

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   posts     │────<│ post_tags   │>────│    tags     │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       │
       ▼
┌─────────────┐
│ categories  │
└─────────────┘

┌─────────────┐     ┌─────────────┐
│   media     │     │ subscribers │
└─────────────┘     └─────────────┘
```

### 5.2 테이블 스키마

#### posts
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT,
  content JSONB NOT NULL, -- 리치 텍스트 에디터 JSON
  cover_image_url TEXT,
  category_id UUID REFERENCES categories(id),
  status VARCHAR(20) DEFAULT 'draft', -- draft, published, scheduled
  is_featured BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  meta_title VARCHAR(255),
  meta_description TEXT,
  og_image_url TEXT,
  reading_time_minutes INTEGER,
  view_count INTEGER DEFAULT 0,
  author_id VARCHAR(255), -- Clerk user ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- 소프트 삭제
);

-- 인덱스
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_category ON posts(category_id);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX idx_posts_is_featured ON posts(is_featured) WHERE is_featured = TRUE;
```

#### categories
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### tags
```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### post_tags (다대다 관계)
```sql
CREATE TABLE post_tags (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
```

#### media
```sql
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255),
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  width INTEGER,
  height INTEGER,
  alt_text VARCHAR(255),
  uploaded_by VARCHAR(255), -- Clerk user ID
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### subscribers
```sql
CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active', -- active, unsubscribed
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  source VARCHAR(50) -- homepage, post, popup
);

-- 인덱스
CREATE INDEX idx_subscribers_email ON subscribers(email);
CREATE INDEX idx_subscribers_status ON subscribers(status);
```

### 5.3 Row Level Security (RLS)

```sql
-- 공개 읽기 (발행된 포스트만)
CREATE POLICY "Public can read published posts"
ON posts FOR SELECT
USING (status = 'published' AND deleted_at IS NULL);

-- 관리자 전체 접근
CREATE POLICY "Admins have full access to posts"
ON posts FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- 구독자 생성은 누구나 가능
CREATE POLICY "Anyone can subscribe"
ON subscribers FOR INSERT
WITH CHECK (true);

-- 구독자 조회는 관리자만
CREATE POLICY "Only admins can view subscribers"
ON subscribers FOR SELECT
USING (auth.jwt() ->> 'role' = 'admin');
```

---

## 6. 기술 스택 (Tech Stack)

### 6.1 프론트엔드

| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 14.x (App Router) | 프레임워크 |
| React | 18.x | UI 라이브러리 |
| TypeScript | 5.x | 타입 안정성 |
| Tailwind CSS | 3.x | 스타일링 |
| Framer Motion | 10.x | 애니메이션 |
| Tiptap | 2.x | 리치 텍스트 에디터 |
| next-themes | - | 다크 모드 |
| react-hook-form | 7.x | 폼 관리 |
| zod | 3.x | 폼 유효성 검사 |

### 6.2 백엔드 / 데이터베이스

| 기술 | 용도 |
|------|------|
| Supabase | PostgreSQL 데이터베이스 |
| Supabase Storage | 이미지 저장 |
| Supabase Auth | (Clerk와 병행 또는 대체 가능) |

### 6.3 인증

| 기술 | 용도 |
|------|------|
| Clerk | 관리자 인증 |
| @clerk/nextjs | Next.js 통합 |

### 6.4 기타

| 기술 | 용도 |
|------|------|
| Vercel | 배포 |
| Vercel Analytics | 트래픽 분석 |
| Resend / Mailchimp | 뉴스레터 발송 (선택) |

---

## 7. 디자인 시스템 (Design System)

### 7.1 디자인 원칙

1. **여백의 미학**: 콘텐츠가 숨 쉴 수 있는 충분한 여백
2. **타이포그래피 중심**: 글이 주인공, 이미지는 조연
3. **절제된 색상**: 브랜드 컬러는 포인트로만 사용
4. **자연스러운 움직임**: 부드럽고 느린 애니메이션
5. **시간의 흐름**: 세로 스크롤로 이야기 전개

### 7.2 컬러 팔레트

| 용도 | 컬러명 | Light Mode | Dark Mode |
|------|--------|------------|-----------|
| Background | Canvas | #FAFAF9 | #171717 |
| Surface | Paper | #FFFFFF | #262626 |
| Text Primary | Ink | #1C1917 | #FAFAF9 |
| Text Secondary | Muted | #78716C | #A8A29E |
| Border | Line | #E7E5E4 | #404040 |
| Accent | Deep Navy | #1A365D | #3B82F6 |
| Accent Secondary | Rose Gold | #B7916E | #D4A574 |

### 7.3 타이포그래피

| 용도 | 폰트 | 사이즈 | 굵기 | 행간 |
|------|------|--------|------|------|
| Display (제목) | Playfair Display | 48-64px | 400 | 1.1 |
| Heading 1 | Playfair Display | 36-40px | 400 | 1.2 |
| Heading 2 | Pretendard | 24-28px | 600 | 1.3 |
| Heading 3 | Pretendard | 18-20px | 600 | 1.4 |
| Body | Pretendard | 16-18px | 400 | 1.8 |
| Caption | Pretendard | 14px | 400 | 1.5 |
| Label | Pretendard | 12px | 500 | 1.4 |

**서체 선정 이유:**
- **Playfair Display**: 세리프체로 클래식한 럭셔리 느낌, 저널/매거진 헤드라인에 적합
- **Pretendard**: 한글 가독성 우수, 모던하면서 중립적인 톤

### 7.4 레이아웃 그리드

```
Desktop (1440px):
┌─────────────────────────────────────────────────────────────────────┐
│  80px  │                    1280px                    │  80px       │
│ margin │              12-column grid                  │ margin      │
└─────────────────────────────────────────────────────────────────────┘

Mobile (375px):
┌─────────────────────────────────┐
│ 20px │      335px        │ 20px │
│      │   4-column grid   │      │
└─────────────────────────────────┘
```

### 7.5 컴포넌트 스타일

| 컴포넌트 | 스타일 |
|---------|--------|
| Card | border-radius: 0 (각진 모서리), subtle shadow |
| Button | border-radius: 0, uppercase, letter-spacing |
| Input | border-radius: 0, 하단 보더만 |
| Divider | 얇은 1px 라인 또는 장식적 요소 |

### 7.6 애니메이션

| 요소 | 애니메이션 |
|------|-----------|
| Page Transition | Fade (500ms ease-out) |
| Image Load | Fade in + subtle scale (300ms) |
| Scroll Reveal | Fade up (400ms, stagger 100ms) |
| Hover (Card) | Subtle lift + shadow |
| Hover (Link) | Underline reveal |

---

## 8. SEO 및 성능 최적화

### 8.1 SEO 요구사항

| 항목 | 구현 방법 |
|------|----------|
| 메타 태그 | Next.js Metadata API |
| OG 태그 | 포스트별 동적 OG 이미지 |
| 구조화 데이터 | JSON-LD (Article, Organization) |
| 사이트맵 | 자동 생성 (next-sitemap) |
| robots.txt | 자동 생성 |
| 캐노니컬 URL | 모든 페이지 설정 |

### 8.2 성능 요구사항

| 지표 | 목표 |
|------|------|
| LCP (Largest Contentful Paint) | < 2.5초 |
| FID (First Input Delay) | < 100ms |
| CLS (Cumulative Layout Shift) | < 0.1 |
| Lighthouse Score | 90+ |

### 8.3 이미지 최적화

- Next.js Image 컴포넌트 사용
- WebP 포맷 자동 변환
- 반응형 이미지 (srcset)
- Lazy loading
- Blur placeholder

---

## 9. 개발 마일스톤

### Phase 1: MVP (3주)

| 주차 | 작업 내용 | 산출물 |
|------|----------|--------|
| Week 1 | 프로젝트 셋업, DB 설계, Clerk 연동 | 기본 구조 |
| Week 2 | 공개 페이지 (홈, 포스트, 카테고리) | 프론트엔드 완성 |
| Week 3 | 관리자 페이지 (포스트 CRUD, 에디터) | 어드민 완성 |

### Phase 2: 기능 확장 (2주)

| 주차 | 작업 내용 | 산출물 |
|------|----------|--------|
| Week 4 | 미디어 라이브러리, 검색 기능 | 부가 기능 |
| Week 5 | 뉴스레터 구독, SEO 최적화 | 마케팅 기능 |

### Phase 3: 고도화 (1주)

| 주차 | 작업 내용 | 산출물 |
|------|----------|--------|
| Week 6 | 애니메이션, 다크 모드, QA | 최종 배포 |

---

## 10. 화면 설계 (추가 와이어프레임)

### 10.1 모바일 홈페이지

```
┌─────────────────────────┐
│  ☰   LE JOURNAL   🔍    │
├─────────────────────────┤
│                         │
│  ┌───────────────────┐  │
│  │                   │  │
│  │   [HERO IMAGE]    │  │
│  │                   │  │
│  │  "심연의 시간이    │  │
│  │   조각한 바다의    │  │
│  │   수공예품"        │  │
│  │                   │  │
│  └───────────────────┘  │
│                         │
│  ─────────────────────  │
│  FEATURED               │
│  ─────────────────────  │
│                         │
│  ┌───────────────────┐  │
│  │                   │  │
│  │   [IMAGE]         │  │
│  │                   │  │
│  │   첫 번째 항해     │  │
│  │   바다의 일지      │  │
│  └───────────────────┘  │
│                         │
│  ┌─────────┐ ┌─────────┐│
│  │[IMAGE]  │ │[IMAGE]  ││
│  │제목 2   │ │제목 3   ││
│  └─────────┘ └─────────┘│
│                         │
│  ─────────────────────  │
│  LATEST                 │
│  ─────────────────────  │
│                         │
│  ┌───────────────────┐  │
│  │ [IMG] 제목 4      │  │
│  │       카테고리    │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ [IMG] 제목 5      │  │
│  │       카테고리    │  │
│  └───────────────────┘  │
│                         │
│  ─────────────────────  │
│                         │
│  바다의 소식을 받아보세요 │
│                         │
│  [이메일 입력        ]  │
│  [    구독하기       ]  │
│                         │
│  ─────────────────────  │
│  © 2026 Muse de Marée  │
│  IG  │  YT  │  NL      │
└─────────────────────────┘
```

### 10.2 관리자 대시보드

```
┌─────────────────────────────────────────────────────────────────────┐
│  LE JOURNAL ADMIN                                    [사용자] [로그아웃] │
├───────────────┬─────────────────────────────────────────────────────┤
│               │                                                     │
│  📊 대시보드   │  대시보드                                            │
│               │                                                     │
│  📝 포스트    │  ┌─────────────────┐  ┌─────────────────┐           │
│    └ 전체     │  │ 전체 포스트      │  │ 이번 달 발행     │           │
│    └ 새 포스트 │  │      24         │  │       3         │           │
│               │  └─────────────────┘  └─────────────────┘           │
│  📁 카테고리  │                                                     │
│               │  ┌─────────────────┐  ┌─────────────────┐           │
│  🖼️ 미디어    │  │ 구독자 수        │  │ 이번 달 조회수   │           │
│               │  │     1,234       │  │    12,456       │           │
│  👥 구독자    │  └─────────────────┘  └─────────────────┘           │
│               │                                                     │
│  ⚙️ 설정     │  ─────────────────────────────────────────────────  │
│               │                                                     │
│               │  최근 포스트                                         │
│               │                                                     │
│               │  ┌─────────────────────────────────────────────┐   │
│               │  │ 제목              │ 상태   │ 날짜      │ 액션│   │
│               │  ├───────────────────┼────────┼───────────┼─────│   │
│               │  │ 첫 번째 항해       │ 발행   │ 2026.01.15│ 편집│   │
│               │  │ 바다의 데이터      │ 초안   │ 2026.01.14│ 편집│   │
│               │  │ 샹파뉴 이야기      │ 발행   │ 2026.01.10│ 편집│   │
│               │  └─────────────────────────────────────────────┘   │
│               │                                                     │
└───────────────┴─────────────────────────────────────────────────────┘
```

---

## 11. API 설계

### 11.1 공개 API (Next.js Server Actions / Route Handlers)

```typescript
// 포스트 목록 조회
GET /api/posts
Query: { category?, page?, limit?, featured? }
Response: { posts: Post[], total: number, hasMore: boolean }

// 포스트 상세 조회
GET /api/posts/[slug]
Response: Post

// 카테고리 목록
GET /api/categories
Response: Category[]

// 뉴스레터 구독
POST /api/subscribe
Body: { email: string, name?: string }
Response: { success: boolean }

// 검색
GET /api/search
Query: { q: string, category?: string }
Response: { posts: Post[] }
```

### 11.2 관리자 API (Clerk 인증 필수)

```typescript
// 포스트 CRUD
POST /api/admin/posts
PUT /api/admin/posts/[id]
DELETE /api/admin/posts/[id]

// 미디어 업로드
POST /api/admin/media/upload
DELETE /api/admin/media/[id]

// 구독자 관리
GET /api/admin/subscribers
GET /api/admin/subscribers/export
```

---

## 12. 보안 고려사항

### 12.1 인증/인가

- Clerk middleware로 관리자 라우트 보호
- Supabase RLS로 데이터베이스 레벨 접근 제어
- API 라우트에서 세션 검증

### 12.2 입력 검증

- Zod 스키마로 모든 입력 유효성 검사
- XSS 방지 (리치 텍스트 HTML 살균)
- SQL Injection 방지 (Supabase 파라미터화 쿼리)

### 12.3 파일 업로드

- 허용 파일 타입 제한 (이미지만)
- 파일 크기 제한 (5MB)
- Supabase Storage 정책 설정

---

## 13. 모니터링 및 분석

### 13.1 분석 도구

| 도구 | 용도 |
|------|------|
| Vercel Analytics | 페이지뷰, 방문자 |
| Google Analytics 4 | 상세 사용자 행동 |
| Supabase Dashboard | 데이터베이스 성능 |

### 13.2 추적 이벤트

| 이벤트 | 설명 |
|--------|------|
| page_view | 페이지 조회 |
| post_read | 포스트 읽기 완료 (스크롤 80% 이상) |
| newsletter_subscribe | 뉴스레터 구독 |
| share_click | 공유 버튼 클릭 |
| search | 검색 수행 |

---

## 14. 향후 확장 계획

### Phase 2 (출시 후 3개월)

- 다국어 지원 (영어)
- 댓글 기능 (Disqus 또는 자체 구현)
- 작성자 프로필 페이지
- 읽기 목록 (북마크)

### Phase 3 (출시 후 6개월)

- 회원 전용 콘텐츠
- 뉴스레터 자동화 (새 포스트 알림)
- A/B 테스트 프레임워크
- CMS 고도화 (Notion/Sanity 연동 검토)

---

## 15. 부록

### 15.1 초기 콘텐츠 계획

런칭 시 최소 10개 포스트 준비:

| # | 제목 | 카테고리 |
|---|------|---------|
| 1 | 뮤즈드마레의 탄생 | 메종 이야기 |
| 2 | 왜 바다인가 | 메종 이야기 |
| 3 | 샹파뉴의 떼루아 | 메종 이야기 |
| 4 | 한국 바다의 비밀 | 바다의 일지 |
| 5 | 첫 번째 입수 기록 | 바다의 일지 |
| 6 | 숙성 1개월 리포트 | 바다의 일지 |
| 7 | 시간과 예술에 대하여 | 문화와 예술 |
| 8 | 협업 공예가 인터뷰 | 문화와 예술 |
| 9 | 페어링 가이드 | 테이블 위에서 |
| 10 | 론칭 이벤트 안내 | 뉴스 |

### 15.2 참고 URL

- Aesop Journal: https://www.aesop.com/kr/r/the-fabulist
- Le Labo Le Journal: https://lejournal.lelabofragrances.com
- Krug: https://www.krug.com
- Dom Pérignon: https://www.domperignon.com

---

**문서 이력**

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0 | 2024-12-13 | - | 최초 작성 |
