'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ArrowRight, Globe } from 'lucide-react'
import { useTranslation, useLocale, type Locale } from '@/lib/i18n'
import { NewsletterForm } from '@/components/NewsletterForm'

const footerLocaleNames: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
}

const INSTAGRAM_URL = 'https://www.instagram.com/muse_de_maree/'

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  )
}

function FooterLanguageToggle() {
  const { locale, setLocale } = useLocale()

  return (
    <div className="inline-flex items-center gap-2">
      <Globe className="w-3 h-3 text-white/50 shrink-0" strokeWidth={1.5} />
      {(Object.keys(footerLocaleNames) as Locale[]).map((loc, i) => (
        <span key={loc} className="flex items-center gap-2">
          {i > 0 && <span className="text-[10px] text-white/15">·</span>}
          <button
            onClick={() => setLocale(loc)}
            className={`text-[11px] tracking-wide transition-colors ${
              locale === loc
                ? 'text-white/80'
                : 'text-white/30 hover:text-white/60'
            }`}
            aria-label={`Switch language to ${footerLocaleNames[loc]}`}
            aria-current={locale === loc ? 'true' : undefined}
          >
            {footerLocaleNames[loc]}
          </button>
        </span>
      ))}
    </div>
  )
}

export function Footer() {
  const pathname = usePathname()
  const hideNewsletter = pathname === '/subscribe'
  const currentYear = new Date().getFullYear()
  const t = useTranslation()

  const footerLinks = {
    journal: [
      { name: t.nav.seaLog, href: '/category/sea-log' },
      { name: t.nav.maison, href: '/category/maison' },
      { name: t.nav.culture, href: '/category/culture' },
      { name: t.nav.table, href: '/category/table' },
      { name: t.nav.news, href: '/category/news' },
    ],
    about: [
      { name: t.footer.home, href: 'https://musedemaree.com/', external: true },
      { name: t.footer.aboutJournal, href: '/about' },
      { name: t.footer.newsletterSubscribe, href: '/subscribe' },
    ],
    social: [
      { name: 'Instagram', href: INSTAGRAM_URL, external: true },
      { name: 'YouTube', href: 'https://youtube.com/@musedemaree', external: true },
    ],
  }

  return (
    <footer className="relative">
      {/* Newsletter Section - Subtle & Refined */}
      {!hideNewsletter && (
      <section className="bg-[#000000] text-white border-b border-white/[0.04]">
        <div className="container-narrow py-5 sm:py-8 md:py-10 px-5 sm:px-6">
          <div className="text-center max-w-lg mx-auto">
            {/* Minimal label */}
            <p className="text-[8px] sm:text-[9px] uppercase tracking-[0.3em] text-white/70 mb-1.5 sm:mb-4">
              Newsletter
            </p>

            {/* Subtle title */}
            <h2 className="font-display text-base sm:text-xl md:text-2xl text-white/70 mb-1.5 sm:mb-3 font-normal">
              {t.newsletter.title}
            </h2>

            {/* Muted description */}
            <p className="text-[11px] sm:text-sm text-white/30 mb-3.5 sm:mb-6 font-light leading-relaxed">
              {t.newsletter.description}
            </p>

            {/* Newsletter Form */}
            <NewsletterForm source="footer" variant="dark" />
          </div>
        </div>
      </section>
      )}

      {/* Main Footer - Compact on Mobile. 하단 safe-area까지 검정으로 채워 홈 인디케이터 영역과 잇는다 */}
      <section
        className="bg-[#000000] border-t border-white/[0.06]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="container-wide py-5 sm:py-8 md:py-12 px-5 sm:px-6">
          {/* Mobile: Simple stacked layout */}
          <div className="md:hidden">
            {/* Brand */}
            <div className="flex items-center justify-between mb-5">
              <Link href="/" className="inline-block" aria-label="Muse de Marée">
                <Image
                  src="/images/logo/logo_text_trans_W.png"
                  alt="Muse de Marée"
                  width={150}
                  height={23}
                  className="h-[20px] w-auto"
                />
              </Link>
              <FooterLanguageToggle />
            </div>

            {/* Compact Link Grid - 3 columns on mobile */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              {/* Journal - only show 3 items */}
              <div>
                <h4 className="text-[8px] uppercase tracking-[0.2em] text-white/70 mb-2.5">
                  {t.footer.journal}
                </h4>
                <ul className="space-y-1.5">
                  {footerLinks.journal.slice(0, 3).map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-[11px] text-white/40 hover:text-white transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Info */}
              <div>
                <h4 className="text-[8px] uppercase tracking-[0.2em] text-white/70 mb-2.5">
                  {t.footer.info}
                </h4>
                <ul className="space-y-1.5">
                  {footerLinks.about.map((link) => (
                    <li key={link.href}>
                      {'external' in link && link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-white/40 hover:text-white transition-colors"
                        >
                          {link.name}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-[11px] text-white/40 hover:text-white transition-colors"
                        >
                          {link.name}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Social */}
              <div>
                <h4 className="text-[8px] uppercase tracking-[0.2em] text-white/70 mb-2.5">
                  {t.footer.social}
                </h4>
                <ul className="space-y-1.5">
                  {footerLinks.social.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-white/40 hover:text-white transition-colors"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.06] mb-3" />

            {/* Bottom - Compact */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <p className="text-[9px] text-white/25">
                  © {currentYear} Muse de Marée
                </p>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="text-white/25 hover:text-white/60 transition-colors"
                >
                  <InstagramIcon className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/privacy" className="text-[9px] text-white/25 hover:text-white/50 transition-colors">
                  {t.footer.privacy}
                </Link>
                <Link href="/terms" className="text-[9px] text-white/25 hover:text-white/50 transition-colors">
                  {t.footer.terms}
                </Link>
              </div>
            </div>
          </div>

          {/* Desktop: Full layout */}
          <div className="hidden md:block">
            {/* Top Section - Brand + Links */}
            <div className="grid lg:grid-cols-12 gap-8 mb-10">
              {/* Brand Column */}
              <div className="lg:col-span-4">
                <Link href="/" className="inline-block mb-6" aria-label="Muse de Marée">
                  <Image
                    src="/images/logo/logo_text_trans_W.png"
                    alt="Muse de Marée"
                    width={184}
                    height={28}
                    className="h-[26px] w-auto"
                  />
                </Link>
                <p className="text-sm text-white/40 leading-relaxed max-w-xs">
                  {t.footer.brandDescription}
                </p>
                <div className="mt-6">
                  <FooterLanguageToggle />
                </div>
              </div>

              {/* Links Columns */}
              <div className="lg:col-span-8">
                <div className="grid grid-cols-3 gap-8">
                  {/* Journal */}
                  <div>
                    <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/80 mb-4">
                      {t.footer.journal}
                    </h4>
                    <ul className="space-y-2">
                      {footerLinks.journal.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            className="group inline-flex items-center text-sm text-white/50 hover:text-white transition-colors"
                          >
                            <span>{link.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Info */}
                  <div>
                    <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/80 mb-4">
                      {t.footer.info}
                    </h4>
                    <ul className="space-y-2">
                      {footerLinks.about.map((link) => (
                        <li key={link.href}>
                          {'external' in link && link.external ? (
                            <a
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group inline-flex items-center text-sm text-white/50 hover:text-white transition-colors"
                            >
                              <span>{link.name}</span>
                            </a>
                          ) : (
                            <Link
                              href={link.href}
                              className="group inline-flex items-center text-sm text-white/50 hover:text-white transition-colors"
                            >
                              <span>{link.name}</span>
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Social */}
                  <div>
                    <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/80 mb-4">
                      {t.footer.social}
                    </h4>
                    <ul className="space-y-2">
                      {footerLinks.social.map((link) => (
                        <li key={link.href}>
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
                          >
                            <span>{link.name}</span>
                            <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.06] mb-6" />

            {/* Bottom Section */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <p className="text-xs text-white/30">
                  © {currentYear} Muse de Marée. All rights reserved.
                </p>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="text-white/30 hover:text-white/60 transition-colors"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>
              </div>
              <div className="flex items-center gap-6">
                <a
                  href="https://musedemaree.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  musedemaree.com
                </a>
                <Link
                  href="/privacy"
                  className="text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  {t.footer.privacy}
                </Link>
                <Link
                  href="/terms"
                  className="text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  {t.footer.terms}
                </Link>
                {/* 전체 페이지 로드로 진입해야 만료된 세션의 핸드셰이크 리다이렉트를 브라우저가 따라갈 수 있다 */}
                <a
                  href="/admin"
                  className="text-xs text-white/20 hover:text-white/40 transition-colors"
                >
                  Admin
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </footer>
  )
}
