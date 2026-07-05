/* ════════════════════════════════════════════════════════════════════════
   POST /api/papers — 从 canonical ExamSpec + v2 active 题池生成可复现模拟卷（Phase 10）

   Body: { examId, mode: 'mini'|'section'|'full', sectionId?, seed? }
   返回: { ok, paperInstanceId?, paper, warnings }
   - v2 未应用 → { ok:true, paper:null, warnings:['v2_not_applied'] }，不崩。
   - 池不足 → { ok:true, ...paper, warnings:['insufficient_pool'] }，绝不用无关词题顶替。
   - 题面剥离 answerKey（答案不前泄）。登录且 v2 就绪时尽力持久化 paper_instance。
   旧 /api/mock-exam 保持可用，待本 API 验证后再考虑下线。
   ════════════════════════════════════════════════════════════════════════ */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePaper, toClientPaper } from '@/lib/papers/paper-generator'
import { normalizeExamId, getExamSpec } from '@/lib/exam-specs'
import type { PaperMode } from '@/lib/papers/paper-types'

const MODES = new Set<PaperMode>(['mini', 'section', 'full'])

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {}
  try { body = (await req.json()) as Record<string, unknown> } catch { body = {} }

  const examIdRaw = String(body.examId ?? '').trim()
  const mode = String(body.mode ?? 'full') as PaperMode
  const sectionId = body.sectionId != null ? String(body.sectionId) : undefined
  const seed = body.seed != null ? String(body.seed) : undefined
  // 接受 canonical id 或可归一别名；不接受 IELTS/GRE（normalizeExamId 已排除）
  const examId = getExamSpec(examIdRaw) ? examIdRaw : (normalizeExamId(examIdRaw) ?? '')

  if (!MODES.has(mode)) return NextResponse.json({ ok: true, paper: null, warnings: ['invalid_mode'] })
  if (!examId) return NextResponse.json({ ok: true, paper: null, warnings: ['unknown_exam'] })
  if (mode === 'section' && !sectionId) return NextResponse.json({ ok: true, paper: null, warnings: ['missing_section'] })

  try {
    const db = await createClient()
    const { paper, warnings } = await generatePaper(db, { examId, mode, sectionId, seed })
    if (!paper) return NextResponse.json({ ok: true, paper: null, warnings })

    const clientPaper = toClientPaper(paper)

    // 尽力持久化：登录用户 + paper_instances 可写时存快照（exam_id/section FK 未 seed → 存 null + 快照）
    let paperInstanceId: string | undefined
    try {
      const { data: auth } = await db.auth.getUser()
      const user = auth?.user
      if (user) {
        const { data: inst } = await db.from('paper_instances').insert({
          user_id: user.id, exam_id: null, seed: paper.seed, mode: paper.mode, status: 'in_progress',
          score: { snapshot: clientPaper },
        }).select('id').single()
        paperInstanceId = (inst as { id: string } | null)?.id
        // 归一化分区记录（R11）：每 section 落 set/item 主键、分值、序号（user_id 反范式化便于 RLS）。
        if (paperInstanceId) {
          const sectionRows = paper.sections.map((s, i) => ({
            paper_instance_id: paperInstanceId, user_id: user.id, section_id: null, order_index: i,
            question_set_ids: s.sets.map((x) => x.setId),
            question_item_ids: s.items.map((x) => x.questionItemId),
            points: s.points,
          }))
          if (sectionRows.length) await db.from('paper_sections').insert(sectionRows)
        }
      }
    } catch { /* 持久化失败不影响出卷 */ }

    return NextResponse.json({ ok: true, paperInstanceId, paper: clientPaper, warnings })
  } catch {
    return NextResponse.json({ ok: true, paper: null, warnings: ['server_error'] }, { status: 200 })
  }
}
