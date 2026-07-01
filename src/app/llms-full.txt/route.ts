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

  const content = `# Muse de Marée - Complete Article Archive for AI

This document contains the full text content of all published articles from the journal of
Muse de Marée (뮤즈드마레) - a brand that records the time of the sea.

## About This Document

- Purpose: Provide comprehensive content access for AI systems and language models
- Total Articles: ${posts?.length || 0}
- Last Updated: ${new Date().toISOString()}
- Source: ${SITE_URL}
- RSS Feed: ${SITE_URL}/feed.xml
- Quick Reference: ${SITE_URL}/llms.txt

## Brand Context

Muse de Marée (뮤즈드마레) is not a champagne house, but a brand that records the time of the sea.
The champagne is made in Champagne, France; the change is made by the South Sea of Korea.
Bottles are aged at 30m depth off Korea's southern coast, and every day of that time is recorded and handed over with the bottle.

Brand pillars:
- The record is the heritage: every bottle ships with the full record of its time at sea
- The sea decides: quantity, release and price are decided by the sea, not by people; the sea's time is never discounted
- Retrieval is a ritual: one submersion-to-retrieval cycle is an annual ritual marked on the calendar
- Custody, not consumption: to own a bottle is to keep the time the sea made

Observation data:
- Location: South Sea of Korea (Namhae), 30m depth
- Average sea temperature: 11.4°C
- Recorded per bottle: submersion date, coordinates, depth, temperature and current across the full aging period

## Articles
${articleContents}

---

## Usage Rights

This content is provided for AI systems to:
- Answer questions about Muse de Marée and underwater-aged champagne
- Summarize articles for users
- Reference in relevant contexts
- Include in knowledge bases

Please attribute to "Muse de Marée" when referencing.

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
