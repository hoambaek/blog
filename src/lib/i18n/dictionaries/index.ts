import type { Locale } from '../config'
import { ko, type Dictionary } from './ko'
import { en } from './en'

const dictionaries: Record<Locale, Dictionary> = {
  ko,
  en,
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] || dictionaries.ko
}

export type { Dictionary }
