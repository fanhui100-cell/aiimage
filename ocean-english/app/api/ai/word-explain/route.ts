import { NextRequest, NextResponse } from 'next/server'
import { createAIClient } from '@/lib/ai/ai-client'
import { AI_CONFIG } from '@/lib/ai/ai-config'
import { normalizeProviderError, safeErrorPayload } from '@/lib/ai/ai-errors'
import { checkRateLimit, getClientIP, RATE_LIMITS, rateLimitKey } from '@/lib/ai/ai-rate-limit'
import { cacheGet, cacheSet, makeCacheKey } from '@/lib/ai/ai-cache'
import type { AIUserLevel } from '@/types/ai'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // Rate limit check
  const ip = getClientIP(req)
  if (!checkRateLimit(rateLimitKey('word-explain', ip), RATE_LIMITS['word-explain'])) {
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

  if (typeof body.word !== 'string' || !body.word.trim()) {
    return NextResponse.json(
      { error: { code: 'invalid_input', message: 'word (non-empty string) is required', retryable: false } },
      { status: 400 },
    )
  }

  const word = body.word.trim().slice(0, 100)
  const userLevel = (body.userLevel as AIUserLevel) ?? 'intermediate'
  const context =
    typeof body.context === 'string' ? body.context.slice(0, 500) : undefined

  // Cache lookup — word explanations are deterministic and safe to cache
  if (AI_CONFIG.enableCache) {
    const key = makeCacheKey('word-explain', word.toLowerCase(), userLevel)
    const cached = cacheGet(key)
    if (cached) {
      return NextResponse.json({ content: cached, provider: AI_CONFIG.provider, cached: true })
    }
  }

  try {
    const client = createAIClient()
    const response = await client.explainWord({ word, userLevel, context })

    // Cache successful response
    if (AI_CONFIG.enableCache) {
      const key = makeCacheKey('word-explain', word.toLowerCase(), userLevel)
      cacheSet(key, response.content)
    }

    return NextResponse.json(response)
  } catch (err) {
    const aiErr = normalizeProviderError(err, AI_CONFIG.provider)
    return NextResponse.json({ error: safeErrorPayload(aiErr) }, { status: aiErr.code === 'rate_limit' ? 429 : 500 })
  }
}
