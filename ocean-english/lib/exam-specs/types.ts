/* ════════════════════════════════════════════════════════════════════════
   exam-specs/types.ts — 七档考试规格的「唯一类型契约」（Phase 1）

   目标：让 7 档考试的真实结构（板块/题型/题量/分值/材料/答案形式）只有一份
   TypeScript 定义，前端、组卷器、校验脚本都从这里读取，避免 paper-specs / drill-data
   两份静态规格继续漂移。本阶段只建类型与数据，不改任何可见 UI、不改任何 DB 数据。

   题型分类的唯一真源仍是 `lib/question-bank/question-type-taxonomy.ts`。
   客观题任务类型直接对齐其 EXAM_TASK_TYPES；写作/翻译/口语等「生产性任务」是真实
   考试需要、但 v1 题库暂无支撑的任务，单独列出，留待 v2 schema / 生成阶段补齐。
   ════════════════════════════════════════════════════════════════════════ */

import { EXAM_TASK_TYPES } from '@/lib/question-bank/question-type-taxonomy'

export type ExamId = 'zhongkao' | 'gaokao' | 'cet4' | 'cet6' | 'kaoyan' | 'toefl' | 'sat' | 'ielts'
export type ExamLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
export type ExamSkill =
  | 'vocabulary'
  | 'grammar'
  | 'reading'
  | 'listening'
  | 'speaking'
  | 'writing'
  | 'translation'
  | 'integrated'

/** 取题/组卷方式：single=单题；rows=按行取（单句/多空题组）；passages=按整篇取；paper=整卷 */
export type QuestionGroupMode = 'single' | 'rows' | 'passages' | 'paper'

/** coming_soon = 已建档但题库未做（如 IELTS）：UI 显示「建设中」、组卷直接拒、绝不回退别的题型。 */
export type ExamSpecStatus = 'draft' | 'active' | 'deprecated' | 'coming_soon'

/** 计分量表：raw=地区不一；150=高考；710=四六级；100=考研；6=TOEFL 2026(1-6)；200-800=SAT RW 单科(总分 400-1600)；1-9=IELTS */
export type ScoringScale = 'raw' | '150' | '710' | '100' | '1-6' | '200-800' | '1-9'

/** 客观题任务类型：直接复用 taxonomy 唯一真源（reading/listening/banked_cloze/...）。 */
export const OBJECTIVE_TASK_TYPES = EXAM_TASK_TYPES
export type ObjectiveTaskType = (typeof OBJECTIVE_TASK_TYPES)[number]

/**
 * 生产性 / 特殊任务类型：真实考试需要、但 v1 客观题库暂无支撑。
 * 这些任务会在 v2 schema（rubric/audio/stimulus）与生成阶段落地，Phase 1 只先确立结构位。
 */
export const PRODUCTIVE_TASK_TYPES = [
  'applied_writing',        // 应用文/短文写作（高考应用文、CET 短文、考研小作文）
  'continuation_writing',   // 读后续写（高考）
  'essay_writing',          // 议论文/大作文（CET 写作、考研大作文）
  'translation_zh_en',      // 汉译英段落（CET）
  'translation_en_zh',      // 英译汉（考研）
  'build_a_sentence',       // TOEFL Writing · Build a Sentence
  'email_writing',          // TOEFL Writing · Write an Email
  'academic_discussion',    // TOEFL Writing · Write for an Academic Discussion
  'complete_the_words',     // TOEFL Reading · Complete the Words
  'read_daily_life',        // TOEFL Reading · Read in Daily Life
  'choose_a_response',      // TOEFL Listening · Listen and Choose a Response
  'listen_and_repeat',      // TOEFL Speaking · Listen and Repeat
  'interview_speaking',     // TOEFL Speaking · Take an Interview
] as const
export type ProductiveTaskType = (typeof PRODUCTIVE_TASK_TYPES)[number]

/** 所有「合法考试任务类型」（运行时数组，供校验脚本使用）。 */
export const ALL_EXAM_TASK_TYPES: readonly string[] = [...OBJECTIVE_TASK_TYPES, ...PRODUCTIVE_TASK_TYPES]
export type ExamTaskType = ObjectiveTaskType | ProductiveTaskType

export interface ExamSectionSpec {
  id: string
  labelZh: string
  labelEn: string
  skill: ExamSkill
  /**
   * 候选任务类型（按优先级）。每项应是 ExamTaskType；
   * 若该板块当前只能用「单词宇宙题型」临时顶替（如中考语言运用暂用易混/近义），
   * 允许放 WORD_UNIVERSE 题型，但必须在 `notes` 写明这是临时回退。
   * 任何 section 都不得包含退役题型（antonym_choice / cet_cloze）。
   */
  taskTypes: string[]
  groupMode: QuestionGroupMode
  itemCount: number
  points: number
  timeLimitSec?: number
  requiresAudio?: boolean
  requiresRubric?: boolean
  notes?: string
}

export interface ExamSpec {
  id: ExamId
  level: ExamLevel
  labelZh: string
  labelEn: string
  version: string
  sourceUrls: string[]
  totalMinutes: number
  fullScore: number
  scoringScale: ScoringScale
  sections: ExamSectionSpec[]
  status: ExamSpecStatus
  /** 整卷模考是否就绪（full/mini）。undefined=就绪；false=专项 task 可练但整卷未完整（如 TOEFL 缺
   *  reading/listening/speaking 客观题），模考入口禁用、generatePaper 整卷拒。仅影响整卷，不影响专项练习。 */
  paperReady?: boolean
}
