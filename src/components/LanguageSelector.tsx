'use client'

import { useState, useRef, useEffect } from 'react'
import { useLocale, locales, type Locale } from '@/lib/i18n'

const localeNames: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
}

const localeLabels: Record<Locale, string> = {
  ko: 'KR',
  en: 'EN',
}

export function LanguageSelector() {
  const { locale, setLocale } = useLocale()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (newLocale: Locale) => {
    setLocale(newLocale)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center w-9 h-9 text-[11px] font-medium tracking-wide hover:bg-muted transition-colors leading-none"
        aria-label="Select language"
      >
        {localeLabels[locale]}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-[#FAF8F5]/80 backdrop-blur-xl shadow-xl z-50 min-w-[130px] overflow-hidden">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => handleSelect(loc)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                locale === loc
                  ? 'bg-white/20'
                  : 'hover:bg-white/10'
              }`}
            >
              <span className="text-[11px] font-medium tracking-wide w-6">{localeLabels[loc]}</span>
              <span className="text-foreground drop-shadow-sm">{localeNames[loc]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
