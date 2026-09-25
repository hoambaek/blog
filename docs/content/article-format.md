# 기록(글) 서식 규격 — Le Journal de Marée

공개 글 화면, 관리자 에디터, Claude 초안 업로드가 **같은 규격**을 쓴다. 셋 중 하나만 고치면 다른 곳에서 서식이 깨진다.
디자인 정본: Paper `Muse de Marée 웹` → 페이지 `Blog — Le Journal de Marée`(공개) · `Blog Admin`(관리자).

## 1. 저장 형식 (DB `posts.content.html`, `content_en.html`)

본문은 HTML 문자열이다. 아래 블록만 쓴다. 번호(소제목 01·02, FIG 004–01)는 **저장하지 않고 렌더 시 순서로 매긴다**.

| 블록 | HTML | 비고 |
|---|---|---|
| 리드 문단 | `<p class="lead">…</p>` | 글 첫 문단. 글당 1개 |
| 문단 | `<p>…</p>` | 빈 `<p></p>`로 간격을 만들지 않는다 |
| 번호 소제목 | `<h3>…</h3>` | 렌더러가 01, 02… 자동 부여. 기존 글의 h3도 그대로 번호가 붙는다 |
| 그림 | `<figure data-block="figure"><img src alt><figcaption><span data-caption>…</span><span data-credit>…</span></figcaption></figure>` | FIG `{글번호}–{순서}` 자동. 크레딧은 글 끝 PHOTO 목록에 자동 수집 |
| 이미지 자리 | `<figure data-block="figure" data-slot data-hint="어떤 사진" data-ratio="4:5"><figcaption>…</figcaption></figure>` | `img` 없음. 관리자에서 점선 상자로 보이고, 공개 화면에서는 **렌더하지 않는다**. 발행 시 비어 있으면 경고 |
| 인용·출처 | `<blockquote><p>…</p><cite>…</cite></blockquote>` | `cite` 없으면 출처 줄 생략 |
| 용어 목록 | `<dl data-block="terms"><div><dt>용어</dt><dd>설명</dd></div>…</dl>` | 가는 선 행. 데스크톱 2열, 모바일 세로 |
| 목록 | `<ul>/<ol><li>` | "- "로 시작하는 문단을 목록 대신 쓰지 않는다 |
| 영상 | 기존 video 노드 유지 | |
| 구분선 | `<hr>` | |
| 링크·강조 | `<a>`, `<strong>`, `<em>` | |

글 단위 필드(본문 밖): 제목, 발췌문(excerpt), 연재(category), 커버, 다음 기록(선택, 없으면 발행일 순), 사진 출처(그림 크레딧 자동 수집 + 수동 추가).

**관측 줄**(글 상단 PUBLISHED · SEA · 1Y AVG · READING)은 저장하지 않는다. 렌더 시 계산한다:
- 수온 = `ocean_data_daily.sea_temperature_avg`를 월별 40m 보정(landing `bottomTemp40`과 같은 계수, 기저 8.0°C)한 값의, **발행일까지 직전 365일 평균**. 소수 1자리. 데이터가 없으면 칸을 숨긴다(값을 지어내지 않는다).
- 초안은 오늘 기준으로 계산해 보여 준다.

글 번호 N°는 발행 순서(published_at 오름차순, 1부터, 3자리)로 매긴다. 초안은 번호 없음(—).

## 2. Claude 원고 문법 (`docs/posts/*.md` → 초안 업로드)

```markdown
---
title: 첫 인양의 기록
slug: first-retrieval-log
excerpt: 한 줄 발췌문
series: sea-log          # sea-log | maison | (연재 slug)
cover: ./images/cover.jpg  # 선택. 로컬 경로면 업로드 시 R2로 올린다
next: why-the-sea         # 선택. 다음 기록 slug
meta_title: 선택
meta_description: 선택
---

:::lead
리드 문단 한 단락.
:::

일반 문단.

## 소제목 (번호는 자동)

:::figure src="./images/deck.jpg" ratio="4:5"
caption: 바다에서 막 올라온 병.
credit: 촬영자 이름
:::

:::figure ratio="4:5"
hint: 인양 직후 갑판 위, 따개비가 붙은 병 한 병의 클로즈업
caption: 바다에서 막 올라온 병.
:::

> 인용문 본문.
> — 출처 이름, 소속

:::terms
일정한 저온 :: 지상의 계절이 오르내리는 동안 좁은 폭 안에서 움직입니다.
빛의 차단 :: 바다 밑에는 그 변수가 없습니다.
:::

- 목록 항목
```

- `src` 없는 `:::figure` = 이미지 자리(`hint` 필수, `ratio` 기본 `4:5`). `src`가 있으면 `ratio`·`hint`는 쓰지 않는다. `alt="…"`를 따로 주지 않으면 캡션 글자가 대체 텍스트가 된다.
- 인용의 마지막 줄이 `— `로 시작하면 출처(`cite`)가 된다. `>`만 있는 빈 줄로 인용 안 단락을 나눈다.
- 인라인은 `**강조**` · `*기울임*` · `[글](https://…)`만. 기호를 그대로 쓰려면 `\*`처럼 역슬래시.
- 줄을 바꿔 써도 빈 줄이 없으면 한 문단으로 합친다. `- `/`1. ` 목록은 한 단계만(중첩 없음).
- 쓰지 않는 것(오류): `# 제목`·`###` 소제목, `![]()` 이미지, 표, 코드 블록, 알 수 없는 `:::` 블록·프론트매터 항목.
- 이미지 경로: `http(s)://`면 그대로, 아니면 원고 파일 기준 로컬 경로 → 업로드 때 R2(`covers/`·`posts/`, WebP 최적화)로 올린다.
- 파서: `src/lib/manuscript/parse.ts`. 출력은 1절 HTML이고 에디터에서 한 번 열어 저장해도 바뀌지 않는다(`npm run test:manuscript`).

### 업로드

```bash
npm run draft -- docs/posts/<slug>.md --dry-run   # 서버에 보내지 않고 블록 요약·이미지·경고만 (오류는 줄 번호로)
npm run draft -- docs/posts/<slug>.md             # 운영(https://blog.musedemaree.com)에 초안 업로드 → 미리보기 링크 출력
npm run draft -- docs/posts/<slug>.md --target=local --port=3000   # 로컬 서버로
npm run draft -- docs/posts/<slug>.md --force     # 관리자에서 고친 초안을 원고로 덮어쓰기 (대표 확인 후에만)
```

- `POST /api/drafts`(토큰 `BLOG_DRAFT_TOKEN`)가 파싱 → 이미지 R2 업로드 → 연재 확인 → 읽는 시간 → 영문 번역 → 저장을 한다. 상태는 항상 초안이다 — 발행·삭제 경로는 없다.
- 같은 slug면 Claude가 올린 초안만 갱신한다. 발행 글·관리자가 만든 글·지운 글의 slug는 거부(409). 관리자에서 고친 초안도 거부(409)하고 `--force`일 때만 덮어쓴다.
- 결과로 나온 미리보기 링크(`/admin/posts/{id}/preview`)를 대표에게 전달한다. 이미지 자리 채우기·번역 검수·발행은 대표가 관리자에서 한다.

## 3. 쓰는 기준 (Claude 작성 규칙)

- 리드 문단으로 시작한다(필수 1개).
- 소제목은 3~5개. 소제목 사이 문단은 2~4개.
- 사진이 들어갈 자리는 소제목마다 최소 1곳 검토. 실제 사진이 없으면 이미지 자리(`hint`에 어떤 사진인지 구체적으로, 권장 비율)로 둔다. 모바일은 정사각 이상·세로 우선 → 기본 `ratio="4:5"`.
- 인용은 실제 발언·문헌만, 출처 필수. 지어낸 인용 금지.
- 조건·용어·비교를 나열할 때는 목록 대신 용어 목록(`:::terms`)을 우선 검토.
- 수치·고유명사는 원문 그대로. 브랜드 규칙(북극성 §7·§9, CLAUDE.md 글 작성 워크플로우)과 humanize 단계는 그대로 적용.
- 다 쓰면 humanize → `npm run draft -- <파일> --dry-run`으로 점검 → `npm run draft -- <파일>`로 업로드 → 미리보기 링크 전달(위 "업로드").
