/* ════════════════════════════════════════════════════════════════════════
   learning-loop/skill-state-writer.ts — 持久化用户技能状态（R12 服务端）

   把 question_attempts 聚合成 skill_states（user×exam×skill 的 EMA 掌握度物化）。
   - 与 /api/diagnostics 同口径：取最近窗口、整体 reverse 成时间升序（旧→新）再聚合，
     保证持久化的 skill_states 与按需诊断一致（绝不因顺序误判变弱/变强）。
   - 整窗重算 + upsert（幂等、零漂移）。调用点：练习作答记录后、整卷提交后。
   - 仅认证用户；RLS 限本人；表未应用/无作答 → 优雅返回 warning，不报错。
   - follow-up：当前每次整窗重算（O(n)），后续可改增量 EMA（只读受影响 skillKey 行）。
   ════════════════════════════════════════════════════════════════════════ */
import type { SupabaseClient } from '@supabase/supabase-js'
import { aggregateSkillStates, type SkillAttempt } from './skill-state-updater'

type Row = { exam_id: string | null; section_id: string | null; task_type: string | null; subskills: string[] | null; is_correct: boolean | null }

export async function persistSkillStates(db: SupabaseClient, userId: string | null): Promise<{ written: number; warnings: string[] }> {
  if (!userId) return { written: 0, warnings: ['unauthenticated'] }
  const rows: Row[] = []
  for (let from = 0; from < 5000; from += 1000) {
    const { data, error } = await db.from('question_attempts')
      .select('exam_id, section_id, task_type, subskills, is_correct')
      .eq('user_id', userId).order('answered_at', { ascending: false }).range(from, from + 999)
    if (error) {
      const notApplied = /relation|does not exist|schema cache/i.test(error.message)
      return { written: 0, warnings: [notApplied ? 'not_applied' : 'query_error'] }
    }
    const page = (data ?? []) as Row[]
    rows.push(...page)
    if (page.length < 1000) break
  }
  rows.reverse() // newest-first → 时间升序，供顺序敏感的 EMA 正确累积
  const attempts: SkillAttempt[] = rows
    .filter((r) => r.exam_id)
    .map((r) => ({ examId: r.exam_id as string, sectionId: r.section_id ?? undefined, taskType: r.task_type ?? undefined, subskills: r.subskills ?? undefined, isCorrect: r.is_correct === true }))
  const states = aggregateSkillStates(attempts)
  if (!states.length) return { written: 0, warnings: ['no_attempts'] }

  const now = new Date().toISOString()
  const upsertRows = states.map((s) => ({
    user_id: userId, exam_id: s.examId, skill_key: s.skillKey,
    mastery: s.mastery, attempts: s.attempts, correct: s.correct,
    last_attempt_at: now, updated_at: now,
  }))
  const { error } = await db.from('skill_states').upsert(upsertRows, { onConflict: 'user_id,exam_id,skill_key' })
  if (error) return { written: 0, warnings: ['skill_states_upsert_failed'] }
  return { written: upsertRows.length, warnings: [] }
}
