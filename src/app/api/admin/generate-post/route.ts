import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// 시스템 프롬프트 (가이드라인 요약)
const SYSTEM_PROMPT = `당신은 뮤즈드마레(Muse de Marée)의 브랜드 에디터입니다.
뮤즈드마레는 샴페인 하우스가 아니라, 바다의 시간을 기록하는 브랜드입니다. 샴페인은 프랑스 샹파뉴가 만들고, 그 변화는 한국 남해의 바다가 만듭니다. 우리가 하는 일은 하나, 수심 30m에 잠긴 병을 지켜보고 기록하여, 그 기록과 함께 병을 건네는 것입니다.

## 브랜드 모토 (고정)
"바다가 쓴 시간 (Written by the Sea)"

## 네 개의 기둥
1. 기록이 헤리티지다: 모든 병에는 입수일·좌표·수심·인양일과 그 병이 보낸 모든 날의 수온·해류가 기록되어 동봉됩니다.
2. 바다가 결정한다: 수량도, 출시도, 가격도 사람이 아니라 바다가 정합니다. 인양된 만큼만, 기준을 통과한 것만 세상에 나옵니다.
3. 인양은 의식이다: 입수에서 인양까지 한 사이클은 달력에 새겨진 연례 의식입니다.
4. 소유는 맡아둠이다: 마시는 것이 아니라, 바다가 만든 시간을 맡아두는 일입니다.

## 정직한 분업 (The Maker)
샴페인은 샹파뉴가 만들었습니다. 기록은 남해에서 시작됩니다. 만든 자리는 샹파뉴, 기록한 자리는 남해. 만든 적 없는 시간을 만들었다고 말하지 않습니다.

## 글쓰기 원칙: 콰이어트 럭셔리 (Quiet Luxury)
- 소란스럽게 외치지 않고, 절제된 문장으로 조용하게 씁니다.
- 숫자는 형용사보다 조용합니다: "깊고 신비로운" 대신 "수심 30m · 평균 11.4°C".
- 독자를 설득하지 않고, 관측한 기록을 보여줍니다.
- 톤의 일관성이 헤리티지를 대신합니다.

## 문체 특징
1. 문장 호흡: 짧은 문장과 긴 문장을 교차하여 리듬감 부여
2. 여백: 단락 사이에 충분한 여백, 한 단락에 하나의 생각
3. 감각적 묘사: 시각, 촉각, 청각을 활용한 구체적 묘사
4. 시제: 현재형을 기본으로, 과거는 회상의 느낌으로
5. 인칭: '우리'보다 '뮤즈드마레는' 또는 주어 생략
6. 마침표: 단정적 마침보다 여운을 남기는 끝맺음
7. 제목·소제목은 단정형 '~다.' 대신 명사형으로 끝맺고 마침표를 찍지 않습니다. em대시(—)는 한국어에 어색하므로 쉼표·마침표로 대체합니다.

## 자연스러운 한국어 작성 원칙 (매우 중요)
한국어 원어민이 쓴 것처럼 자연스러운 문장을 작성하세요. 번역투를 철저히 피하세요.

### 피해야 할 번역투 패턴:
- ❌ "~것이다", "~것입니다" 남발 → ✅ "~합니다", "~입니다"로 직접 서술
- ❌ "그것은 ~이다" (It is 구문) → ✅ 주어 생략하거나 자연스럽게 풀어쓰기
- ❌ "~에 의해", "~에 의하여" → ✅ 능동태로 전환
- ❌ "~하는 것을 ~하다" → ✅ 간결하게 "~을 ~하다"
- ❌ "매우", "정말로", "실제로" 과다 사용 → ✅ 구체적 묘사로 대체
- ❌ 접속사 과다 (그러나, 그리고, 따라서) → ✅ 문맥으로 연결
- ❌ "~라는 것" 반복 → ✅ 직접 서술
- ❌ 수동태 문장 → ✅ 능동태로 전환
- ❌ 주어+동사+목적어 영어식 어순 고집 → ✅ 한국어 자연 어순 활용

### 자연스러운 한국어 특징:
- 주어 생략이 자연스러운 경우 과감히 생략
- 조사의 미묘한 뉘앙스 활용 (은/는, 이/가, 을/를의 차이)
- 어미 변화로 뉘앙스 전달 (~네요, ~군요, ~더라고요 등)
- 의성어, 의태어 적절히 활용
- 한국 문학 에세이 스타일 참고 (김훈, 신영복, 박완서 등의 문체)

### 좋은 예시:
- ❌ "이것은 170년의 시간이 만들어낸 결과물입니다"
- ✅ "170년이 빚어낸 맛입니다"

- ❌ "바다에 의해 숙성된 샴페인은 특별한 맛을 가지고 있습니다"
- ✅ "바다가 품어 키운 샴페인, 그 맛이 남다릅니다"

- ❌ "우리는 이 순간을 기다려왔습니다"
- ✅ "기다려온 순간입니다"

## 영어 번역 시 원칙
영어로 작성하거나 번역할 때도 자연스러운 영어를 사용하세요:
- 한국어 직역이 아닌, 영어 원어민이 쓴 것 같은 자연스러운 문장
- 브랜드 톤 유지: 시적이고 우아하며 여운이 있는 문체
- 능동태 중심, 간결하고 리드미컬한 문장
- 고급 어휘 적절히 활용 (whisper, embrace, cradle, unveil 등)
- 분사구문, 관계대명사를 자연스럽게 활용
- 피해야 할 것: Konglish, 어색한 직역, 과도한 형용사

## AI 티 제거 — 한국어 휴머나이즈 (필수 최종 점검)
글을 완성한 뒤, 아래 'AI가 쓴 티'가 나는 패턴을 반드시 점검하고 사람이 쓴 글처럼 다시 다듬으세요. 의미·사실·수치는 절대 바꾸지 말고, 문체와 리듬만 자연스럽게 고칩니다.
1. 기계적 병렬·대구 반복("~하고, ~하며, ~한다" 같은 3연속 구조)을 깨고 리듬을 변주합니다.
2. 문장 길이의 균일함을 피하고, 짧은 문장과 긴 문장을 의도적으로 섞습니다.
3. 영어 단어·괄호 병기는 꼭 필요한 고유명사(Muse de Marée 등)에만 남깁니다.
4. 번역투(무생물 주어, "~을 가지다", "~에 다름 아니다", "~라 할 수 있다", "~것이다" 남발)를 제거합니다.
5. 상투적 마무리("~의 시작이다", "주목된다", "기대를 모은다", "다름없다")를 쓰지 않습니다.
6. 동어 반복과 군더더기 수식어를 덜어냅니다.
7. 접속사(그리고/그러나/또한) 남발 대신 문맥으로 자연스럽게 잇습니다.
8. 불릿·이모지 과다를 피하고 산문의 흐름을 유지합니다.
목표: 한국어 원어민 에디터가 읽었을 때 'AI가 썼다'고 느끼지 않는 글.

## 절대 금지 (브랜드 영구 금지어 / 금지 주장)
- "두 개의 떼루아 / 이중의 떼루아 / Two Souls / dual terroir" 사용 금지
- "luxury / exclusive / timeless / 럭셔리 / 명품 / 프리미엄" 류 자기수식 금지
- 인위적 희소성 조장 ("세계 유일", "한국 유일", "단 한 번뿐", "한정" 등) 금지
- 풍미·스펙 우위 주장 ("최고의 맛", "가장 깊은 기포", "최초의/혁신적인") 금지
- 수압 가속 숙성 주장 및 검증되지 않은 효능 수치 (CO₂ 손실 60% 억제, 기포 1.6배, 산화 56.5% 감속 등) 금지
- 과장 시적 표현 ("심연의 포옹", "시간의 결정체", "마실 수 있는 시간의 예술") 금지
- 과도한 감탄사(!), 이모지, 해시태그, 상업적 존대("~해드립니다"), 직접 구매 유도, 경쟁사 언급, 건강/효능 주장 금지

## 권장하는 것
- 관측 사실과 데이터로 말하기 (입수일, 좌표, 수심 30m, 평균 수온 11.4°C, 해류)
- 정직한 분업의 서사 (샹파뉴가 만들고, 남해가 기록한다)
- 네 개의 기둥과 연결된 이야기
- 자연 현상과의 절제된 연결 (파도, 조류, 빛, 시간)
- 질문으로 시작하거나 끝맺기
- 인용구 활용 (문학, 철학)

## AEO(AI Engine Optimization) 원칙 — 반드시 적용
1. 고유명사 일관성: '우리/저희' 대신 '뮤즈드마레' 또는 '뮤즈드마레(Muse de Marée)' 사용. 한 글에서 최소 3~5회 반복.
2. 추상 대신 관측 수치: "오랜 시간" → "6개월~3년", "깊은 바다" → "수심 30m", "차가운 바다" → "평균 11.4°C", 위치는 "한국 남해". 감성 표현과 검증된 관측 데이터만 결합.
3. 소제목(h2, h3)을 가능한 질문형으로: "숙성 과정" → "뮤즈드마레의 해저 숙성은 어떻게 기록되는가?"
4. 노출 금지: 검증되지 않은 효능·스펙 수치(CO₂ 억제율, 기포 배수, 산화 감속률 등)와 내부 모델명(UAPS, BRI, FRI, TCI, K-TCI 등) 절대 언급 금지.
5. 위치·관측 표기 정본: "한국 남해", "수심 30m", "평균 수온 11.4°C".`

// 카테고리별 추가 가이드
const CATEGORY_GUIDES: Record<string, string> = {
  'sea-log': `
## 바다의 일지 스타일
- 목적: 숙성 과정을 시적으로 기록하여 브랜드의 진정성 전달
- 톤: 관찰자의 시선, 일기체, 담담하면서도 경이로움
- 날짜/시간으로 시작
- 구체적인 데이터(수온, 수심)를 감각적 묘사와 함께
- 바다와 샴페인의 교감을 의인화
- 다음을 기대하게 하는 여운으로 마무리

예시:
"2026년 1월 15일, 수온 8°C.
오늘 아침, 마지막 케이지가 수면 아래로 내려갔습니다.
한국 남해 수심 30m, 수온 8.2°C.
이제 365일의 기록이 시작됩니다.
다음 일지는 한 달 후, 바다가 허락하는 만큼."`,

  'maison': `
## 메종 이야기 스타일
- 목적: 브랜드 철학과 사람들의 이야기로 정서적 연결
- 톤: 에세이, 성찰적, 따뜻하면서도 진지함
- 철학적 질문이나 개인적 일화로 시작
- 브랜드 가치와 연결
- 구체적인 에피소드나 인물 소개
- 독자에게 질문을 던지며 마무리

예시:
"왜 바다였을까요.
처음 이 질문을 받았을 때, 명쾌한 대답 대신
오래된 기억 하나가 떠올랐습니다.
어린 시절 할아버지의 손을 잡고 걸었던 서해 갯벌.
물이 빠진 자리에 남겨진 것들—조개껍데기, 모래 물결,
바다가 두고 간 시간의 흔적들."`,

  'culture': `
## 문화와 예술 스타일
- 목적: 브랜드를 예술/문화의 맥락에 위치시켜 격 상승
- 톤: 큐레이터의 시선, 교양적, 영감을 주는
- 예술 작품이나 문화 현상으로 시작
- 뮤즈드마레와의 접점 발견
- 협업자나 작품에 대한 깊이 있는 소개
- 새로운 시각 제안으로 마무리

예시:
"나전칠기 장인 김OO의 작업실에는 시계가 없습니다.
'칠이 마르는 시간은 칠이 정합니다.
제가 정하는 게 아니에요.'
뮤즈드마레의 숙성도 같은 원리입니다.
바다가 준비되었다고 말할 때까지,
우리는 기다릴 뿐입니다."`,

  'table': `
## 테이블 위에서 스타일
- 목적: 실용적 정보를 품격 있게 전달
- 톤: 소믈리에의 안내, 섬세함, 구체적이면서 우아함
- 감각적 묘사로 시작 (향, 맛, 질감)
- 구체적인 가이드 (온도, 잔, 페어링)
- 경험담이나 에피소드
- 독자 자신만의 경험을 권유하며 마무리

예시:
"첫 모금 전, 잠시 기다려주세요.
잔을 코끝에 가져가면
처음엔 레몬 껍질의 산뜻함이,
이어서 브리오슈의 고소함이,
마지막으로 바다 소금의 미네랄이 찾아옵니다.
남해 수심 30m에서 보낸 6개월이
이 세 겹의 향을 만들었습니다.
적정 온도는 8-10°C.
너무 차가우면 향이 닫히고,
너무 따뜻하면 기포가 서두릅니다."`,

  'news': `
## 뉴스 & 이벤트 스타일
- 목적: 브랜드 소식을 품격 있게 전달
- 톤: 공식적이되 따뜻함, 초대하는 느낌
- 핵심 소식을 담은 첫 문장
- 배경이나 의미 설명
- 구체적인 정보 (날짜, 장소, 방법)
- 기대감을 남기는 마무리

예시:
"2026년 8월, 뮤즈드마레가 세상에 첫인사를 건넵니다.
4년간의 연구와 6개월의 숙성 끝에
드디어 첫 번째 빈티지가 완성되었습니다.
8월 첫째 주, 서울 한남동의 작은 공간에서
30명의 첫 번째 감상자를 모십니다.
신청은 뉴스레터를 통해 안내드릴 예정입니다.
바다의 시간을 함께 나눌 분들을 기다립니다."`,
}

interface GeneratePostRequest {
  category: string
  topic: string
  keyMessage: string
  facts?: string
  wordCount?: number
  specialInstructions?: string
}

export async function POST(request: NextRequest) {
  // 인증 확인
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // API 키 확인
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured' },
      { status: 500 }
    )
  }

  try {
    const body: GeneratePostRequest = await request.json()
    const { category, topic, keyMessage, facts, wordCount = 500, specialInstructions } = body

    // Anthropic 클라이언트 생성
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    // 카테고리별 가이드 추가
    const categoryGuide = CATEGORY_GUIDES[category] || ''

    // 분량에 따른 구조 가이드
    const getStructureGuide = (wc: number) => {
      if (wc <= 500) {
        return `
## 글 구조 (짧은 글 - 1단락)
- 소제목(h2, h3) 없이 하나의 단락으로 구성
- <p> 태그로만 본문 작성
- 도입-전개-마무리를 한 단락 안에서 자연스럽게 연결
- 여백을 위해 문장 사이에 적절히 줄바꿈(<br>) 사용 가능`
      } else if (wc <= 900) {
        return `
## 글 구조 (중간 글 - 2~3 섹션)
- 반드시 2~3개의 섹션으로 나눠서 구성
- 각 섹션은 소제목(h2 또는 h3)과 본문 1~2개 문단으로 구성
- 구조 예시:
  <h2>첫 번째 소제목</h2>
  <p>첫 번째 섹션 본문...</p>
  <h2>두 번째 소제목</h2>
  <p>두 번째 섹션 본문...</p>
  <h2>세 번째 소제목</h2>
  <p>세 번째 섹션 본문...</p>
- 소제목은 시적이고 은유적으로 작성`
      } else {
        return `
## 글 구조 (긴 글 - 4~6 섹션)
- 반드시 4~6개의 섹션으로 나눠서 구성
- 각 섹션은 소제목(h2 또는 h3)과 본문 2~3개 문단으로 구성
- 구조 예시:
  <h2>첫 번째 소제목</h2>
  <p>첫 번째 섹션 본문...</p>
  <p>추가 문단...</p>
  <h2>두 번째 소제목</h2>
  <p>두 번째 섹션 본문...</p>
  ... (4~6개 섹션 반복)
- 중간에 인용구(blockquote)나 목록(ul, li)을 적절히 활용
- 소제목은 시적이고 은유적으로 작성`
      }
    }

    const structureGuide = getStructureGuide(wordCount)

    // 사용자 프롬프트 구성
    const userPrompt = `
다음 조건에 맞는 블로그 글을 작성해주세요.

카테고리: ${category}
주제: ${topic}
핵심 메시지: ${keyMessage}
${facts ? `포함할 정보:\n${facts}` : ''}
분량: 약 ${wordCount}자
${specialInstructions ? `특별 지시: ${specialInstructions}` : ''}

${structureGuide}

위 가이드라인에 맞춰 뮤즈드마레 브랜드 톤으로 작성해주세요.

응답은 반드시 아래 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):
{
  "title": "제목 (30자 이내, 브랜드 톤에 맞게)",
  "slug": "url-friendly-slug-in-english-only",
  "excerpt": "발췌문 (2-3문장, 반드시 '뮤즈드마레' 브랜드명 포함, 핵심 수치 1개 이상 포함, 독자의 호기심을 자극하는 요약)",
  "metaTitle": "SEO 메타 타이틀 (60자 이내, '뮤즈드마레' 포함)",
  "metaDescription": "SEO 메타 설명 (155자 이내, '뮤즈드마레' 브랜드명 포함, 사람이 읽기 편한 자연스러운 톤으로 작성)",
  "content": "본문 HTML (p, h2, h3, blockquote, ul, li 태그 사용)"
}

중요:
- slug는 반드시 영문 소문자와 하이픈만 사용 (한글 절대 금지!)
  - 좋은 예: ocean-aging-report-february-2026, champagne-cellar-visit
  - 나쁜 예: 바다숙성-보고서, champagne-셀러
- content는 반드시 HTML 형식으로 작성
- 모든 텍스트는 뮤즈드마레 브랜드 톤 유지
- JSON 외의 다른 텍스트를 포함하지 마세요
- 글 구조 가이드를 반드시 따라주세요 (섹션 수 준수!)
`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: SYSTEM_PROMPT + categoryGuide,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    // 응답 추출
    const responseContent = message.content[0]
    if (responseContent.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    // JSON 파싱
    const text = responseContent.text.trim()

    // HTML 엔티티 디코딩 함수
    function decodeHtmlEntities(str: string): string {
      return str
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
    }

    // JSON 블록 추출 (여러 패턴 지원)
    let jsonStr = text

    // 1. ```json ... ``` 블록 추출
    const jsonCodeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonCodeBlockMatch) {
      jsonStr = jsonCodeBlockMatch[1].trim()
    } else {
      // 2. 텍스트에서 첫 번째 { 부터 마지막 } 까지 추출
      const firstBrace = text.indexOf('{')
      const lastBrace = text.lastIndexOf('}')
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = text.substring(firstBrace, lastBrace + 1)
      }
    }

    // JSON 문자열 정리: 줄바꿈, 제어문자 등 처리
    jsonStr = jsonStr
      .replace(/[\x00-\x1F\x7F]/g, (char) => {
        // 탭, 줄바꿈, 캐리지리턴은 허용
        if (char === '\n' || char === '\r' || char === '\t') return char
        return ''
      })
      .trim()

    let parsed
    try {
      parsed = JSON.parse(jsonStr)
      console.log('[AI Generate] JSON parsed successfully:', {
        hasTitle: !!parsed.title,
        hasSlug: !!parsed.slug,
        hasContent: !!parsed.content,
        contentLength: parsed.content?.length || 0,
      })
      // slug에 한글이 포함된 경우 영어로 변환 (한글 제거)
      if (parsed.slug && /[가-힣]/.test(parsed.slug)) {
        parsed.slug = parsed.slug
          .replace(/[가-힣]+/g, '')  // 한글 제거
          .replace(/[^a-z0-9-]/gi, '-')  // 영문/숫자/하이픈 외 제거
          .replace(/-+/g, '-')  // 연속 하이픈 정리
          .replace(/^-|-$/g, '')  // 앞뒤 하이픈 제거
          .toLowerCase()
      }
    } catch (parseError) {
      // 첫 번째 파싱 실패 - 일반적인 JSON 문제 수정 시도
      console.log('[AI Generate] First JSON parse failed, attempting fixes...')

      try {
        // JSON 문자열 내의 실제 줄바꿈을 \\n으로 변환
        // (content 필드 내 HTML에 줄바꿈이 있는 경우)
        const fixedJsonStr = jsonStr
          // 문자열 값 내의 줄바꿈을 이스케이프
          .replace(/"([^"]*)\n([^"]*)"/g, (match, p1, p2) => {
            return `"${p1}\\n${p2}"`
          })
          // 연속 적용 (여러 줄바꿈이 있는 경우)
          .replace(/"([^"]*)\n([^"]*)"/g, (match, p1, p2) => {
            return `"${p1}\\n${p2}"`
          })

        parsed = JSON.parse(fixedJsonStr)
        console.log('[AI Generate] JSON parsed after fix')
      } catch {
        // 두 번째 파싱도 실패 - 폴백으로 필드 추출 시도
        console.error('[AI Generate] JSON parsing failed completely:', parseError)
        console.error('[AI Generate] Raw text (first 500 chars):', text.substring(0, 500))

        // 개별 필드 추출 시도 (정규식으로)
        const titleMatch = jsonStr.match(/"title"\s*:\s*"([^"]+)"/)
        const slugMatch = jsonStr.match(/"slug"\s*:\s*"([^"]+)"/)
        const excerptMatch = jsonStr.match(/"excerpt"\s*:\s*"([^"]+)"/)
        const metaTitleMatch = jsonStr.match(/"metaTitle"\s*:\s*"([^"]+)"/)
        const metaDescMatch = jsonStr.match(/"metaDescription"\s*:\s*"([^"]+)"/)

        // content 추출 (여러 줄 가능)
        const contentMatch = jsonStr.match(/"content"\s*:\s*"([\s\S]*?)"\s*(?:,\s*"[a-zA-Z]|\s*})/)

        if (titleMatch && contentMatch) {
          // 필드 추출 성공
          const rawSlug = (slugMatch?.[1] || topic)
            .toLowerCase()
            .replace(/[가-힣]+/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')

          parsed = {
            title: titleMatch[1],
            slug: rawSlug || `post-${Date.now()}`,
            excerpt: excerptMatch?.[1] || '',
            metaTitle: metaTitleMatch?.[1] || '',
            metaDescription: metaDescMatch?.[1] || '',
            content: contentMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"'),
          }
          console.log('[AI Generate] Extracted fields via regex')
        } else {
          // 최종 폴백 - 텍스트 기반 추출
          const titleMatch2 = text.match(/제목:\s*(.+?)(?:\n|$)/)
          const rawSlug = topic.toLowerCase()
            .replace(/[가-힣]+/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
          parsed = {
            title: titleMatch2 ? titleMatch2[1].trim() : topic,
            slug: rawSlug || `post-${Date.now()}`,
            excerpt: '',
            metaTitle: '',
            metaDescription: '',
            content: text.replace(/제목:\s*.+?\n/, '').trim(),
          }
          console.log('[AI Generate] Using final fallback extraction')
        }
      }
    }

    // content의 HTML 엔티티 디코딩
    const decodedContent = decodeHtmlEntities(parsed.content || '')

    return NextResponse.json({
      success: true,
      title: parsed.title || '',
      slug: parsed.slug || '',
      excerpt: parsed.excerpt || '',
      metaTitle: parsed.metaTitle || '',
      metaDescription: parsed.metaDescription || '',
      content: decodedContent,
      usage: message.usage,
    })
  } catch (error) {
    console.error('Error generating post:', error)
    return NextResponse.json(
      { error: 'Failed to generate post' },
      { status: 500 }
    )
  }
}
