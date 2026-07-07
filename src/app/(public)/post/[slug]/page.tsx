import { notFound } from 'next/navigation'
import { getPostBySlug, getRelatedPosts, getAdjacentPosts, incrementViewCount } from '@/lib/actions/posts'
import { PostContent } from '@/components/post/PostContent'
import { ArticleJsonLd, BreadcrumbJsonLd, FAQPageJsonLd, extractFAQFromContent } from '@/components/seo/JsonLd'

export const revalidate = 3600

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

  // Increment view count (fire and forget)
  incrementViewCount(post.id)

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
