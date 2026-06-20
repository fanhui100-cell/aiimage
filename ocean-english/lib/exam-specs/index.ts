/* ════════════════════════════════════════════════════════════════════════
   exam-specs/index.ts — 七档考试规格的公共入口（Phase 1）
   外部一律从 `@/lib/exam-specs` 引用，不直接深引 specs/level-map 内部文件。
   ════════════════════════════════════════════════════════════════════════ */

export type {
  ExamId,
  ExamLevel,
  ExamSkill,
  QuestionGroupMode,
  ExamSpecStatus,
  ScoringScale,
  ObjectiveTaskType,
  ProductiveTaskType,
  ExamTaskType,
  ExamSectionSpec,
  ExamSpec,
} from './types'

export {
  OBJECTIVE_TASK_TYPES,
  PRODUCTIVE_TASK_TYPES,
  ALL_EXAM_TASK_TYPES,
} from './types'

export { EXAM_SPECS, getExamSpec, listExamSpecs } from './specs'

export {
  LEVEL_TO_EXAM_ID,
  EXAM_ID_TO_LEVEL,
  normalizeExamId,
  examIdToThemeTag,
  examIdToDisplayName,
} from './level-map'
