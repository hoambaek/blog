import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  buildTranslationPrompt,
  estimateResponseChars,
  parseTranslationResponse,
  TRANSLATION_MODEL,
  TRANSLATION_MAX_TOKENS,
  type TranslationInput,
} from '@/lib/translation'

// 번역이 본문 길이에 따라 20~60초 걸리므로 여유를 둔다
export const maxDuration = 300

// 진행 이벤트를 ndjson으로 스트리밍: {type:'progress',pct} ... {type:'result',translation} | {type:'error',message}
export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ type: 'error', message: 'Unauthorized' }, { status: 401 })
  }

  const input: TranslationInput = await request.json()
  const hasAnything = input.title || input.excerpt || input.content || input.metaTitle || input.metaDescription
  if (!hasAnything) {
    return Response.json({ type: 'error', message: '번역할 내용이 없습니다.' }, { status: 400 })
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ type: 'error', message: 'ANTHROPIC_API_KEY가 설정되지 않았습니다.' }, { status: 500 })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const prompt = buildTranslationPrompt(input)
  const estimated = estimateResponseChars(input)
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'))
        } catch {
          // 클라이언트가 먼저 끊은 경우 — 무시
        }
      }
      try {
        const msgStream = anthropic.messages.stream({
          model: TRANSLATION_MODEL,
          max_tokens: TRANSLATION_MAX_TOKENS,
          messages: [{ role: 'user', content: prompt }],
        })

        let received = 0
        let lastPct = 0
        msgStream.on('text', (delta) => {
          received += delta.length
          const pct = Math.min(99, Math.round((received / estimated) * 100))
          if (pct >= lastPct + 2) {
            lastPct = pct
            send({ type: 'progress', pct })
          }
        })

        const final = await msgStream.finalMessage()

        if (final.stop_reason === 'max_tokens') {
          send({ type: 'error', message: '번역 응답이 최대 길이에 도달해 잘렸습니다. 본문이 너무 깁니다.' })
          return
        }
        const textBlock = final.content.find((block) => block.type === 'text')
        const translation = parseTranslationResponse(textBlock && textBlock.type === 'text' ? textBlock.text : '')
        if (translation) {
          send({ type: 'progress', pct: 100 })
          send({ type: 'result', translation })
        } else {
          send({ type: 'error', message: '번역 응답을 해석하지 못했습니다.' })
        }
      } catch (error) {
        console.error('Streaming translation error:', error)
        const message = error instanceof Error ? error.message : String(error)
        send({ type: 'error', message: `영문 번역 중 오류가 발생했습니다(${message}).` })
      } finally {
        try {
          controller.close()
        } catch {
          // 이미 닫힌 경우 무시
        }
      }
    },
  })

  return new Response(stream, {
    headers: {
      'content-type': 'application/x-ndjson; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
    },
  })
}
