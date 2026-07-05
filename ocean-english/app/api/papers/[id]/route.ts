/* ════════════════════════════════════════════════════════════════════════
   GET /api/papers/[id] — 取已生成的模拟卷实例（Phase 10）

   - v2 表存在且 id 命中（RLS 仅本人）→ 返回快照 paper（已剥离 answerKey）。
   - v2 未应用 / id 不存在 → 受控 JSON（ok:true, paper:null, warnings），绝不 500。
   ════════════════════════════════════════════════════════════════════════ */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return NextResponse.json({ ok: true, paper: null, warnings: ['missing_id'] })

  try {
    const db = await createClient()
    const { data, error } = await db
      .from('paper_instances')
      .select('id, exam_id, seed, mode, status, score, created_at')
      .eq('id', id)
      .maybeSingle()

    // 表不存在（v2 未应用）→ 受控返回，不 500
    if (error) {
      const notApplied = /relation|does not exist|schema cache/i.test(error.message)
      return NextResponse.json({ ok: true, paper: null, warnings: [notApplied ? 'v2_not_applied' : 'query_error'] })
    }
    if (!data) return NextResponse.json({ ok: true, paper: null, warnings: ['not_found'] })

    const score = (data.score ?? {}) as { snapshot?: unknown }
    const paper = score.snapshot ?? null
    return NextResponse.json({
      ok: true,
      paper,
      instance: { id: data.id, seed: data.seed, mode: data.mode, status: data.status, createdAt: data.created_at },
      warnings: paper ? [] : ['no_snapshot'],
    })
  } catch {
    return NextResponse.json({ ok: true, paper: null, warnings: ['server_error'] }, { status: 200 })
  }
}
