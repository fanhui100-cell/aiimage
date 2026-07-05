/* ════════════════════════════════════════════════════════════════════════
   learning-loop/error-classifier.ts — 错误类型分类（Phase 13，纯函数）

   从题目元数据（taskType/inputMode/subskills/dimension）+ 作答结果分类错误类型；
   无法确定时归 'unknown'。答对返回 null（无错误）。不依赖 DB。
   ════════════════════════════════════════════════════════════════════════ */

export const ERROR_TYPES = [
  'unknown_word', 'wrong_sense', 'collocation', 'word_form', 'grammar',
  'inference', 'main_idea', 'evidence', 'listening_detail', 'listening_inference',
  'pronunciation', 'fluency', 'organization', 'translation_accuracy', 'unknown',
] as const
export type ErrorType = (typeof ERROR_TYPES)[number]

export interface ClassifyInput {
  taskType?: string
  inputMode?: string
  isCorrect?: boolean
  subskills?: string[]
  /** 词维度（recognize/spell/listen/context/output）若已知。 */
  dimension?: string
}

const SUBSKILL_TO_ERROR: Record<string, ErrorType> = {
  main_idea: 'main_idea', central_ideas: 'main_idea', central_ideas_details: 'main_idea', gist: 'main_idea', topic_sentence: 'main_idea',
  inference: 'inference', logical_flow: 'inference',
  command_of_evidence: 'evidence', evidence: 'evidence',
  collocation: 'collocation', pos_consistency: 'collocation', context_coherence: 'collocation',
  word_form: 'word_form',
  grammar: 'grammar', verb_tense: 'grammar', subject_verb_agreement: 'grammar', non_finite: 'grammar', article: 'grammar', preposition: 'grammar', boundaries: 'grammar', form_structure_sense: 'grammar',
  cohesion: 'organization', discourse_marker: 'organization', reference: 'organization', transitions: 'organization',
  paraphrase: 'main_idea', info_matching: 'main_idea', scanning: 'evidence',
  words_in_context: 'wrong_sense',
  pronunciation: 'pronunciation', fluency: 'fluency',
  translation_accuracy: 'translation_accuracy',
}

const TASK_TO_ERROR: Record<string, ErrorType> = {
  en_to_zh: 'wrong_sense', zh_to_en: 'wrong_sense', def_to_word: 'wrong_sense',
  synonym_choice: 'wrong_sense', synonym_substitute: 'wrong_sense', confusable_choice: 'wrong_sense',
  collocation_choice: 'collocation',
  zh_to_word_spell: 'word_form', word_form: 'word_form', cloze_spell: 'word_form',
  cloze_choice: 'grammar', cloze_passage: 'grammar', grammar_fill: 'grammar', banked_cloze: 'collocation',
  listen_to_meaning: 'listening_detail', dictation_spell: 'listening_detail',
  listening_comprehension: 'listening_detail',
  reading_comprehension: 'inference', seven_select: 'inference', para_match: 'main_idea',
  essay_writing: 'organization', applied_writing: 'organization', continuation_writing: 'organization',
  translation_zh_en: 'translation_accuracy', translation_en_zh: 'translation_accuracy',
  listen_and_repeat: 'pronunciation', interview_speaking: 'fluency',
}

/** 答对→null；答错→按 subskills 优先、再按 taskType、再按 dimension 推断；都不确定→'unknown'。 */
export function classifyError(input: ClassifyInput): ErrorType | null {
  // P1 fix (cc-full-project-review-2026-07-05): 仅当「明确判错」才归错误类型。
  // 结构题/产出题以 isCorrect=undefined 记录（未判分），旧写法 `if (input.isCorrect)` 把 undefined 当假，
  // 会给未判分作答硬扣一个错误类型（如 cloze_passage→grammar）。改为只有 isCorrect===false 才分类。
  if (input.isCorrect !== false) return null

  // 1) listening 最先特判：听力错误归 listening_detail / listening_inference，
  //    否则会被通用 subskill 映射（如 inference）抢先，永远到不了 listening_inference。
  if (input.taskType === 'listening_comprehension') {
    if ((input.subskills ?? []).some((s) => /infer/i.test(s))) return 'listening_inference'
    return 'listening_detail'
  }

  // 2) subskills 最具体（非听力）
  for (const s of input.subskills ?? []) {
    const hit = SUBSKILL_TO_ERROR[s]
    if (hit) return hit
  }

  // 3) taskType
  if (input.taskType && TASK_TO_ERROR[input.taskType]) return TASK_TO_ERROR[input.taskType]

  // 4) inputMode 兜底
  if (input.inputMode === 'spell') return 'word_form'
  if (input.inputMode === 'listen') return 'listening_detail'
  if (input.inputMode === 'free_text') return 'organization'
  if (input.inputMode === 'speak') return 'pronunciation'

  // 5) 词维度兜底（recognize → 词义不清）
  if (input.dimension === 'recognize') return 'wrong_sense'
  if (input.dimension === 'spell') return 'word_form'
  if (input.dimension === 'listen') return 'listening_detail'
  if (input.dimension === 'output') return 'organization'

  return 'unknown'
}

export function isErrorType(v: string): v is ErrorType {
  return (ERROR_TYPES as readonly string[]).includes(v)
}
