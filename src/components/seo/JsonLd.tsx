import type { PostWithCategory } from '@/lib/supabase/types'

const SITE_URL = 'https://journal.musedemaree.com'
const SITE_NAME = 'Le Journal de Marée'
const ORGANIZATION_NAME = 'Muse de Marée'

interface ArticleJsonLdProps {
  post: PostWithCategory
}

export function ArticleJsonLd({ post }: ArticleJsonLdProps) {
  const content = typeof post.content === 'object' && post.content !== null
    ? (post.content as { html?: string }).html || ''
    : ''

  // Strip HTML tags for plain text
  const plainTextContent = content.replace(/<[^>]*>/g, '').trim()
  const wordCount = plainTextContent.split(/\s+/).length

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${SITE_URL}/post/${post.slug}#article`,
    headline: post.title,
    description: post.excerpt || post.meta_description || plainTextContent.slice(0, 160),
    image: post.cover_image_url || post.og_image_url || `${SITE_URL}/og-default.png`,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Organization',
      name: ORGANIZATION_NAME,
      url: 'https://musedemaree.com',
    },
    publisher: {
      '@type': 'Organization',
      name: ORGANIZATION_NAME,
      url: 'https://musedemaree.com',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/post/${post.slug}`,
    },
    articleBody: plainTextContent,
    wordCount: wordCount,
    inLanguage: 'ko-KR',
    isAccessibleForFree: true,
    ...(post.category && {
      articleSection: post.category.name,
    }),
    ...(post.reading_time_minutes && {
      timeRequired: `PT${post.reading_time_minutes}M`,
    }),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

interface BreadcrumbJsonLdProps {
  items: Array<{ name: string; url: string }>
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export function WebsiteJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description: '심연의 시간이 조각한 바다의 수공예품. 해저숙성 샴페인 뮤즈드마레의 이야기를 담은 저널입니다.',
    inLanguage: 'ko-KR',
    publisher: {
      '@type': 'Organization',
      name: ORGANIZATION_NAME,
      url: 'https://musedemaree.com',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export function OrganizationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://musedemaree.com#organization',
    name: ORGANIZATION_NAME,
    url: 'https://musedemaree.com',
    logo: `${SITE_URL}/logo.png`,
    description: '프랑스의 대지가 낳고, 한국의 파도가 기른 시간의 결정체. 세계 유일의 해저숙성 샴페인 브랜드.',
    sameAs: [
      'https://instagram.com/musedemaree',
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
