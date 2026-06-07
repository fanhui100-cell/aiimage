import { NextRequest, NextResponse } from 'next/server'
import { AI_CONFIG } from '@/lib/ai/ai-config'
import { createAIClient } from '@/lib/ai/ai-client'
import { normalizeProviderError, safeErrorPayload } from '@/lib/ai/ai-errors'
import { checkRateLimit, getClientIP, RATE_LIMITS, rateLimitKey } from '@/lib/ai/ai-rate-limit'
import { buildDocumentAnalysisMessages } from '@/lib/ai/prompts/document-analysis'
import { parseAIDocumentAnalysis } from '@/lib/document/document-analysis-mapper'
import { buildMockDocumentAnalysis } from '@/lib/document/providers/mock-document-provider'
import { DOCUMENT_CONFIG } from '@/lib/document/document-config'
import type { AIUserLevel } from '@/types/ai'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // Rate limit
  const ip = getClientIP(req)
  if (!checkRateLimit(rateLimitKey('document-analysis', ip), RATE_LIMITS['document-analysis'])) {
    return NextResponse.json(
      { ok: false, error: { code: 'rate_limit', message: 'Too many requests. Please wait a moment.' } },
      { status: 429 },
    )
  }

  // Parse body
  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: 'invalid_request', message: 'Invalid JSON in request body.' } },
      { status: 400 },
    )
  }

  if (typeof body.rawText !== 'string' || !body.rawText.trim()) {
    return NextResponse.json(
      { ok: false, error: { code: 'invalid_request', message: 'rawText (non-empty string) is required.' } },
      { status: 400 },
    )
  }

  // Enforce max analysis input length
  const rawText = (body.rawText as string).slice(0, DOCUMENT_CONFIG.maxRawTextForAnalysis)
  const fileName = typeof body.fileName === 'string' ? body.fileName.slice(0, 200) : 'Document'
  const userLevel = (body.userLevel as AIUserLevel) ?? 'intermediate'

  // Mock provider path — return deterministic result without calling LLM
  if (AI_CONFIG.provider === 'mock') {
    const result = buildMockDocumentAnalysis(rawText, fileName)
    return NextResponse.json({ ok: true, data: result })
  }

  // Real AI path — uses client.chat() with a dedicated document-analysis message set.
  // LIMITATION (Phase 4B, mock-only): real providers (OpenAI, Anthropic, Gemini) prepend the
  // chat-tutor system prompt inside their chat() implementations. When a real provider is activated,
  // this route must call a dedicated analyzeDocument() method (or a raw completeMessages() path)
  // that does NOT inject the chat-tutor context. Until then, only the mock provider is safe here.
  try {
    const client = createAIClient()
    const messages = buildDocumentAnalysisMessages(rawText, userLevel)
    const aiResponse = await client.chat(messages, {
      userLevel,
      language: 'bilingual',
      maxTokens: AI_CONFIG.maxOutputTokens,
    })

    const parsed = parseAIDocumentAnalysis(aiResponse.content, { fileName, rawText })
    if (parsed) {
      return NextResponse.json({ ok: true, data: parsed })
    }

    // Parsing failed → safe fallback to mock
    console.warn('[document-analysis] AI response could not be parsed; using mock fallback')
    const fallback = buildMockDocumentAnalysis(rawText, fileName)
    return NextResponse.json({ ok: true, data: { ...fallback, warnings: [...fallback.warnings, 'AI response format was unexpected; showing demo analysis.'] } })
  } catch (err) {
    const aiErr = normalizeProviderError(err, AI_CONFIG.provider)
    return NextResponse.json(
      { ok: false, error: safeErrorPayload(aiErr) },
      { status: aiErr.code === 'rate_limit' ? 429 : 500 },
    )
  }
}
