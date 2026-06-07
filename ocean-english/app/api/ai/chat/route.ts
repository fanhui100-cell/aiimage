import { NextRequest, NextResponse } from 'next/server'
import { createAIClient } from '@/lib/ai/ai-client'
import { AI_CONFIG } from '@/lib/ai/ai-config'
import { normalizeProviderError, safeErrorPayload } from '@/lib/ai/ai-errors'
import { checkRateLimit, getClientIP, RATE_LIMITS, rateLimitKey } from '@/lib/ai/ai-rate-limit'
import type { AIMessage, AIRequestContext, AIUserLevel } from '@/types/ai'

export const runtime = 'nodejs'

function isClientMessage(m: unknown): m is { role: string; content: string } {
  if (typeof m !== 'object' || m === null) return false
  const msg = m as Record<string, unknown>
  return (
    typeof msg.role === 'string' &&
    ['user', 'assistant', 'system'].includes(msg.role) &&
    typeof msg.content === 'string' &&
    msg.content.length > 0
  )
}

export async function POST(req: NextRequest) {
  // Rate limit check
  const ip = getClientIP(req)
  if (!checkRateLimit(rateLimitKey('chat', ip), RATE_LIMITS.chat)) {
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

  // Validate messages array
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      { error: { code: 'invalid_input', message: 'messages (non-empty array) is required', retryable: false } },
      { status: 400 },
    )
  }

  const rawMessages = body.messages as unknown[]
  if (!rawMessages.every(isClientMessage)) {
    return NextResponse.json(
      { error: { code: 'invalid_input', message: 'Invalid message format. Each message needs role and content.', retryable: false } },
      { status: 400 },
    )
  }

  // SECURITY: Strip any system messages from client input.
  // System prompts are server-controlled exclusively — clients submit only user/assistant.
  const messages: AIMessage[] = rawMessages
    .filter(m => {
      const msg = m as { role: string; content: string }
      return msg.role === 'user' || msg.role === 'assistant'
    })
    .map(m => {
      const msg = m as { role: 'user' | 'assistant'; content: string }
      return {
        role: msg.role,
        // Truncate individual messages to prevent oversized inputs
        content: msg.content.slice(0, 2000),
      }
    })
    .slice(-20) // Keep last 20 exchanges

  if (messages.length === 0) {
    return NextResponse.json(
      { error: { code: 'invalid_input', message: 'No valid user or assistant messages provided', retryable: false } },
      { status: 400 },
    )
  }

  // Max total prompt length guard
  const totalLength = messages.reduce((sum, m) => sum + m.content.length, 0)
  if (totalLength > AI_CONFIG.maxPromptLength) {
    return NextResponse.json(
      { error: { code: 'invalid_input', message: 'Conversation too long. Please start a new session.', retryable: false } },
      { status: 400 },
    )
  }

  const rawContext = (typeof body.context === 'object' && body.context !== null)
    ? (body.context as Record<string, unknown>)
    : {}

  const context: AIRequestContext = {
    userLevel: (rawContext.userLevel as AIUserLevel) ?? undefined,
    language: 'bilingual',
    maxTokens: AI_CONFIG.maxOutputTokens,
  }

  try {
    const client = createAIClient()
    const response = await client.chat(messages, context)
    return NextResponse.json(response)
  } catch (err) {
    const aiErr = normalizeProviderError(err, AI_CONFIG.provider)
    return NextResponse.json({ error: safeErrorPayload(aiErr) }, { status: aiErr.code === 'rate_limit' ? 429 : 500 })
  }
}
