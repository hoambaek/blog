'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { NewsletterForm } from '@/components/NewsletterForm'

export function Footer() {
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
      {/* Newsletter Section - Dark Elegant */}
      <section className="relative bg-[#0a0a0a] text-white overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-rose-gold/[0.03] blur-[100px] rounded-full" />

        <div className="container-narrow relative py-20 md:py-28">
          {/* Decorative Element */}
          <div className="flex items-center justify-center gap-6 mb-10">
            <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-white/20" />
            <div className="w-1.5 h-1.5 rotate-45 bg-rose-gold" />
            <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-white/20" />
          </div>

          {/* Content */}
          <div className="text-center">
            <p className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-rose-gold mb-6">
              Newsletter
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl mb-6">
              {t.newsletter.title}
            </h2>
            <p className="text-base md:text-lg text-white/50 mb-10 max-w-lg mx-auto font-light leading-relaxed">
              {t.newsletter.description}
            </p>

            {/* Newsletter Form */}
            <NewsletterForm source="footer" variant="dark" />
          </div>
        </div>

        {/* Corner Accents */}
        <div className="hidden md:block absolute top-12 left-10 w-16 h-16 border-l border-t border-white/[0.05]" />
        <div className="hidden md:block absolute top-12 right-10 w-16 h-16 border-r border-t border-white/[0.05]" />
      </section>

      {/* Main Footer */}
      <section className="bg-[#0a0a0a] border-t border-white/[0.06]">
        <div className="container-wide py-16 md:py-20">
          {/* Top Section - Brand + Links */}
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
            {/* Brand Column */}
            <div className="lg:col-span-4">
              <Link href="/" className="inline-block mb-6">
                <h3 className="font-display text-xl text-white tracking-tight">
                  LE JOURNAL DE MARÉE
                </h3>
              </Link>
              <p className="text-sm text-white/40 leading-relaxed max-w-xs mb-6">
                {t.footer.brandDescription}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-[1px] bg-gradient-to-r from-rose-gold/60 to-transparent" />
                <span className="text-rose-gold/60 text-[8px]">◆</span>
              </div>
            </div>

            {/* Links Columns */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {/* Journal */}
                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.3em] text-rose-gold/80 mb-5">
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
                  <h4 className="text-[10px] uppercase tracking-[0.3em] text-rose-gold/80 mb-5">
                    {t.footer.info}
                  </h4>
                  <ul className="space-y-3">
                    {footerLinks.about.map((link) => (
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

                {/* Social */}
                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.3em] text-rose-gold/80 mb-5">
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

                {/* Brand Quote */}
                <div className="hidden md:block">
                  <h4 className="text-[10px] uppercase tracking-[0.3em] text-rose-gold/80 mb-5">
                    {t.footer.brand}
                  </h4>
                  <blockquote className="text-sm text-white/40 italic leading-relaxed">
                    "심연의 시간이 조각한<br />바다의 수공예품"
                  </blockquote>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-rose-gold/40 text-[6px]">◆</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-white/30">
              © {currentYear} Muse de Marée. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
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
      </section>
    </footer>
  )
}
