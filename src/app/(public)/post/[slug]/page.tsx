import { notFound } from 'next/navigation'
import { getPostBySlug, getRelatedPosts, getAdjacentPosts, getPublishedSlugs } from '@/lib/actions/posts'
import { PostContent } from '@/components/post/PostContent'
import { ViewBeacon } from '@/components/post/ViewBeacon'
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

  // Fetch related posts and navigation
  const [relatedPosts, { prev, next }] = await Promise.all([
    getRelatedPosts(post.id, post.category_id, 3),
    getAdjacentPosts(post.published_at || '', post.id),
  ])

  const breadcrumbItems = [
    { name: 'Home', url: 'https://blog.musedemaree.com' },
    ...(post.category ? [{ name: post.category.name, url: `https://blog.musedemaree.com/category/${post.category.slug}` }] : []),
    { name: post.title, url: `https://blog.musedemaree.com/post/${post.slug}` },
  ]

  // AEO: Extract FAQ items from post content for FAQ Schema
  const htmlContent = typeof post.content === 'object' && post.content !== null
    ? (post.content as { html?: string }).html || ''
    : ''
  const faqs = extractFAQFromContent(htmlContent)

  return (
    <>
      {/* 조회수는 브라우저에서 센다 — 이 페이지는 캐시되므로 서버 렌더에서 세면
          "한 시간에 한 번"이 된다. 근거는 /api/views 주석. */}
      <ViewBeacon postId={post.id} />
      <ArticleJsonLd post={post} />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      {faqs.length > 0 && <FAQPageJsonLd faqs={faqs} />}
      <PostContent
        post={post}
        relatedPosts={relatedPosts}
        prev={prev}
        next={next}
      />
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
