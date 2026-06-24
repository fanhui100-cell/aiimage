/* ════════════════════════════════════════════════════════════════════════
   practice/session-types.ts — 统一练习会话契约（Phase 4）
   word / task / section / paper 四种模式，v2 优先、v1 回退、空池可控。
   ════════════════════════════════════════════════════════════════════════ */

export type PracticeMode = 'word' | 'task' | 'section' | 'paper'
export type PracticeSource = 'v1' | 'v2' | 'auto'

export interface BuildPracticeSessionInput {
  mode: PracticeMode
  source?: PracticeSource
  examId?: string
  sectionId?: string
  taskType?: string
  word?: string
  wordId?: string
  level?: number
  count?: number
  seed?: string
}

export interface PracticeChoice {
  id: string
  text: string
}

export interface PracticeStimulus {
  kind?: string
  title?: string
  textEn?: string
  textZh?: string
  audioUrl?: string
}

export interface PracticeTargetWord {
  wordId?: string
  surface?: string
  role?: string
  senseKey?: string
  dimension?: string
}

export interface PracticeItem {
  id: string
  questionItemId?: string        // v2
  legacyQuestionId?: string      // v1
  setId?: string
  type: string
  inputMode: string
  prompt: string
  promptZh?: string
  choices?: PracticeChoice[]
  answer?: string | string[] | null
  answerText?: string
  stimulus?: PracticeStimulus
  /** 练习载荷只带可播放字段；transcript 绝不下发（答题后由 audio-asset-client review 模式拉取）。 */
  audio?: { url?: string } | null
  /** v2 材料 id（非揭示性 UUID）：复习态据此 review 模式拉 transcript。 */
  stimulusId?: string
  targetWords: PracticeTargetWord[]
  subskills: string[]
  explanationZh?: string
  // ── 分组题型渲染体（R3 接线；服务端按 inputMode 重建，提交前不含正解；正解只在 review）──
  // 精确形状见 components/practice/renderers/*（PracticeItemView 以兼容交集收窄）；此处用 unknown
  // 避免 lib→components 反向依赖。session-builder 赋值结构化对象，runner 经 view 收窄消费。
  clozeBody?: unknown
  matchBody?: unknown
  buildBody?: unknown
  /** 提交回合下发的批改（cloze/matching/build/freeText）；提交前 renderer 不读。 */
  review?: unknown
  wordMin?: number
  wordMax?: number
  guide?: string
}

export interface PracticeSessionResponse {
  ok: boolean
  source: 'v1' | 'v2' | 'empty'
  sessionId: string
  mode: string
  items: PracticeItem[]
  warnings: string[]
}

// ── attempts ────────────────────────────────────────────────────────────────
export interface RecordAttemptInput {
  source?: 'v1' | 'v2'
  questionItemId?: string        // v2
  legacyQuestionId?: string      // v1
  setId?: string
  examId?: string
  sectionId?: string
  taskType?: string
  subskills?: string[]
  answer: unknown
  isCorrect?: boolean
  score?: number
  durationMs?: number
  errorType?: string
  targetWords?: PracticeTargetWord[]
}

/** 建议的词状态更新（客户端据此调 lexiStore.markCorrect/markWrong/recordDimPass）。 */
export interface WordUpdateSuggestion {
  wordId: string
  isCorrect: boolean
  dimension?: string
}

/** 建议的技能状态更新（客户端/后续 skill_states 据此累积）。 */
export interface SkillUpdateSuggestion {
  examId: string
  skillKey: string
  delta: number
}

export interface RecordAttemptResponse {
  ok: boolean
  recorded: boolean
  storage: 'v2' | 'none'
  warnings: string[]
  wordUpdates: WordUpdateSuggestion[]
  skillUpdates: SkillUpdateSuggestion[]
}
