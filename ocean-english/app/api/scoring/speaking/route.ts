/* ════════════════════════════════════════════════════════════════════════
   POST /api/scoring/speaking — 口语练习估分（Phase 12，基于文字转写）

   Body: { examId, transcript|text(文字转写), sourceText?(题面), level?, taskType?, mock? }
   → 结构化反馈，含 audioScoring:'not_ready'、transcriptUsed:true。
   安全：**不接收、不存储原始麦克风音频**（仅文字转写）；保守匿名限流；长度校验；非官方分。
   ════════════════════════════════════════════════════════════════════════ */
import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit, getClientIP, rateLimitKey } from '@/lib/ai/ai-rate-limit'
import { scoreSpeaking } from '@/lib/scoring/score-speaking'
import { normalizeExamId } from '@/lib/exam-specs'

export const runtime = 'nodejs'
const LIMIT = { windowMs: 60_000, max: 5 }
const DISCLAIMER = '练习估分（基于文字转写），非官方分数。音频评分尚未就绪。'

export async function POST(req: NextRequest) {
  const ip = getClientIP(req)
  if (!(await checkRateLimit(rateLimitKey('scoring-speaking', ip), LIMIT))) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
  }
  let body: Record<string, unknown>
  try { body = (await req.json()) as Record<string, unknown> } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }) }

  // 隐私边界（2026-07-05 Task 3）：显式拒绝任何音频载荷（不接收、不存储、不建 Storage 对象）。
  // 客户端若尝试上传 audio/recording/audioBase64/audioUrl → 受控 400，转写请求不受影响。
  for (const k of ['audio', 'audioBlob', 'audioBase64', 'audioUrl', 'audioData', 'file', 'recording', 'recordingUrl']) {
    if (body[k] != null && body[k] !== '') {
      return NextResponse.json({ ok: false, error: 'audio_upload_not_supported' }, { status: 400 })
    }
  }

  const rawExam = String(body.examId ?? '').trim()
  // 仅接收文字转写（不接收/不存储原始音频；音频字段已在上方显式拒绝）
  const text = String(body.transcript ?? body.text ?? '').trim()
  const sourceText = body.sourceText != null ? String(body.sourceText).trim().slice(0, 2000) : undefined
  const level = body.level != null ? Number(body.level) : undefined
  const taskType = body.taskType != null ? String(body.taskType) : undefined
  if (!rawExam) return NextResponse.json({ ok: false, error: 'examId_required' }, { status: 400 })
  const examId = normalizeExamId(rawExam) ?? rawExam
  if (text.length < 5) return NextResponse.json({ ok: false, error: 'transcript_too_short' }, { status: 400 })
  if (text.length > 4000) return NextResponse.json({ ok: false, error: 'transcript_too_long' }, { status: 400 })

  const forceMock = body.mock === true || req.nextUrl.searchParams.get('mock') === '1'
  const result = await scoreSpeaking({ examId, text, sourceText, level, taskType }, { forceMock })
  if ('error' in result) return NextResponse.json({ ok: false, error: result.error }, { status: result.error === 'no_speaking_rubric' ? 404 : 400 })
  return NextResponse.json({ ok: true, disclaimer: DISCLAIMER, audioStorage: 'none', ...result })
}
