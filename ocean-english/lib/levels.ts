/* ============================================================================
   lib/levels.ts — 等级系统（P1-2）
   7 档与词库对齐（KyleBing/english-vocabulary 七档词表）。
   band = min(level + 1, 8) 派生保留，兼容既有 band 消费方。
   ============================================================================ */

import type { ExamTag } from '@/lib/dictionary/dictionary-types'

export interface LevelDef {
  level: number
  key: string
  zh: string
  /** 对应词库考试标签（无则 null，如初中） */
  examTag: ExamTag | null
  /** lexiStore ExamKey（targetExam 用） */
  examKey: string | null
  desc: string
  /** 词库该档词量（README 口径） */
  wordCount: number
}

export const LEVELS: LevelDef[] = [
  { level: 1, key: 'junior',  zh: '初中',  examTag: null,     examKey: null,     desc: '基础词汇起步，覆盖日常表达', wordCount: 3223 },
  { level: 2, key: 'senior',  zh: '高中',  examTag: 'GAOKAO', examKey: 'GAOKAO', desc: '高考核心词，读写听说全面打底', wordCount: 6008 },
  { level: 3, key: 'cet4',    zh: '四级',  examTag: 'CET-4',  examKey: 'CET4',   desc: '大学英语四级，应试与应用并重', wordCount: 7508 },
  { level: 4, key: 'cet6',    zh: '六级',  examTag: 'CET-6',  examKey: 'CET6',   desc: '六级进阶词汇，学术阅读起点', wordCount: 5651 },
  { level: 5, key: 'kaoyan',  zh: '考研',  examTag: 'KAOYAN', examKey: 'KAOYAN', desc: '考研大纲词，长难句的基石', wordCount: 9602 },
  { level: 6, key: 'toefl',   zh: '托福',  examTag: 'TOEFL',  examKey: 'TOEFL',  desc: '留学学术词汇，听说读写四项', wordCount: 13477 },
  { level: 7, key: 'sat',     zh: 'SAT',   examTag: 'SAT',    examKey: 'SAT',    desc: '北美学术顶配，精确与文雅', wordCount: 8887 },
]

export function levelDef(level: number): LevelDef {
  return LEVELS.find(l => l.level === level) ?? LEVELS[2]
}

/** band = min(level + 1, 8)，兼容既有 band 消费方（CEFR 窗口/题池等） */
export function levelToBand(level: number): number {
  return Math.min(level + 1, 8)
}

/** 词库注入前的 CEFR 退回映射（spec：1→A2 2→B1 3→B1 4→B2 5→B2 6→C1 7→C1） */
export const LEVEL_CEFR: Record<number, string> = {
  1: 'A2', 2: 'B1', 3: 'B1', 4: 'B2', 5: 'B2', 6: 'C1', 7: 'C1',
}

/* ── 快速测评探测词：7 档梯度 20 词（手工挑选；阶段 2 注入后改从词库抽）──
   二分检索按 level 1-7 收敛，每档约 3 词。 */
export interface ProbeWord {
  word: string
  zh: string
  level: number
}

export const PROBE_WORDS: ProbeWord[] = [
  // L1 初中
  { word: 'weather',     zh: '天气',          level: 1 },
  { word: 'borrow',      zh: '借入',          level: 1 },
  { word: 'decide',      zh: '决定',          level: 1 },
  // L2 高中
  { word: 'attitude',    zh: '态度',          level: 2 },
  { word: 'benefit',     zh: '益处；得益',    level: 2 },
  { word: 'gradually',   zh: '逐渐地',        level: 2 },
  // L3 四级
  { word: 'persuade',    zh: '说服',          level: 3 },
  { word: 'evaluate',    zh: '评估',          level: 3 },
  { word: 'sustainable', zh: '可持续的',      level: 3 },
  // L4 六级
  { word: 'inevitable',  zh: '必然的',        level: 4 },
  { word: 'consensus',   zh: '共识',          level: 4 },
  { word: 'ambiguous',   zh: '模棱两可的',    level: 4 },
  // L5 考研
  { word: 'mitigate',    zh: '缓解、减轻',    level: 5 },
  { word: 'paradigm',    zh: '范式、典范',    level: 5 },
  { word: 'empirical',   zh: '实证的',        level: 5 },
  // L6 托福
  { word: 'nuance',      zh: '细微差别',      level: 6 },
  { word: 'ubiquitous',  zh: '无处不在的',    level: 6 },
  { word: 'meticulous',  zh: '一丝不苟的',    level: 6 },
  // L7 SAT
  { word: 'perfunctory', zh: '敷衍的',        level: 7 },
  { word: 'obfuscate',   zh: '使混乱、模糊',  level: 7 },
]

/** 取某档的探测词（二分流程按档抽词用） */
export function probeWordsForLevel(level: number): ProbeWord[] {
  return PROBE_WORDS.filter(p => p.level === level)
}
