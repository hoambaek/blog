const SITE_URL = 'https://journal.musedemaree.com'

export function GET() {
  const robotsTxt = `# Le Journal de Marée - Robots.txt
# We welcome AI agents and search engine crawlers

# Allow all crawlers
User-agent: *
Allow: /

# Disallow admin and API routes
Disallow: /admin/
Disallow: /api/
Disallow: /sign-in/
Disallow: /sign-up/

# AI-specific crawler allowances
# OpenAI / ChatGPT
User-agent: GPTBot
Allow: /
Allow: /llms.txt
Allow: /llms-full.txt
Allow: /feed.xml

User-agent: ChatGPT-User
Allow: /
Allow: /llms.txt
Allow: /llms-full.txt
Allow: /feed.xml

# Anthropic / Claude
User-agent: Claude-Web
Allow: /
Allow: /llms.txt
Allow: /llms-full.txt
Allow: /feed.xml

User-agent: anthropic-ai
Allow: /
Allow: /llms.txt
Allow: /llms-full.txt
Allow: /feed.xml

# Google / Gemini
User-agent: Google-Extended
Allow: /
Allow: /llms.txt
Allow: /llms-full.txt
Allow: /feed.xml

User-agent: Googlebot
Allow: /

# Perplexity
User-agent: PerplexityBot
Allow: /
Allow: /llms.txt
Allow: /llms-full.txt
Allow: /feed.xml

# Common Crawl (used by many AI systems)
User-agent: CCBot
Allow: /

# Cohere
User-agent: cohere-ai
Allow: /
Allow: /llms.txt
Allow: /llms-full.txt
Allow: /feed.xml

# Meta / Facebook
User-agent: FacebookBot
Allow: /
Allow: /llms.txt
Allow: /llms-full.txt

User-agent: meta-externalagent
Allow: /

# Microsoft / Bing
User-agent: Bingbot
Allow: /

# Apple
User-agent: Applebot
Allow: /

# Sitemaps
Sitemap: ${SITE_URL}/sitemap.xml

# AI Content Files
# llms.txt - Quick reference for AI systems
# llms-full.txt - Complete article content for AI training and retrieval
`

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
