/** 메인 사이트(브랜드 홈) 절대 주소 — 메뉴 오버레이·푸터 링크 */
export const MAIN_SITE = 'https://www.musedemaree.com'
export const PRIVACY_URL = `${MAIN_SITE}/privacy`
export const TERMS_URL = `${MAIN_SITE}/terms`

/** 메인 사이트 메뉴와 같은 8항목 (landing Header MAIN_LINKS) — 08 Journal이 이 블로그 */
export const MAIN_MENU = [
  { anchor: '#void', label: 'Home' },
  { anchor: '#data-archive', label: 'Ocean Cellar™' },
  { anchor: '#the-first-record', label: 'First Record' },
  { anchor: '#archive', label: 'Collection' },
  { anchor: '#the-maker', label: 'The Maker' },
  { anchor: '#ocean-circle', label: 'Ocean Cellar Privé' },
  { anchor: '#professionals', label: 'Partnership' },
] as const

/** 메인 사이트 언어별 홈 경로 (landing localePrefixMap) */
export function mainSiteHref(locale: 'ko' | 'en', anchor: string): string {
  return `${MAIN_SITE}${locale === 'en' ? '/en' : '/'}${anchor}`
}
