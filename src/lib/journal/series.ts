/*
 * 연재별 표기 — 프랑스어 이름(연재 밴드·연재 히어로)과 히어로 이미지.
 * 바다의 일지·메종 이야기는 Paper 시안 값. 나머지 연재는 시안이 없어 이름만 정해 두고
 * 히어로는 바다 이미지(hero-sea)를 쓴다 — 해당 연재에 글이 생기면 시안을 받아 바꾼다.
 */

export interface SeriesHero {
  desktop: string
  mobile: string
  /** 데스크톱 이미지의 object-position */
  position: string
}

const SEA_HERO: SeriesHero = {
  desktop: '/images/journal/hero-sea.webp',
  mobile: '/images/journal/hero-sea-mobile.webp',
  position: '50% 50%',
}

const SERIES_META: Record<string, { french: string; hero: SeriesHero }> = {
  'sea-log': {
    french: 'Journal de bord',
    // 목록 마스트헤드와 같은 바다 사진을 다른 자리로 자른다 (파도 아래쪽 수면)
    hero: { ...SEA_HERO, position: '50% 78%' },
  },
  maison: {
    french: 'La Maison',
    hero: {
      desktop: '/images/journal/series-maison.webp',
      mobile: '/images/journal/series-maison-mobile.webp',
      position: '50% 62%',
    },
  },
  culture: { french: 'Culture', hero: SEA_HERO },
  table: { french: 'À table', hero: SEA_HERO },
  news: { french: 'Nouvelles', hero: SEA_HERO },
}

export function seriesFrench(slug: string | null | undefined): string {
  return (slug && SERIES_META[slug]?.french) || ''
}

export function seriesHero(slug: string | null | undefined): SeriesHero {
  return (slug && SERIES_META[slug]?.hero) || SEA_HERO
}

export const MASTHEAD_HERO = SEA_HERO
