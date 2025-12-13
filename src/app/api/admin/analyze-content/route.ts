import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const CATEGORY_CONTEXT: Record<string, string> = {
  'sea-log': 'underwater ocean themes, deep sea atmosphere, champagne bottles in ocean setting, mysterious maritime vibes',
  'maison': 'champagne vineyards, ancient cellars, traditional craftsmanship, heritage and legacy',
  'culture': 'contemporary art, gallery spaces, cultural sophistication, artistic expression',
  'table': 'fine dining, elegant table settings, gourmet cuisine, intimate dining experiences',
  'news': 'luxury events, celebrations, exclusive gatherings, sophisticated social occasions',
}

export async function POST(request: NextRequest) {
  try {
    const { title, content, category } = await request.json()

    if (!title && !content) {
      return NextResponse.json(
        { success: false, error: '제목 또는 본문 내용이 필요합니다.' },
        { status: 400 }
      )
    }

    const categoryContext = CATEGORY_CONTEXT[category] || CATEGORY_CONTEXT['sea-log']

    // Strip HTML tags from content for analysis
    const plainContent = content?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || ''
    const truncatedContent = plainContent.slice(0, 2000) // Limit content for analysis

    const systemPrompt = `You are an expert at creating image generation prompts for luxury champagne brand visuals.
Your task is to analyze the given blog post title and content, then create a compelling image prompt.

Brand context:
- Luxury champagne brand "Musée de Marée" (뮤즈드마레)
- Elegant, sophisticated, timeless aesthetic
- Ocean/maritime themes combined with champagne culture
- High-end editorial photography style

Category theme hints: ${categoryContext}

Guidelines for the image prompt:
1. Create a prompt in English, 1-2 sentences
2. Focus on visual elements that capture the essence of the content
3. Include lighting, atmosphere, and mood descriptions
4. Avoid text, logos, or explicit champagne brand names in the image
5. Suggest a cinematic, editorial photography style
6. Keep it elegant and luxurious, never tacky or commercial

Output ONLY the image prompt, nothing else. No explanations, no quotes.`

    const userMessage = `Title: ${title || '(No title)'}

Content excerpt:
${truncatedContent || '(No content)'}

Generate a cover image prompt that visually represents this article's theme and mood.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
      system: systemPrompt,
    })

    const generatedPrompt = response.content[0].type === 'text'
      ? response.content[0].text.trim()
      : ''

    return NextResponse.json({
      success: true,
      prompt: generatedPrompt,
    })
  } catch (error) {
    console.error('Content analysis error:', error)
    return NextResponse.json(
      { success: false, error: '콘텐츠 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
