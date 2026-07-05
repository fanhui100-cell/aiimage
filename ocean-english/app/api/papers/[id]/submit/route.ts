/* ════════════════════════════════════════════════════════════════════════
   POST /api/papers/[id]/submit — 提交模拟卷，服务端权威判分（R11）

   Body: { responses: [{ questionItemId, answer }] }
   返回: { ok, paperAttemptId?, score?, warnings, error? }
   - 未登录 → 401；非本人/不存在 → 403/404；已提交 → 409（防重复终判）。
   - 答案键服务端从 question_items 现取，绝不信任客户端。
   - 客观题服务端判分并持久化 paper_attempts + question_attempts；productive 恒待评分。
   ════════════════════════════════════════════════════════════════════════ */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { submitPaper } from '@/lib/papers/submit-paper'
import type { ItemResponse } from '@/lib/papers/paper-types'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let body: Record<string, unknown> = {}
  try { body = (await req.json()) as Record<string, unknown> } catch { body = {} }
  const responses = Array.isArray(body.responses) ? (body.responses as ItemResponse[]) : []

  try {
    const db = await createClient()
    let userId: string | null = null
    try { const { data: auth } = await db.auth.getUser(); userId = auth?.user?.id ?? null } catch { userId = null }

    const result = await submitPaper(db, userId, id, responses)
    return NextResponse.json(
      { ok: result.ok, paperAttemptId: result.paperAttemptId, score: result.score, warnings: result.warnings, error: result.error },
      { status: result.status },
    )
  } catch {
    return NextResponse.json({ ok: false, error: 'server_error', warnings: ['server_error'] }, { status: 500 })
  }
}
