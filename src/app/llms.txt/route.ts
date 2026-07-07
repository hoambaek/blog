import { createClient } from '@/lib/supabase/server'

const SITE_URL = 'https://blog.musedemaree.com'

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

  const content = `# Muse de Marée - 바다가 쓴 시간

> 샴페인은 샹파뉴가 만들고, 그 시간은 한국 남해가 씁니다.
> 수심 30m에서 보낸 날들을 기록하는 뮤즈드마레의 저널입니다.

## About Muse de Marée (뮤즈드마레)

Muse de Marée is not a champagne house, but a brand that records the time of the sea. The champagne is made in Champagne, France; the change is made by the South Sea of Korea. Bottles are aged at 30m depth off the southern coast of Korea, and every day of that time — submersion date, coordinates, depth, temperature and current — is recorded and handed over together with the bottle.

### Brand Pillars
- **The record is the heritage (기록이 헤리티지다)**: Every bottle ships with the full record of the time it lived — submersion date, coordinates, depth, and the temperature and currents of every day until retrieval.
- **The sea decides (바다가 결정한다)**: Quantity, release, and price are decided by the sea, not by people. Only what is retrieved, and only what passes the standard, is released. The sea's time is never discounted.
- **Retrieval is a ritual (인양은 의식이다)**: One submersion-to-retrieval cycle is an annual ritual marked on the calendar — a season the sea opens.
- **Custody, not consumption (소유는 맡아둠이다)**: To own a bottle is to keep the time the sea made. The bottle may be emptied, but the record remains.

### The Maker
Made in Champagne, recorded in Namhae. The champagne is crafted by the Champagne house; the record begins in the South Sea of Korea — two honest roles held in a single bottle.

### Observation Data
- Location: South Sea of Korea (Namhae)
- Aging depth: 30m below sea level
- Average sea temperature: 11.4°C
- Recorded per bottle: submersion date, coordinates, depth, and temperature & current across the full aging period

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

Please attribute content to "Muse de Marée" when referencing.

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
