/* ════════════════════════════════════════════════════════════════════════
   POST /api/practice/attempts — 作答记录（Phase 4）
   - 已认证 + v2 question_attempts 表存在 + 有 questionItemId → 写入。
   - 未认证 / 表未应用 / 仅 v1 题 → HTTP 200 + warning（不写库、不报 500）。
   - 始终返回建议的 wordUpdates / skillUpdates（客户端据此更新 lexiStore）。
   - 非法输入 → HTTP 400。
   ════════════════════════════════════════════════════════════════════════ */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { recordAttempt } from '@/lib/practice/attempt-recorder'
import type { RecordAttemptInput } from '@/lib/practice/session-types'

export async function POST(request: NextRequest) {
  let body: RecordAttemptInput
  try {
    body = (await request.json()) as RecordAttemptInput
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 })
  }
  if (!body.questionItemId && !body.legacyQuestionId) {
    return NextResponse.json({ ok: false, error: 'missing_question_ref' }, { status: 400 })
  }

  const db = await createClient()
  let userId: string | null = null
  try {
    const { data } = await db.auth.getUser()
    userId = data.user?.id ?? null
  } catch {
    userId = null
  }

  const result = await recordAttempt(db, userId, body)
  return NextResponse.json(result)
}
