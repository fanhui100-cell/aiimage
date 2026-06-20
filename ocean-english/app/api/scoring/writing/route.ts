/* ════════════════════════════════════════════════════════════════════════
   POST /api/scoring/writing — 写作练习估分（Phase 12）

   Body: { examId, text, level?, taskType?, mock? }（或 ?mock=1 强制 mock）
   → { ok, disclaimer, provider, overall, fullScore, band, dimensions[], strengths[], issues[], nextRecommendation, isEstimate:true }
   安全：保守匿名限流（5/min/IP，独立 key，不触碰 DeepSeek 全局限流）；长度校验；估分非官方分。
   ════════════════════════════════════════════════════════════════════════ */
import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit, getClientIP, rateLimitKey } from '@/lib/ai/ai-rate-limit'
import { scoreWriting } from '@/lib/scoring/score-writing'
import { normalizeExamId } from '@/lib/exam-specs'

export const runtime = 'nodejs'
const LIMIT = { windowMs: 60_000, max: 5 }
const DISCLAIMER = '练习估分，仅供参考与改进方向，非官方分数。'

export async function POST(req: NextRequest) {
  const ip = getClientIP(req)
  if (!(await checkRateLimit(rateLimitKey('scoring-writing', ip), LIMIT))) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
  }
  let body: Record<string, unknown>
  try { body = (await req.json()) as Record<string, unknown> } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }) }

  const rawExam = String(body.examId ?? '').trim()
  const text = String(body.text ?? '').trim()
  const level = body.level != null ? Number(body.level) : undefined
  const taskType = body.taskType != null ? String(body.taskType) : undefined
  if (!rawExam) return NextResponse.json({ ok: false, error: 'examId_required' }, { status: 400 })
  // 归一别名（CET-4→cet4）；ielts/gre 等归一为 null → 保留原值 → 无 rubric → 404
  const examId = normalizeExamId(rawExam) ?? rawExam
  if (text.length < 5) return NextResponse.json({ ok: false, error: 'text_too_short' }, { status: 400 })
  if (text.length > 4000) return NextResponse.json({ ok: false, error: 'text_too_long' }, { status: 400 })

  const forceMock = body.mock === true || req.nextUrl.searchParams.get('mock') === '1'
  const result = await scoreWriting({ examId, text, level, taskType }, { forceMock })
  if ('error' in result) return NextResponse.json({ ok: false, error: result.error }, { status: result.error === 'no_writing_rubric' ? 404 : 400 })
  return NextResponse.json({ ok: true, disclaimer: DISCLAIMER, ...result })
}
