import type { Metadata } from "next";
import { Playfair_Display, Nanum_Myeongjo, Nanum_Gothic } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { I18nProvider } from "@/lib/i18n";
import { WebsiteJsonLd, OrganizationJsonLd } from "@/components/seo/JsonLd";
import "./globals.css";

// Display font for headings (English)
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

// Nanum Myeongjo for Korean display/headings - elegant serif
const nanumMyeongjo = Nanum_Myeongjo({
  variable: "--font-nanum-myeongjo",
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  display: "swap",
  preload: false,
});

// Nanum Gothic for Korean body text
const nanumGothic = Nanum_Gothic({
  variable: "--font-nanum-gothic",
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "Le Journal de Marée | 뮤즈드마레",
    template: "%s | Le Journal de Marée",
  },
  description: "심연의 시간이 조각한 바다의 수공예품. 해저숙성 샴페인 뮤즈드마레의 이야기를 담은 저널입니다.",
  keywords: ["뮤즈드마레", "해저숙성", "샴페인", "럭셔리", "와인", "Muse de Marée"],
  authors: [{ name: "Muse de Marée" }],
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon-32x32.png',
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://journal.musedemaree.com",
    siteName: "Le Journal de Marée",
    title: "Le Journal de Marée | 뮤즈드마레",
    description: "심연의 시간이 조각한 바다의 수공예품",
  },
  alternates: {
    types: {
      'application/rss+xml': 'https://journal.musedemaree.com/feed.xml',
    },
  },
  other: {
    'llms.txt': 'https://journal.musedemaree.com/llms.txt',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://pub-e7d9b0569247435fa5adc92a77955acd.r2.dev" />
        <link rel="dns-prefetch" href="https://pub-e7d9b0569247435fa5adc92a77955acd.r2.dev" />
      </head>
      <body
        className={`${playfair.variable} ${nanumMyeongjo.variable} ${nanumGothic.variable} font-sans antialiased`}
      >
        <WebsiteJsonLd />
        <OrganizationJsonLd />
        <I18nProvider>
          {children}
        </I18nProvider>
        <Analytics />
      </body>
    </html>
  );
}
