/* ════════════════════════════════════════════════════════════════════════
   question-bank-v2/schema.ts — v2 题库运行时常量（Phase 3）
   状态 / 输入模式 / 分组模式 / 目标词角色 / QA 状态 / v2 表名清单。
   SQL（supabase/sql/p4-question-bank-v2.sql）与 TS（types/question-bank-v2.ts）
   都以这里为单一真源，避免枚举漂移。
   ════════════════════════════════════════════════════════════════════════ */

/** 内容生命周期状态（specs/templates 用前三态，sets/items 用全部）。 */
export const QBANK_V2_STATUSES = ['draft', 'reviewed', 'active', 'retired', 'rejected'] as const
export type QbankV2Status = (typeof QBANK_V2_STATUSES)[number]

/** 题目输入模式（PracticeRunner 据此选 renderer）。 */
export const QBANK_V2_INPUT_MODES = ['choice', 'spell', 'free_text', 'speak', 'listen', 'matching', 'multi_blank'] as const
export type QbankV2InputMode = (typeof QBANK_V2_INPUT_MODES)[number]

/** 任务分组模式：single=单题；set=带材料的题组；paper=整卷。 */
export const QBANK_V2_GROUP_MODES = ['single', 'set', 'paper'] as const
export type QbankV2GroupMode = (typeof QBANK_V2_GROUP_MODES)[number]

/** 目标词角色（question_target_words.role）。 */
export const QBANK_V2_TARGET_WORD_ROLES = ['tested_answer', 'tested_context', 'distractor', 'keyword', 'expected_output'] as const
export type QbankV2TargetWordRole = (typeof QBANK_V2_TARGET_WORD_ROLES)[number]

/** 材料/音频 QA 状态（stimuli.qa_status / audio_assets.qa_status）。 */
export const QBANK_V2_QA_STATUSES = ['draft', 'machine_checked', 'human_checked', 'active', 'rejected'] as const
export type QbankV2QaStatus = (typeof QBANK_V2_QA_STATUSES)[number]

/** 板块技能（exam_sections.skill）。 */
export const QBANK_V2_SKILLS = ['vocabulary', 'grammar', 'reading', 'listening', 'speaking', 'writing', 'translation', 'integrated'] as const
export type QbankV2Skill = (typeof QBANK_V2_SKILLS)[number]

/** v2 表名清单（校验脚本探测是否已建表用）。 */
export const QBANK_V2_TABLES = [
  'exam_specs',
  'exam_sections',
  'task_templates',
  'stimuli',
  'audio_assets',
  'rubrics',
  'question_sets',
  'question_items',
  'question_target_words',
  'paper_instances',
  'paper_sections',
  'paper_attempts',
  'question_attempts',
  'skill_states',
  'daily_plan_items',
] as const
export type QbankV2Table = (typeof QBANK_V2_TABLES)[number]

export function isQbankV2Status(value: string): value is QbankV2Status {
  return (QBANK_V2_STATUSES as readonly string[]).includes(value)
}
export function isQbankV2InputMode(value: string): value is QbankV2InputMode {
  return (QBANK_V2_INPUT_MODES as readonly string[]).includes(value)
}
export function isQbankV2GroupMode(value: string): value is QbankV2GroupMode {
  return (QBANK_V2_GROUP_MODES as readonly string[]).includes(value)
}
export function isQbankV2TargetWordRole(value: string): value is QbankV2TargetWordRole {
  return (QBANK_V2_TARGET_WORD_ROLES as readonly string[]).includes(value)
}
