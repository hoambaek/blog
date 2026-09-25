/*
 * 원고 파서·초안 업로드 테스트 — `npm run test:manuscript`
 *
 *   1) 파서: 규격 예시 원고(docs/content/article-format.md 2절 코드 블록) → 기대 HTML, 인라인·블록 문법, 오류 케이스(줄 번호)
 *   2) 에디터 왕복: 파서 출력이 에디터 스키마(extensions.ts)를 한 번 돌아도 글자 하나 안 바뀌고, 공개 렌더러 구조도 같다
 *   3) 라우트 로직(src/lib/drafts/service.ts): DB·R2·번역을 목으로 끼워 생성·갱신·거부·409·force 확인
 *   4) 토큰 검사·레이트 제한
 *
 * 네트워크·운영 DB에 닿지 않는다.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'
import { Window } from 'happy-dom'
import { Editor } from '@tiptap/core'
import { articleExtensions } from '../src/lib/editor/extensions'
import { cleanArticleHtml } from '../src/lib/editor/serialize'
import { parseArticleHtml } from '../src/lib/article/parse'
import { parseManuscript } from '../src/lib/manuscript/parse'
import { renderInline } from '../src/lib/manuscript/inline'
import {
  EDIT_TOLERANCE_MS,
  parseDraftRequest,
  processDraft,
  DraftSetupError,
  type DraftDeps,
  type DraftRow,
  type ExistingPost,
} from '../src/lib/drafts/service'
import { checkDraftToken } from '../src/lib/drafts/token'
import { createRateLimiter } from '../src/lib/drafts/rate-limit'

const window = new Window({ url: 'http://localhost/' })
const g = globalThis as unknown as Record<string, unknown>
const w = window as unknown as Record<string, unknown>
for (const key of ['document', 'Node', 'Element', 'HTMLElement', 'DocumentFragment', 'MutationObserver']) g[key] = w[key]
g.window = window
g.getComputedStyle = window.getComputedStyle.bind(window)
g.requestAnimationFrame = (cb: () => void) => setTimeout(cb, 0)
g.cancelAnimationFrame = (id: ReturnType<typeof setTimeout>) => clearTimeout(id)

const results: { name: string; ok: boolean; error?: string }[] = []
async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn()
    results.push({ name, ok: true })
  } catch (error) {
    results.push({ name, ok: false, error: (error as Error).message })
  }
}

function roundTrip(html: string): string {
  const editor = new Editor({ extensions: articleExtensions(), content: html })
  const out = cleanArticleHtml(editor.getHTML())
  editor.destroy()
  return out
}

function frontmatter(extra = ''): string {
  return `---\ntitle: 테스트 기록\nslug: test-record\nexcerpt: 발췌\nseries: sea-log\n${extra}---\n`
}

function errorsOf(source: string) {
  return parseManuscript(source).errors
}

function assertError(source: string, line: number, includes: string) {
  const errors = errorsOf(source)
  const hit = errors.find((e) => e.line === line && e.message.includes(includes))
  assert.ok(hit, `${line}행 "${includes}" 오류를 기대했지만: ${JSON.stringify(errors)}`)
}

// ── 1) 파서 ──

const SPEC_SOURCE = readFileSync('docs/content/article-format.md', 'utf8').match(/```markdown\n([\s\S]*?)\n```/)?.[1] ?? ''

const SPEC_EXPECTED =
  '<p class="lead">리드 문단 한 단락.</p>' +
  '<p>일반 문단.</p>' +
  '<h3>소제목 (번호는 자동)</h3>' +
  '<figure data-block="figure"><img src="./images/deck.jpg" alt="바다에서 막 올라온 병."><figcaption><span data-caption>바다에서 막 올라온 병.</span><span data-credit>촬영자 이름</span></figcaption></figure>' +
  '<figure data-block="figure" data-slot data-hint="인양 직후 갑판 위, 따개비가 붙은 병 한 병의 클로즈업" data-ratio="4:5"><figcaption>바다에서 막 올라온 병.</figcaption></figure>' +
  '<blockquote><p>인용문 본문.</p><cite>출처 이름, 소속</cite></blockquote>' +
  '<dl data-block="terms"><div><dt>일정한 저온</dt><dd>지상의 계절이 오르내리는 동안 좁은 폭 안에서 움직입니다.</dd></div><div><dt>빛의 차단</dt><dd>바다 밑에는 그 변수가 없습니다.</dd></div></dl>' +
  '<ul><li><p>목록 항목</p></li></ul>'

/** 규격 블록을 모두 쓰는 원고 — 인라인 겹침·이스케이프·여러 줄 문단 포함 */
const FULL_SOURCE = `${frontmatter('cover: https://pub.example.r2.dev/covers/c.webp\nnext: why-the-sea\nmeta_title: "제목: 콜론 포함"\n')}
:::lead
첫 줄과
둘째 줄이 한 단락이 됩니다.
:::

**굵게**와 *기울임*, [링크](https://example.com/?a=1&b=2), 그리고 \\*별표\\* 와 <태그> & 기호.
이어지는 줄.

## 첫 소제목

:::figure src="https://pub.example.r2.dev/posts/a.webp" alt="대체 글"
caption: 캡션에 *기울임*.
credit: 촬영 자리표시
:::

:::figure ratio="1:1"
hint: 힌트에 "따옴표" & 기호 <x>
caption: 자리 캡션 **굵게는 글자만**
credit: 자리 크레딧
:::

:::figure
hint: 캡션 없는 자리
:::

> 첫 인용 단락
> 이어지는 줄.
>
> 둘째 단락에 [링크](/about).
> — 출처 *이름*, 소속

> 출처 없는 인용.

:::terms
용어 하나 :: 설명 **하나**
용어 둘 :: 설명 둘 :: 콜론 포함
:::

- 항목 하나
  이어지는 줄
- 항목 둘

- 빈 줄 뒤 항목

1. 번호 하나
2. 번호 둘

---

## 둘째 소제목

*가 **나** 다* 와 **[굵은 링크](https://example.com)** 끝.
`

async function parserTests() {
  await test('파서: 규격 예시 원고 → 기대 HTML', () => {
    assert.ok(SPEC_SOURCE, 'article-format.md 에서 원고 예시를 찾지 못했습니다')
    const r = parseManuscript(SPEC_SOURCE)
    assert.deepEqual(r.errors, [])
    assert.equal(r.html, SPEC_EXPECTED)
    assert.deepEqual(r.meta, {
      title: '첫 인양의 기록',
      slug: 'first-retrieval-log',
      excerpt: '한 줄 발췌문',
      series: 'sea-log',
      cover: './images/cover.jpg',
      next: 'why-the-sea',
      metaTitle: '선택',
      metaDescription: '선택',
    })
    assert.deepEqual(
      r.images.map((i) => [i.usage, i.path]),
      [
        ['cover', './images/cover.jpg'],
        ['figure', './images/deck.jpg'],
      ],
    )
    assert.equal(r.slots, 1)
  })

  await test('파서: 전체 문법 원고', () => {
    const r = parseManuscript(FULL_SOURCE)
    assert.deepEqual(r.errors, [])
    assert.equal(r.meta?.metaTitle, '제목: 콜론 포함')
    assert.equal(r.images.length, 0)
    assert.equal(r.slots, 2)
    const expected =
      '<p class="lead">첫 줄과 둘째 줄이 한 단락이 됩니다.</p>' +
      '<p><strong>굵게</strong>와 <em>기울임</em>, <a href="https://example.com/?a=1&amp;b=2">링크</a>, 그리고 *별표* 와 &lt;태그&gt; &amp; 기호. 이어지는 줄.</p>' +
      '<h3>첫 소제목</h3>' +
      '<figure data-block="figure"><img src="https://pub.example.r2.dev/posts/a.webp" alt="대체 글"><figcaption><span data-caption>캡션에 <em>기울임</em>.</span><span data-credit>촬영 자리표시</span></figcaption></figure>'
    assert.ok(r.html.startsWith(expected), r.html)
    assert.ok(r.html.includes('<figure data-block="figure" data-slot data-hint="힌트에 &quot;따옴표&quot; &amp; 기호 <x>" data-ratio="1:1" data-credit="자리 크레딧"><figcaption>자리 캡션 굵게는 글자만</figcaption></figure>'), r.html)
    assert.ok(r.html.includes('<figure data-block="figure" data-slot data-hint="캡션 없는 자리" data-ratio="4:5"></figure>'), r.html)
    assert.ok(r.html.includes('<blockquote><p>첫 인용 단락 이어지는 줄.</p><p>둘째 단락에 <a href="/about">링크</a>.</p><cite>출처 <em>이름</em>, 소속</cite></blockquote>'), r.html)
    assert.ok(r.html.includes('<blockquote><p>출처 없는 인용.</p></blockquote>'), r.html)
    assert.ok(r.html.includes('<dl data-block="terms"><div><dt>용어 하나</dt><dd>설명 <strong>하나</strong></dd></div><div><dt>용어 둘</dt><dd>설명 둘 :: 콜론 포함</dd></div></dl>'), r.html)
    assert.ok(r.html.includes('<ul><li><p>항목 하나 이어지는 줄</p></li><li><p>항목 둘</p></li><li><p>빈 줄 뒤 항목</p></li></ul>'), r.html)
    assert.ok(r.html.includes('<ol><li><p>번호 하나</p></li><li><p>번호 둘</p></li></ol><hr><h3>둘째 소제목</h3>'), r.html)
    assert.ok(r.html.endsWith('<p><em>가 </em><strong><em>나</em></strong><em> 다</em> 와 <a href="https://example.com"><strong>굵은 링크</strong></a> 끝.</p>'), r.html)
  })

  await test('파서: 인라인 이스케이프·표시 순서', () => {
    assert.equal(renderInline('a & b < c > d').html, 'a &amp; b &lt; c &gt; d')
    assert.equal(renderInline('**[a](https://x.com)**').html, '<a href="https://x.com"><strong>a</strong></a>')
    assert.equal(renderInline('5 * 3 = 15').html, '5 * 3 = 15')
    assert.equal(renderInline('닫히지 않은 **굵게').html, '닫히지 않은 **굵게')
    assert.equal(renderInline('[글](https://x.com "t")').text, '글')
  })

  const body = (text: string) => `${frontmatter()}\n:::lead\n리드.\n:::\n\n${text}\n`
  // frontmatter() 6줄, 빈 줄 1, 리드 3줄, 빈 줄 1 → 본문 추가분은 12행부터
  const L = 12

  await test('오류: 이미지 자리에 hint 없음', () => assertError(body(':::figure ratio="4:5"\ncaption: 캡션만\n:::'), L, 'hint'))
  await test('오류: 닫히지 않은 블록', () => assertError(body(':::terms\n용어 :: 설명'), L, '닫히지 않았습니다'))
  await test('오류: 프론트매터 없음', () => assertError(':::lead\n리드\n:::\n', 1, '프론트매터'))
  await test('오류: title 없음', () => assertError('---\nslug: a-b\n---\n\n본문.\n', 1, 'title'))
  await test('오류: slug 모양', () => assertError('---\ntitle: 가\nslug: 한글슬러그\n---\n\n본문.\n', 3, 'slug'))
  await test('오류: 알 수 없는 프론트매터 항목', () => assertError('---\ntitle: 가\nslug: a\nseires: sea-log\n---\n\n본문.\n', 4, '알 수 없는 항목'))
  await test('오류: 마크다운 이미지', () => assertError(body('![alt](./a.jpg)'), L, ':::figure'))
  await test('오류: # 제목·### 소제목', () => {
    assertError(body('# 제목'), L, '프론트매터 title')
    assertError(body('### 작은 제목'), L, '"## "')
  })
  await test('오류: 허용하지 않는 링크', () => assertError(body('[누르기](javascript:alert(1))'), L, '링크 주소'))
  await test('오류: 리드 2개·리드가 첫 블록 아님', () => {
    assertError(body(':::lead\n둘째 리드\n:::'), L, '글당 1개')
    assertError(`${frontmatter()}\n문단 먼저.\n\n:::lead\n리드.\n:::\n`, 10, '첫 블록')
  })
  await test('오류: 용어 줄 모양', () => assertError(body(':::terms\n설명 없는 용어\n:::'), L + 1, '용어 :: 설명'))
  await test('오류: 중첩 목록', () => assertError(body('- 바깥\n  - 안쪽'), L + 1, '중첩 목록'))
  await test('오류: 알 수 없는 ::: 블록·표', () => {
    assertError(body(':::note\n메모\n:::'), L, '알 수 없는 블록')
    assert.equal(errorsOf(body(':::note\n메모\n:::')).length, 1, '안쪽 줄·닫는 줄로 오류가 더 나면 안 됩니다')
    assertError(body(':::'), L, '여는 줄 없이')
    assertError(body('| a | b |'), L, '표')
  })
  await test('오류: figure 속성·줄', () => {
    assertError(body(':::figure src=./a.jpg\n:::'), L, '속성')
    assertError(body(':::figure ratio="4:5"\nhint: 자리\ntitle: 잘못된 줄\n:::'), L + 2, 'caption:')
    assertError(body(':::figure ratio="45"\nhint: 자리\n:::'), L, 'ratio')
  })
  await test('오류는 모두 모아서 줄 순서로', () => {
    const errors = errorsOf(body('# 제목\n\n![x](y)\n\n:::figure\n:::'))
    assert.deepEqual(
      errors.map((e) => e.line),
      [L, L + 2, L + 4],
    )
  })
  await test('로컬 이미지 경로 목록', () => {
    const r = parseManuscript(
      `${frontmatter('cover: ./img/cover.jpg\n')}\n:::figure src="./img/a.jpg"\n:::\n\n:::figure src="https://x.r2.dev/b.webp"\n:::\n\n:::figure src="img/c.png"\ncaption: 셋째\n:::\n`,
    )
    assert.deepEqual(r.errors, [])
    assert.deepEqual(
      r.images.map((i) => `${i.usage}:${i.path}@${i.line}`),
      ['cover:./img/cover.jpg@6', 'figure:./img/a.jpg@9', 'figure:img/c.png@15'],
    )
  })
}

// ── 2) 에디터 왕복 ──

async function roundTripTests() {
  for (const [name, source] of [
    ['규격 예시', SPEC_SOURCE],
    ['전체 문법', FULL_SOURCE],
  ] as const) {
    await test(`왕복: ${name} 원고 → 에디터 → 저장 HTML 이 글자 그대로`, () => {
      const html = parseManuscript(source).html
      const once = roundTrip(html)
      assert.equal(once, html)
      assert.ok(isDeepStrictEqual(parseArticleHtml(once), parseArticleHtml(html)), '공개 렌더러 구조가 달라졌습니다')
    })
  }
}

// ── 3) 라우트 로직 ──

const NOW = new Date('2026-09-25T10:00:00.000Z')
const R2 = 'https://pub.example.r2.dev'
const TINY_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')

interface FakeState {
  posts: ExistingPost[]
  inserted: DraftRow[]
  updated: { id: string; row: DraftRow; guard: { expectedUpdatedAt: string | null } }[]
  uploads: { folder: string; name: string }[]
  deleted: string[]
  translations: number
}

function fakeDeps(
  posts: ExistingPost[],
  overrides: Partial<DraftDeps> = {},
): { deps: DraftDeps; state: FakeState } {
  const state: FakeState = { posts, inserted: [], updated: [], uploads: [], deleted: [], translations: 0 }
  const deps: DraftDeps = {
    findPostBySlug: async (slug) => state.posts.find((p) => p.slug === slug) ?? null,
    findCategoryBySlug: async (slug) => (slug === 'sea-log' ? { id: 'cat-sea' } : null),
    uploadImage: async (_data, { folder, name }) => {
      state.uploads.push({ folder, name })
      return `${R2}/${folder}/${state.uploads.length}-${name.replace(/\.[^.]+$/, '')}.webp`
    },
    deleteImage: async (url) => {
      state.deleted.push(url)
    },
    translate: async (input) => {
      state.translations++
      return {
        ok: true,
        content: {
          title_en: `EN ${input.title}`,
          excerpt_en: 'EN excerpt',
          content_en: '<p>EN</p>',
          meta_title_en: null,
          meta_description_en: null,
        },
      }
    },
    insertDraft: async (row) => {
      state.inserted.push(row)
      return { id: 'new-id' }
    },
    updateDraft: async (id, row, guard) => {
      state.updated.push({ id, row, guard })
      return { id }
    },
    revalidate: () => {},
    now: () => NOW,
    ...overrides,
  }
  return { deps, state }
}

const MANUSCRIPT = `---
title: 초안 테스트
slug: draft-test
excerpt: 발췌
series: sea-log
cover: ./img/cover.jpg
next: older-post
---

:::lead
리드.
:::

## 소제목

:::figure src="./img/a.jpg"
caption: 그림.
:::

:::figure
hint: 비어 있는 자리
:::
`

function request(overrides: { manuscript?: string; images?: Record<string, Buffer>; force?: boolean } = {}) {
  const images = overrides.images ?? { './img/cover.jpg': TINY_PNG, './img/a.jpg': TINY_PNG }
  return {
    manuscript: overrides.manuscript ?? MANUSCRIPT,
    images: new Map(Object.entries(images)),
    force: overrides.force ?? false,
  }
}

const OLDER: ExistingPost = {
  id: 'older-id',
  slug: 'older-post',
  status: 'published',
  draft_source: null,
  draft_uploaded_at: null,
  updated_at: '2026-01-01T00:00:00.000Z',
  deleted_at: null,
}

function claudeDraft(minutesAfterUpload: number): ExistingPost {
  const uploaded = new Date('2026-09-20T09:00:00.000Z')
  return {
    id: 'draft-id',
    slug: 'draft-test',
    status: 'draft',
    draft_source: 'claude',
    draft_uploaded_at: uploaded.toISOString(),
    updated_at: new Date(uploaded.getTime() + minutesAfterUpload * 60_000 + 150).toISOString(),
    deleted_at: null,
  }
}

async function serviceTests() {
  const origin = 'https://blog.example.com'

  await test('라우트: 신규 초안 생성', async () => {
    const { deps, state } = fakeDeps([OLDER])
    const res = await processDraft(request(), deps, origin)
    assert.equal(res.status, 201, JSON.stringify(res.body))
    if (!res.body.ok) throw new Error('실패 응답')
    assert.equal(res.body.action, 'created')
    assert.equal(res.body.previewUrl, `${origin}/admin/posts/new-id/preview`)
    assert.equal(res.body.editUrl, `${origin}/admin/posts/new-id/edit`)
    assert.equal(res.body.emptySlots, 1)
    assert.equal(res.body.uploadedImages, 2)
    assert.deepEqual(state.uploads, [
      { folder: 'covers', name: 'cover.jpg' },
      { folder: 'posts', name: 'a.jpg' },
    ])
    const row = state.inserted[0]
    assert.equal(row.status, 'draft')
    assert.equal(row.published_at, null)
    assert.equal(row.draft_source, 'claude')
    assert.equal(row.draft_uploaded_at, NOW.toISOString())
    assert.equal(row.category_id, 'cat-sea')
    assert.equal(row.next_post_id, 'older-id')
    assert.equal(row.cover_image_url, `${R2}/covers/1-cover.webp`)
    assert.ok(row.content.html.includes(`<img src="${R2}/posts/2-a.webp" alt="그림.">`), row.content.html)
    assert.ok(!row.content.html.includes('./img/'), '로컬 경로가 남았습니다')
    assert.equal(row.reading_time_minutes, 1)
    assert.equal(row.title_en, 'EN 초안 테스트')
    assert.deepEqual(row.content_en, { html: '<p>EN</p>' })
  })

  await test('라우트: Claude 초안 갱신 (관리자 수정 없음)', async () => {
    const existing = claudeDraft(0)
    const { deps, state } = fakeDeps([OLDER, existing])
    const res = await processDraft(request(), deps, origin)
    assert.equal(res.status, 200, JSON.stringify(res.body))
    assert.equal(state.inserted.length, 0)
    assert.equal(state.updated[0].id, 'draft-id')
    assert.equal(state.updated[0].guard.expectedUpdatedAt, existing.updated_at)
    assert.equal(state.updated[0].row.draft_source, 'claude')
  })

  await test('라우트: 발행 글 slug → 409 (업로드·번역 없음)', async () => {
    const { deps, state } = fakeDeps([OLDER, { ...claudeDraft(0), status: 'published' }])
    const res = await processDraft(request(), deps, origin)
    assert.equal(res.status, 409)
    assert.equal(!res.body.ok && res.body.reason, 'published')
    assert.equal(state.uploads.length + state.translations + state.updated.length, 0)
  })

  await test('라우트: 관리자가 만든 초안 slug → 409', async () => {
    const { deps, state } = fakeDeps([OLDER, { ...claudeDraft(0), draft_source: null }])
    const res = await processDraft(request(), deps, origin)
    assert.equal(res.status, 409)
    assert.equal(!res.body.ok && res.body.reason, 'admin-draft')
    assert.equal(state.updated.length, 0)
  })

  await test('라우트: 지운 글 slug → 409', async () => {
    const { deps } = fakeDeps([OLDER, { ...claudeDraft(0), deleted_at: '2026-09-21T00:00:00Z' }])
    const res = await processDraft(request(), deps, origin)
    assert.equal(res.status, 409)
    assert.equal(!res.body.ok && res.body.reason, 'deleted')
  })

  await test('라우트: 관리자 수정 후 → 409, 오차 범위 안은 통과', async () => {
    const { deps, state } = fakeDeps([OLDER, claudeDraft(30)])
    const res = await processDraft(request(), deps, origin)
    assert.equal(res.status, 409)
    assert.equal(!res.body.ok && res.body.reason, 'edited')
    assert.equal(state.uploads.length + state.translations, 0)

    const withinTolerance = claudeDraft(0)
    withinTolerance.updated_at = new Date(Date.parse(withinTolerance.draft_uploaded_at!) + EDIT_TOLERANCE_MS - 1).toISOString()
    const second = fakeDeps([OLDER, withinTolerance])
    assert.equal((await processDraft(request(), second.deps, origin)).status, 200)
  })

  await test('라우트: 관리자 수정 후 force → 덮어쓰기 (updated_at 조건 없이)', async () => {
    const { deps, state } = fakeDeps([OLDER, claudeDraft(30)])
    const res = await processDraft(request({ force: true }), deps, origin)
    assert.equal(res.status, 200, JSON.stringify(res.body))
    assert.equal(state.updated[0].guard.expectedUpdatedAt, null)
  })

  await test('라우트: force여도 발행 글은 거부', async () => {
    const { deps } = fakeDeps([OLDER, { ...claudeDraft(30), status: 'published' }])
    assert.equal((await processDraft(request({ force: true }), deps, origin)).status, 409)
  })

  await test('라우트: 저장 순간 조건 불일치 → 409 + 올린 이미지 정리', async () => {
    const { deps, state } = fakeDeps([OLDER, claudeDraft(0)], { updateDraft: async () => null })
    const res = await processDraft(request(), deps, origin)
    assert.equal(res.status, 409)
    assert.equal(!res.body.ok && res.body.reason, 'changed-during-upload')
    assert.equal(state.deleted.length, 2)
  })

  await test('라우트: 번역 실패 — 갱신이면 기존 영문 유지, 경고', async () => {
    const { deps, state } = fakeDeps([OLDER, claudeDraft(0)], {
      translate: async () => ({
        ok: false,
        error: '번역 실패.',
        content: { title_en: null, excerpt_en: null, content_en: null, meta_title_en: null, meta_description_en: null },
      }),
    })
    const res = await processDraft(request(), deps, origin)
    assert.equal(res.status, 200)
    assert.ok(res.body.ok && res.body.translation === 'failed')
    assert.ok(!('title_en' in state.updated[0].row), '영문 필드를 덮어쓰면 안 됩니다')
    assert.ok(res.body.ok && res.body.warnings.some((x) => x.includes('기존 영문은 그대로')))
  })

  await test('라우트: 원고 오류 → 422 + 줄 번호', async () => {
    const { deps } = fakeDeps([])
    const res = await processDraft(request({ manuscript: MANUSCRIPT.replace('hint: 비어 있는 자리\n', '') }), deps, origin)
    assert.equal(res.status, 422)
    assert.ok(!res.body.ok && res.body.issues?.some((i) => i.line === 20 && i.message.includes('hint')), JSON.stringify(res.body))
  })

  await test('라우트: 이미지 누락·연재 없음·다음 기록 없음 → 422', async () => {
    const a = fakeDeps([OLDER])
    assert.equal((await processDraft(request({ images: { './img/a.jpg': TINY_PNG } }), a.deps, origin)).status, 422)
    const b = fakeDeps([OLDER])
    assert.equal((await processDraft(request({ manuscript: MANUSCRIPT.replace('series: sea-log', 'series: nope') }), b.deps, origin)).status, 422)
    const c = fakeDeps([])
    assert.equal((await processDraft(request(), c.deps, origin)).status, 422)
    assert.equal(a.state.uploads.length + b.state.uploads.length + c.state.uploads.length, 0)
  })

  await test('라우트: 005 마이그레이션 없음 → 503', async () => {
    const { deps } = fakeDeps([], {
      findPostBySlug: async () => {
        throw new DraftSetupError('005 없음')
      },
    })
    assert.equal((await processDraft(request(), deps, origin)).status, 503)
  })

  await test('라우트: 이미지 업로드 실패 → 422 + 앞서 올린 것 정리', async () => {
    let n = 0
    const { deps, state } = fakeDeps([OLDER], {
      uploadImage: async () => {
        if (++n === 2) throw new Error('이미지 파일이 아닙니다.')
        return `${R2}/covers/x.webp`
      },
    })
    const res = await processDraft(request(), deps, origin)
    assert.equal(res.status, 422)
    assert.deepEqual(state.deleted, [`${R2}/covers/x.webp`])
    assert.equal(state.inserted.length, 0)
  })

  await test('요청 검사: 모양·base64·크기·개수', () => {
    assert.equal(parseDraftRequest(null).ok, false)
    assert.equal(parseDraftRequest({ manuscript: '' }).ok, false)
    assert.equal(parseDraftRequest({ manuscript: 'x', force: 'yes' }).ok, false)
    assert.equal(parseDraftRequest({ manuscript: 'x', images: [{ path: 'a', data: '***' }] }).ok, false)
    const big = Buffer.alloc(3_000_000).toString('base64')
    const r = parseDraftRequest({ manuscript: 'x', images: [{ path: 'a', data: big }] })
    assert.ok(!r.ok && r.response.status === 413)
    const many = Array.from({ length: 21 }, (_, k) => ({ path: `${k}`, data: 'AA==' }))
    assert.equal(parseDraftRequest({ manuscript: 'x', images: many }).ok, false)
    const ok = parseDraftRequest({ manuscript: 'x', images: [{ path: './a.jpg', data: `data:image/png;base64,${TINY_PNG.toString('base64')}` }], force: true })
    assert.ok(ok.ok && ok.request.force && ok.request.images.get('./a.jpg')?.equals(TINY_PNG))
  })
}

// ── 4) 토큰·레이트 제한 ──

async function guardTests() {
  const secret = 'x'.repeat(40)
  await test('토큰: 미설정·짧음 → unconfigured', () => {
    assert.equal(checkDraftToken(`Bearer ${secret}`, undefined), 'unconfigured')
    assert.equal(checkDraftToken('Bearer short', 'short'), 'unconfigured')
    assert.equal(checkDraftToken(`Bearer ${'y'.repeat(31)}`, 'y'.repeat(31)), 'unconfigured')
  })
  await test('토큰: 일치·불일치·헤더 없음', () => {
    assert.equal(checkDraftToken(`Bearer ${secret}`, secret), 'ok')
    assert.equal(checkDraftToken(`bearer ${secret}`, `${secret}\n`), 'ok')
    assert.equal(checkDraftToken(`Bearer ${secret}z`, secret), 'unauthorized')
    assert.equal(checkDraftToken(secret, secret), 'unauthorized')
    assert.equal(checkDraftToken(null, secret), 'unauthorized')
  })
  await test('레이트 제한: 창 안 한도 초과 → 거부, 창 지나면 회복', () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 })
    assert.equal(limiter.take('ip', 0).ok, true)
    assert.equal(limiter.take('ip', 10).ok, true)
    const third = limiter.take('ip', 20)
    assert.ok(!third.ok && third.retryAfterSec === 1)
    assert.equal(limiter.take('other', 20).ok, true)
    assert.equal(limiter.take('ip', 1001).ok, true)
  })
}

async function main() {
  await parserTests()
  await roundTripTests()
  await serviceTests()
  await guardTests()
  let failed = 0
  for (const r of results) {
    if (!r.ok) failed++
    console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.error ? `\n      ${r.error}` : ''}`)
  }
  console.log(`\n${results.length - failed}/${results.length} 통과`)
  await window.happyDOM.close()
  process.exit(failed ? 1 : 0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
