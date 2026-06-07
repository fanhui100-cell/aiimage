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
  if (!checkRateLimit(rateLimitKey('study-plan', ip), RATE_LIMITS['study-plan'])) {
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

  const savedWordCount =
    typeof body.savedWordCount === 'number' && isFinite(body.savedWordCount)
      ? Math.max(0, Math.floor(body.savedWordCount))
      : 0

  const dailyGoal =
    typeof body.dailyGoal === 'number' && isFinite(body.dailyGoal)
      ? Math.min(Math.max(5, Math.floor(body.dailyGoal)), 120)
      : 15

  const weakAreas = Array.isArray(body.weakAreas)
    ? (body.weakAreas as unknown[])
        .filter(w => typeof w === 'string' && (w as string).trim().length > 0)
        .map(w => (w as string).trim().slice(0, 100))
        .slice(0, 5)
    : []

  try {
    const client = createAIClient()
    const response = await client.generateStudyPlan({
      userLevel: (body.userLevel as AIUserLevel) ?? undefined,
      savedWordCount,
      dailyGoal,
      weakAreas,
    })
    return NextResponse.json(response)
  } catch (err) {
    const aiErr = normalizeProviderError(err, AI_CONFIG.provider)
    return NextResponse.json({ error: safeErrorPayload(aiErr) }, { status: aiErr.code === 'rate_limit' ? 429 : 500 })
  }
}
