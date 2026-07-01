import { GoogleGenAI, ThinkingLevel } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// Gemini 3 Pro Preview를 사용한 뉴스레터 생성
const SYSTEM_PROMPT = `당신은 뮤즈드마레(Muse de Marée)의 뉴스레터 에디터입니다.
뮤즈드마레는 샴페인 하우스가 아니라, 바다의 시간을 기록하는 브랜드입니다. 샴페인은 프랑스 샹파뉴가 만들고, 그 변화는 한국 남해의 바다가 만듭니다. 모토는 "바다가 쓴 시간(Written by the Sea)"입니다.

## 뉴스레터 디자인 원칙
절제되고 미니멀한 웹 뉴스레터 형식으로 작성합니다.
- 배경색: 따뜻한 아이보리(#ECEAE6) 또는 흰색
- 텍스트: 드리프트우드 잉크(#312E2A)
- 악센트: 브래스(#CCAD7B) — 단 하나의 강조색
- 폰트: 세리프 제목(Cormorant Garamond), 산세리프 본문
- 레이아웃: 중앙 정렬, 충분한 여백, 각진 모서리(border-radius 0)

## 글쓰기 원칙: 콰이어트 럭셔리
- 소란스럽게 외치지 않고, 절제된 문장으로 조용하게 씁니다
- 숫자는 형용사보다 조용합니다 (수심 30m · 평균 11.4°C)
- 독자를 설득하지 않고, 관측한 기록을 보여줍니다
- 이모지, 과장 표현, "럭셔리 / 유일 / 한정" 류 자기수식을 쓰지 않습니다

## 뉴스레터 구조 (반드시 따르세요)
1. 헤더: 로고/브랜드명과 날짜
2. 메인 이미지 영역 (placeholder)
3. 메인 콘텐츠: 제목, 부제, 본문
4. CTA 버튼 (선택적)
5. 구분선
6. 푸터: 연락처, 구독 해지 링크

응답은 반드시 아래 JSON 형식으로 응답하세요:
{
  "subject": "이메일 제목",
  "preview_text": "미리보기 텍스트 (50자 이내)",
  "html_content": "완전한 HTML 뉴스레터 (인라인 CSS 포함)"
}`

interface GenerateNewsletterRequest {
  topic: string
  keyMessage: string
  includeImage?: boolean
  ctaText?: string
  ctaUrl?: string
  specialInstructions?: string
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json(
      { error: 'GOOGLE_AI_API_KEY is not configured' },
      { status: 500 }
    )
  }

  try {
    const body: GenerateNewsletterRequest = await request.json()
    const { topic, keyMessage, includeImage = true, ctaText, ctaUrl, specialInstructions } = body

    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY })

    const userPrompt = `
다음 조건에 맞는 이메일 뉴스레터를 HTML로 작성해주세요.

주제: ${topic}
핵심 메시지: ${keyMessage}
${includeImage ? '메인 이미지: 이미지 placeholder 영역 포함 (실제 URL은 나중에 교체)' : '메인 이미지: 없음'}
${ctaText ? `CTA 버튼 텍스트: ${ctaText}` : ''}
${ctaUrl ? `CTA 버튼 링크: ${ctaUrl}` : ''}
${specialInstructions ? `특별 지시: ${specialInstructions}` : ''}

HTML 뉴스레터 작성 규칙:
1. 이메일 클라이언트 호환을 위해 테이블 기반 레이아웃 사용
2. 모든 CSS는 인라인으로 작성
3. 최대 너비 600px, 중앙 정렬
4. 폰트: Georgia (제목), Arial (본문)
5. 색상: 배경 #FDFBF7, 텍스트 #1a1a2e, 악센트 #9a754b
6. 헤더에 "LE JOURNAL DE MARÉE" 텍스트 로고
7. 푸터에 "© 2025 Muse de Marée. All rights reserved." 포함
8. 구독 해지 링크 placeholder: {{unsubscribe_url}}
9. 이미지 placeholder URL: https://via.placeholder.com/600x400

JSON 형식으로만 응답하세요. 다른 텍스트 없이 순수 JSON만 반환하세요.
`

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: SYSTEM_PROMPT + '\n\n' + userPrompt,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
      },
    })

    const responseText = response.text || ''

    // JSON 파싱
    let parsed
    try {
      // JSON 블록 추출
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      console.error('Raw response:', responseText.substring(0, 500))
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      subject: parsed.subject || '',
      preview_text: parsed.preview_text || '',
      html_content: parsed.html_content || '',
    })
  } catch (error) {
    console.error('Error generating newsletter:', error)
    return NextResponse.json(
      { error: 'Failed to generate newsletter' },
      { status: 500 }
    )
  }
}
