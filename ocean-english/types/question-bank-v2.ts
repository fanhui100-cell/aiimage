/* ════════════════════════════════════════════════════════════════════════
   types/question-bank-v2.ts — v2 题库表 Row 契约（Phase 3）
   与 supabase/sql/p4-question-bank-v2.sql 列对齐。枚举从 lib/question-bank-v2/schema 引入。
   ════════════════════════════════════════════════════════════════════════ */

import type {
  QbankV2GroupMode,
  QbankV2InputMode,
  QbankV2QaStatus,
  QbankV2Skill,
  QbankV2Status,
  QbankV2TargetWordRole,
} from '@/lib/question-bank-v2/schema'

export type ExamSpecStatusRow = 'draft' | 'active' | 'deprecated'
export type SelectionMode = 'single' | 'rows' | 'passages' | 'paper'

export interface V2Choice {
  id: string
  text: string
}

export interface ExamSpecRow {
  id: string
  level: number
  name_zh: string
  name_en: string
  version: string
  source_urls: string[]
  total_minutes: number | null
  full_score: number | null
  scoring_scale: string | null
  status: ExamSpecStatusRow
  created_at: string
  updated_at: string
}

export interface ExamSectionRow {
  id: string
  exam_id: string
  order_index: number
  name_zh: string
  name_en: string | null
  skill: QbankV2Skill
  selection_mode: SelectionMode | null
  item_count: number | null
  points: number | null
  time_limit_sec: number | null
  requires_audio: boolean
  requires_rubric: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface TaskTemplateRow {
  id: string
  exam_id: string | null
  section_id: string | null
  task_type: string
  name_zh: string | null
  subskills: string[]
  input_mode: QbankV2InputMode
  group_mode: QbankV2GroupMode
  answer_schema: Record<string, unknown>
  min_pool: number
  status: ExamSpecStatusRow
  created_at: string
  updated_at: string
}

export interface StimulusRow {
  id: string
  legacy_id: string | null
  kind: 'passage' | 'dialogue' | 'lecture' | 'announcement' | 'table' | 'image' | 'sentence' | 'word'
  title: string | null
  text_en: string | null
  text_zh: string | null
  topic_tags: string[]
  domain_tags: string[]
  level: number | null
  word_count: number | null
  source_type: string
  source_note: string | null
  qa_status: QbankV2QaStatus
  created_at: string
  updated_at: string
}

export interface AudioAssetRow {
  id: string
  stimulus_id: string | null
  url: string
  transcript: string
  duration_ms: number | null
  accent: string | null
  voice_id: string | null
  provider: string | null
  checksum: string | null
  qa_status: QbankV2QaStatus
  created_at: string
  updated_at: string
}

export interface RubricRow {
  id: string
  name_zh: string | null
  exam_id: string | null
  skill: string | null
  criteria: unknown
  max_score: number | null
  status: ExamSpecStatusRow
  created_at: string
  updated_at: string
}

export interface QuestionSetRow {
  id: string
  legacy_id: string | null
  exam_id: string | null
  section_id: string | null
  task_template_id: string | null
  stimulus_id: string | null
  level: number | null
  task_type: string
  difficulty_band: number | null
  estimated_minutes: number | null
  topic_tags: string[]
  status: QbankV2Status
  qa_flags: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface QuestionItemRow {
  id: string
  legacy_id: string | null
  question_set_id: string
  order_index: number
  input_mode: QbankV2InputMode
  prompt: string
  prompt_zh: string | null
  choices: V2Choice[]
  answer: unknown
  explanation_zh: string | null
  subskills: string[]
  rubric_id: string | null
  difficulty_band: number | null
  status: QbankV2Status
  created_at: string
  updated_at: string
}

export interface QuestionTargetWordRow {
  id: string
  question_item_id: string
  word_id: string | null
  surface: string | null
  role: QbankV2TargetWordRole
  sense_key: string | null
  dimension: string | null
  created_at: string
}

export interface PaperInstanceRow {
  id: string
  user_id: string
  exam_id: string | null
  seed: string
  mode: 'mini' | 'section' | 'full'
  status: 'in_progress' | 'submitted' | 'abandoned'
  score: Record<string, unknown>
  started_at: string
  submitted_at: string | null
  created_at: string
  updated_at: string
}

export interface PaperSectionRow {
  id: string
  paper_instance_id: string
  user_id: string
  section_id: string | null
  order_index: number
  question_set_ids: string[]
  question_item_ids: string[]
  points: number | null
  time_limit_sec: number | null
  created_at: string
}

export interface PaperAttemptRow {
  id: string
  paper_instance_id: string
  user_id: string
  score: Record<string, unknown>
  objective_score: number | null
  scaled_score: number | null
  submitted_at: string
  created_at: string
}

export interface QuestionAttemptRow {
  id: string
  user_id: string
  question_item_id: string
  question_set_id: string | null
  paper_instance_id: string | null
  exam_id: string | null
  section_id: string | null
  task_type: string | null
  subskills: string[]
  answer: unknown
  is_correct: boolean | null
  score: number | null
  duration_ms: number | null
  error_type: string | null
  answered_at: string
}

export interface SkillStateRow {
  user_id: string
  exam_id: string
  skill_key: string
  mastery: number
  attempts: number
  correct: number
  last_attempt_at: string | null
  updated_at: string
}

export interface DailyPlanItemRow {
  id: string
  user_id: string
  plan_date: string
  kind: string
  payload: Record<string, unknown>
  priority: number
  estimated_minutes: number | null
  status: 'pending' | 'done' | 'skipped'
  created_at: string
}
