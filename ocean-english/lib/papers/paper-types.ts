/* ════════════════════════════════════════════════════════════════════════
   papers/paper-types.ts — 模拟卷生成/评分契约（Phase 10）

   从 canonical ExamSpec（lib/exam-specs）+ v2 active 题池装配可复现的整卷。
   - 客观区：抽 v2 active question_sets/items（按 task_type+level，绝不退役、绝不无关回退）。
   - 主观区（写作/翻译/口语）：只放 placeholder（needs_manual_or_ai_scoring），不造假客观题。
   - 答案键 answerKey 仅服务端/评分用；API 客户端视图会剥离。
   ════════════════════════════════════════════════════════════════════════ */
import type { ExamId } from '@/lib/exam-specs'

export type PaperMode = 'mini' | 'section' | 'full'

/** section/item 计分方式。 */
export type ScoreKind = 'objective' | 'multi_blank' | 'matching' | 'needs_manual_or_ai_scoring'

export interface PaperChoice {
  id: string
  text: string
}

export interface PaperStimulus {
  kind?: string
  title?: string
  textEn?: string
  audioUrl?: string
}

export interface PaperSetRef {
  setId: string
  taskType: string
  stimulusId?: string
  stimulus?: PaperStimulus
}

export interface PaperItem {
  questionItemId: string
  setId: string
  orderIndex: number
  inputMode: string
  prompt: string
  promptZh?: string
  choices?: PaperChoice[]
  /** 标准答案：仅服务端持久化/评分用；POST /api/papers 的客户端视图会剥离。 */
  answerKey?: unknown
  targetWordIds?: string[]
}

export interface PaperSection {
  sectionId: string
  labelZh: string
  labelEn: string
  skill: string
  /** 实际抽中的题型；主观/空池时为 spec 的首选 taskType。 */
  taskType: string | null
  groupMode: string
  points: number
  scoring: ScoreKind
  requiresAudio?: boolean
  requiresRubric?: boolean
  /** 写作/翻译/口语等 → 仅 placeholder。 */
  subjective: boolean
  placeholder?: { reason: 'needs_manual_or_ai_scoring'; taskTypes: string[] }
  sets: PaperSetRef[]
  items: PaperItem[]
  warnings: string[]
}

export interface GeneratedPaper {
  examId: ExamId
  examLabelZh: string
  level: number
  mode: PaperMode
  seed: string
  scoringScale: string
  fullScore: number
  totalMinutes: number
  sections: PaperSection[]
  warnings: string[]
}

export interface GeneratePaperInput {
  examId: string
  mode: PaperMode
  sectionId?: string
  seed?: string
}

// ── 评分 ────────────────────────────────────────────────────────────────────
export interface ItemResponse {
  questionItemId: string
  answer: unknown
}

export interface ItemScore {
  questionItemId: string
  kind: ScoreKind
  awarded: number
  max: number
  correct?: boolean
  needsScoring?: boolean
}

export interface SectionScore {
  sectionId: string
  awarded: number
  max: number
  needsManualOrAi: boolean
  items: ItemScore[]
}

export interface PaperScore {
  sections: SectionScore[]
  objectiveAwarded: number
  objectiveMax: number
  scaled: number
  needsManualOrAi: boolean
}
