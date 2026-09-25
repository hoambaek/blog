import { createClient } from '@/lib/supabase/server'

const SITE_URL = 'https://blog.musedemaree.com'

/*
 * 한 시간마다 다시 만든다.
 *
 * 전에는 Supabase 클라이언트가 cookies()를 읽어 우연히 매 요청 새로 만들어졌다.
 * 그 배선을 걷어내자(2026-07-27) 이 라우트가 빌드 때 한 번 구워지면서,
 * 새로 발행한 글이 다음 배포 전까지 사이트맵에 안 실리게 됐다.
 * 검색엔진이 보는 목록이라 그대로 두면 색인이 늦어진다.
 */
export const revalidate = 3600

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const supabase = await createClient()

  // Get all published posts
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, updated_at, published_at')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })

  // Get all categories
  const { data: categories } = await supabase
    .from('categories')
    .select('slug, updated_at')
    .order('sort_order', { ascending: true })

  // Static pages
  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'daily' },
    // /category/all은 목록(/)으로 합쳐 308로 넘긴다(2026-09 저널 개편) — 사이트맵에서 뺐다
  ]

  const staticUrls = staticPages.map((page) => `
  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('')

  // Category pages
  const categoryUrls = (categories || []).map((category) => `
  <url>
    <loc>${SITE_URL}/category/${escapeXml(category.slug)}</loc>
    <lastmod>${new Date(category.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')

  // Post pages
  const postUrls = (posts || []).map((post) => `
  <url>
    <loc>${SITE_URL}/post/${escapeXml(post.slug)}</loc>
    <lastmod>${new Date(post.updated_at).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`).join('')

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${staticUrls}
${categoryUrls}
${postUrls}
</urlset>`

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
