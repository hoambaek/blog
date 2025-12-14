import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { uploadToR2, generateUniqueFilename } from '@/lib/r2/client'

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
  imageType?: 'cover' | 'content'  // cover: 4K, content: 1K
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
    const { prompt, category = 'sea-log', aspectRatio = '16:9', additionalDetails, imageType = 'content' } = requestBody

    // 이미지 타입에 따른 해상도 설정: cover(4K), content(1K)
    const imageSize = imageType === 'cover' ? '4K' : '1K'

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // 브랜드 가이드라인에 맞는 프롬프트 생성
    const basePrompt = generateBrandPrompt(category, prompt, additionalDetails)
    // 이미지 생성을 명시적으로 요청
    const enhancedPrompt = `Generate a high-quality photograph image of: ${basePrompt}. Do not include any text in the image.`

    // Google GenAI 클라이언트 생성
    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

    // Gemini 3 Pro Image Preview로 이미지 생성
    const response = await genAI.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: enhancedPrompt,
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: imageSize,
        },
      },
    })

    console.log('Gemini response:', JSON.stringify(response, null, 2))

    // 생성된 이미지 추출
    const candidates = response.candidates
    if (!candidates || candidates.length === 0) {
      console.error('No candidates in response')
      return NextResponse.json(
        { error: 'No images generated' },
        { status: 500 }
      )
    }

    // 이미지 데이터 찾기
    const parts = candidates[0].content?.parts || []
    console.log('Response parts:', JSON.stringify(parts, null, 2))

    let base64Data: string | undefined
    let mimeType: string = 'image/png'

    for (const part of parts) {
      // @ts-expect-error - inlineData type might not be fully typed
      if (part.inlineData) {
        // @ts-expect-error - inlineData type might not be fully typed
        base64Data = part.inlineData.data
        // @ts-expect-error - inlineData type might not be fully typed
        mimeType = part.inlineData.mimeType || 'image/png'
        break
      }
    }

    if (!base64Data) {
      console.error('No inlineData found in parts:', parts)
      return NextResponse.json(
        { error: 'No image data in response' },
        { status: 500 }
      )
    }

    // mimeType에 따른 파일 확장자 결정
    const extension = mimeType === 'image/jpeg' ? 'jpg' : 'png'

    // Buffer로 변환하여 R2에 업로드
    const buffer = Buffer.from(base64Data, 'base64')
    const filename = generateUniqueFilename(`ai-generated.${extension}`)
    const key = `posts/${filename}`

    const imageUrl = await uploadToR2(buffer, key, mimeType)

    return NextResponse.json({
      success: true,
      imageUrl,
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
