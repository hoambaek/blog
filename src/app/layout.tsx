import type { Metadata } from "next";
import { Playfair_Display, Noto_Sans_KR } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { I18nProvider } from "@/lib/i18n";
import { WebsiteJsonLd, OrganizationJsonLd } from "@/components/seo/JsonLd";
import "./globals.css";

// Display font for headings
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

// Noto Sans KR for Korean body text (supports 100-900 weights)
const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Le Journal de Marée | 뮤즈드마레",
    template: "%s | Le Journal de Marée",
  },
  description: "심연의 시간이 조각한 바다의 수공예품. 해저숙성 샴페인 뮤즈드마레의 이야기를 담은 저널입니다.",
  keywords: ["뮤즈드마레", "해저숙성", "샴페인", "럭셔리", "와인", "Muse de Marée"],
  authors: [{ name: "Muse de Marée" }],
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
    <ClerkProvider>
      <html lang="ko" suppressHydrationWarning>
        <body
          className={`${playfair.variable} ${notoSansKR.variable} font-sans antialiased`}
        >
          <WebsiteJsonLd />
          <OrganizationJsonLd />
          <I18nProvider>
            {children}
          </I18nProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
