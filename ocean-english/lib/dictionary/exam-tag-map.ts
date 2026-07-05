/* ============================================================================
   lib/dictionary/exam-tag-map.ts — lexiStore ExamKey ↔ 词典 ExamTag 映射
   lexiStore 用 'CET4'/'CET6'，词典用 'CET-4'/'CET-6'；不映射则 exam 过滤永远落空。
   ============================================================================ */

import type { ExamTag } from '@/lib/dictionary/dictionary-types'

export const EXAM_KEY_TO_TAG: Record<string, ExamTag> = {
  GAOKAO: 'GAOKAO',
  CET4: 'CET-4',
  'CET-4': 'CET-4',
  CET6: 'CET-6',
  'CET-6': 'CET-6',
  KAOYAN: 'KAOYAN',
  IELTS: 'IELTS',
  TOEFL: 'TOEFL',
  GRE: 'GRE',
  SAT: 'SAT',
  CUSTOM: 'custom',
}

/** ExamKey（或已是 ExamTag 的值）→ 词典 ExamTag；无法识别（如 'casual'）返回 null */
export function mapExamKeyToTag(key: string | null | undefined): ExamTag | null {
  if (!key) return null
  return EXAM_KEY_TO_TAG[key.trim().toUpperCase()] ?? null
}
