/*
 * 저널 날짜·번호 표기 — 서버와 브라우저가 같은 글자를 내도록 한국 시간(Asia/Seoul)으로 고정한다.
 * (브라우저 시간대로 찍으면 하이드레이션 때 날짜가 하루 어긋날 수 있다)
 */

const kstParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** ISO → 'YYYY-MM-DD' (한국 날짜) */
export function kstDate(iso: string): string {
  return kstParts.format(new Date(iso))
}

/** ISO → '2026.07.12' */
export function dateline(iso: string | null | undefined): string {
  if (!iso) return ''
  return kstDate(iso).replaceAll('-', '.')
}

/** 발행 연도 (한국 날짜 기준) */
export function kstYear(iso: string): string {
  return kstDate(iso).slice(0, 4)
}

/** 4 → '004' */
export function recordNo(n: number | null | undefined): string {
  return n ? String(n).padStart(3, '0') : ''
}

/** 1 → '01' */
export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}
