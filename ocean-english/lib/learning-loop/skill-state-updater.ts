/* ════════════════════════════════════════════════════════════════════════
   learning-loop/skill-state-updater.ts — 考试技能状态更新（Phase 13，纯函数）

   - 按 examId × skillKey 累积 mastery；保守 EMA 平滑，不因单次作答暴涨/暴跌。
   - confidence 由样本量决定；样本稀疏 → 低置信，调用方据此**不展示精确分**。
   - skillKey 来自 subskills（优先）/ sectionId / taskType。
   ════════════════════════════════════════════════════════════════════════ */

export type Confidence = 'insufficient' | 'low' | 'medium' | 'high'

export interface SkillAttempt {
  examId: string
  sectionId?: string
  taskType?: string
  subskills?: string[]
  isCorrect: boolean
}

export interface SkillState {
  examId: string
  skillKey: string
  mastery: number      // 0..1（EMA）
  attempts: number
  correct: number
}

export interface SkillStateResult extends SkillState {
  confidence: Confidence
  /** confidence !== 'high' 时为 true：UI 应标注「估算/样本不足」，不展示精确分。 */
  isEstimate: boolean
}

const ALPHA = 0.15          // 保守平滑：单次最多挪动 15%
const PRIOR_MASTERY = 0.5   // 冷启动中性先验

export function confidenceFor(attempts: number): Confidence {
  if (attempts < 3) return 'insufficient'
  if (attempts < 8) return 'low'
  if (attempts < 20) return 'medium'
  return 'high'
}

/** 从一条作答抽取 skillKey 列表（subskills 优先，否则 sectionId/taskType）。 */
export function skillKeysFor(a: SkillAttempt): string[] {
  if (a.subskills && a.subskills.length) return a.subskills
  const k = a.sectionId ?? a.taskType
  return k ? [k] : []
}

/** 单步更新：保守 EMA，attempts/correct 累加。 */
export function updateSkillState(prev: SkillState | null, isCorrect: boolean): SkillState {
  const base = prev ?? { examId: '', skillKey: '', mastery: PRIOR_MASTERY, attempts: 0, correct: 0 }
  const target = isCorrect ? 1 : 0
  return {
    examId: base.examId,
    skillKey: base.skillKey,
    mastery: Math.max(0, Math.min(1, base.mastery + ALPHA * (target - base.mastery))),
    attempts: base.attempts + 1,
    correct: base.correct + (isCorrect ? 1 : 0),
  }
}

function withConfidence(s: SkillState): SkillStateResult {
  const confidence = confidenceFor(s.attempts)
  return { ...s, confidence, isEstimate: confidence !== 'high' }
}

/** 聚合一批作答 → 各 (examId×skillKey) 技能状态（可带先验）。 */
export function aggregateSkillStates(attempts: SkillAttempt[], prior?: Map<string, SkillState>): SkillStateResult[] {
  const map = new Map<string, SkillState>()
  if (prior) for (const [k, v] of prior) map.set(k, { ...v })
  for (const a of attempts) {
    if (!a.examId) continue
    for (const skillKey of skillKeysFor(a)) {
      const key = `${a.examId}::${skillKey}`
      const cur = map.get(key) ?? { examId: a.examId, skillKey, mastery: PRIOR_MASTERY, attempts: 0, correct: 0 }
      const next = updateSkillState(cur, a.isCorrect)
      next.examId = a.examId
      next.skillKey = skillKey
      map.set(key, next)
    }
  }
  return [...map.values()].map(withConfidence)
}

/** 薄弱技能：mastery 低于阈值的（默认 0.6），按 mastery 升序。 */
export function weakSkills(states: SkillStateResult[], threshold = 0.6): SkillStateResult[] {
  return states.filter((s) => s.mastery < threshold && s.attempts > 0).sort((a, b) => a.mastery - b.mastery)
}
