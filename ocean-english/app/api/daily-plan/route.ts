/* ════════════════════════════════════════════════════════════════════════
   POST /api/daily-plan — 今日计划卡片（Phase 13）

   词数据在客户端（lexiStore）→ 由客户端 POST 传入 dueWords/weakWords/recentMistakes/goal/examTarget；
   薄弱技能优先取服务端 v2 skill_states（已认证+已应用时），否则用客户端可提供值/留空。
   v2 未应用/未登录 → 仍用客户端输入产出计划（graceful partial），不崩。
   ════════════════════════════════════════════════════════════════════════ */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildDailyPlan, type PlanWord, type PlanWeakSkill, type PlanMistake } from '@/lib/daily-plan/daily-plan-engine'
import { confidenceFor } from '@/lib/learning-loop/skill-state-updater'
import { normalizeExamId } from '@/lib/exam-specs'

export const runtime = 'nodejs'

function asWords(v: unknown): PlanWord[] {
  return Array.isArray(v) ? v.map((x) => { const o = (x ?? {}) as Record<string, unknown>; return { id: String(o.id ?? ''), word: String(o.word ?? '') } }).filter((w) => w.id).slice(0, 500) : []
}
function asMistakes(v: unknown): PlanMistake[] {
  return Array.isArray(v) ? v.map((x) => { const o = (x ?? {}) as Record<string, unknown>; return { wordId: o.wordId != null ? String(o.wordId) : undefined, errorType: o.errorType != null ? String(o.errorType) : undefined, taskType: o.taskType != null ? String(o.taskType) : undefined } }).slice(0, 500) : []
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {}
  try { body = (await req.json()) as Record<string, unknown> } catch { body = {} }

  const dueWords = asWords(body.dueWords)
  const weakWords = asWords(body.weakWords)
  const recentMistakes = asMistakes(body.recentMistakes)
  const goalObj = (body.goal ?? {}) as Record<string, unknown>
  const goal = { dailyGoal: Number(goalObj.dailyGoal) || 0, goals: Array.isArray(goalObj.goals) ? goalObj.goals.map(String) : [] }
  const examTarget = body.examTarget ? (normalizeExamId(String(body.examTarget)) ?? null) : null
  const mockPending = body.mockPending === true

  // 客户端可先传 weakSkills（离线）；服务端 v2 skill_states 优先覆盖
  let weakSkills: PlanWeakSkill[] = Array.isArray(body.weakSkills)
    ? (body.weakSkills as Record<string, unknown>[]).map((s) => ({ examId: String(s.examId ?? ''), skillKey: String(s.skillKey ?? ''), mastery: Number(s.mastery) || 0, confidence: String(s.confidence ?? 'insufficient') }))
    : []
  let source = 'client'

  try {
    const db = await createClient()
    const { data: auth } = await db.auth.getUser()
    if (auth?.user) {
      const { data, error } = await db.from('skill_states').select('exam_id, skill_key, mastery, attempts').eq('user_id', auth.user.id)
      if (!error && Array.isArray(data)) {
        weakSkills = data
          .map((s) => ({ examId: String(s.exam_id), skillKey: String(s.skill_key), mastery: Number(s.mastery) || 0, attempts: Number(s.attempts) || 0 }))
          .filter((s) => s.mastery < 0.6)
          .sort((a, b) => a.mastery - b.mastery)
          .map((s) => ({ examId: s.examId, skillKey: s.skillKey, mastery: s.mastery, confidence: confidenceFor(s.attempts) }))
        source = 'v2'
      }
    }
  } catch { /* v2 未应用/未登录 → 用客户端输入 */ }

  const plan = buildDailyPlan({ dueWords, weakWords, weakSkills, recentMistakes, goal, examTarget, mockPending })
  return NextResponse.json({ ok: true, source, ...plan })
}
