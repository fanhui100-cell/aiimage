import { NextRequest, NextResponse } from 'next/server'
import { createAIClient } from '@/lib/ai/ai-client'
import { AI_CONFIG } from '@/lib/ai/ai-config'
import { normalizeProviderError, safeErrorPayload } from '@/lib/ai/ai-errors'
import { checkRateLimit, getClientIP, RATE_LIMITS, rateLimitKey } from '@/lib/ai/ai-rate-limit'
import type { AIUserLevel, MistakeAnalysisRequest } from '@/types/ai'

export const runtime = 'nodejs'

function sanitizeString(val: unknown, maxLen: number): string {
  return typeof val === 'string' ? val.trim().slice(0, maxLen) : ''
}

export async function POST(req: NextRequest) {
  // Rate limit check
  const ip = getClientIP(req)
  if (!checkRateLimit(rateLimitKey('mistake-analysis', ip), RATE_LIMITS['mistake-analysis'])) {
    return NextResponse.json(
      { error: { code: 'rate_limit', message: 'Too many requests. Please wait a moment.', retryable: true } },
      { status: 429 },
    )
  }

  // Parse body — return 400 on malformed JSON
  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json(
      { error: { code: 'invalid_input', message: 'Invalid JSON in request body', retryable: false } },
      { status: 400 },
    )
  }

  if (!Array.isArray(body.wrongAnswers)) {
    return NextResponse.json(
      { error: { code: 'invalid_input', message: 'wrongAnswers (array) is required', retryable: false } },
      { status: 400 },
    )
  }

  // All four core fields must be present and non-empty strings.
  // Entries missing any core field are rejected; error names the actual missing fields.
  const rawEntries = body.wrongAnswers as unknown[]

  const CORE_FIELDS = ['word', 'question', 'userAnswer', 'correctAnswer'] as const

  function getMissingFields(w: unknown): string[] {
    if (typeof w !== 'object' || w === null) return [...CORE_FIELDS]
    const e = w as Record<string, unknown>
    return CORE_FIELDS.filter(f => typeof e[f] !== 'string' || (e[f] as string).trim().length === 0)
  }

  const firstInvalid = rawEntries
    .map((w, i) => ({ index: i, missing: getMissingFields(w) }))
    .find(e => e.missing.length > 0)

  if (firstInvalid) {
    return NextResponse.json(
      {
        error: {
          code: 'invalid_input',
          message: `Entry at index ${firstInvalid.index} is missing required fields: ${firstInvalid.missing.join(', ')}`,
          retryable: false,
        },
      },
      { status: 400 },
    )
  }

  const wrongAnswers: MistakeAnalysisRequest['wrongAnswers'] = rawEntries
    .slice(0, 20)
    .map(w => {
      const e = w as Record<string, unknown>
      return {
        word: sanitizeString(e.word, 100),
        question: sanitizeString(e.question, 500),
        userAnswer: sanitizeString(e.userAnswer, 200),
        correctAnswer: sanitizeString(e.correctAnswer, 200),
      }
    })

  try {
    const client = createAIClient()
    const response = await client.analyzeMistakes({
      wrongAnswers,
      userLevel: (body.userLevel as AIUserLevel) ?? undefined,
    })
    return NextResponse.json(response)
  } catch (err) {
    const aiErr = normalizeProviderError(err, AI_CONFIG.provider)
    return NextResponse.json({ error: safeErrorPayload(aiErr) }, { status: aiErr.code === 'rate_limit' ? 429 : 500 })
  }
}
