/* ════════════════════════════════════════════════════════════════════════
   scoring/rubric-types.ts — 主观题（写作/翻译/口语）评分契约（Phase 12）

   评分一律是「练习估分」（isEstimate=true），绝不冒充官方分。AI 不可用时回退 mock。
   ════════════════════════════════════════════════════════════════════════ */

export type RubricDimensionKey =
  | 'task_achievement'
  | 'accuracy'
  | 'vocabulary'
  | 'grammar'
  | 'organization'
  | 'coherence'
  | 'pronunciation'
  | 'fluency'
  | 'translation_accuracy'

export type ScoringSkill = 'writing' | 'translation' | 'speaking'

export interface RubricDimension {
  key: RubricDimensionKey
  labelZh: string
  labelEn: string
  /** 该维度考查什么（给 AI/复核者看）。 */
  description: string
  /** 权重 0..1；同一 rubric 各维度权重之和应≈1。 */
  weight: number
  /** 维度内分档区间（如 0..5）。 */
  scale: { min: number; max: number }
  /** 可选分档描述（band descriptors）。 */
  bands?: { score: number; descriptor: string }[]
}

export interface Rubric {
  id: string                    // `${examId}:${skill}`
  examId: string                // canonical exam id（lib/exam-specs）
  skill: ScoringSkill
  taskTypes: string[]           // 覆盖的生产性任务类型（applied_writing / essay_writing / ...）
  nameZh: string
  /** 该任务在所属考试量表下的满分（练习估分会折算到此）。 */
  fullScore: number
  dimensions: RubricDimension[]
  notes?: string
}

export interface ScoreDimensionResult {
  key: RubricDimensionKey
  labelZh: string
  awarded: number
  max: number
  comment: string
}

export interface SubjectiveScore {
  provider: 'deepseek' | 'mock'
  /** 永远为 true：练习估分，非官方分。 */
  isEstimate: true
  rubricId: string
  examId: string
  skill: ScoringSkill
  /** 0..fullScore（考试量表）。 */
  overall: number
  fullScore: number
  /** 定性档（如「接近目标 / 达标 / 待提升」）。 */
  band: string
  dimensions: ScoreDimensionResult[]
  strengths: string[]
  issues: string[]
  nextRecommendation: string
  /** 口语：是否基于文字转写评分（本期仅文字转写）。 */
  transcriptUsed?: boolean
  /** 口语：音频评分是否就绪（本期 not_ready）。 */
  audioScoring?: 'not_ready'
  warnings: string[]
}

export interface ScoreInput {
  examId: string
  /** 学习者提交：作文 / 译文 / 口语转写。 */
  text: string
  /** 翻译源文 / 口语题面（可选）。 */
  sourceText?: string
  level?: number
  taskType?: string
}
