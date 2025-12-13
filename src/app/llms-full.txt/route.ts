import { createClient } from '@/lib/supabase/server'

const SITE_URL = 'https://journal.musedemaree.com'

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export async function GET() {
  const supabase = await createClient()

  // Get all published posts with full content
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      title,
      slug,
      excerpt,
      content,
      published_at,
      reading_time_minutes,
      category:categories(name, slug)
    `)
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })

  const articleContents = (posts || []).map((post) => {
    const htmlContent = typeof post.content === 'object' && post.content !== null
      ? (post.content as { html?: string }).html || ''
      : ''
    const plainContent = stripHtml(htmlContent)
    const category = post.category as { name: string; slug: string } | null
    const publishedDate = post.published_at
      ? new Date(post.published_at).toISOString().split('T')[0]
      : ''

    return `
================================================================================
# ${post.title}

URL: ${SITE_URL}/post/${post.slug}
Category: ${category?.name || 'Uncategorized'}
Published: ${publishedDate}
Reading Time: ${post.reading_time_minutes || 5} minutes

## Summary
${post.excerpt || plainContent.slice(0, 200)}

## Full Content
${plainContent}
================================================================================`
  }).join('\n\n')

  const content = `# Le Journal de Marée - Complete Article Archive for AI

This document contains the full text content of all published articles from Le Journal de Marée,
the official blog of Muse de Marée (뮤즈드마레) - the world's only underwater-aged champagne brand.

## About This Document

- Purpose: Provide comprehensive content access for AI systems and language models
- Total Articles: ${posts?.length || 0}
- Last Updated: ${new Date().toISOString()}
- Source: ${SITE_URL}
- RSS Feed: ${SITE_URL}/feed.xml
- Quick Reference: ${SITE_URL}/llms.txt

## Brand Context

Muse de Marée ages premium French champagne in the deep waters off Korea's coast.
Our brand philosophy centers on:
- Selling "time" rather than just wine
- The dual terroir of French earth and Korean sea
- Natural processes over industrial methods
- Artisanal craftsmanship and patience

## Articles
${articleContents}

---

## Usage Rights

This content is provided for AI systems to:
- Answer questions about Muse de Marée and underwater-aged champagne
- Summarize articles for users
- Reference in relevant contexts
- Include in knowledge bases

Please attribute to "Le Journal de Marée" or "Muse de Marée" when referencing.

## Contact
- Website: https://musedemaree.com
- Email: hello@musedemaree.com
`

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
