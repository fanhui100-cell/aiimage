import { NextRequest, NextResponse } from 'next/server'
import { createAIClient } from '@/lib/ai/ai-client'
import { AI_CONFIG } from '@/lib/ai/ai-config'
import { normalizeProviderError, safeErrorPayload } from '@/lib/ai/ai-errors'
import { checkRateLimit, getClientIP, RATE_LIMITS, rateLimitKey } from '@/lib/ai/ai-rate-limit'
import type { AIUserLevel } from '@/types/ai'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // Rate limit check
  const ip = getClientIP(req)
  if (!(await checkRateLimit(rateLimitKey('quiz-generate', ip), RATE_LIMITS['quiz-generate']))) {
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

  if (!Array.isArray(body.words)) {
    return NextResponse.json(
      { error: { code: 'invalid_input', message: 'words (array of strings) is required', retryable: false } },
      { status: 400 },
    )
  }

  // Filter and sanitize words — reject after filtering if nothing valid remains
  const words = (body.words as unknown[])
    .filter(w => typeof w === 'string' && (w as string).trim().length > 0)
    .map(w => (w as string).trim().slice(0, 100))
    .slice(0, 20)

  if (words.length === 0) {
    return NextResponse.json(
      { error: { code: 'invalid_input', message: 'No valid words provided after filtering', retryable: false } },
      { status: 400 },
    )
  }

  const questionCount = typeof body.questionCount === 'number'
    ? Math.min(Math.max(1, Math.floor(body.questionCount)), 10)
    : 5

  const allowedTypes = ['multiple_choice', 'fill_blank', 'definition_match']
  const questionType =
    typeof body.questionType === 'string' && allowedTypes.includes(body.questionType)
      ? (body.questionType as 'multiple_choice' | 'fill_blank' | 'definition_match')
      : 'multiple_choice'

  try {
    const client = createAIClient()
    const response = await client.generateQuiz({
      words,
      userLevel: (body.userLevel as AIUserLevel) ?? undefined,
      questionCount,
      questionType,
    })
    return NextResponse.json(response)
  } catch (err) {
    const aiErr = normalizeProviderError(err, AI_CONFIG.provider)
    return NextResponse.json({ error: safeErrorPayload(aiErr) }, { status: aiErr.code === 'rate_limit' ? 429 : 500 })
  }
}
