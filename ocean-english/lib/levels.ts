/* ============================================================================
   lib/levels.ts — 等级系统（八档统一，单一真源）
   8 档：①初中 ②高中 ③四级 ④六级 ⑤考研 ⑥托福 ⑦SAT ⑧雅思(IELTS)。
   词库源：1-6 = ECDICT(MIT) tag(zk/gk/cet4/cet6/ky/toefl)，7 = 独立 SAT 表，8 = ECDICT ielts。
   ⚠ 难度按 cefrRank（A2..C1）而非 level 号：level 仅是「目录档号」，IELTS(level 8) CEFR=B2-C1，
     与六级/托福重叠，并不比 SAT 难——凡难度敏感逻辑（排序/颜色/词汇量基线/阅读难度/宇宙轨道/升档）
     一律用 cefrRank，绝不用 level 数值当难度。
   ⚠ 按某档取词/统计/星系/推荐一律用 dictionary_words.levels ∋ L（大纲全量），不能用 primary_level=L
     （primary_level=min(levels)，多档词会被归到最低档而漏算）。
   band 维度（旧 level+1 偏移）正在退役，统一用 level 1-8；levelToBand 暂留兼容，待 persist v6 合并。
   ============================================================================ */

import type { ExamTag } from '@/lib/dictionary/dictionary-types'

/** CEFR → 难度序（A1=1 … C2=6）；'B2-C1' 取 4.5（介于 B2 与 C1）。 */
export const CEFR_RANK: Record<string, number> = {
  A1: 1, A2: 2, B1: 3, B2: 4, 'B2-C1': 4.5, C1: 5, C2: 6,
}

export interface LevelDef {
  level: number          // 目录档号 1-8（非难度）
  key: string
  zh: string
  /** 对应词库考试标签（无则 null，如初中） */
  examTag: ExamTag | null
  /** lexiStore ExamKey（targetExam 用） */
  examKey: string | null
  /** CEFR 等级（难度真信号；UI 徽章亦用） */
  cefr: string
  /** 难度序（= CEFR_RANK[cefr]）；难度敏感逻辑用它而非 level */
  cefrRank: number
  desc: string
  /** 词库该档词量（待 ECDICT 重打后按 levels∋L 校准） */
  wordCount: number
  /** 等级带是否「基础梯」(可 mastery 自动升档) vs「目标考试档」(用户选定) */
  track: 'foundation' | 'target'
}

const def = (
  level: number, key: string, zh: string, examTag: ExamTag | null, examKey: string | null,
  cefr: string, desc: string, wordCount: number, track: 'foundation' | 'target',
): LevelDef => ({ level, key, zh, examTag, examKey, cefr, cefrRank: CEFR_RANK[cefr] ?? 3, desc, wordCount, track })

export const LEVELS: LevelDef[] = [
  def(1, 'junior', '初中', null,     null,     'A2',    '基础词汇起步，覆盖日常表达',     3223,  'foundation'),
  def(2, 'senior', '高中', 'GAOKAO', 'GAOKAO', 'B1',    '高考核心词，读写听说全面打底',   6008,  'foundation'),
  def(3, 'cet4',   '四级', 'CET-4',  'CET4',   'B1',    '大学英语四级，应试与应用并重',   7508,  'foundation'),
  def(4, 'cet6',   '六级', 'CET-6',  'CET6',   'B2',    '六级进阶词汇，学术阅读起点',     5651,  'foundation'),
  def(5, 'kaoyan', '考研', 'KAOYAN', 'KAOYAN', 'B2',    '考研大纲词，长难句的基石',       9602,  'target'),
  def(6, 'toefl',  '托福', 'TOEFL',  'TOEFL',  'C1',    '留学学术词汇，听说读写四项',     13477, 'target'),
  def(7, 'sat',    'SAT',  'SAT',    'SAT',    'C1',    '北美学术顶配，精确与文雅',       8887,  'target'),
  def(8, 'ielts',  '雅思', 'IELTS',  'IELTS',  'B2-C1', '雅思学术词汇，听说读写四项',     7500,  'target'),  // wordCount 待 ECDICT 重打校准
]

/** 最大档号（= 档数）；凡 1..7 硬上限改用此常量。 */
export const MAX_LEVEL = LEVELS.length   // 8

/** 1-based 档名数组（[0]='' 空哨兵；index = level）。各界面统一引用，勿再各自硬编码。 */
export const LEVEL_NAMES: string[] = ['', ...LEVELS.map(l => l.zh)]

export function levelDef(level: number): LevelDef {
  return LEVELS.find(l => l.level === level) ?? LEVELS[2]
}

/** 难度序（CEFR 维度）；难度敏感逻辑用它，不要用 level 数值。 */
export function levelCefrRank(level: number): number {
  return levelDef(level).cefrRank
}

/**
 * @deprecated band 维度将退役（八档统一为单一 level）。**Phase 1 暂保留原 +1 偏移行为不变**
 * （min(level+1,8)），避免在 persist v6 迁移前改动存量用户的 band 语义（recommend 的 CEFR 窗口依赖它）。
 * 注：八档下 L7/L8 都塌到 band 8；band 已无意义，Phase 6 随 persist v6 将 band 合并为 level 并移除本函数。
 */
export function levelToBand(level: number): number {
  return Math.min(level + 1, 8)
}

/** 词库注入前的 CEFR 退回映射（由 LEVELS 单源派生，1..8）。 */
export const LEVEL_CEFR: Record<number, string> = Object.fromEntries(LEVELS.map(l => [l.level, l.cefr]))

/* ── 快速测评探测词：8 档梯度（手工挑选；阶段 3 ECDICT 重打后改从词库 levels∋L 抽）──
   二分检索按 level 1-8 收敛，每档约 3 词。 */
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
  // L8 雅思（学术高频，B2-C1）
  { word: 'coherent',    zh: '连贯的',        level: 8 },
  { word: 'paraphrase',  zh: '释义、改写',    level: 8 },
]

/** 取某档的探测词（二分流程按档抽词用） */
export function probeWordsForLevel(level: number): ProbeWord[] {
  return PROBE_WORDS.filter(p => p.level === level)
}
