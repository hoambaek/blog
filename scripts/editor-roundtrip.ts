/*
 * 에디터 왕복 테스트 — `npm run test:editor`
 *
 * HTML → 에디터 스키마(src/lib/editor/extensions.ts) → 저장 HTML(cleanArticleHtml) 을 거친 뒤,
 * 공개 렌더러 파서(parseArticleHtml)로 읽은 블록 구조가 원문과 같은지 확인한다.
 *   1) 규격 예시 HTML (docs/content/article-format.md 1절의 블록 전부)
 *   2) 규격 밖 요소가 섞인 예전 글 모양 (표·iframe·중첩 목록·div 없는 dt/dd·옛 figcaption 등)
 *   3) 운영 발행 글 전부의 현재 HTML (KO·EN) — anon 키 공개 REST로 읽기만 한다
 * 추가로 한 번 더 돌렸을 때 결과가 같은지(멱등)도 본다.
 *
 * 환경: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (.env.local에서 읽음). 없으면 3)을 건너뛴다.
 */
import { readFileSync, existsSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'
import { Window } from 'happy-dom'
import { Editor } from '@tiptap/core'
import { articleExtensions } from '../src/lib/editor/extensions'
import { cleanArticleHtml } from '../src/lib/editor/serialize'
import { parseArticleHtml } from '../src/lib/article/parse'

const window = new Window({ url: 'http://localhost/' })
// ProseMirror·Tiptap이 쓰는 DOM 전역만 happy-dom으로 채운다
const g = globalThis as unknown as Record<string, unknown>
const w = window as unknown as Record<string, unknown>
for (const key of ['document', 'Node', 'Element', 'HTMLElement', 'DocumentFragment', 'MutationObserver']) g[key] = w[key]
g.window = window
g.getComputedStyle = window.getComputedStyle.bind(window)
g.requestAnimationFrame = (cb: () => void) => setTimeout(cb, 0)
g.cancelAnimationFrame = (id: ReturnType<typeof setTimeout>) => clearTimeout(id)

function loadEnv() {
  const file = '.env.local'
  if (!existsSync(file)) return
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const SPEC_EXAMPLE = `
<p class="lead">와인을 바다에 두는 일은 <em>오래된</em> 상상처럼 들립니다.</p>
<p>일반 문단에 <a href="https://example.com">링크</a>와 <strong>강조</strong>가 있습니다.<br>줄바꿈 뒤 글.</p>
<h3>해저숙성은 어디에서 시작되었을까</h3>
<p>두 번째 문단.</p>
<figure data-block="figure"><img src="https://pub.example.r2.dev/posts/a.webp" alt="난파선"><figcaption><span data-caption>발트해 난파선 안에 남아 있던 <em>병들</em>.</span><span data-credit>Tomasz Stachura / Baltictech</span></figcaption></figure>
<figure data-block="figure" data-slot data-hint="인양 직후 갑판 위, 따개비가 붙은 병 한 병의 클로즈업" data-ratio="4:5"><figcaption>바다에서 막 올라온 병.</figcaption></figure>
<figure data-block="figure" data-slot data-hint="캡션 없는 자리"></figure>
<blockquote><p>인용문 본문.</p><p>둘째 줄.</p><cite>출처 이름, 소속</cite></blockquote>
<blockquote><p>출처 없는 인용.</p></blockquote>
<dl data-block="terms"><div><dt>일정한 저온</dt><dd>지상의 계절이 오르내리는 동안 좁은 폭 안에서 움직입니다.</dd></div><div><dt>빛의 차단</dt><dd>바다 밑에는 그 변수가 없습니다.</dd></div></dl>
<ul><li><p>목록 항목 하나</p></li><li><p>목록 항목 둘</p></li></ul>
<ol><li><p>번호 목록</p></li></ol>
<video src="https://pub.example.r2.dev/posts/v.mp4" controls="true" playsinline="true" preload="metadata"></video>
<hr>
<h3>둘째 소제목</h3>
<p>끝 문단 <sup>1</sup> <mark>표시</mark> <u>밑줄</u> <s>취소</s> <code>code</code>.</p>
`

const LEGACY_EXTRAS = `
<p>예전 글 문단<img class="max-w-full h-auto" src="https://pub.example.r2.dev/posts/inline.webp">이어지는 글</p>
<img src="https://pub.example.r2.dev/posts/top.webp">
<figure><img src="https://pub.example.r2.dev/posts/old.webp" alt=""><figcaption>옛 캡션 <span data-credit>옛 크레딧</span></figcaption></figure>
<h2>h2 소제목</h2>
<h4>작은 소제목</h4>
<table><tbody><tr><td>표</td><td>보존</td></tr></tbody></table>
<iframe src="https://www.youtube.com/embed/abc" width="560" height="315"></iframe>
<ul><li><p>바깥</p><ul><li><p>안쪽</p></li></ul></li><li>p 없는 li</li></ul>
<dl><dt>div 없는 용어</dt><dd>설명</dd></dl>
<blockquote>p 없는 인용<cite>출처</cite></blockquote>
<div><p>div에 감싼 문단</p></div>
<p><span style="color:red">span은 벗겨지고 글자는 남는다</span></p>
<p></p>
<p><em>Muse de Marée</em></p>
`

function roundTrip(html: string): string {
  const editor = new Editor({ extensions: articleExtensions(), content: html })
  const out = cleanArticleHtml(editor.getHTML())
  editor.destroy()
  return out
}

interface CaseResult {
  name: string
  blocks: number
  structureOk: boolean
  idempotent: boolean
  detail?: string
}

function summarize(blocks: ReturnType<typeof parseArticleHtml>): string {
  return blocks.map((b) => b.type).join(' ')
}

/*
 * 비교 전 공백만 정규화한다 — ProseMirror는 블록 가장자리 공백과 연속 공백을 접는다(화면에서도 보이지 않는 차이).
 * 글자·인라인 표시·블록 순서·속성은 그대로 비교한다.
 */
function normalizeWhitespace<T>(value: T): T {
  if (Array.isArray(value)) {
    const list = value.map((v) => normalizeWhitespace(v)) as unknown[]
    // 인라인 배열 가장자리 텍스트 공백 제거 + 빈 텍스트 노드 제거
    const isText = (n: unknown): n is { t: 'text'; v: string } =>
      typeof n === 'object' && n !== null && (n as { t?: string }).t === 'text'
    if (list.length && list.every((n) => typeof n === 'object' && n !== null && 't' in (n as object))) {
      const first = list[0]
      const last = list[list.length - 1]
      if (isText(first)) first.v = first.v.replace(/^\s+/, '')
      if (isText(last)) last.v = last.v.replace(/\s+$/, '')
      return list.filter((n) => !isText(n) || n.v !== '') as T
    }
    return list as T
  }
  if (typeof value === 'object' && value !== null) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = k === 'v' && typeof v === 'string' ? v.replace(/\s+/g, ' ') : normalizeWhitespace(v)
    }
    return out as T
  }
  return value
}

function runCase(name: string, html: string): CaseResult {
  const before = normalizeWhitespace(parseArticleHtml(html))
  const once = roundTrip(html)
  const after = normalizeWhitespace(parseArticleHtml(once))
  const twice = roundTrip(once)
  const structureOk = isDeepStrictEqual(before, after)
  let detail: string | undefined
  if (!structureOk) {
    const i = before.findIndex((b, k) => !isDeepStrictEqual(b, after[k]))
    detail =
      `블록 수 ${before.length} → ${after.length}\n` +
      `  원문: ${summarize(before)}\n  왕복: ${summarize(after)}\n` +
      (i >= 0 ? `  첫 차이 #${i}\n    원문 ${JSON.stringify(before[i])}\n    왕복 ${JSON.stringify(after[i])}` : '')
  }
  return { name, blocks: before.length, structureOk, idempotent: once === twice, detail }
}

async function fetchPublishedPosts(): Promise<{ slug: string; ko: string; en: string | null }[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []
  const res = await fetch(
    `${url}/rest/v1/posts?select=slug,content,content_en&status=eq.published&deleted_at=is.null&order=published_at.asc`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  )
  if (!res.ok) throw new Error(`운영 글 조회 실패: ${res.status}`)
  const rows = (await res.json()) as { slug: string; content: { html?: string } | null; content_en: { html?: string } | null }[]
  return rows.map((r) => ({ slug: r.slug, ko: r.content?.html ?? '', en: r.content_en?.html ?? null }))
}

async function main() {
  loadEnv()

  const results: CaseResult[] = [runCase('규격 예시', SPEC_EXAMPLE), runCase('예전 글·규격 밖 요소', LEGACY_EXTRAS)]

  let posts: Awaited<ReturnType<typeof fetchPublishedPosts>> = []
  try {
    posts = await fetchPublishedPosts()
    if (!posts.length) console.warn('! 운영 글을 읽지 못했거나 환경변수가 없어 운영 글 왕복은 건너뛰었습니다.')
  } catch (error) {
    console.warn(`! ${(error as Error).message} — 운영 글 왕복은 확인하지 못했습니다.`)
  }
  for (const post of posts) {
    results.push(runCase(`운영 ${post.slug} (KO)`, post.ko))
    if (post.en) results.push(runCase(`운영 ${post.slug} (EN)`, post.en))
  }

  let failed = 0
  for (const r of results) {
    const ok = r.structureOk && r.idempotent
    if (!ok) failed++
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.name} — 블록 ${r.blocks}개 · 구조 ${r.structureOk ? '같음' : '다름'} · 재왕복 ${r.idempotent ? '같음' : '다름'}`)
    if (r.detail) console.log(r.detail)
  }
  if (process.argv.includes('--show')) {
    console.log('\n── 규격 예시 왕복 결과 ──\n' + roundTrip(SPEC_EXAMPLE))
    console.log('\n── 예전 글 왕복 결과 ──\n' + roundTrip(LEGACY_EXTRAS))
  }
  console.log(`\n${results.length - failed}/${results.length} 통과`)
  await window.happyDOM.close()
  process.exit(failed ? 1 : 0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
