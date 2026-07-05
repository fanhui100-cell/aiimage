/* ════════════════════════════════════════════════════════════════════════
   POST /api/scoring/translation — 翻译练习估分（Phase 12）

   Body: { examId, text(译文), sourceText?(源文), level?, taskType?, mock? }
   → 结构化反馈（练习估分）。保守匿名限流；长度校验；非官方分。
   ════════════════════════════════════════════════════════════════════════ */
import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit, getClientIP, rateLimitKey } from '@/lib/ai/ai-rate-limit'
import { scoreTranslation } from '@/lib/scoring/score-translation'
import { normalizeExamId } from '@/lib/exam-specs'

export const runtime = 'nodejs'
const LIMIT = { windowMs: 60_000, max: 5 }
const DISCLAIMER = '练习估分，仅供参考与改进方向，非官方分数。'

export async function POST(req: NextRequest) {
  const ip = getClientIP(req)
  if (!(await checkRateLimit(rateLimitKey('scoring-translation', ip), LIMIT))) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
  }
  let body: Record<string, unknown>
  try { body = (await req.json()) as Record<string, unknown> } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }) }

  const rawExam = String(body.examId ?? '').trim()
  const text = String(body.text ?? '').trim()
  const sourceText = body.sourceText != null ? String(body.sourceText).trim().slice(0, 2000) : undefined
  const level = body.level != null ? Number(body.level) : undefined
  const taskType = body.taskType != null ? String(body.taskType) : undefined
  if (!rawExam) return NextResponse.json({ ok: false, error: 'examId_required' }, { status: 400 })
  const examId = normalizeExamId(rawExam) ?? rawExam
  if (text.length < 5) return NextResponse.json({ ok: false, error: 'text_too_short' }, { status: 400 })
  if (text.length > 4000) return NextResponse.json({ ok: false, error: 'text_too_long' }, { status: 400 })

  const forceMock = body.mock === true || req.nextUrl.searchParams.get('mock') === '1'
  const result = await scoreTranslation({ examId, text, sourceText, level, taskType }, { forceMock })
  if ('error' in result) return NextResponse.json({ ok: false, error: result.error }, { status: result.error === 'no_translation_rubric' ? 404 : 400 })
  return NextResponse.json({ ok: true, disclaimer: DISCLAIMER, ...result })
}
