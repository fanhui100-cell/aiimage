/* ════════════════════════════════════════════════════════════════════════
   GET /api/diagnostics — 词/技能/考试诊断（Phase 13）

   - 已登录 + v2 question_attempts 已应用 → 用真实作答聚合技能状态（带 confidence，
     稀疏样本标 isEstimate，不展示精确分）+ 错误类型直方图 + 分考试正确率。
   - v2 未应用 → 用 v1（wrong_answers / quiz_attempts）给「部分诊断」，不编造。
   - 未登录 → 受控空响应。绝不 500。
   ════════════════════════════════════════════════════════════════════════ */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aggregateSkillStates, weakSkills, type SkillAttempt } from '@/lib/learning-loop/skill-state-updater'

export const runtime = 'nodejs'

type AttemptRow = { exam_id: string | null; section_id: string | null; task_type: string | null; subskills: string[] | null; is_correct: boolean | null; error_type: string | null }

export async function GET() {
  try {
    const db = await createClient()
    const { data: auth } = await db.auth.getUser()
    const user = auth?.user
    if (!user) return NextResponse.json({ ok: true, source: 'empty', skill: [], exam: [], word: null, warnings: ['unauthenticated'] })

    // v2 路径
    const { data: probe, error: probeErr } = await db.from('question_attempts').select('id').limit(1)
    const v2Applied = !probeErr && probe != null

    if (v2Applied) {
      // 用 desc 分页取「最近 5000 条」，但 EMA 顺序敏感 → 聚合前整体 reverse 成时间升序（旧→新），
      // 否则会把「近期变好」误判为更弱。
      const rows: AttemptRow[] = []
      for (let from = 0; from < 5000; from += 1000) {
        const { data } = await db.from('question_attempts').select('exam_id, section_id, task_type, subskills, is_correct, error_type').eq('user_id', user.id).order('answered_at', { ascending: false }).range(from, from + 999)
        const page = (data ?? []) as AttemptRow[]
        rows.push(...page)
        if (page.length < 1000) break
      }
      rows.reverse()   // newest-first → 时间升序，供顺序敏感的 EMA 正确累积
      const skillAttempts: SkillAttempt[] = rows.filter((r) => r.exam_id).map((r) => ({ examId: r.exam_id as string, sectionId: r.section_id ?? undefined, taskType: r.task_type ?? undefined, subskills: r.subskills ?? undefined, isCorrect: r.is_correct === true }))
      const skill = aggregateSkillStates(skillAttempts)
      const weak = weakSkills(skill)
      // 错误类型直方图
      const errorHistogram: Record<string, number> = {}
      for (const r of rows) if (r.error_type) errorHistogram[r.error_type] = (errorHistogram[r.error_type] ?? 0) + 1
      // 分考试正确率
      const examAgg = new Map<string, { attempts: number; correct: number }>()
      for (const r of rows) { if (!r.exam_id) continue; const e = examAgg.get(r.exam_id) ?? { attempts: 0, correct: 0 }; e.attempts++; if (r.is_correct) e.correct++; examAgg.set(r.exam_id, e) }
      const exam = [...examAgg.entries()].map(([examId, v]) => ({ examId, attempts: v.attempts, accuracy: v.attempts ? Math.round((v.correct / v.attempts) * 100) / 100 : 0, isEstimate: v.attempts < 20 }))

      return NextResponse.json({
        ok: true, source: 'v2', totalAttempts: rows.length,
        skill, weakSkills: weak, errorHistogram, exam,
        word: null,
        note: '部分技能样本不足，对应分数为估算（isEstimate=true / confidence≠high），请勿当精确分。',
        warnings: rows.length ? [] : ['no_attempts'],
      })
    }

    // v1 部分诊断（不编造）
    const { data: wrong, error: wErr } = await db.from('wrong_answers').select('id').eq('user_id', user.id).limit(2000)
    if (wErr) return NextResponse.json({ ok: true, source: 'empty', skill: [], exam: [], word: null, warnings: ['v2_not_applied', 'no_v1_wrong_answers'] })
    return NextResponse.json({
      ok: true, source: 'v1_partial', skill: [], exam: [],
      word: { wrongCount: (wrong ?? []).length },
      note: 'v2 未应用：仅基于 v1 错题给部分诊断；技能/子技能诊断需 v2 question_attempts。',
      warnings: ['v2_not_applied'],
    })
  } catch {
    return NextResponse.json({ ok: true, source: 'empty', skill: [], exam: [], word: null, warnings: ['server_error'] })
  }
}
