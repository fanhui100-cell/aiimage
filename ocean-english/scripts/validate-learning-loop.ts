/* ════════════════════════════════════════════════════════════════════════
   validate-learning-loop.ts — 学习闭环校验（Phase 13，纯函数、确定性、只读）

   跑一组确定性样本作答，穿过 word-mastery / skill-state-updater / daily-plan-engine /
   error-classifier。核心不变量：**任何答错都必须产生复习/修复信号**（词级 needsReview
   或计划级 word_review/mistake_fix 卡）；否则失败退出 1。
   用法：npm run validate:learning-loop
   ════════════════════════════════════════════════════════════════════════ */
import { writeFileSync } from 'node:fs'
import { attemptToWordUpdate, type WordAttempt } from '@/lib/learning-loop/word-mastery'
import { aggregateSkillStates, weakSkills, updateSkillState, type SkillAttempt } from '@/lib/learning-loop/skill-state-updater'
import { classifyError } from '@/lib/learning-loop/error-classifier'
import { buildDailyPlan } from '@/lib/daily-plan/daily-plan-engine'
import { skillKeyToTaskType } from '@/lib/practice/skill-task-map'

const errors: string[] = []
const notes: string[] = []
const ok = (cond: boolean, msg: string) => { if (!cond) errors.push(msg) }

function main() {
  // ── 样本作答 ──
  const wordAttempts: WordAttempt[] = [
    { wordId: 'w1', taskType: 'en_to_zh', isCorrect: false },          // recognize
    { wordId: 'w2', taskType: 'zh_to_word_spell', isCorrect: false },  // spell
    { wordId: 'w3', taskType: 'listen_to_meaning', isCorrect: true },  // listen（对）
    { wordId: 'w4', taskType: 'collocation_choice', isCorrect: false },// context
    { wordId: 'w5', taskType: 'reading_comprehension', isCorrect: true },// context（对）
  ]

  // 1) word-mastery：每个答错都必须 needsReview=true（复习信号）；答对 false
  const updates = wordAttempts.map(attemptToWordUpdate)
  for (const u of updates) {
    const src = wordAttempts.find((a) => a.wordId === u.wordId)!
    ok(u.needsReview === !src.isCorrect, `word ${u.wordId}: needsReview 应=${!src.isCorrect}`)
    ok(!src.isCorrect ? u.suggestedGrade === 'again' : u.suggestedGrade === 'good', `word ${u.wordId}: suggestedGrade 不符`)
  }
  // 维度映射抽查
  ok(updates.find((u) => u.wordId === 'w2')!.dimension === 'spell', 'w2 维度应=spell')
  ok(updates.find((u) => u.wordId === 'w3')!.dimension === 'listen', 'w3 维度应=listen')
  ok(updates.find((u) => u.wordId === 'w4')!.dimension === 'context', 'w4 维度应=context')
  // 核心不变量：没有任何答错被漏掉复习信号
  const wrongCount = wordAttempts.filter((a) => !a.isCorrect).length
  const reviewSignals = updates.filter((u) => u.needsReview).length
  ok(reviewSignals === wrongCount, `答错 ${wrongCount} 个但只产生 ${reviewSignals} 个复习信号（必须相等）`)

  // 2) error-classifier：答错→非 null 错误类型；答对→null
  for (const a of wordAttempts) {
    const e = classifyError({ taskType: a.taskType, isCorrect: a.isCorrect })
    ok(a.isCorrect ? e === null : e !== null, `classifyError ${a.wordId}: 答${a.isCorrect ? '对应 null' : '错应非 null'}`)
  }
  ok(classifyError({ taskType: 'zh_to_word_spell', isCorrect: false }) === 'word_form', 'spell 错应分类 word_form')
  ok(classifyError({ taskType: 'reading_comprehension', subskills: ['main_idea'], isCorrect: false }) === 'main_idea', 'reading main_idea 分类')
  // P2：听力推理/细节必须归到专属听力错误类型（不被通用 inference 抢先）
  ok(classifyError({ taskType: 'listening_comprehension', subskills: ['inference'], isCorrect: false }) === 'listening_inference', '听力推理错应归 listening_inference（P2）')
  ok(classifyError({ taskType: 'listening_comprehension', isCorrect: false }) === 'listening_detail', '听力细节错应归 listening_detail')

  // 3) skill-state-updater：保守平滑 + 置信度随样本量
  const single = updateSkillState(null, false)   // 0.5 → 0.425
  ok(Math.abs(single.mastery - 0.425) < 1e-9, `单次答错平滑应到 0.425，实际 ${single.mastery}`)
  ok(single.mastery > 0.4, '保守：单次不应暴跌超过 ALPHA')
  const skillAttempts: SkillAttempt[] = [
    { examId: 'cet4', taskType: 'reading_comprehension', subskills: ['inference'], isCorrect: false },
    { examId: 'cet4', taskType: 'reading_comprehension', subskills: ['inference'], isCorrect: false },
    { examId: 'cet4', taskType: 'reading_comprehension', subskills: ['inference'], isCorrect: false },
    { examId: 'cet4', sectionId: 'listening', taskType: 'listening_comprehension', isCorrect: true },
  ]
  const states = aggregateSkillStates(skillAttempts)
  const inf = states.find((s) => s.skillKey === 'inference')
  ok(!!inf && inf.mastery < 0.5, 'inference（全错）mastery 应 < 0.5')
  ok(!!inf && inf.confidence === 'low' && inf.isEstimate, 'inference 3 样本应 confidence=low + isEstimate')
  const weak = weakSkills(states)
  ok(weak.some((s) => s.skillKey === 'inference'), 'inference 应进薄弱技能')

  // P1：EMA 顺序敏感 → 诊断必须按时间升序聚合（前 5 错、后 5 对 = 近期变好）
  const improving: SkillAttempt[] = [
    ...Array.from({ length: 5 }, (): SkillAttempt => ({ examId: 'cet4', taskType: 'reading_comprehension', subskills: ['inference'], isCorrect: false })),
    ...Array.from({ length: 5 }, (): SkillAttempt => ({ examId: 'cet4', taskType: 'reading_comprehension', subskills: ['inference'], isCorrect: true })),
  ]
  const chrono = aggregateSkillStates(improving).find((s) => s.skillKey === 'inference')!
  const reversed = aggregateSkillStates([...improving].reverse()).find((s) => s.skillKey === 'inference')!
  ok(chrono.mastery > reversed.mastery, '顺序不变量：时间升序(近期变好)应比降序 mastery 更高（P1）')
  ok(chrono.mastery > 0.5, '近期 5 连对（升序）→ mastery 应 > 0.5')
  ok(reversed.mastery < 0.5, '若误用降序 → mastery 会被失真 < 0.5')
  notes.push(`order invariant: chrono ${chrono.mastery.toFixed(4)} vs reverse ${reversed.mastery.toFixed(4)}`)

  // 4) daily-plan：答错应在计划层产出修复卡（mistake_fix 或 word_review）
  const weakW = wordAttempts.filter((a) => !a.isCorrect).map((a) => ({ id: a.wordId, word: a.wordId }))
  const recentMistakes = wordAttempts.filter((a) => !a.isCorrect).map((a) => ({ wordId: a.wordId, errorType: classifyError({ taskType: a.taskType, isCorrect: false }) ?? 'unknown' }))
  const plan = buildDailyPlan({
    dueWords: [{ id: 'd1', word: 'due' }], weakWords: weakW,
    weakSkills: weak.map((s) => ({ examId: s.examId, skillKey: s.skillKey, mastery: s.mastery, confidence: s.confidence })),
    recentMistakes, goal: { dailyGoal: 20, goals: ['writing'] }, examTarget: 'cet4',
  })
  const types = new Set(plan.cards.map((c) => c.type))
  ok(types.has('mistake_fix') || types.has('word_review'), '计划必须含修复卡（mistake_fix/word_review）')
  ok(types.has('exam_task'), '有薄弱技能时应含 exam_task 卡')
  ok(plan.cards.every((c) => c.reason && c.estimatedMinutes > 0), '每张卡必须有 reason + estimatedMinutes>0')

  // 全对场景：不应漏（无错→无修复卡也合法，但到期词仍触发 word_review）
  const allCorrectPlan = buildDailyPlan({ dueWords: [{ id: 'd1', word: 'due' }], weakWords: [], weakSkills: [], recentMistakes: [], goal: { dailyGoal: 10 }, examTarget: 'cet4' })
  ok(allCorrectPlan.cards.some((c) => c.type === 'word_review'), '有到期词时应含 word_review')

  // 5) skillKey → taskType 映射（P1-1 修复：弱项练习不再把 subskill 直当 taskType → 空池）
  ok(skillKeyToTaskType('inference') === 'reading_comprehension', 'inference → reading_comprehension')
  ok(skillKeyToTaskType('listening_inference') === 'listening_comprehension', 'listening_inference → listening_comprehension')
  ok(skillKeyToTaskType('verb_tense') === 'grammar_fill', 'verb_tense → grammar_fill')
  ok(skillKeyToTaskType('topic_sentence') === 'seven_select', 'topic_sentence → seven_select')
  ok(skillKeyToTaskType('reading_comprehension') === 'reading_comprehension', '合法 task_type 直通')
  ok(skillKeyToTaskType('writing') === undefined, '产出技能(writing) → undefined（caller 按 examId 抽混合，不空池）')
  ok(skillKeyToTaskType('') === undefined, '空 skillKey → undefined')

  writeFileSync('reports/learning-loop-validation.json', JSON.stringify({
    generatedAt: new Date().toISOString(),
    samples: { wordAttempts: wordAttempts.length, skillAttempts: skillAttempts.length },
    planCards: plan.cards.map((c) => ({ type: c.type, minutes: c.estimatedMinutes, reason: c.reason })),
    skillStates: states,
    errors, notes, ok: errors.length === 0,
  }, null, 2) + '\n', 'utf8')

  console.log(`validate-learning-loop: 错误 ${errors.length}`)
  console.log(`  计划卡：${plan.cards.map((c) => c.type).join(', ')}`)
  for (const e of errors) console.error(`ERROR ${e}`)
  process.exitCode = errors.length ? 1 : 0
}

main()
