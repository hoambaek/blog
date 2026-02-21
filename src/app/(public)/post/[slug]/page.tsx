import { notFound } from 'next/navigation'
import { getPostBySlug, getRelatedPosts, getAdjacentPosts, incrementViewCount } from '@/lib/actions/posts'
import { PostContent } from '@/components/post/PostContent'
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd'

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
    { name: 'Home', url: 'https://journal.musedemaree.com' },
    ...(post.category ? [{ name: post.category.name, url: `https://journal.musedemaree.com/category/${post.category.slug}` }] : []),
    { name: post.title, url: `https://journal.musedemaree.com/post/${post.slug}` },
  ]

  return (
    <>
      <ArticleJsonLd post={post} />
      <BreadcrumbJsonLd items={breadcrumbItems} />
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

  return {
    title: post.title,
    description: post.excerpt || post.meta_description,
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      type: 'article',
      publishedTime: post.published_at || undefined,
      images: post.cover_image_url ? [post.cover_image_url] : [],
    },
  }
}
