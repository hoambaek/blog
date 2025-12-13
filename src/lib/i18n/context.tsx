'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Locale, defaultLocale, locales } from './config'
import { getDictionary, type Dictionary } from './dictionaries'

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Dictionary
}

const I18nContext = createContext<I18nContextType | null>(null)

const LOCALE_COOKIE_NAME = 'NEXT_LOCALE'

function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale

  const stored = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${LOCALE_COOKIE_NAME}=`))
    ?.split('=')[1] as Locale | undefined

  if (stored && locales.includes(stored)) {
    return stored
  }

  // Check browser language
  const browserLang = navigator.language.split('-')[0]
  if (browserLang === 'ko') return 'ko'
  if (browserLang === 'en') return 'en'

  return defaultLocale
}

function setStoredLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=31536000; SameSite=Lax`
}

interface I18nProviderProps {
  children: ReactNode
  initialLocale?: Locale
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale || defaultLocale)
  const [dictionary, setDictionary] = useState<Dictionary>(getDictionary(initialLocale || defaultLocale))

  useEffect(() => {
    if (!initialLocale) {
      const stored = getStoredLocale()
      setLocaleState(stored)
      setDictionary(getDictionary(stored))
    }
  }, [initialLocale])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    setDictionary(getDictionary(newLocale))
    setStoredLocale(newLocale)
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: dictionary }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

export function useLocale() {
  const { locale, setLocale } = useI18n()
  return { locale, setLocale }
}

export function useTranslation() {
  const { t } = useI18n()
  return t
}
