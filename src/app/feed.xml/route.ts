import { createClient } from '@/lib/supabase/server'

const SITE_URL = 'https://journal.musedemaree.com'
const SITE_NAME = 'Le Journal de Marée'
const SITE_DESCRIPTION = '심연의 시간이 조각한 바다의 수공예품. 해저숙성 샴페인 뮤즈드마레의 이야기를 담은 저널입니다.'

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

export async function GET() {
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
      category:categories(name, slug)
    `)
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .limit(50)

  const feedItems = (posts || []).map((post) => {
    const content = typeof post.content === 'object' && post.content !== null
      ? (post.content as { html?: string }).html || ''
      : ''
    const plainContent = stripHtml(content)
    const description = post.excerpt || post.meta_description || plainContent.slice(0, 300)
    const category = post.category as { name: string; slug: string } | null

    return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE_URL}/post/${post.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/post/${post.slug}</guid>
      <description>${escapeXml(description)}</description>
      <content:encoded><![CDATA[${content}]]></content:encoded>
      <pubDate>${new Date(post.published_at || post.created_at).toUTCString()}</pubDate>
      ${category ? `<category>${escapeXml(category.name)}</category>` : ''}
      ${post.cover_image_url ? `<enclosure url="${escapeXml(post.cover_image_url)}" type="image/jpeg" />` : ''}
      <author>editor@musedemaree.com (Muse de Marée)</author>
    </item>`
  }).join('')

  const lastBuildDate = posts?.[0]?.published_at
    ? new Date(posts[0].published_at).toUTCString()
    : new Date().toUTCString()

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>ko-KR</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/logo.png</url>
      <title>${escapeXml(SITE_NAME)}</title>
      <link>${SITE_URL}</link>
    </image>
    <copyright>© ${new Date().getFullYear()} Muse de Marée. All rights reserved.</copyright>
    <managingEditor>editor@musedemaree.com (Muse de Marée)</managingEditor>
    <webMaster>tech@musedemaree.com (Muse de Marée)</webMaster>
    <ttl>60</ttl>
    ${feedItems}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
