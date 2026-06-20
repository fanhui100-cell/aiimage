/* ════════════════════════════════════════════════════════════════════════
   daily-plan/daily-plan-engine.ts — 今日计划引擎（Phase 13，纯函数、确定性）

   输入：到期词 / 薄弱词 / 薄弱技能 / 近期错题 / 用户目标 / 目标考试。
   输出卡片：word_review / new_words / exam_task / mistake_fix / output / mock_review。
   每张卡都带 reason（为什么推荐）+ estimatedMinutes。
   ════════════════════════════════════════════════════════════════════════ */

export type CardType = 'word_review' | 'new_words' | 'exam_task' | 'mistake_fix' | 'output' | 'mock_review'

export interface PlanWord { id: string; word: string }
export interface PlanWeakSkill { examId: string; skillKey: string; mastery: number; confidence: string }
export interface PlanMistake { wordId?: string; errorType?: string; taskType?: string }

export interface DailyPlanInput {
  dueWords: PlanWord[]
  weakWords: PlanWord[]
  weakSkills: PlanWeakSkill[]
  recentMistakes: PlanMistake[]
  goal?: { dailyGoal?: number; goals?: string[] }
  examTarget?: string | null
  /** 是否有待回顾的模拟卷（客户端/服务端传入）。 */
  mockPending?: boolean
}

export interface PlanCard {
  type: CardType
  titleZh: string
  reason: string
  estimatedMinutes: number
  priority: number          // 越小越靠前
  payload: Record<string, unknown>
}

export interface DailyPlan {
  cards: PlanCard[]
  warnings: string[]
}

const clampMin = (n: number, lo = 1, hi = 30) => Math.max(lo, Math.min(hi, Math.round(n)))
const PRODUCTIVE_EXAMS = new Set(['zhongkao', 'gaokao', 'cet4', 'cet6', 'kaoyan', 'toefl'])   // SAT 无写作/口语产出

export function buildDailyPlan(input: DailyPlanInput): DailyPlan {
  const cards: PlanCard[] = []
  const warnings: string[] = []
  const due = input.dueWords ?? []
  const weakW = input.weakWords ?? []
  const weakS = input.weakSkills ?? []
  const mistakes = input.recentMistakes ?? []
  const exam = input.examTarget ?? null

  // 1) 到期词复习（最高优先：漏复习损失最大）
  if (due.length) {
    cards.push({
      type: 'word_review', titleZh: '到期复习', priority: 1,
      reason: `有 ${due.length} 个词到达复习时间，按 SRS 节奏巩固以防遗忘。`,
      estimatedMinutes: clampMin(due.length * 0.4),
      payload: { count: due.length, wordIds: due.slice(0, 50).map((w) => w.id) },
    })
  }

  // 2) 错题重练（错题/薄弱词产生的修复信号）
  const repairCount = new Set([...mistakes.map((m) => m.wordId).filter(Boolean) as string[], ...weakW.map((w) => w.id)]).size
  if (repairCount) {
    const topErr = mistakes.find((m) => m.errorType && m.errorType !== 'unknown')?.errorType
    cards.push({
      type: 'mistake_fix', titleZh: '错题重练', priority: 2,
      reason: `有 ${repairCount} 个薄弱点${topErr ? `（主要错误：${topErr}）` : ''}，针对性重练修复。`,
      estimatedMinutes: clampMin(repairCount * 0.6),
      payload: { count: repairCount, wordIds: weakW.slice(0, 50).map((w) => w.id) },
    })
  }

  // 3) 考试任务（薄弱板块定向练）
  if (exam && weakS.length) {
    const s = weakS[0]
    cards.push({
      type: 'exam_task', titleZh: '薄弱板块专练', priority: 3,
      reason: `「${exam}」的 ${s.skillKey} 掌握度偏低（${Math.round(s.mastery * 100)}%，置信度 ${s.confidence}），定向练习提分。`,
      estimatedMinutes: 12,
      payload: { examId: exam, skillKey: s.skillKey, allWeak: weakS.slice(0, 5) },
    })
  }

  // 4) 新学词（按每日目标）
  const dailyGoal = input.goal?.dailyGoal ?? 0
  if (dailyGoal > 0) {
    const newCount = Math.max(0, dailyGoal - due.length)
    if (newCount > 0) {
      cards.push({
        type: 'new_words', titleZh: '今日新学', priority: 4,
        reason: `今日目标 ${dailyGoal} 词，复习占 ${Math.min(due.length, dailyGoal)}，再学 ${newCount} 个新词。`,
        estimatedMinutes: clampMin(newCount * 0.6),
        payload: { count: newCount },
      })
    }
  }

  // 5) 产出练习（写作/口语；SAT 无产出任务）
  if (exam && PRODUCTIVE_EXAMS.has(exam)) {
    const wantOutput = (input.goal?.goals ?? []).some((g) => /writ|speak|output|作文|口语|写作/i.test(g)) || weakS.some((s) => /writ|speak|essay|translation/i.test(s.skillKey))
    if (wantOutput) {
      cards.push({
        type: 'output', titleZh: '产出练习', priority: 5,
        reason: `结合目标考试「${exam}」做一次写作/口语产出，并用 rubric 估分获取改进方向。`,
        estimatedMinutes: 12,
        payload: { examId: exam },
      })
    }
  }

  // 6) 模拟卷回顾
  if (input.mockPending) {
    cards.push({
      type: 'mock_review', titleZh: '模拟卷回顾', priority: 6,
      reason: '有未回顾的模拟卷，复盘错题与分区表现，巩固薄弱板块。',
      estimatedMinutes: 10,
      payload: { examId: exam },
    })
  }

  if (!cards.length) warnings.push('no_signals')   // 无任何信号（新用户/无数据）
  cards.sort((a, b) => a.priority - b.priority)
  return { cards, warnings }
}
