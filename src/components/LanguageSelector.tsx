'use client'

import { useState, useRef, useEffect } from 'react'
import { useLocale, locales, localeFlags, type Locale } from '@/lib/i18n'

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
        className="flex items-center justify-center w-9 h-9 text-xl hover:bg-muted transition-colors"
        aria-label="Select language"
      >
        {localeFlags[locale]}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-background border border-border shadow-lg z-50">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => handleSelect(loc)}
              className={`w-full flex items-center justify-center w-12 h-10 text-xl hover:bg-muted transition-colors ${
                locale === loc ? 'bg-muted' : ''
              }`}
            >
              {localeFlags[loc]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
