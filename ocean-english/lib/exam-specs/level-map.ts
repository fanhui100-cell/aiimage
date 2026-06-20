/* ════════════════════════════════════════════════════════════════════════
   exam-specs/level-map.ts — ExamId ↔ ExamLevel 映射与归一 helpers（Phase 1）
   question_bank 题库按 theme_tags `lvN` 标等级；examIdToThemeTag 据此把 examId 映回 lvN。
   ════════════════════════════════════════════════════════════════════════ */

import type { ExamId, ExamLevel } from './types'

export const LEVEL_TO_EXAM_ID: Record<ExamLevel, ExamId> = {
  1: 'zhongkao',
  2: 'gaokao',
  3: 'cet4',
  4: 'cet6',
  5: 'kaoyan',
  6: 'toefl',
  7: 'sat',
}

export const EXAM_ID_TO_LEVEL: Record<ExamId, ExamLevel> = {
  zhongkao: 1,
  gaokao: 2,
  cet4: 3,
  cet6: 4,
  kaoyan: 5,
  toefl: 6,
  sat: 7,
}

const DISPLAY_NAMES: Record<ExamId, string> = {
  zhongkao: '中考',
  gaokao: '高考',
  cet4: 'CET-4',
  cet6: 'CET-6',
  kaoyan: '考研',
  toefl: 'TOEFL',
  sat: 'SAT',
}

// 输入别名 → canonical ExamId（含中文、常见写法、旧入口键）。键统一小写匹配。
const EXAM_ID_ALIASES: Record<string, ExamId> = {
  zhongkao: 'zhongkao', 中考: 'zhongkao', 初中: 'zhongkao',
  gaokao: 'gaokao', 高考: 'gaokao', 高中: 'gaokao', nmet: 'gaokao',
  cet4: 'cet4', 'cet-4': 'cet4', 'cet 4': 'cet4', 四级: 'cet4',
  cet6: 'cet6', 'cet-6': 'cet6', 'cet 6': 'cet6', 六级: 'cet6',
  kaoyan: 'kaoyan', 考研: 'kaoyan', kaoyan1: 'kaoyan', kaoyan2: 'kaoyan', 'kaoyan-1': 'kaoyan', 'kaoyan-2': 'kaoyan',
  toefl: 'toefl', 托福: 'toefl', 'toefl-ibt': 'toefl', toefl_ibt: 'toefl',
  sat: 'sat', 'sat-digital': 'sat', sat_digital: 'sat',
}

/** 把任意常见写法归一到 7 档 canonical ExamId；无法识别返回 null。 */
export function normalizeExamId(input: string): ExamId | null {
  if (!input) return null
  const trimmed = input.trim()
  return EXAM_ID_ALIASES[trimmed.toLowerCase()] ?? EXAM_ID_ALIASES[trimmed] ?? null
}

/** examId → question_bank theme_tags 等级标（`lvN`）。 */
export function examIdToThemeTag(id: ExamId): string {
  return `lv${EXAM_ID_TO_LEVEL[id]}`
}

/** examId → 中文显示名。 */
export function examIdToDisplayName(id: ExamId): string {
  return DISPLAY_NAMES[id]
}
