import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// 공통 스타일 프리픽스
const COMMON_STYLE_PREFIX = `Editorial photography style, soft natural lighting,
muted color palette with deep navy and rose gold accents,
film grain texture, elegant and serene atmosphere,
shallow depth of field, high quality, professional photography`

// 공통 네거티브 프롬프트
const NEGATIVE_PROMPT = `oversaturated, neon colors, harsh lighting,
flash photography, HDR, overly sharp, busy background,
cluttered composition, text, watermark, logo,
people's faces clearly visible, commercial advertising style,
stock photo feel, artificial, plastic`

// 카테고리별 템플릿
const CATEGORY_TEMPLATES: Record<string, {
  style: string
  colors: string
  mood: string
  subjects: string[]
}> = {
  'sea-log': {
    style: 'underwater photography, mysterious deep ocean',
    colors: 'deep navy blue, ocean teal, pearl white highlights',
    mood: 'mysterious, serene, profound depth',
    subjects: ['ocean floor', 'light rays underwater', 'bubbles', 'marine textures']
  },
  'maison': {
    style: 'heritage documentary, warm editorial',
    colors: 'warm earth tones, champagne gold, soft shadows',
    mood: 'contemplative, authentic, timeless',
    subjects: ['vineyards', 'cellars', 'artisan hands', 'vintage objects']
  },
  'culture': {
    style: 'art documentation, gallery aesthetic',
    colors: 'neutral whites, charcoal shadows, rose gold accents',
    mood: 'inspirational, curated, refined',
    subjects: ['craft process', 'art objects', 'workshop spaces', 'material textures']
  },
  'table': {
    style: 'food and beverage photography, sensory',
    colors: 'champagne gold, crystal clarity, warm candlelight',
    mood: 'sensual, celebratory, intimate',
    subjects: ['champagne glasses', 'bubbles', 'table settings', 'food pairings']
  },
  'news': {
    style: 'event photography, atmospheric',
    colors: 'ambient warm lighting, navy and gold',
    mood: 'anticipation, celebration, warmth',
    subjects: ['event spaces', 'silhouettes', 'invitation details', 'ambient scenes']
  }
}

// 프롬프트 생성 함수
function generateBrandPrompt(
  category: string,
  subject: string,
  additionalDetails?: string
): string {
  const template = CATEGORY_TEMPLATES[category] || CATEGORY_TEMPLATES['sea-log']

  const prompt = `
    ${subject}${additionalDetails ? `, ${additionalDetails}` : ''},
    ${template.style},
    ${COMMON_STYLE_PREFIX},
    color palette: ${template.colors},
    mood: ${template.mood}
  `.replace(/\s+/g, ' ').trim()

  return prompt
}

interface GenerateImageRequest {
  prompt: string
  category?: string
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9'
  additionalDetails?: string
}

export async function POST(request: NextRequest) {
  // 인증 확인
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // API 키 확인
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not configured' },
      { status: 500 }
    )
  }

  try {
    const requestBody: GenerateImageRequest = await request.json()
    const { prompt, category = 'sea-log', aspectRatio = '16:9', additionalDetails } = requestBody

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // 브랜드 가이드라인에 맞는 프롬프트 생성
    const enhancedPrompt = generateBrandPrompt(category, prompt, additionalDetails)

    // Google GenAI 클라이언트 생성
    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

    // Imagen 4로 이미지 생성
    const response = await genAI.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: enhancedPrompt,
      config: {
        numberOfImages: 1,
        aspectRatio,
        // 사람 얼굴 생성 방지 (브랜드 가이드라인)
        personGeneration: 'DONT_ALLOW' as const,
      },
    })

    // 생성된 이미지 추출
    if (!response.generatedImages || response.generatedImages.length === 0) {
      return NextResponse.json(
        { error: 'No images generated' },
        { status: 500 }
      )
    }

    const image = response.generatedImages[0]

    // Base64 이미지 데이터 반환
    return NextResponse.json({
      success: true,
      image: {
        base64: image.image?.imageBytes,
        mimeType: 'image/png',
      },
      prompt: enhancedPrompt,
    })
  } catch (error) {
    console.error('Error generating image:', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}
