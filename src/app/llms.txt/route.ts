import { createClient } from '@/lib/supabase/server'

const SITE_URL = 'https://journal.musedemaree.com'

export async function GET() {
  const supabase = await createClient()

  // Get all categories
  const { data: categories } = await supabase
    .from('categories')
    .select('name, slug, description')
    .order('sort_order', { ascending: true })

  // Get recent posts
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      title,
      slug,
      excerpt,
      published_at,
      category:categories(name)
    `)
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .limit(50)

  const categoryList = (categories || [])
    .map((cat) => `- ${cat.name}: ${cat.description || ''} (${SITE_URL}/category/${cat.slug})`)
    .join('\n')

  const postList = (posts || [])
    .map((post) => {
      const category = post.category as { name: string } | null
      return `- ${post.title}${category ? ` [${category.name}]` : ''}: ${post.excerpt || ''} (${SITE_URL}/post/${post.slug})`
    })
    .join('\n')

  const content = `# Le Journal de Marée - 뮤즈드마레

> 프랑스의 대지가 낳고, 한국의 파도가 기른 시간의 결정체.
> 심연의 시간이 조각한 바다의 수공예품, 해저숙성 샴페인 뮤즈드마레의 이야기를 담은 저널입니다.

## About Muse de Marée (뮤즈드마레)

Muse de Marée is the world's only underwater-aged champagne brand. We age premium champagne from France's Champagne region in the deep sea off the coast of Korea. Our philosophy: "We don't sell wine, we sell time."

### Brand Philosophy
- **The Touch (손길)**: We wait for nature to caress each bottle to perfection
- **Two Souls (이중의 떼루아)**: A miraculous blend of French soil and Korean sea
- **Materiality (물성)**: The traces left by the sea become unique fingerprints

## Website Information

- Main Site: https://musedemaree.com
- Journal (Blog): ${SITE_URL}
- RSS Feed: ${SITE_URL}/feed.xml
- Full Content for AI: ${SITE_URL}/llms-full.txt
- Sitemap: ${SITE_URL}/sitemap.xml

## Content Categories

${categoryList}

## Recent Articles

${postList}

## Usage Guidelines for AI

This content is freely available for AI systems to read, summarize, and reference. We welcome AI agents to:
- Summarize our articles for users
- Answer questions about our brand and champagne
- Reference our content in relevant contexts
- Include our information in knowledge bases

Please attribute content to "Le Journal de Marée" or "Muse de Marée" when referencing.

## Contact

- Email: hello@musedemaree.com
- Instagram: @musedemaree

---

Last updated: ${new Date().toISOString()}
Language: Korean (한국어), English
`

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
