import type { Dictionary } from './dictionaries'

/**
 * Resolve a category's display name for the active locale.
 *
 * Categories are stored in the DB with a Korean `name` only, so public views
 * must map the stable `slug` to the localized label in the dictionary
 * (`t.nav.*`). Falls back to the DB name, then the slug, when unknown.
 */
export function getCategoryName(
  t: Dictionary,
  slug?: string | null,
  fallback?: string | null,
): string {
  if (!slug) return fallback ?? ''
  const map: Record<string, string> = {
    'sea-log': t.nav.seaLog,
    'maison': t.nav.maison,
    'culture': t.nav.culture,
    'table': t.nav.table,
    'news': t.nav.news,
  }
  return map[slug] ?? fallback ?? slug
}

/**
 * English descriptions per category slug. Categories store a Korean
 * `description` only, so EN views map the slug to these; KO falls back to the
 * DB value.
 */
const CATEGORY_DESCRIPTION_EN: Record<string, string> = {
  'sea-log': 'Aging diaries, retrieval logs, and data from the sea',
  'maison': 'Brand philosophy, the founders, and the makers',
  'culture': 'Collaborating artists, art and time, and stories of place',
  'table': 'Pairing guides, chef collaborations, and tasting notes',
  'news': 'Brand news, event recaps, and press',
}

/**
 * Resolve a category's description for the active locale. In English, uses the
 * curated map above; otherwise falls back to the DB (Korean) description.
 */
export function getCategoryDescription(
  locale: string,
  slug?: string | null,
  fallback?: string | null,
): string {
  if (locale === 'en' && slug && CATEGORY_DESCRIPTION_EN[slug]) {
    return CATEGORY_DESCRIPTION_EN[slug]
  }
  return fallback ?? ''
}
