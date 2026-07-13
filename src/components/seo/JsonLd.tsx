import type { PostWithCategory } from '@/lib/supabase/types'

const SITE_URL = 'https://blog.musedemaree.com'
const SITE_NAME = 'Muse de Marée'
const ORGANIZATION_NAME = 'Muse de Marée'
const BRAND_DESCRIPTION = '샴페인은 샹파뉴가 만들고, 그 변화는 한국 남해의 바다가 만듭니다. 바다의 시간을 기록하는 브랜드, 뮤즈드마레.'

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
    image: post.cover_image_url || post.og_image_url || `${SITE_URL}/bg.png`,
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
        url: `${SITE_URL}/icon-512.png`,
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
    // AEO: speakable for AI voice assistants
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.post-content h2', '.post-content p:first-of-type', '.aeo-summary'],
    },
    // AEO: about and mentions for entity recognition
    about: {
      '@type': 'Thing',
      name: '해저숙성 샴페인',
      description: BRAND_DESCRIPTION,
    },
    mentions: {
      '@type': 'Brand',
      name: ORGANIZATION_NAME,
      url: 'https://musedemaree.com',
    },
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
    description: '샴페인은 샹파뉴가 만들고, 그 시간은 한국 남해가 씁니다. 수심 30m에서 보낸 날들을 기록하는 뮤즈드마레의 저널.',
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
    logo: `${SITE_URL}/icon-512.png`,
    description: '샴페인은 샹파뉴가 만들고, 그 변화는 한국 남해의 바다가 만듭니다. 바다의 시간을 기록하는 브랜드, 뮤즈드마레.',
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

// ═══════════════════════════════════════════════════
// AEO: FAQ Schema - AI가 Q&A 형식으로 콘텐츠를 인용
// ═══════════════════════════════════════════════════

interface FAQItem {
  question: string
  answer: string
}

interface FAQPageJsonLdProps {
  faqs: FAQItem[]
}

export function FAQPageJsonLd({ faqs }: FAQPageJsonLdProps) {
  if (faqs.length === 0) return null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

/**
 * HTML 콘텐츠에서 FAQ 항목을 자동 추출
 * 질문형 h2/h3 태그만 질문으로 인정하고, 뒤따르는 p 태그를 답변으로 변환.
 * 서술형 소제목("남해의 겨울" 등)을 Question으로 둔갑시키면 FAQPage 스키마가
 * 부정확해지므로, 질문 형태가 아니면 제외한다 (없으면 스키마 자체를 안 낸다).
 */
function isQuestionLike(text: string): boolean {
  if (text.includes('?') || text.includes('？')) return true
  return /(무엇|무슨|왜|어떻게|어디서|언제|누가|얼마나|인가요|일까요|할까요|다를까|맞을까|어떤가)/.test(
    text
  )
}

export function extractFAQFromContent(htmlContent: string): FAQItem[] {
  const faqs: FAQItem[] = []
  // h2 또는 h3 뒤에 오는 텍스트를 Q&A 쌍으로 추출
  const headingRegex = /<h[23][^>]*>(.*?)<\/h[23]>/gi
  const matches = [...htmlContent.matchAll(headingRegex)]

  for (const match of matches) {
    const question = match[1].replace(/<[^>]*>/g, '').trim()
    if (!question || !isQuestionLike(question)) continue

    // 해당 heading 이후의 첫 번째 paragraph 텍스트 추출
    const afterHeading = htmlContent.slice((match.index || 0) + match[0].length)
    const paragraphMatch = afterHeading.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
    if (paragraphMatch) {
      const answer = paragraphMatch[1].replace(/<[^>]*>/g, '').trim()
      if (answer && answer.length > 20) {
        faqs.push({ question, answer })
      }
    }
  }

  return faqs.slice(0, 10) // 최대 10개
}
