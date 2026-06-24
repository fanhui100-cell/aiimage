/* ════════════════════════════════════════════════════════════════════════
   practice/attempt-recorder.ts — 作答记录器（Phase 4）

   - v2 question_attempts 表存在 + 用户已认证 + 有 questionItemId → 写入一行。
   - 表不存在 / 未认证 / 仅 v1 题 → 优雅返回 warning，不报 500、不写库。
   - 始终返回「建议的词状态/技能更新」，由客户端决定是否应用到 lexiStore（本函数不改任何客户端状态）。
   ════════════════════════════════════════════════════════════════════════ */
import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeExamId } from '@/lib/exam-specs'
import { classifyError } from '@/lib/learning-loop/error-classifier'
import { dimensionForAttempt } from '@/lib/learning-loop/word-mastery'
import { persistSkillStates } from '@/lib/learning-loop/skill-state-writer'
import type {
  RecordAttemptInput,
  RecordAttemptResponse,
  SkillUpdateSuggestion,
  WordUpdateSuggestion,
} from './session-types'

const SKILL_DELTA = 0.02

/** 从作答输入推导建议的词状态更新（仅被测/被测语境词回流）。Phase 13：补全词维度。 */
function deriveWordUpdates(input: RecordAttemptInput): WordUpdateSuggestion[] {
  const isCorrect = input.isCorrect ?? false
  const out: WordUpdateSuggestion[] = []
  for (const tw of input.targetWords ?? []) {
    if (!tw.wordId) continue
    if (tw.role && tw.role !== 'tested_answer' && tw.role !== 'tested_context') continue
    // 维度优先用题面给的；否则由 taskType 推断（recognize/spell/listen/context/output）
    const dimension = dimensionForAttempt(input.taskType, undefined, tw.dimension)
    out.push({ wordId: tw.wordId, isCorrect, dimension })
  }
  return out
}

/** Phase 13：错误类型——优先用调用方给的，否则按题目元数据 + 结果分类（答对为 null）。 */
function resolveErrorType(input: RecordAttemptInput): string | null {
  if (input.errorType) return input.errorType
  return classifyError({ taskType: input.taskType, isCorrect: input.isCorrect, subskills: input.subskills }) ?? null
}

/** 从作答输入推导建议的技能状态更新。 */
function deriveSkillUpdates(input: RecordAttemptInput): SkillUpdateSuggestion[] {
  const examId = input.examId ? normalizeExamId(input.examId) : null
  if (!examId) return []
  const delta = (input.isCorrect ? 1 : -1) * SKILL_DELTA
  const keys = input.subskills && input.subskills.length
    ? input.subskills
    : [input.sectionId ?? input.taskType].filter((x): x is string => !!x)
  return keys.map((skillKey) => ({ examId, skillKey, delta }))
}

async function v2AttemptTableExists(db: SupabaseClient): Promise<boolean> {
  const { error } = await db.from('question_attempts').select('id').limit(1)
  return !error
}

export async function recordAttempt(
  db: SupabaseClient,
  userId: string | null,
  input: RecordAttemptInput,
): Promise<RecordAttemptResponse> {
  const warnings: string[] = []
  const wordUpdates = deriveWordUpdates(input)
  const skillUpdates = deriveSkillUpdates(input)

  const base = { ok: true, recorded: false, storage: 'none' as const, warnings, wordUpdates, skillUpdates }

  if (!userId) {
    warnings.push('unauthenticated')
    return base
  }
  if (!input.questionItemId) {
    // v1-only 作答（无 v2 题目主键）：v2 attempts 需 question_item_id FK，无法写入。
    warnings.push('v1_attempt_no_v2_target')
    return base
  }
  if (!(await v2AttemptTableExists(db))) {
    warnings.push('not_applied')
    return base
  }

  const examId = input.examId ? normalizeExamId(input.examId) : null
  const row = {
    user_id: userId,
    question_item_id: input.questionItemId,
    question_set_id: input.setId ?? null,
    exam_id: examId,
    section_id: input.sectionId ?? null,
    task_type: input.taskType ?? null,
    subskills: input.subskills ?? [],
    answer: input.answer ?? null,
    is_correct: input.isCorrect ?? null,
    score: input.score ?? null,
    duration_ms: input.durationMs ?? null,
    error_type: resolveErrorType(input),
  }

  const { error } = await db.from('question_attempts').insert(row)
  if (error) {
    // 非致命：记录失败也不报 500，返回建议供客户端本地处理
    warnings.push('attempt_insert_failed')
    return base
  }

  // R12：物化服务端技能状态（供 daily-plan/diagnostics）；失败不影响作答记录
  const sk = await persistSkillStates(db, userId)
  if (!sk.written && sk.warnings.length && sk.warnings[0] !== 'no_attempts') warnings.push('skill_states:' + sk.warnings[0])

  return { ok: true, recorded: true, storage: 'v2', warnings, wordUpdates, skillUpdates }
}
