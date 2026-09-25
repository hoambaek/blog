import { notFound } from 'next/navigation'
import { getPostBySlug, getAdjacentPosts, getPublishedSlugs, getPublishedPostById } from '@/lib/actions/posts'
import { ViewBeacon } from '@/components/post/ViewBeacon'
import { PostView } from '@/components/journal/PostView'
import { collectFigureCredits, htmlFromContent, parseArticleHtml } from '@/lib/article/parse'
import { toRecords } from '@/lib/journal/data'
import { ArticleJsonLd, BreadcrumbJsonLd, FAQPageJsonLd, extractFAQFromContent } from '@/components/seo/JsonLd'

export const revalidate = 3600

/*
 * 동적 구간([slug])은 목록을 주지 않으면 revalidate를 적어 둬도 캐시를 타지 않는다.
 * Next 16은 미리 알려준 경로만 정적으로 굽고, 나머지는 매 요청 새로 그린다
 * (실측: Cache-Control이 no-store로 나갔다).
 * 여기서 발행 글 목록을 넘겨 주면 빌드 때 구워지고, 그 뒤 한 시간마다 갱신된다.
 * 빌드 후에 새로 발행된 글은 목록에 없지만 dynamicParams 기본값(true) 덕에
 * 첫 요청에서 렌더돼 그때부터 캐시된다 — 404가 되지 않는다.
 */
export async function generateStaticParams() {
  const slugs = await getPublishedSlugs()
  return slugs.map((slug) => ({ slug }))
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  // 다음 기록 = 관리자에서 지정한 글(발행 글일 때만). 지정이 없으면 발행일 순으로 바로 앞(더 오래된) 글 하나.
  // next_post_id는 005 마이그레이션 컬럼 — 적용 전에는 undefined라 자동으로 떨어진다.
  const pinnedNextId = post.next_post_id && post.next_post_id !== post.id ? post.next_post_id : null
  const [pinned, { prev }, [record]] = await Promise.all([
    pinnedNextId ? getPublishedPostById(pinnedNextId) : Promise.resolve(null),
    getAdjacentPosts(post.published_at || '', post.id),
    toRecords([post], { withSea: true }),
  ])
  const nextPost = pinned ?? prev
  const next = nextPost ? (await toRecords([nextPost], { withSea: true }))[0] : null

  const breadcrumbItems = [
    { name: 'Home', url: 'https://blog.musedemaree.com' },
    ...(post.category ? [{ name: post.category.name, url: `https://blog.musedemaree.com/category/${post.category.slug}` }] : []),
    { name: post.title, url: `https://blog.musedemaree.com/post/${post.slug}` },
  ]

  // 본문은 서버에서 블록으로 파싱해 넘긴다(두 언어 모두 — 화면이 KO/EN 쿠키에 맞춰 고른다)
  const htmlContent = htmlFromContent(post.content)
  const blocks = parseArticleHtml(htmlContent)
  const htmlEn = htmlFromContent(post.content_en)
  const blocksEn = htmlEn ? parseArticleHtml(htmlEn) : null

  // 글 끝 PHOTO — 그림 크레딧 자동 수집 + photo_credits 필드(줄마다 한 항목, 앞의 · - • 기호는 뗀다)
  const manualCredits = (post.photo_credits ?? '')
    .split('\n')
    .map((line) => line.replace(/^\s*[·•\-*]\s*/, '').trim())
    .filter(Boolean)
  const credits = [...new Set([...collectFigureCredits(blocks), ...manualCredits])]

  // AEO: Extract FAQ items from post content for FAQ Schema
  const faqs = extractFAQFromContent(htmlContent)

  return (
    <>
      {/* 조회수는 브라우저에서 센다 — 이 페이지는 캐시되므로 서버 렌더에서 세면
          "한 시간에 한 번"이 된다. 근거는 /api/views 주석. */}
      <ViewBeacon postId={post.id} />
      <ArticleJsonLd post={post} />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      {faqs.length > 0 && <FAQPageJsonLd faqs={faqs} />}
      <PostView data={{ record, blocks, blocksEn, credits, next }} />
    </>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return {
      title: 'Post not found',
    }
  }

  // AEO: 브랜드명을 자연스럽게 포함한 메타 설명
  const brandName = '뮤즈드마레'
  const baseDescription = post.meta_description || post.excerpt || ''

  // 이미 브랜드명이 포함되어 있으면 그대로, 아니면 자연스럽게 추가
  const aeoDescription = baseDescription.includes(brandName)
    ? baseDescription
    : `${baseDescription} — ${brandName}(Muse de Marée)`

  const aeoTitle = post.meta_title || `${post.title} | ${brandName}`

  return {
    title: post.title,
    description: aeoDescription.slice(0, 160),
    openGraph: {
      title: aeoTitle,
      description: aeoDescription.slice(0, 160),
      type: 'article',
      publishedTime: post.published_at || undefined,
      images: post.cover_image_url ? [post.cover_image_url] : [],
      siteName: 'Muse de Marée',
    },
    twitter: {
      card: 'summary_large_image',
      title: aeoTitle,
      description: aeoDescription.slice(0, 160),
    },
    alternates: {
      canonical: `https://blog.musedemaree.com/post/${post.slug}`,
    },
  }
}
