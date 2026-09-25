/*
 * Claude 초안 업로드 CLI — `npm run draft -- <원고.md> [--dry-run] [--force] [--target=prod|local] [--port=3000]`
 *
 * 원고(docs/content/article-format.md 2절 문법)와 원고가 가리키는 로컬 이미지(원고 파일 기준 상대경로)를 읽어
 * POST /api/drafts 로 보낸다. 서버가 파싱·이미지 R2 업로드·영문 번역·초안 저장을 한다. 발행은 하지 않는다.
 *
 *   --dry-run      서버에 보내지 않고 파싱 결과(블록 요약·이미지 목록·경고)만 출력
 *   --force        관리자에서 고친 초안이라도 원고로 덮어쓴다
 *   --target=prod  https://blog.musedemaree.com (기본)
 *   --target=local http://localhost:<--port, 기본 3000>
 *
 * 토큰: 환경변수 BLOG_DRAFT_TOKEN. 없으면 .env.local 에서 읽는다.
 * `npm run draft 파일 --dry-run` 처럼 `--` 없이 써도 된다(npm이 플래그를 npm_config_* 로 넘기는 것을 같이 읽는다).
 */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'
import sharp from 'sharp'
import { describeBlock, parseManuscript } from '../src/lib/manuscript/parse'

const PROD_URL = 'https://blog.musedemaree.com'
/** 서버 한도(src/lib/drafts/service.ts DRAFT_LIMITS)와 맞춘다 */
const MAX_BODY_BYTES = 4_000_000
const MAX_IMAGE_BYTES = 2_900_000
/** 이 크기를 넘는 사진은 보내기 전에 줄인다(긴 변 2400px, WebP 90). 서버가 한 번 더 최적화한다 */
const SHRINK_OVER_BYTES = 2_000_000

interface Options {
  file: string
  dryRun: boolean
  force: boolean
  target: 'prod' | 'local'
  port: number
}

function fail(message: string): never {
  console.error(`✗ ${message}`)
  process.exit(1)
}

function parseArgs(argv: string[]): Options {
  const env = process.env
  const flags = new Map<string, string | true>()
  const positional: string[] = []
  for (const arg of argv) {
    const m = arg.match(/^--([a-z-]+)(?:=(.*))?$/)
    if (m) flags.set(m[1], m[2] ?? true)
    else positional.push(arg)
  }
  const flag = (name: string, npmKey: string) => flags.get(name) ?? (env[`npm_config_${npmKey}`] || undefined)
  for (const name of flags.keys())
    if (!['dry-run', 'force', 'target', 'port'].includes(name)) fail(`알 수 없는 옵션 --${name}`)

  const target = String(flag('target', 'target') ?? 'prod')
  if (target !== 'prod' && target !== 'local') fail(`--target 은 prod 또는 local 입니다: ${target}`)
  const port = Number(flag('port', 'port') ?? 3000)
  if (!Number.isInteger(port) || port <= 0) fail(`--port 가 숫자가 아닙니다: ${flag('port', 'port')}`)
  const truthy = (v: string | true | undefined) => v === true || v === 'true' || v === ''
  if (positional.length !== 1) fail('원고 파일 하나를 주세요. 예) npm run draft -- docs/posts/글.md --dry-run')

  return {
    file: positional[0],
    dryRun: truthy(flag('dry-run', 'dry_run')),
    force: truthy(flag('force', 'force')),
    target,
    port,
  }
}

function loadToken(): string | undefined {
  if (!process.env.BLOG_DRAFT_TOKEN && existsSync('.env.local')) {
    try {
      process.loadEnvFile('.env.local')
    } catch (error) {
      console.warn(`! .env.local 을 읽지 못했습니다: ${(error as Error).message}`)
    }
  }
  return process.env.BLOG_DRAFT_TOKEN?.trim() || undefined
}

function kb(bytes: number): string {
  return bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1)}MB` : `${Math.round(bytes / 1e3)}KB`
}

async function readImage(path: string): Promise<{ data: Buffer; note: string }> {
  const original = readFileSync(path)
  if (original.length <= SHRINK_OVER_BYTES) return { data: original, note: kb(original.length) }
  const shrunk = await sharp(original)
    .rotate()
    .resize(2400, 2400, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 90 })
    .toBuffer()
  return { data: shrunk, note: `${kb(original.length)} → 전송용 ${kb(shrunk.length)}` }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const file = resolve(options.file)
  if (!existsSync(file)) fail(`파일이 없습니다: ${options.file}`)
  const source = readFileSync(file, 'utf8')
  const parsed = parseManuscript(source)
  const baseDir = dirname(file)

  if (parsed.errors.length) {
    console.error(`✗ 원고 오류 ${parsed.errors.length}건 (${options.file})`)
    for (const e of parsed.errors) console.error(`  ${e.line}행  ${e.message}`)
    process.exit(1)
  }
  const meta = parsed.meta!

  // 로컬 이미지 확인
  const paths = [...new Set(parsed.images.map((img) => img.path))]
  const missing: string[] = []
  for (const path of paths) {
    const full = isAbsolute(path) ? path : resolve(baseDir, path)
    if (!existsSync(full) || !statSync(full).isFile()) missing.push(path)
  }

  if (options.dryRun) {
    console.log(`원고   ${options.file}`)
    console.log(`제목   ${meta.title}`)
    console.log(`slug   ${meta.slug}`)
    console.log(`발췌   ${meta.excerpt ?? '(없음)'}`)
    console.log(`연재   ${meta.series ?? '(없음)'}   다음 기록 ${meta.next ?? '(발행일 순)'}   커버 ${meta.cover ?? '(없음)'}`)
    if (meta.metaTitle || meta.metaDescription) console.log(`SEO    ${meta.metaTitle ?? '-'} / ${meta.metaDescription ?? '-'}`)
    console.log(`\n블록 ${parsed.blocks.length}개`)
    parsed.blocks.forEach((b, k) => console.log(`  ${String(k + 1).padStart(2)}. ${String(b.line).padStart(4)}행  ${describeBlock(b)}`))
    console.log(`\n로컬 이미지 ${paths.length}개 · 비어 있는 이미지 자리 ${parsed.slots}개`)
    for (const img of parsed.images) {
      const full = isAbsolute(img.path) ? img.path : resolve(baseDir, img.path)
      const state = missing.includes(img.path) ? '✗ 파일 없음' : kb(statSync(full).size)
      console.log(`  ${img.usage === 'cover' ? '커버' : '본문'}  ${img.path}  (${img.line}행, ${state})`)
    }
    if (parsed.warnings.length) {
      console.log(`\n경고 ${parsed.warnings.length}건`)
      for (const w of parsed.warnings) console.log(`  ${w.line}행  ${w.message}`)
    }
    if (missing.length) fail(`없는 이미지 파일 ${missing.length}개 — 업로드하면 거부됩니다.`)
    console.log('\n✓ 파싱 통과 (--dry-run: 서버에 보내지 않았습니다)')
    return
  }

  if (missing.length) fail(`이미지 파일이 없습니다: ${missing.join(', ')}`)
  const token = loadToken()
  if (!token) fail('BLOG_DRAFT_TOKEN 이 없습니다 — .env.local 에 넣거나 환경변수로 주세요.')

  const images: { path: string; data: string }[] = []
  for (const path of paths) {
    const { data, note } = await readImage(isAbsolute(path) ? path : resolve(baseDir, path))
    if (data.length > MAX_IMAGE_BYTES) fail(`이미지가 너무 큽니다(${kb(data.length)}, 최대 ${kb(MAX_IMAGE_BYTES)}): ${path}`)
    console.log(`  이미지 ${path} (${note})`)
    images.push({ path, data: data.toString('base64') })
  }
  const body = JSON.stringify({ manuscript: source, images, force: options.force })
  if (Buffer.byteLength(body) > MAX_BODY_BYTES)
    fail(`요청이 ${kb(Buffer.byteLength(body))}로 한도(${kb(MAX_BODY_BYTES)})를 넘습니다. 사진 수를 줄이거나 일부를 이미지 자리로 두고 관리자에서 올리세요.`)

  const base = options.target === 'prod' ? PROD_URL : `http://localhost:${options.port}`
  console.log(`→ ${base}/api/drafts 로 보내는 중… (번역 때문에 1분 안팎 걸릴 수 있습니다)`)
  let res: Response
  try {
    res = await fetch(`${base}/api/drafts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body,
      signal: AbortSignal.timeout(310_000),
    })
  } catch (error) {
    fail(`서버에 닿지 못했습니다: ${(error as Error).message}`)
  }
  const text = await res.text()
  let result: Record<string, unknown>
  try {
    result = JSON.parse(text)
  } catch {
    fail(`서버 응답을 읽지 못했습니다 (HTTP ${res.status}): ${text.slice(0, 300)}`)
  }

  if (!res.ok || result.ok !== true) {
    console.error(`✗ 업로드 거부 (HTTP ${res.status}): ${String(result.error ?? '')}`)
    const issues = result.issues as { line: number; message: string }[] | undefined
    for (const e of issues ?? []) console.error(`  ${e.line}행  ${e.message}`)
    if (result.reason === 'edited') console.error('  → 관리자 수정을 버리고 덮어쓰려면: npm run draft -- <파일> --force')
    process.exit(1)
  }

  console.log(`✓ 초안 ${result.action === 'created' ? '생성' : '갱신'} — ${String(result.slug)}`)
  console.log(`  미리보기  ${String(result.previewUrl)}`)
  console.log(`  편집      ${String(result.editUrl)}`)
  console.log(`  비어 있는 이미지 자리 ${String(result.emptySlots)}개 · 올린 이미지 ${String(result.uploadedImages)}장 · 영문 번역 ${result.translation === 'ok' ? '완료' : '실패'}`)
  const warnings = (result.warnings as string[] | undefined) ?? []
  if (warnings.length) {
    console.log(`  경고 ${warnings.length}건`)
    for (const w of warnings) console.log(`   - ${w}`)
  }
}

main().catch((error) => fail((error as Error).stack ?? String(error)))
