import type { Metadata, Viewport } from "next";
import {
  Playfair_Display,
  Lora,
  Inter,
  Noto_Serif_KR,
  Mrs_Saint_Delafield,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { I18nProvider } from "@/lib/i18n";
import { WebsiteJsonLd, OrganizationJsonLd } from "@/components/seo/JsonLd";
import "./globals.css";

// Display serif for headlines (Wired: WiredDisplay → Playfair Display)
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

// Humanist serif for long-form body (Wired: BreveText → Lora)
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

// Humanist sans for UI / nav / metadata / buttons (Wired: Apercu → Inter)
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Korean serif companion for display/body serif
const notoSerifKR = Noto_Serif_KR({
  variable: "--font-noto-serif-kr",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
});

// Handwritten signature script for brand motto (matches landing footer)
const mrsSaintDelafield = Mrs_Saint_Delafield({
  variable: "--font-motto",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

// 노치(safe area) 뒤까지 콘텐츠를 확장 — 상단 상태바 영역은 Header의 차폐 바가 칠한다 (랜딩과 동일 문법)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Muse de Marée | 바다가 쓴 시간",
    template: "%s | Muse de Marée",
  },
  description: "샴페인은 샹파뉴가 만들고, 그 시간은 한국 남해가 씁니다. 수심 30m에서 보낸 날들을 기록하는 뮤즈드마레의 저널.",
  keywords: ["뮤즈드마레", "Muse de Marée", "해저 숙성", "샴페인", "남해", "해양 숙성 와인", "기록"],
  authors: [{ name: "Muse de Marée" }],
  icons: {
    icon: [
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon-32x32.png',
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://blog.musedemaree.com",
    siteName: "Muse de Marée",
    title: "Muse de Marée | 바다가 쓴 시간",
    description: "샴페인은 샹파뉴가 만들고, 그 시간은 한국 남해가 씁니다. 수심 30m에서 보낸 날들을 기록하는 뮤즈드마레의 저널.",
  },
  alternates: {
    types: {
      'application/rss+xml': 'https://blog.musedemaree.com/feed.xml',
    },
  },
  other: {
    'llms.txt': 'https://blog.musedemaree.com/llms.txt',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID ?? "G-YVXMD6VF59";
  // 프로덕션 배포에서만 GA 작동 (preview·로컬 개발 트래픽 제외)
  const gaEnabled = process.env.VERCEL_ENV === "production" && !!gaId;
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://pub-e7d9b0569247435fa5adc92a77955acd.r2.dev" />
        <link rel="dns-prefetch" href="https://pub-e7d9b0569247435fa5adc92a77955acd.r2.dev" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body
        className={`${playfair.variable} ${lora.variable} ${inter.variable} ${notoSerifKR.variable} ${mrsSaintDelafield.variable} font-sans antialiased`}
      >
        <WebsiteJsonLd />
        <OrganizationJsonLd />
        <I18nProvider>
          {children}
        </I18nProvider>
        <Analytics />
        {gaEnabled && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
