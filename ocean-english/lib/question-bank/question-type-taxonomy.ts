/* ════════════════════════════════════════════════════════════════════════
   question-type-taxonomy.ts — 题型分类「唯一真源」（Phase 0A）

   把 question_bank 里散落的 `type` 字符串归到四个互斥集合，供后端/默认题池/
   组卷器/校验脚本统一引用。本文件不改任何 DB 数据，也不改前端可见 UI。

   四个集合（互斥）：
   - WORD_UNIVERSE_TYPES   单词宇宙练习题型（背词/拼写/听辨/搭配/辨析），不当作真实考试任务
   - EXAM_TASK_TYPES       真实考试任务题型（阅读/听力/选词填空/七选五/段落匹配/完形/语法填空）
   - DEPRECATED_QUESTION_TYPES  从默认路由/推荐/模拟卷/考试任务池退役的题型
   - ALIAS_ONLY_QUESTION_TYPES  仅作历史命名别名、不作为可见题型对外暴露的 type

   命名债务说明：
   - DB 实际使用 `def_to_word` 表示「看释义选词」；`definition_to_word` /
     `zh_definition_to_word` 是旧命名别名（见 question-api-utils 的归一逻辑），
     仅作兼容，不作为独立可选题型。
   ════════════════════════════════════════════════════════════════════════ */

/** 单词宇宙练习题型：背词闭环可见，但不是真实考试任务。`def_to_word` 是 DB 实际命名。 */
export const WORD_UNIVERSE_TYPES = [
  'en_to_zh',
  'zh_to_en',
  'def_to_word',
  'cloze_choice',
  'cloze_spell',
  'zh_to_word_spell',
  'word_form',
  'listen_to_meaning',
  'dictation_spell',
  'synonym_choice',
  'synonym_substitute',
  'collocation_choice',
  'confusable_choice',
] as const

/** 真实考试任务题型：按官方 section/task 结构训练与组卷。 */
export const EXAM_TASK_TYPES = [
  'reading_comprehension',
  'listening_comprehension',
  'banked_cloze',
  'seven_select',
  'para_match',
  'cloze_passage',
  'grammar_fill',
] as const

/**
 * 退役题型：不进默认路由、不进推荐、不进模拟卷、不进考试任务池。
 * 旧 DB 行仍存在（不物理删除），只是不再从这些入口主动抽取。
 */
export const DEPRECATED_QUESTION_TYPES = [
  'antonym_choice',
  'cet_cloze',
] as const

/**
 * 仅别名题型：只作为历史命名的兼容别名存在，不作为可见/可选题型。
 * 这些名字在客户端会被归一到对应正式 type（如 def_to_word）。
 */
export const ALIAS_ONLY_QUESTION_TYPES = [
  'definition_to_word',
  'zh_definition_to_word',
  'listen_to_word',
] as const

export type WordUniverseType = (typeof WORD_UNIVERSE_TYPES)[number]
export type ExamTaskType = (typeof EXAM_TASK_TYPES)[number]
export type DeprecatedQuestionType = (typeof DEPRECATED_QUESTION_TYPES)[number]
export type AliasOnlyQuestionType = (typeof ALIAS_ONLY_QUESTION_TYPES)[number]

const WORD_UNIVERSE_SET: ReadonlySet<string> = new Set(WORD_UNIVERSE_TYPES)
const EXAM_TASK_SET: ReadonlySet<string> = new Set(EXAM_TASK_TYPES)
const DEPRECATED_SET: ReadonlySet<string> = new Set(DEPRECATED_QUESTION_TYPES)
const ALIAS_ONLY_SET: ReadonlySet<string> = new Set(ALIAS_ONLY_QUESTION_TYPES)

export function isWordUniverseType(type: string): boolean {
  return WORD_UNIVERSE_SET.has(type)
}

export function isExamTaskType(type: string): boolean {
  return EXAM_TASK_SET.has(type)
}

export function isDeprecatedQuestionType(type: string): boolean {
  return DEPRECATED_SET.has(type)
}

export function isAliasOnlyQuestionType(type: string): boolean {
  return ALIAS_ONLY_SET.has(type)
}

/**
 * 可选/可对外暴露的题型：单词宇宙练习题型或真实考试任务题型。
 * 退役题型和仅别名题型都不可选。四集合互斥，故直接并集即可。
 */
export function isSelectableQuestionType(type: string): boolean {
  return isWordUniverseType(type) || isExamTaskType(type)
}
