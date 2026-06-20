/* ════════════════════════════════════════════════════════════════════════
   learning-loop/word-mastery.ts — 作答 → 词级掌握更新（Phase 13，纯函数）

   - 把一次作答映射到词维度：recognize / spell / listen / context / output。
   - 产出「建议的 SRS 评分」（again/good），由客户端喂给现有 SRS（lib/srs/schedule，
     不替代、不重写 SRS）。
   - 答错 → needsReview=true（复习/修复信号；validate-learning-loop 会校验此信号必产生）。
   ════════════════════════════════════════════════════════════════════════ */
import type { ReviewGrade } from '@/lib/srs/schedule'

export type WordDimension = 'recognize' | 'spell' | 'listen' | 'context' | 'output'

export interface WordAttempt {
  wordId: string
  taskType?: string
  inputMode?: string
  isCorrect: boolean
  /** 已知词维度（覆盖推断）。 */
  dimension?: string
}

export interface WordMasteryUpdate {
  wordId: string
  dimension: WordDimension
  isCorrect: boolean
  /** 建议喂给现有 SRS 的评分；答错 again、答对 good。 */
  suggestedGrade: ReviewGrade
  /** 答错 → true：必须进复习/修复队列。 */
  needsReview: boolean
}

const SPELL_TASKS = new Set(['zh_to_word_spell', 'word_form', 'cloze_spell', 'dictation_spell'])
const LISTEN_TASKS = new Set(['listen_to_meaning', 'dictation_spell', 'listening_comprehension', 'listen_to_word'])
const CONTEXT_TASKS = new Set(['cloze_choice', 'cloze_passage', 'synonym_substitute', 'collocation_choice', 'reading_comprehension', 'banked_cloze', 'seven_select', 'para_match', 'grammar_fill', 'confusable_choice'])
const OUTPUT_TASKS = new Set(['essay_writing', 'applied_writing', 'continuation_writing', 'translation_zh_en', 'translation_en_zh', 'interview_speaking', 'listen_and_repeat'])

const VALID_DIMS = new Set<WordDimension>(['recognize', 'spell', 'listen', 'context', 'output'])

/** 推断该作答考查的词维度。 */
export function dimensionForAttempt(taskType?: string, inputMode?: string, explicit?: string): WordDimension {
  if (explicit && VALID_DIMS.has(explicit as WordDimension)) return explicit as WordDimension
  if (inputMode === 'spell' || (taskType && SPELL_TASKS.has(taskType))) return 'spell'
  if (inputMode === 'listen' || (taskType && LISTEN_TASKS.has(taskType))) return 'listen'
  if (inputMode === 'free_text' || inputMode === 'speak' || (taskType && OUTPUT_TASKS.has(taskType))) return 'output'
  if (taskType && CONTEXT_TASKS.has(taskType)) return 'context'
  return 'recognize'
}

/** 作答 → 词级掌握更新（含建议 SRS 评分 + 复习信号）。 */
export function attemptToWordUpdate(a: WordAttempt): WordMasteryUpdate {
  const dimension = dimensionForAttempt(a.taskType, a.inputMode, a.dimension)
  return {
    wordId: a.wordId,
    dimension,
    isCorrect: a.isCorrect,
    suggestedGrade: a.isCorrect ? 'good' : 'again',
    needsReview: !a.isCorrect,
  }
}

/** 批量：从一组词作答产出更新（保序去抖：同词多维各记一条）。 */
export function buildWordMasteryUpdates(attempts: WordAttempt[]): WordMasteryUpdate[] {
  return attempts.filter((a) => a.wordId).map(attemptToWordUpdate)
}
