/*
 * 뉴스레터 메일 HTML — 기록 기반(Paper IOR-0 미리보기).
 * 공개 화면 팔레트(sand #E8E5E1 · earth #312E2A · amber #A8874F · void #0A0908). 편지체가 아니라 일반 뉴스레터 톤.
 * 메일 클라이언트용이라 표 레이아웃 + 인라인 스타일만 쓰고, 웹폰트 대신 시스템 서체로 떨어뜨린다.
 * 관리자 미리보기(브라우저)와 발송 라우트(서버)가 같은 함수를 쓴다 — 순수 함수.
 * 수신자별 해지 링크는 {{unsubscribe_url}} 자리표시로 두고 발송 때 서명 링크로 바꾼다.
 */

export const UNSUBSCRIBE_PLACEHOLDER = '{{unsubscribe_url}}'
export const SITE_URL = 'https://blog.musedemaree.com'

export interface NewsletterRecord {
  slug: string
  number: number | null
  title: string
  excerpt: string | null
  cover: string | null
  seriesName: string | null
}

export interface NewsletterContent {
  subject: string
  /** 여는 말. 비우면 기록이 하나일 때 그 발췌문을 쓴다 */
  intro: string
  records: NewsletterRecord[]
}

const SERIF = "'Noto Serif KR', 'AppleMyungjo', 'Nanum Myeongjo', Georgia, serif"
const SANS = "'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', Arial, sans-serif"
const MONO = "'IBM Plex Mono', Menlo, Consolas, monospace"
const GARAMOND = "'Cormorant Garamond', Garamond, Georgia, serif"

function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function nl2br(value: string): string {
  return esc(value).replace(/\n/g, '<br>')
}

function recordNo(n: number | null): string {
  return n ? String(n).padStart(3, '0') : ''
}

export function resolvedIntro(content: NewsletterContent): string {
  if (content.intro.trim()) return content.intro.trim()
  return content.records.length === 1 ? (content.records[0].excerpt ?? '') : ''
}

function recordBlock(record: NewsletterRecord, showExcerpt: boolean): string {
  const url = `${SITE_URL}/post/${encodeURIComponent(record.slug)}`
  const kicker = [record.number ? `N° ${recordNo(record.number)}` : '', record.seriesName ?? ''].filter(Boolean).join(' · ')
  return `
    ${
      record.cover
        ? `<tr><td style="padding:0 0 22px;"><a href="${esc(url)}" style="text-decoration:none;"><img src="${esc(record.cover)}" alt="" width="552" style="display:block;width:100%;max-width:552px;height:auto;border:0;"></a></td></tr>`
        : ''
    }
    ${kicker ? `<tr><td style="padding:0 0 8px;font-family:${MONO};font-size:11px;letter-spacing:0.12em;line-height:14px;color:#A8874F;">${esc(kicker)}</td></tr>` : ''}
    <tr><td style="padding:0 0 ${showExcerpt && record.excerpt ? '12px' : '22px'};font-family:${SERIF};font-size:26px;font-weight:300;line-height:34px;color:#312E2A;">
      <a href="${esc(url)}" style="color:#312E2A;text-decoration:none;">${esc(record.title)}</a>
    </td></tr>
    ${
      showExcerpt && record.excerpt
        ? `<tr><td style="padding:0 0 22px;font-family:${SANS};font-size:14.5px;font-weight:300;line-height:25px;color:#55504A;">${nl2br(record.excerpt)}</td></tr>`
        : ''
    }
    <tr><td style="padding:0 0 36px;">
      <a href="${esc(url)}" style="display:inline-block;background:#0A0908;color:#F1EFEB;font-family:${SANS};font-size:13.5px;line-height:18px;padding:13px 22px;text-decoration:none;">기록 읽기 &rsaquo;</a>
    </td></tr>`
}

export function renderNewsletterHtml(content: NewsletterContent): string {
  const intro = resolvedIntro(content)
  // 기록이 여럿이면 기록마다 발췌를 붙이고, 하나면 발췌가 여는 말 자리로 올라가 있으니 되풀이하지 않는다
  const showExcerpts = content.records.length > 1
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${esc(content.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#E8E5E1;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#E8E5E1;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#E8E5E1;">
      <tr><td style="padding:0 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:12px 0 18px;border-bottom:1px solid rgba(49,46,42,0.2);font-family:${GARAMOND};font-style:italic;font-size:19px;line-height:24px;color:#312E2A;">Le Journal de Marée</td>
            <td align="right" style="padding:12px 0 18px;border-bottom:1px solid rgba(49,46,42,0.2);font-family:${MONO};font-size:10px;letter-spacing:0.14em;line-height:12px;color:#8C857B;">NEWSLETTER</td>
          </tr>
        </table>
      </td></tr>
      ${
        intro
          ? `<tr><td style="padding:24px 24px 0;font-family:${SANS};font-size:14.5px;font-weight:300;line-height:25px;color:#312E2A;">${nl2br(intro)}</td></tr>`
          : ''
      }
      <tr><td style="padding:24px 24px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${content.records.map((r) => recordBlock(r, showExcerpts)).join('')}
        </table>
      </td></tr>
      <tr><td style="padding:0 24px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="padding:18px 0 0;border-top:1px solid rgba(49,46,42,0.2);font-family:${SANS};font-size:11.5px;font-weight:300;line-height:19px;color:#8C857B;">
            뮤즈드마레 · <a href="${SITE_URL}" style="color:#8C857B;text-decoration:none;">blog.musedemaree.com</a><br>
            메일 하단의 링크로 언제든 구독을 해지할 수 있습니다. <a href="${UNSUBSCRIBE_PLACEHOLDER}" style="color:#6E675D;text-decoration:underline;">구독 해지</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

export function renderNewsletterText(content: NewsletterContent): string {
  const intro = resolvedIntro(content)
  const lines = ['Le Journal de Marée — NEWSLETTER', '']
  if (intro) lines.push(intro, '')
  for (const r of content.records) {
    const kicker = [r.number ? `N° ${recordNo(r.number)}` : '', r.seriesName ?? ''].filter(Boolean).join(' · ')
    if (kicker) lines.push(kicker)
    lines.push(r.title)
    if (content.records.length > 1 && r.excerpt) lines.push(r.excerpt)
    lines.push(`기록 읽기: ${SITE_URL}/post/${r.slug}`, '')
  }
  lines.push('뮤즈드마레 · blog.musedemaree.com', `구독 해지: ${UNSUBSCRIBE_PLACEHOLDER}`)
  return lines.join('\n')
}
