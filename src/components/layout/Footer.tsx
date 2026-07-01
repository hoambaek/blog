'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { NewsletterForm } from '@/components/NewsletterForm'

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
      { name: 'Instagram', href: 'https://instagram.com/musedemaree', external: true },
      { name: 'YouTube', href: 'https://youtube.com/@musedemaree', external: true },
    ],
  }

  return (
    <footer className="relative">
      {/* Newsletter Section - Subtle & Refined */}
      {!hideNewsletter && (
      <section className="bg-[#000000] text-white border-b border-white/[0.04]">
        <div className="container-narrow py-8 sm:py-10 md:py-14 px-5 sm:px-6">
          <div className="text-center max-w-lg mx-auto">
            {/* Minimal label */}
            <p className="text-[8px] sm:text-[9px] uppercase tracking-[0.3em] text-white/70 mb-2 sm:mb-4">
              Newsletter
            </p>

            {/* Subtle title */}
            <h2 className="font-display text-base sm:text-xl md:text-2xl text-white/70 mb-1.5 sm:mb-3 font-normal">
              {t.newsletter.title}
            </h2>

            {/* Muted description */}
            <p className="text-[11px] sm:text-sm text-white/30 mb-5 sm:mb-8 font-light leading-relaxed">
              {t.newsletter.description}
            </p>

            {/* Newsletter Form */}
            <NewsletterForm source="footer" variant="dark" />
          </div>
        </div>
      </section>
      )}

      {/* Main Footer - Compact on Mobile */}
      <section className="bg-[#000000] border-t border-white/[0.06]">
        <div className="container-wide py-8 sm:py-12 md:py-20 px-5 sm:px-6">
          {/* Mobile: Simple stacked layout */}
          <div className="md:hidden">
            {/* Brand */}
            <Link href="/" className="inline-block mb-5" aria-label="Muse de Marée">
              <Image
                src="/images/logo/logo_text_trans_W.png"
                alt="Muse de Marée"
                width={150}
                height={23}
                className="h-[20px] w-auto"
              />
            </Link>

            {/* Compact Link Grid - 3 columns on mobile */}
            <div className="grid grid-cols-3 gap-4 mb-6">
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
            <div className="h-px bg-white/[0.06] mb-4" />

            {/* Bottom - Compact */}
            <div className="flex justify-between items-center">
              <p className="text-[9px] text-white/25">
                © {currentYear} Muse de Marée
              </p>
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
            <div className="grid lg:grid-cols-12 gap-8 mb-16">
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
              </div>

              {/* Links Columns */}
              <div className="lg:col-span-8">
                <div className="grid grid-cols-3 gap-8">
                  {/* Journal */}
                  <div>
                    <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/80 mb-5">
                      {t.footer.journal}
                    </h4>
                    <ul className="space-y-3">
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
                    <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/80 mb-5">
                      {t.footer.info}
                    </h4>
                    <ul className="space-y-3">
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
                    <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/80 mb-5">
                      {t.footer.social}
                    </h4>
                    <ul className="space-y-3">
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
            <div className="h-px bg-white/[0.06] mb-8" />

            {/* Bottom Section */}
            <div className="flex justify-between items-center">
              <p className="text-xs text-white/30">
                © {currentYear} Muse de Marée. All rights reserved.
              </p>
              <div className="flex items-center gap-6">
                <a
                  href="https://musedemaree.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  {t.footer.home}
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
                <Link
                  href="/admin"
                  className="text-xs text-white/20 hover:text-white/40 transition-colors"
                >
                  Admin
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </footer>
  )
}
