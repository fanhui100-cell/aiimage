/* ════════════════════════════════════════════════════════════════════════
   smoke-learning-loop-e2e.ts — R12 学习闭环端到端：真实作答 → 错误分类 → 技能状态
   物化 → 诊断/今日计划。用 service-role + 现有 profile（前置断言 0 作答以防污染），
   全程自建自删。断言：
   - 错答(reading inference) → question_attempts.error_type 非空。
   - 答对 → error_type=null（不伪造错误）。
   - 听力错答(subskill inference) → error_type='listening_inference'（不并入泛 inference）。
   - persistSkillStates 物化 skill_states（attempts>0、mastery∈[0,1]、样本少→confidence
     insufficient/isEstimate）。
   - 弱技能 → buildDailyPlan 产出带 reason+estimatedMinutes 的卡片。
   - 未登录 recordAttempt → 不写库(recorded=false)。
   退出码：0 全过，1 任一失败。
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { loadDotenv } from './load-dotenv'
import { recordAttempt } from '@/lib/practice/attempt-recorder'
import { confidenceFor } from '@/lib/learning-loop/skill-state-updater'
import { buildDailyPlan, type PlanWeakSkill } from '@/lib/daily-plan/daily-plan-engine'

loadDotenv()
const env = readFileSync('.env.local', 'utf8')
const rd = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]!.trim()
const db = createClient(rd('NEXT_PUBLIC_SUPABASE_URL'), rd('SUPABASE_SERVICE_ROLE_KEY'))

let failures = 0
const check = (cond: boolean, msg: string) => { if (cond) console.log('  ✓', msg); else { console.log('  ✗', msg); failures++ } }

async function activeItems(taskType: string, level: number, n: number): Promise<{ itemId: string; setId: string }[]> {
  const { data: sets } = await db.from('question_sets').select('id').eq('status', 'active').eq('task_type', taskType).eq('level', level).limit(n)
  const out: { itemId: string; setId: string }[] = []
  for (const s of sets ?? []) {
    const { data: items } = await db.from('question_items').select('id').eq('status', 'active').eq('question_set_id', (s as { id: string }).id).limit(1)
    if (items && items[0]) out.push({ itemId: (items[0] as { id: string }).id, setId: (s as { id: string }).id })
    if (out.length >= n) break
  }
  return out
}
async function errorTypeOf(userId: string, itemId: string): Promise<string | null | undefined> {
  const { data } = await db.from('question_attempts').select('error_type').eq('user_id', userId).eq('question_item_id', itemId).order('answered_at', { ascending: false }).limit(1)
  return data && data[0] ? (data[0] as { error_type: string | null }).error_type : undefined
}

async function main() {
  console.log('smoke-learning-loop-e2e: R12 学习闭环端到端')
  const { data: prof } = await db.from('profiles').select('id').limit(1)
  const userId = prof && prof[0] ? (prof[0] as { id: string }).id : null
  if (!userId) { console.log('  ⚠ 无 profile，跳过'); return }
  const { count: pre } = await db.from('question_attempts').select('*', { count: 'exact', head: true }).eq('user_id', userId)
  if (pre && pre > 0) { console.log(`  ⚠ 用户已有 ${pre} 条作答，跳过（避免污染真实数据）`); return }

  const reading = await activeItems('reading_comprehension', 2, 3)   // gaokao lv2
  const listening = await activeItems('listening_comprehension', 3, 1) // cet4 lv3
  check(reading.length >= 2 && listening.length >= 1, `取到活跃题（reading ${reading.length}, listening ${listening.length}）`)
  if (reading.length < 2 || listening.length < 1) { console.log('  ✗ 活跃题不足，无法测'); failures++; return }

  try {
    // a) 错答 reading inference → error_type 非空
    await recordAttempt(db, userId, { questionItemId: reading[0].itemId, setId: reading[0].setId, examId: 'gaokao', taskType: 'reading_comprehension', subskills: ['inference'], answer: 'a', isCorrect: false })
    const eA = await errorTypeOf(userId, reading[0].itemId)
    check(!!eA, `错答 reading → error_type 非空（${eA}）`)

    // b) 答对 reading → error_type null
    await recordAttempt(db, userId, { questionItemId: reading[1].itemId, setId: reading[1].setId, examId: 'gaokao', taskType: 'reading_comprehension', subskills: ['inference'], answer: 'b', isCorrect: true })
    const eB = await errorTypeOf(userId, reading[1].itemId)
    check(eB === null, `答对 reading → error_type=null（实际 ${eB}）`)

    // c) 错答 listening inference → listening_inference
    await recordAttempt(db, userId, { questionItemId: listening[0].itemId, setId: listening[0].setId, examId: 'cet4', taskType: 'listening_comprehension', subskills: ['inference'], answer: 'c', isCorrect: false })
    const eC = await errorTypeOf(userId, listening[0].itemId)
    check(eC === 'listening_inference', `错答 listening inference → 'listening_inference'（实际 ${eC}）`)

    // skill_states 物化
    const { data: ss } = await db.from('skill_states').select('exam_id, skill_key, mastery, attempts, correct').eq('user_id', userId)
    check((ss?.length ?? 0) > 0, `skill_states 已物化（${ss?.length} 行）`)
    const allValid = (ss ?? []).every((s) => { const m = Number((s as { mastery: number }).mastery); return m >= 0 && m <= 1 && Number((s as { attempts: number }).attempts) > 0 })
    check(allValid, 'skill_states mastery∈[0,1] 且 attempts>0')
    // 低样本（每 skill 仅 1-2 次作答）→ 全为估算：confidence !== high（isEstimate=true，UI 不展示精确分）。
    // persistSkillStates 已改全量替换，无 stale 残留致 attempts 失真累积。
    const allEstimate = (ss ?? []).every((s) => confidenceFor(Number((s as { attempts: number }).attempts)) !== 'high')
    check(allEstimate, '低样本 → 全为估算（confidence !== high → isEstimate，UI 不展示精确分）')

    // daily-plan：弱技能 → 卡片带 reason + estimatedMinutes
    const weak: PlanWeakSkill[] = (ss ?? []).map((s) => ({ examId: String((s as { exam_id: string }).exam_id), skillKey: String((s as { skill_key: string }).skill_key), mastery: Number((s as { mastery: number }).mastery), confidence: confidenceFor(Number((s as { attempts: number }).attempts)) })).filter((s) => s.mastery < 0.6)
    const plan = buildDailyPlan({ dueWords: [], weakWords: [], weakSkills: weak, recentMistakes: [{ taskType: 'reading_comprehension', errorType: eA ?? undefined }], goal: {}, examTarget: 'gaokao', mockPending: false })
    const good = plan.cards.filter((c) => c.reason && c.reason.length > 0 && c.estimatedMinutes > 0)
    check(good.length > 0, `daily-plan 产出带 reason+estimatedMinutes 的卡片（${good.length}/${plan.cards.length}）`)
    check(plan.cards.some((c) => c.type === 'exam_task'), '弱技能 → 含 exam_task 卡片')

    // 未登录 → 不写库
    const unauth = await recordAttempt(db, null, { questionItemId: reading[0].itemId, answer: 'x', isCorrect: false })
    check(!unauth.recorded && unauth.warnings.includes('unauthenticated'), '未登录 recordAttempt → 不写库')
  } finally {
    await db.from('question_attempts').delete().eq('user_id', userId)
    await db.from('skill_states').delete().eq('user_id', userId)
  }

  console.log(failures === 0 ? '\nsmoke-learning-loop-e2e PASS' : `\nsmoke-learning-loop-e2e FAIL（${failures} 项）`)
  if (failures) process.exitCode = 1
}
main().catch((e) => { console.error('smoke-learning-loop-e2e fatal', e?.message ?? e); process.exit(1) })
