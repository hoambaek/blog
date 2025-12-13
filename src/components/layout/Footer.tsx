'use client'

import Link from 'next/link'
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
    <footer className="border-t border-border bg-card">
      <div className="container-wide py-16">
        {/* Newsletter CTA */}
        <div className="text-center mb-16">
          <h3 className="font-display text-2xl md:text-3xl mb-4">
            {t.newsletter.title}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {t.newsletter.description}
          </p>
          <NewsletterForm source="footer" />
        </div>

        {/* Divider */}
        <div className="divider">
          <span className="text-rose-gold">◆</span>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h4 className="label-text mb-4">{t.footer.journal}</h4>
            <ul className="space-y-2">
              {footerLinks.journal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="label-text mb-4">{t.footer.info}</h4>
            <ul className="space-y-2">
              {footerLinks.about.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="label-text mb-4">{t.footer.social}</h4>
            <ul className="space-y-2">
              {footerLinks.social.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="label-text mb-4">{t.footer.brand}</h4>
            <p className="text-sm text-muted-foreground">
              {t.footer.brandDescription}
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Muse de Marée. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.footer.privacy}
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.footer.terms}
            </Link>
            <Link
              href="/admin"
              className="text-sm text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
