'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { MAIN_SITE, PRIVACY_URL, TERMS_URL } from '@/lib/journal/links'

/** 저널 푸터 — Paper 'Footer' (워드마크 · 링크 4개 · Written by the Sea.) */
export function JournalFooter() {
  const t = useTranslation().journal.footer
  const linkClass =
    'font-sans-kr text-[12px] font-light leading-4 text-paper/55 transition-colors hover:text-paper md:tracking-[0.04em]'

  return (
    <footer
      className="flex flex-col gap-[18px] border-t border-paper/10 bg-void px-5 pb-10 pt-7 md:flex-row md:items-center md:justify-between md:gap-8 md:px-24 md:pt-8"
      style={{ paddingBottom: 'max(40px, env(safe-area-inset-bottom))' }}
    >
      <Link href="/" aria-label="Muse de Marée" className="block w-fit opacity-70">
        <Image
          src="/images/logo/logo_text_trans_W.png"
          alt="MUSE DE MARÉE"
          width={1000}
          height={152}
          className="h-[17px] w-auto md:h-[22px]"
        />
      </Link>
      <nav aria-label="Footer" className="flex flex-wrap gap-5 md:gap-8">
        <a href={MAIN_SITE} className={linkClass}>
          musedemaree.com
        </a>
        <a href="/feed.xml" className={linkClass}>
          RSS
        </a>
        <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {t.privacy}
        </a>
        <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {t.terms}
        </a>
      </nav>
      <p className="font-garamond text-[15px] font-light italic leading-[18px] text-paper/55 md:text-[16px] md:leading-5">
        {t.motto}
      </p>
    </footer>
  )
}
