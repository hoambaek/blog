import { Playfair_Display, Lora, Inter } from 'next/font/google'

/*
 * 관리자 화면 전용 옛 서체. 공개 화면(저널)은 새 서체 4종만 쓴다(src/app/layout.tsx).
 * 관리자 재디자인(다음 단계) 전까지 관리자 화면이 예전 모양 그대로 보이도록 여기서만 싣는다.
 */
const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
})

const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const legacyFontClassName = `${playfair.variable} ${lora.variable} ${inter.variable} font-sans`
