'use client'
/* ============================================================================
   store/lexiStore.ts — 单一数据中枢（7 状态学习闭环）
   1:1 TypeScript port of prototype/store.jsx (zustand + persist)
   ============================================================================ */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { type WordState, STATE_ORDER } from '@/lib/state-meta'
import { gradeSrs, previewIntervals, isMastered, GRADE_NOTE, type ReviewGrade } from '@/lib/srs/schedule'
import { toWordEntry } from '@/lib/dictionary/entry-adapter'
import { mapExamKeyToTag } from '@/lib/dictionary/exam-tag-map'
import type { DictionaryWord } from '@/lib/dictionary/dictionary-types'
import type { LearningLevel } from '@/types/learning'
import type { QuizSession } from '@/types/quiz'
import type { ChatMessage } from '@/types/study'

export type { ReviewGrade }

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
export type { WordState }

export interface WordEntry {
  id: string
  word: string
  phon: string
  pos: string
  zh: string
  galaxy: string
  state: WordState
  streak: number
  ease: number
  interval: number
  nextReviewAt?: number     // 时间戳；undefined = 不在 SRS 队列
  lastReviewedAt?: number
  // ── A4 缝合：入库元信息（可选，便于存量数据渐进迁移）──
  addedAt?: number
  source?: 'today-pack' | 'lookup' | 'scan' | 'reading' | 'seed'
  saved?: boolean           // 收编 learningStore.savedWords
  cefr?: string
  band?: number
  examTags?: string[]
  // P1-2：词库 7 档标签（阶段 2 注入；为空时消费方退回 CEFR/band 窗口）
  levels?: number[]
  ex?: string
  exZh?: string
  syn?: string[]
  ant?: string[]
  /** F4：发音历史最佳分（0-100，浏览器识别评分） */
  pronScore?: number
  /** P3：跨维通过记录（'recognize'|'spell'|'listen'）；mastered + dims≥2 = 真·镀金 */
  dims?: string[]
}

export interface Profile {
  onboarded: boolean
  skipped: boolean
  targetExam: string | null
  band: number
  dailyGoal: number
  goals?: string[]
  // 收编 learningStore.userLevel；未显式设置时由 band 派生
  userLevel?: LearningLevel | null
  // B2-4：最近一次定级时间（重测 30 天提醒用）；带 band/level 的 setProfile 时刷新
  onboardedAt?: number
  // P1-2：7 档等级（lib/levels.ts），band = min(level+1, 8) 派生保留兼容
  level?: number
  // P0 onboarding v2：学习方式（驱动今日活动配比）+ 定级测评附带量（结果页/复测展示）
  path?: 'full' | 'words' | 'reading' | 'exam'
  vocabEst?: number
  confidence?: '高' | '中' | '低'
  // 界面优化1·阶段3：应试路线考试日期（YYYY-MM-DD），驱动今日「距考试 N 天」与每日量倒计时推荐
  examDate?: string | null
}

// band → userLevel 派生默认值（spec A4-3）
export function bandToLevel(band: number): LearningLevel {
  return band <= 3 ? 'beginner' : band <= 6 ? 'intermediate' : 'advanced'
}

export interface LogEntry {
  id: string
  word: string
  from: string
  to: WordState
  note: string
  t: number
}

export interface DistractorOption {
  id: string
  text: string
  correct: boolean
}

export interface TodayPack {
  recommended: WordEntry[]
  review: WordEntry[]
  weak: WordEntry[]
  all: WordEntry[]
}

/** 每日生成一次的今日包缓存（A5）：生成与读取分离，getToday 只读 */
export interface TodayPackCache {
  date: string
  recommendedIds: string[]
}

/** 结构化错题（A7 平移自 learningStore，结构不变，云同步端点沿用） */
export interface WrongAnswer {
  id: string
  wordId: string
  word: string
  question: string
  userAnswer: string
  correctAnswer: string
  explanation: string
  timestamp: number
}

// ─────────────────────────────────────────────────────────────
// Constants (from prototype/store.jsx — 1:1)
// ─────────────────────────────────────────────────────────────
export const SM2_INTERVALS = [1, 3, 7, 16, 35]

export const BAND_CEFR: Record<number, string> = {
  1: 'A1', 2: 'A2', 3: 'B1', 4: 'B1', 5: 'B2', 6: 'B2', 7: 'C1', 8: 'C1',
}

export const EXAM_BANDS = {
  GAOKAO: { zh: '高考', band: 4 },
  CET4:   { zh: '四级', band: 5 },
  CET6:   { zh: '六级', band: 6 },
  KAOYAN: { zh: '考研', band: 7 },
  IELTS:  { zh: '雅思', band: 7 },
  TOEFL:  { zh: '托福', band: 8 },
  GRE:    { zh: 'GRE', band: 8 },
} as const

export type ExamKey = keyof typeof EXAM_BANDS

export const PROBE_LADDER = [
  { word: 'decide',     zh: '决定',      cefr: 'A2', band: 2 },
  { word: 'benefit',    zh: '益处；得益', cefr: 'B1', band: 3 },
  { word: 'persuade',   zh: '说服',      cefr: 'B1', band: 4 },
  { word: 'inevitable', zh: '必然的',    cefr: 'B2', band: 5 },
  { word: 'consensus',  zh: '共识',      cefr: 'B2', band: 6 },
  { word: 'nuance',     zh: '细微差别',  cefr: 'C1', band: 7 },
  { word: 'empirical',  zh: '实证的',    cefr: 'C1', band: 8 },
  { word: 'ubiquitous', zh: '无处不在的', cefr: 'C2', band: 8 },
]

const WORD_AUG: Record<string, Partial<WordEntry>> = {
  w01: { cefr: 'B2', band: 5, examTags: ['CET6', 'IELTS'],          ex: 'The change felt unavoidable once the data was clear.',          exZh: '数据一清晰，这个变化就显得难以避免。',   syn: ['inevitable', 'inescapable'], ant: ['avoidable'] },
  w02: { cefr: 'B2', band: 5, examTags: ['CET6', 'IELTS', 'KAOYAN'], ex: 'Conflict seemed inevitable after the talks broke down.',       exZh: '谈判破裂后冲突似乎不可避免。',           syn: ['unavoidable', 'certain'],    ant: ['avoidable', 'uncertain'] },
  w03: { cefr: 'B2', band: 6, examTags: ['CET6', 'KAOYAN'],          ex: 'Her speech had a profound effect on the audience.',            exZh: '她的演讲对听众产生了深远的影响。',       syn: ['deep', 'far-reaching'],      ant: ['superficial', 'shallow'] },
  w04: { cefr: 'B2', band: 6, examTags: ['CET6', 'IELTS'],           ex: 'The instructions were so ambiguous that no one knew what to do.', exZh: '说明含糊不清，没人知道该怎么做。',     syn: ['unclear', 'vague'],          ant: ['clear', 'explicit'] },
  w05: { cefr: 'B2', band: 6, examTags: ['CET6', 'IELTS'],           ex: 'A coherent argument connects each point to the next.',         exZh: '连贯的论证会把每个观点逐一衔接起来。',   syn: ['logical', 'consistent'],     ant: ['incoherent', 'disjointed'] },
  w06: { cefr: 'C1', band: 7, examTags: ['KAOYAN', 'IELTS', 'GRE'],  ex: 'The discovery forced a shift in the scientific paradigm.',     exZh: '这一发现迫使科学范式发生转变。',         syn: ['model', 'framework'],        ant: [] },
  w07: { cefr: 'C1', band: 7, examTags: ['IELTS', 'GRE'],            ex: 'He caught every nuance of her tone.',                          exZh: '他捕捉到了她语气里每一处细微差别。',     syn: ['subtlety', 'shade'],         ant: [] },
  w08: { cefr: 'C1', band: 7, examTags: ['KAOYAN', 'GRE'],           ex: 'The essay was full of empty rhetoric.',                        exZh: '这篇文章满是空洞的辞令。',               syn: ['oratory', 'eloquence'],      ant: [] },
  w09: { cefr: 'C1', band: 8, examTags: ['KAOYAN', 'IELTS'],         ex: 'The claim lacks empirical evidence.',                          exZh: '这一论断缺乏实证证据。',                 syn: ['observed', 'experiential'],  ant: ['theoretical'] },
  w10: { cefr: 'C1', band: 8, examTags: ['KAOYAN'],                  ex: 'Memory is a core part of human cognition.',                   exZh: '记忆是人类认知的核心部分。',             syn: ['perception', 'awareness'],   ant: [] },
  w11: { cefr: 'B2', band: 5, examTags: ['CET6', 'KAOYAN'],          ex: 'She advocates for cleaner public transport.',                  exZh: '她提倡更清洁的公共交通。',               syn: ['support', 'champion'],       ant: ['oppose'] },
  w12: { cefr: 'B2', band: 6, examTags: ['CET6', 'IELTS'],           ex: 'The team finally reached a consensus.',                       exZh: '团队终于达成了共识。',                   syn: ['agreement', 'accord'],       ant: ['disagreement'] },
  w13: { cefr: 'C1', band: 7, examTags: ['IELTS', 'TOEFL'],          ex: 'Planting trees can mitigate the effects of heat.',             exZh: '植树能缓解高温带来的影响。',             syn: ['alleviate', 'ease'],         ant: ['aggravate', 'worsen'] },
  w14: { cefr: 'B2', band: 5, examTags: ['CET4', 'IELTS'],           ex: 'We need a sustainable model of growth.',                      exZh: '我们需要一种可持续的增长模式。',         syn: ['lasting', 'viable'],         ant: ['unsustainable'] },
  w15: { cefr: 'C1', band: 7, examTags: ['KAOYAN', 'IELTS'],         ex: 'Public discourse shapes how we see the issue.',               exZh: '公共论述塑造了我们看待这一问题的方式。', syn: ['discussion', 'dialogue'],    ant: [] },
  w16: { cefr: 'C1', band: 7, examTags: ['KAOYAN', 'GRE'],           ex: 'A pragmatic leader focuses on what works.',                   exZh: '务实的领导者关注切实可行的东西。',       syn: ['practical', 'realistic'],    ant: ['idealistic'] },
  w17: { cefr: 'C1', band: 8, examTags: ['IELTS', 'GRE'],            ex: 'They called for a more equitable system.',                    exZh: '他们呼吁建立更公平的制度。',             syn: ['fair', 'just'],              ant: ['unfair', 'unjust'] },
  w18: { cefr: 'B2', band: 6, examTags: ['CET6', 'KAOYAN'],          ex: 'Bonuses are a strong incentive to work harder.',              exZh: '奖金是更努力工作的有力激励。',           syn: ['motivation', 'spur'],        ant: ['deterrent'] },
}

const SEED_WORDS_BASE: Omit<WordEntry, 'cefr' | 'band' | 'examTags' | 'ex' | 'exZh' | 'syn' | 'ant'>[] = [
  { id: 'w01', word: 'unavoidable', phon: '/ˌʌnəˈvɔɪdəbl/', pos: 'adj.', zh: '难以避免的',      galaxy: 'cognition', state: 'recommended', streak: 0, ease: 2.5, interval: 0 },
  { id: 'w02', word: 'inevitable',  phon: '/ɪnˈevɪtəbl/',  pos: 'adj.', zh: '必然发生的',      galaxy: 'cognition', state: 'recommended', streak: 0, ease: 2.5, interval: 0 },
  { id: 'w03', word: 'profound',    phon: '/prəˈfaʊnd/',   pos: 'adj.', zh: '深刻的、深远的',   galaxy: 'cognition', state: 'learning',     streak: 1, ease: 2.5, interval: 1 },
  { id: 'w04', word: 'ambiguous',   phon: '/æmˈbɪɡjuəs/',  pos: 'adj.', zh: '模棱两可的',      galaxy: 'cognition', state: 'review',       streak: 2, ease: 2.4, interval: 3,  nextReviewAt: Date.now() },
  { id: 'w05', word: 'coherent',    phon: '/kəʊˈhɪərənt/', pos: 'adj.', zh: '连贯的、一致的',   galaxy: 'cognition', state: 'weak',         streak: 0, ease: 2.1, interval: 1 },
  { id: 'w06', word: 'paradigm',    phon: '/ˈpærədaɪm/',   pos: 'n.',   zh: '范式、典范',      galaxy: 'cognition', state: 'mastered',     streak: 5, ease: 2.7, interval: 16 },
  { id: 'w07', word: 'nuance',      phon: '/ˈnjuːɑːns/',   pos: 'n.',   zh: '细微差别',        galaxy: 'cognition', state: 'review',       streak: 3, ease: 2.5, interval: 7,  nextReviewAt: Date.now() },
  { id: 'w08', word: 'rhetoric',    phon: '/ˈretərɪk/',    pos: 'n.',   zh: '修辞、辞令',      galaxy: 'cognition', state: 'unknown',      streak: 0, ease: 2.5, interval: 0 },
  { id: 'w09', word: 'empirical',   phon: '/ɪmˈpɪrɪkl/',   pos: 'adj.', zh: '经验主义的、实证的', galaxy: 'cognition', state: 'unknown',    streak: 0, ease: 2.5, interval: 0 },
  { id: 'w10', word: 'cognition',   phon: '/kɒɡˈnɪʃn/',    pos: 'n.',   zh: '认知、认识',      galaxy: 'cognition', state: 'locked',       streak: 0, ease: 2.5, interval: 0 },
  { id: 'w11', word: 'advocate',    phon: '/ˈædvəkeɪt/',   pos: 'v.',   zh: '提倡、拥护',      galaxy: 'society',   state: 'recommended', streak: 0, ease: 2.5, interval: 0 },
  { id: 'w12', word: 'consensus',   phon: '/kənˈsensəs/',  pos: 'n.',   zh: '共识、一致',      galaxy: 'society',   state: 'learning',     streak: 2, ease: 2.5, interval: 3 },
  { id: 'w13', word: 'mitigate',    phon: '/ˈmɪtɪɡeɪt/',   pos: 'v.',   zh: '缓解、减轻',      galaxy: 'society',   state: 'weak',         streak: 0, ease: 2.0, interval: 1 },
  { id: 'w14', word: 'sustainable', phon: '/səˈsteɪnəbl/', pos: 'adj.', zh: '可持续的',        galaxy: 'society',   state: 'review',       streak: 4, ease: 2.6, interval: 16, nextReviewAt: Date.now() },
  { id: 'w15', word: 'discourse',   phon: '/ˈdɪskɔːs/',    pos: 'n.',   zh: '论述、话语',      galaxy: 'society',   state: 'mastered',     streak: 6, ease: 2.8, interval: 35 },
  { id: 'w16', word: 'pragmatic',   phon: '/præɡˈmætɪk/',  pos: 'adj.', zh: '务实的',          galaxy: 'society',   state: 'unknown',      streak: 0, ease: 2.5, interval: 0 },
  { id: 'w17', word: 'equitable',   phon: '/ˈekwɪtəbl/',   pos: 'adj.', zh: '公平的、公正的',   galaxy: 'society',   state: 'unknown',      streak: 0, ease: 2.5, interval: 0 },
  { id: 'w18', word: 'incentive',   phon: '/ɪnˈsentɪv/',   pos: 'n.',   zh: '激励、动机',      galaxy: 'society',   state: 'locked',       streak: 0, ease: 2.5, interval: 0 },
]

// 旧种子 id → 词典 slug（DictionaryWord.id 即小写词形）
export const SEED_SLUG: Record<string, string> = {
  w01: 'unavoidable', w02: 'inevitable', w03: 'profound', w04: 'ambiguous',
  w05: 'coherent', w06: 'paradigm', w07: 'nuance', w08: 'rhetoric',
  w09: 'empirical', w10: 'cognition', w11: 'advocate', w12: 'consensus',
  w13: 'mitigate', w14: 'sustainable', w15: 'discourse', w16: 'pragmatic',
  w17: 'equitable', w18: 'incentive',
}

// 零网络兜底包：仅当词典不可用且词库为空时注入（A4-6）。
// id = 词典 slug；学习字段全部归零，source 标 'seed'。
const OFFLINE_SEED_WORDS: WordEntry[] = SEED_WORDS_BASE.map(w => ({
  ...(w as WordEntry),
  ...(WORD_AUG[w.id] ?? {}),
  id: SEED_SLUG[w.id],
  state: 'recommended' as WordState,
  streak: 0, ease: 2.5, interval: 0,
  nextReviewAt: undefined,
  source: 'seed' as const,
}))

// ─────────────────────────────────────────────────────────────
// Store interface
// ─────────────────────────────────────────────────────────────
export interface DailyRecord {
  date: string
  learned: number
  quizzed: number
  reviewed: number
  /** F4：今日发音达标次数（评分 ≥80） */
  pronounced?: number
}

export interface StreakData {
  current: number
  longest: number
  lastStudyDate: string
}

/** 按日归档的活动计数（B9 热力图 / B3 周打卡条），上限 366 天 */
export type DailyHistory = Record<string, { learned: number; quizzed: number; reviewed: number }>

interface LexiStoreState {
  words: WordEntry[]
  xp: number
  daily: DailyRecord
  /** 今日侧路活动完成标记（阅读/真题/错题/考试进度等，按日重置） */
  todayActivity: { date: string; done: string[] }
  history: DailyHistory
  streakData: StreakData
  goalToday: number
  todayPack: TodayPackCache
  log: LogEntry[]
  profile: Profile
  // ── practice 切片（A7 平移自 learningStore）──
  wrongAnswers: WrongAnswer[]
  quizHistory: QuizSession[]
  // ── chat 切片（A7 平移自 learningStore）──
  chatMessages: ChatMessage[]
}

type PersistedWordEntry = Partial<WordEntry> & {
  id: string
  word?: string
  due?: boolean
}

type PersistedLexiState = Omit<Partial<LexiStoreState>, 'words'> & {
  words?: PersistedWordEntry[]
  xp?: number
}

interface LegacyReviewWord {
  wordId?: string
  word?: string
  interval?: number
  ease?: number
  repetitions?: number
  nextReviewAt?: number
}

interface LegacyStudyProgress {
  currentStreak?: number
  longestStreak?: number
  lastStudyDate?: string
  totalXp?: number
}

interface LegacyLearningState {
  reviewWords?: LegacyReviewWord[]
  savedWords?: unknown[]
  userLevel?: LearningLevel
  studyProgress?: LegacyStudyProgress
  wrongAnswers?: WrongAnswer[]
  quizHistory?: QuizSession[]
  chatMessages?: ChatMessage[]
}

interface LexiStoreActions {
  // read views
  byId: (id: string) => WordEntry | undefined
  all: () => WordEntry[]
  byState: (s: WordState) => WordEntry[]
  byGalaxy: (g: string) => WordEntry[]
  counts: () => Record<WordState, number>
  getToday: () => TodayPack
  getDue: () => WordEntry[]
  getWeak: () => WordEntry[]
  getLearning: () => WordEntry[]
  getTodayProgress: () => { n: number; goal: number; pct: number }
  previewFor: (w: WordEntry) => Record<ReviewGrade, string>
  getSaved: () => WordEntry[]
  isSaved: (id: string) => boolean
  masteredPct: () => number
  probeLadder: () => typeof PROBE_LADDER
  examBands: () => typeof EXAM_BANDS
  bandCefr: (b: number) => string
  goals: () => string[]
  distractorsFor: (w: WordEntry) => DistractorOption[]
  // write views
  markLearning: (id: string) => void
  markCorrect: (id: string) => void
  markWrong: (id: string) => void
  /** P3：记录某词在某维度（recognize/spell/listen）答对，用于跨维镀金 */
  recordDimPass: (id: string, dim: string) => void
  /** P3：当前档跨维掌握进度（gold = mastered 且 dims≥2）+ 是否够升档 */
  getLevelUpProgress: () => { ready: boolean; rate: number; gold: number; total: number; level: number | null }
  reviewGrade: (id: string, g: ReviewGrade) => void
  relearn: (id: string) => void
  addToReview: (id: string) => void
  // A4 缝合：唯一词典入库入口（已存在不重置学习进度）
  ensureWord: (dw: DictionaryWord, source: NonNullable<WordEntry['source']>, state?: WordState) => WordEntry
  hydrateMissingEntries: () => Promise<void>
  injectOfflineSeedIfEmpty: () => Promise<void>
  buildTodayPack: (force?: boolean) => Promise<void>
  setSaved: (id: string, value: boolean, fallbackWord?: string) => void
  addWord: (entry: Partial<WordEntry> & Pick<WordEntry, 'id' | 'word' | 'zh'>) => WordEntry | undefined
  // B7-3：词详情「移出」——从学习库删除（云端同步删除由 CloudSyncProvider diff 触发）
  removeWord: (id: string) => void
  incXp: (n: number) => void
  /** F4：写入发音最佳分（只升不降） */
  setPronScore: (id: string, score: number) => void
  /** F1-3：补签 — 扣 50 XP 补昨日 history 缺口并重算 streak；不可补返回 false */
  repairStreak: () => boolean
  recordActivity: (kind: 'learned' | 'quizzed' | 'reviewed' | 'pronounced') => void
  /** 标记今日某侧路活动完成（key 如 reading/article/pick/mock/wrong/progress），按日重置 */
  markActivityDone: (key: string) => void
  setProfile: (p: Partial<Profile>) => void
  skipOnboarding: () => void
  toggleGoal: (exam: string) => void
  // practice 切片
  addWrongAnswer: (entry: Omit<WrongAnswer, 'id'>) => void
  removeWrongAnswer: (id: string) => void
  clearWrongAnswers: () => void
  addQuizSession: (session: QuizSession) => void
  // chat 切片
  addChatMessage: (message: ChatMessage) => void
  clearChat: () => void
}

type LexiStore = LexiStoreState & LexiStoreActions

// ─────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────
// 迁移用轻量 stub：内容字段留空，由启动时 hydrateMissingEntries() 补全
function stubEntry(
  id: string,
  word: string,
  source: NonNullable<WordEntry['source']>,
  state: WordState,
): WordEntry {
  return {
    id, word, zh: '', phon: '', pos: '', galaxy: 'cognition',
    state, streak: 0, ease: 2.5, interval: 0, addedAt: Date.now(), source,
  }
}

function transition(
  words: WordEntry[],
  log: LogEntry[],
  id: string,
  next: WordState,
  note: string,
  updates?: Partial<WordEntry>,
): { words: WordEntry[]; log: LogEntry[] } {
  const word = words.find(w => w.id === id)
  if (!word) return { words, log }
  const prev = word.state
  if (prev === next && !updates) return { words, log }
  const updated: WordEntry = { ...word, ...updates, state: next }
  const entry: LogEntry = { id, word: word.word, from: prev, to: next, note, t: Date.now() }
  return {
    words: words.map(w => w.id === id ? updated : w),
    log: [entry, ...log].slice(0, 30),
  }
}

// ─────────────────────────────────────────────────────────────
// Zustand store
// ─────────────────────────────────────────────────────────────
export const useLexiStore = create<LexiStore>()(
  persist(
    (set, get) => ({
      // ── initial state ──
      // 新用户词库为空：词由词典推荐/查词进入；离线时由 injectOfflineSeedIfEmpty 兜底
      words: [],
      xp: 0,
      daily: { date: '', learned: 0, quizzed: 0, reviewed: 0 },
      todayActivity: { date: '', done: [] },
      history: {},
      streakData: { current: 0, longest: 0, lastStudyDate: '' },
      goalToday: 12,
      todayPack: { date: '', recommendedIds: [] },
      log: [],
      profile: { onboarded: false, skipped: false, targetExam: null, band: 5, dailyGoal: 12 },
      wrongAnswers: [],
      quizHistory: [],
      chatMessages: [],

      // ── read views ──
      byId: (id) => get().words.find(w => w.id === id),
      all: () => get().words,
      byState: (s) => get().words.filter(w => w.state === s),
      byGalaxy: (g) => get().words.filter(w => w.galaxy === g),
      counts: () => {
        const c = Object.fromEntries(STATE_ORDER.map(s => [s, 0])) as Record<WordState, number>
        get().words.forEach(w => c[w.state]++)
        return c
      },
      // 只读 todayPack 缓存（由 buildTodayPack 每日生成一次）；复习/薄弱按配比截断
      getToday: () => {
        const { words, todayPack, goalToday } = get()
        const ids = new Set(todayPack.recommendedIds)
        const recommended = words.filter(w => ids.has(w.id) && w.state === 'recommended')
        const review = get().getDue().slice(0, Math.max(1, Math.round(goalToday * 0.35)))
        const dueIds = new Set(review.map(w => w.id))
        const weak = words
          .filter(w => w.state === 'weak' && !dueIds.has(w.id))
          .slice(0, Math.max(1, Math.round(goalToday * 0.25)))
        return { recommended, review, weak, all: [...recommended, ...review, ...weak] }
      },
      // 时间派生：nextReviewAt 到点即到期（review / weak 词都可能在内）
      getDue: () => {
        const now = Date.now()
        return get().words.filter(w => w.nextReviewAt != null && w.nextReviewAt <= now)
      },
      getWeak: () => get().words.filter(w => w.state === 'weak'),
      getLearning: () => get().words.filter(w => w.state === 'learning'),
      getTodayProgress: () => {
        const { daily, goalToday } = get()
        const today = new Date().toISOString().slice(0, 10)
        const n = daily.date === today ? daily.learned + daily.reviewed : 0
        return { n, goal: goalToday, pct: Math.min(100, Math.round((n / (goalToday || 1)) * 100)) }
      },
      previewFor: (w) => previewIntervals({ interval: w.interval, ease: w.ease, streak: w.streak }),
      getSaved: () => get().words.filter(w => w.saved),
      isSaved: (id) => !!get().words.find(w => w.id === id)?.saved,
      masteredPct: () => {
        const ws = get().words
        const active = ws.filter(w => w.state !== 'locked')
        if (!active.length) return 0
        return Math.round(ws.filter(w => w.state === 'mastered').length / active.length * 100)
      },
      probeLadder: () => PROBE_LADDER,
      examBands: () => EXAM_BANDS,
      bandCefr: (b) => BAND_CEFR[b] ?? 'B2',
      goals: () => {
        const p = get().profile
        return p.goals?.length ? p.goals : (p.targetExam ? [p.targetExam] : [])
      },
      distractorsFor: (w) => {
        // 干扰项 = 同词性、band±1 的真实词典释义；不足则放开到全库
        const sameLevel = get().words
          .filter(c => c.id !== w.id && c.zh && c.zh !== w.zh
            && c.pos === w.pos
            && (!w.band || !c.band || Math.abs(c.band - w.band) <= 1))
          .map(c => c.zh)
        const fallback = get().words
          .filter(c => c.id !== w.id && c.zh && c.zh !== w.zh)
          .map(c => c.zh)
        const candidates = sameLevel.length >= 3 ? sameLevel : [...sameLevel, ...fallback]
        // 去重，避免选项重复
        const pool = Array.from(new Set(candidates))
        const picks: string[] = []
        const available = [...pool]
        for (let i = 0; i < 3 && available.length; i++) {
          picks.push(available.splice(Math.floor(Math.random() * available.length), 1)[0])
        }
        const opts: DistractorOption[] = [...picks, w.zh].map((text, i) => ({
          id: String.fromCharCode(97 + i), text, correct: text === w.zh,
        }))
        for (let i = opts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [opts[i], opts[j]] = [opts[j], opts[i]]
        }
        return opts
      },

      // ── write views ──
      markLearning: (id) => set(s => transition(s.words, s.log, id, 'learning', '开始学')),

      // 测验答对：走 'good' 档调度，趋向掌握
      markCorrect: (id) => set(s => {
        const word = s.words.find(w => w.id === id)
        if (!word) return {}
        const r = gradeSrs({ interval: word.interval, ease: word.ease, streak: word.streak }, 'good')
        const next: WordState = isMastered(r) ? 'mastered' : 'learning'
        const note = next === 'mastered' ? '连对达标' : '答对积累'
        return transition(s.words, s.log, id, next, note, { ...r, lastReviewedAt: Date.now() })
      }),

      // 测验答错：走 'again' 档调度，转薄弱 + 1 小时后回炉
      markWrong: (id) => set(s => {
        const word = s.words.find(w => w.id === id)
        if (!word) return {}
        const r = gradeSrs({ interval: word.interval, ease: word.ease, streak: word.streak }, 'again')
        return transition(s.words, s.log, id, 'weak', '答错回炉', { ...r, lastReviewedAt: Date.now() })
      }),

      // P3：记录跨维通过（answered correct in a skill dimension）
      recordDimPass: (id, dim) => set(s => {
        const w = s.words.find(x => x.id === id)
        if (!w || (w.dims ?? []).includes(dim)) return {}
        return { words: s.words.map(x => x.id === id ? { ...x, dims: [...(x.dims ?? []), dim] } : x) }
      }),

      // P3：当前能力档的跨维掌握率（升档自适应依据）
      getLevelUpProgress: () => {
        const s = get()
        const lv = s.profile.level ?? null
        if (lv == null) return { ready: false, rate: 0, gold: 0, total: 0, level: null }
        const atLevel = s.words.filter(w => w.state !== 'locked' && w.state !== 'unknown'
          && (w.levels?.length ? w.levels.includes(lv) : (w.band ?? s.profile.band) === lv))
        const total = atLevel.length
        const gold = atLevel.filter(w => w.state === 'mastered' && (w.dims?.length ?? 0) >= 2).length
        const rate = total ? Math.round((gold / total) * 100) : 0
        return { ready: total >= 10 && rate >= 80 && lv < 7, rate, gold, total, level: lv }
      },

      // 复习评分：四档统一入口，状态由结果派生
      reviewGrade: (id, g) => set(s => {
        const word = s.words.find(w => w.id === id)
        if (!word) return {}
        const r = gradeSrs({ interval: word.interval, ease: word.ease, streak: word.streak }, g)
        const next: WordState =
          g === 'again' ? 'weak'
          : isMastered(r) ? 'mastered'
          : 'review'
        return transition(s.words, s.log, id, next, GRADE_NOTE[g], { ...r, lastReviewedAt: Date.now() })
      }),

      relearn: (id) => set(s => transition(s.words, s.log, id, 'learning', '薄弱重学')),

      addToReview: (id) => set(s => {
        const word = s.words.find(w => w.id === id)
        if (!word) return {}
        return transition(s.words, s.log, id, 'review', '加入复习', { nextReviewAt: Date.now() })
      }),

      // 唯一词典入库入口：已在库中则原样返回（绝不重置进度）
      ensureWord: (dw, source, state = 'learning') => {
        const existing = get().words.find(w => w.id === dw.id)
        if (existing) return existing
        const entry: WordEntry = { ...toWordEntry(dw, source), state }
        const logEntry: LogEntry = { id: entry.id, word: entry.word, from: 'unknown', to: state, note: '入库', t: Date.now() }
        set(s => ({ words: [...s.words, entry], log: [logEntry, ...s.log].slice(0, 30) }))
        return entry
      },

      // 启动兜底：对内容缺失的 stub 词条（zh === ''）逐个调词典 API 补全。
      // 只补内容缓存字段，绝不动学习状态（state/streak/ease/interval/nextReviewAt/saved）。
      hydrateMissingEntries: async () => {
        const missing = get().words.filter(w => !w.zh)
        for (const w of missing) {
          try {
            const res = await fetch(`/api/dictionary/word/${encodeURIComponent(w.id)}`)
            if (!res.ok) continue
            const { data } = await res.json() as { data?: DictionaryWord }
            if (!data) continue
            const content = toWordEntry(data, w.source ?? 'lookup')
            set(s => ({
              words: s.words.map(x => x.id === w.id ? {
                ...x,
                word: content.word, zh: content.zh, phon: content.phon, pos: content.pos,
                cefr: content.cefr, band: content.band, examTags: content.examTags,
                ex: content.ex, exZh: content.exZh, syn: content.syn, ant: content.ant,
                galaxy: content.galaxy,
              } : x),
            }))
          } catch {
            // 断网等瞬时失败：保留 stub，下次启动重试
          }
        }
      },

      // 今日包生成器（A5）：每天一次，新词 40% 配比经推荐 API 拉取并入库；
      // 失败降级：离线种子兜底 → 仍无则今日包只剩复习+薄弱（recommendedIds 为空）
      buildTodayPack: async (force = false) => {
        const today = new Date().toISOString().slice(0, 10)
        if (!force && get().todayPack.date === today) return   // 当天只生成一次（重试按钮可 force）
        const { profile, words } = get()
        const newN = Math.max(1, Math.round((profile.dailyGoal || 12) * 0.4))
        try {
          const exam = mapExamKeyToTag(profile.targetExam)
          const res = await fetch('/api/dictionary/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              band: profile.band,
              limit: newN,
              ...(profile.level != null ? { level: profile.level } : {}),
              ...(exam ? { exam } : {}),
              exclude: words.map(w => w.id),
            }),
          })
          if (!res.ok) throw new Error(`recommend ${res.status}`)
          const { data } = await res.json() as { data?: DictionaryWord[] }
          if (!Array.isArray(data) || data.length === 0) throw new Error('empty')
          data.forEach(dw => get().ensureWord(dw, 'today-pack', 'recommended'))
          set({ todayPack: { date: today, recommendedIds: data.map(d => d.id) } })
        } catch {
          // 降级：尝试离线种子；把库中现存 recommended 词（如种子）收进今日包
          await get().injectOfflineSeedIfEmpty()
          const fallback = get().words
            .filter(w => w.state === 'recommended')
            .slice(0, newN)
            .map(w => w.id)
          set({ todayPack: { date: today, recommendedIds: fallback } })
        }
      },

      // 零网络兜底：词库为空且词典完全不可用时注入离线种子包
      injectOfflineSeedIfEmpty: async () => {
        if (get().words.length > 0) return
        try {
          const res = await fetch('/api/dictionary/word/inevitable')
          if (res.ok) return   // 词典可用：交给推荐/查词流程，不注入
        } catch {
          // 断网 → 落入注入
        }
        if (get().words.length > 0) return
        const now = Date.now()
        set(s => ({ words: [...s.words, ...OFFLINE_SEED_WORDS.map(w => ({ ...w, addedAt: now }))] }))
      },

      // 收藏标记（收编 learningStore.savedWords）：词不在库则建轻量 stub
      setSaved: (id, value, fallbackWord) => set(s => {
        const exists = s.words.find(w => w.id === id)
        if (exists) return { words: s.words.map(w => w.id === id ? { ...w, saved: value } : w) }
        if (!value) return {}
        const stub: WordEntry = {
          id, word: fallbackWord ?? id, zh: '', phon: '', pos: '', galaxy: 'cognition',
          state: 'learning', streak: 0, ease: 2.5, interval: 0,
          saved: true, addedAt: Date.now(), source: 'lookup',
        }
        return { words: [...s.words, stub] }
      }),

      addWord: (entry) => {
        const current = get()
        const existing = current.words.find(w => w.id === entry.id)
        if (existing) {
          set(s => transition(s.words, s.log, entry.id, 'learning', '查词加入'))
          return get().words.find(w => w.id === entry.id)
        }
        const newWord: WordEntry = {
          streak: 0, ease: 2.5, interval: 0, galaxy: 'cognition', phon: '', pos: '',
          ...entry, state: 'learning',
        }
        const logEntry: LogEntry = { id: newWord.id, word: newWord.word, from: 'unknown', to: 'learning', note: '查词加入', t: Date.now() }
        set(s => ({
          words: [...s.words, newWord],
          log: [logEntry, ...s.log].slice(0, 30),
        }))
        return newWord
      },

      removeWord: (id) => set(s => {
        const word = s.words.find(w => w.id === id)
        if (!word) return {}
        const entry: LogEntry = { id, word: word.word, from: word.state, to: 'unknown', note: '移出学习', t: Date.now() }
        return { words: s.words.filter(w => w.id !== id), log: [entry, ...s.log].slice(0, 30) }
      }),

      incXp: (n) => set(s => ({ xp: s.xp + n })),
      setPronScore: (id, score) => set(s => ({
        words: s.words.map(w => w.id === id && (w.pronScore ?? 0) < score ? { ...w, pronScore: score } : w),
      })),
      repairStreak: () => {
        const s = get()
        const day = (off: number) => {
          const d = new Date(); d.setDate(d.getDate() - off)
          return d.toISOString().slice(0, 10)
        }
        const yesterday = day(1)
        const hasYesterday = !!s.history[yesterday]
          || (s.daily.date === yesterday && (s.daily.learned + s.daily.quizzed + s.daily.reviewed) > 0)
        if (hasYesterday || s.xp < 50) return false
        const history = { ...s.history, [yesterday]: { learned: 0, quizzed: 0, reviewed: 0 } }
        // 重算 streak：从今天（或昨天）起连续往回数有记录的天
        const today = day(0)
        const todayActive = s.daily.date === today && (s.daily.learned + s.daily.quizzed + s.daily.reviewed) > 0
        let current = 0
        for (let i = todayActive ? 0 : 1; ; i++) {
          const k = day(i)
          const active = (k === today && todayActive) || !!history[k]
          if (active) current++
          else break
        }
        set({
          xp: s.xp - 50,
          history,
          streakData: {
            current,
            longest: Math.max(s.streakData.longest, current),
            lastStudyDate: todayActive ? today : yesterday,
          },
        })
        return true
      },

      // 统一活动记录入口：跨天自动清零（昨天归档进 history）+ streak 计算
      recordActivity: (kind) => set(s => {
        const today = new Date().toISOString().slice(0, 10)
        const crossing = s.daily.date !== today
        let history = s.history
        if (crossing && s.daily.date) {
          // B9-1：跨天时把上一天的 daily 归档（上限 366 条，溢出删最旧）
          history = { ...history, [s.daily.date]: { learned: s.daily.learned, quizzed: s.daily.quizzed, reviewed: s.daily.reviewed } }
          const dates = Object.keys(history).sort()
          while (dates.length > 366) delete history[dates.shift()!]
        }
        const d = !crossing
          ? s.daily
          : { date: today, learned: 0, quizzed: 0, reviewed: 0 }
        const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
        const sd = s.streakData
        const nextCurrent = sd.lastStudyDate === yesterday ? sd.current + 1 : 1
        const streakData = sd.lastStudyDate === today ? sd : {
          current: nextCurrent,
          longest: Math.max(sd.longest, nextCurrent),
          lastStudyDate: today,
        }
        return { daily: { ...d, [kind]: (d[kind] ?? 0) + 1 }, history, streakData }
      }),

      markActivityDone: (key) => set(s => {
        const today = new Date().toISOString().slice(0, 10)
        const cur = s.todayActivity.date === today ? s.todayActivity : { date: today, done: [] as string[] }
        if (cur.done.includes(key)) return { todayActivity: cur }
        return { todayActivity: { date: today, done: [...cur.done, key] } }
      }),

      setProfile: (p) => set(s => {
        // 只有带 band/level 的写入（= 完成定级）才标记 onboarded；
        // 「我的」页单独调整 dailyGoal 不应让未定级用户跳过引导（B9-3）
        const grading = p.band !== undefined || p.level !== undefined
        const completing = grading || s.profile.onboarded
        const profile = {
          ...s.profile, ...p,
          onboarded: completing,
          skipped: completing ? false : s.profile.skipped,
          ...(p.targetExam && (!s.profile.goals?.length) ? { goals: [p.targetExam] } : {}),
        }
        // P1-2：带 level 未带 band 时派生 band = min(level+1, 8)
        if (p.level !== undefined && p.band === undefined) {
          profile.band = Math.min(p.level + 1, 8)
        }
        // userLevel 未显式设置时由 band 派生
        if (!profile.userLevel) profile.userLevel = bandToLevel(profile.band)
        // 带 band/level 的写入视为（重新）定级，刷新定级时间
        if (grading) profile.onboardedAt = Date.now()
        return {
          profile,
          goalToday: p.dailyGoal ?? s.goalToday,
        }
      }),

      skipOnboarding: () => set(s => ({ profile: { ...s.profile, skipped: true } })),

      toggleGoal: (exam) => set(s => {
        const g = new Set(get().goals())
        g.has(exam) ? g.delete(exam) : g.add(exam)
        return { profile: { ...s.profile, goals: [...g] } }
      }),

      // ── practice 切片（逻辑平移自 learningStore，结构不变）──
      addWrongAnswer: (entry) => set(s => {
        // 按 wordId + question 去重
        const exists = s.wrongAnswers.some(
          w => w.wordId === entry.wordId && w.question === entry.question,
        )
        if (exists) return {}
        const id = `${entry.wordId}-${entry.timestamp}`
        return { wrongAnswers: [{ ...entry, id }, ...s.wrongAnswers].slice(0, 200) }
      }),

      removeWrongAnswer: (id) => set(s => ({
        wrongAnswers: s.wrongAnswers.filter(w => w.id !== id),
      })),

      clearWrongAnswers: () => set({ wrongAnswers: [] }),

      addQuizSession: (session) => set(s => ({
        quizHistory: [session, ...s.quizHistory].slice(0, 50),
      })),

      // ── chat 切片 ──
      addChatMessage: (message) => set(s => ({
        chatMessages: [...s.chatMessages, message].slice(-100),
      })),

      clearChat: () => set({ chatMessages: [] }),
    }),
    {
      name: 'lexi-store-v1',
      storage: createJSONStorage(() => localStorage),
      version: 5,
      // v1 → v2：给存量词补时间戳调度字段，去掉假进度
      // v2 → v3：吸收旧 learningStore（localStorage['lexiocean-learning']）本地数据
      // v3 → v4：种子词 id 重映射为词典 slug（w01 → unavoidable），学习进度保留
      // v4 → v5：平移 learningStore 的 practice/chat 切片（错题/测验史/聊天记录）
      migrate: (persisted: unknown, from: number) => {
        if (!persisted || typeof persisted !== 'object') return persisted
        const state = persisted as PersistedLexiState
        if (from < 2) {
          const DAY = 86_400_000
          if (Array.isArray(state.words)) {
            state.words = state.words.map((w) => {
              const nextReviewAt = w.nextReviewAt ?? (
                w.due ? Date.now()
                : w.state === 'review' ? Date.now() + (w.interval || 1) * DAY
                : w.state === 'weak' ? Date.now() + DAY
                : undefined
              )
              const rest = { ...w }
              delete rest.due
              return { ...rest, nextReviewAt }
            })
          }
          // 假进度归零：fake 基线 xp=1240，扣掉后保留真实积累
          state.xp = Math.max(0, (typeof state.xp === 'number' ? state.xp : 0) - 1240)
          delete (state as Record<string, unknown>).streak
          delete (state as Record<string, unknown>).studiedToday
          state.daily = state.daily ?? { date: '', learned: 0, quizzed: 0, reviewed: 0 }
          state.streakData = state.streakData ?? { current: 0, longest: 0, lastStudyDate: '' }
        }
        if (from < 3) {
          try {
            const raw = typeof localStorage !== 'undefined'
              ? localStorage.getItem('lexiocean-learning') : null
            const legacy = raw ? (JSON.parse(raw)?.state as LegacyLearningState | undefined) : null
            if (legacy) {
              const words: PersistedWordEntry[] = Array.isArray(state.words) ? state.words : []
              // reviewWords → 词条 SRS 字段（词不在库则建 stub，内容启动后补拉）
              for (const r of legacy.reviewWords ?? []) {
                if (!r?.wordId) continue
                let w = words.find((x) => x.id === r.wordId)
                if (!w) {
                  w = stubEntry(r.wordId, r.word ?? r.wordId, 'lookup', 'review')
                  words.push(w)
                }
                w.interval = r.interval ?? w.interval
                w.ease = r.ease ?? w.ease
                w.streak = r.repetitions ?? w.streak
                // nextReviewAt 取更早者：宁可多复习不漏复习
                w.nextReviewAt = w.nextReviewAt != null && r.nextReviewAt != null
                  ? Math.min(w.nextReviewAt, r.nextReviewAt)
                  : (r.nextReviewAt ?? w.nextReviewAt)
              }
              // savedWords → WordEntry.saved
              for (const id of legacy.savedWords ?? []) {
                if (typeof id !== 'string' || !id) continue
                let w = words.find((x) => x.id === id)
                if (!w) {
                  w = stubEntry(id, id, 'lookup', 'learning')
                  words.push(w)
                }
                w.saved = true
              }
              state.words = words
              // userLevel 并入 profile（已有显式值则不覆盖）
              if (legacy.userLevel && state.profile && !state.profile.userLevel) {
                state.profile.userLevel = legacy.userLevel
              }
              // streak / xp 取两边较大者
              const sp = legacy.studyProgress
              if (sp) {
                const sd = state.streakData ?? { current: 0, longest: 0, lastStudyDate: '' }
                state.streakData = {
                  current: Math.max(sd.current ?? 0, sp.currentStreak ?? 0),
                  longest: Math.max(sd.longest ?? 0, sp.longestStreak ?? 0),
                  lastStudyDate: (sd.lastStudyDate ?? '') > (sp.lastStudyDate ?? '')
                    ? sd.lastStudyDate
                    : (sp.lastStudyDate ?? ''),
                }
                state.xp = Math.max(
                  typeof state.xp === 'number' ? state.xp : 0,
                  sp.totalXp ?? 0,
                )
              }
              // 旧 key 不删：learningStore 仍是云同步镜像，A7 改造后再清
            }
          } catch {
            // 旧数据损坏：跳过合并，不阻塞启动
          }
        }
        if (from < 5) {
          try {
            const raw = typeof localStorage !== 'undefined'
              ? localStorage.getItem('lexiocean-learning') : null
            const legacy = raw ? (JSON.parse(raw)?.state as LegacyLearningState | undefined) : null
            if (legacy) {
              if (!Array.isArray(state.wrongAnswers) || state.wrongAnswers.length === 0) {
                state.wrongAnswers = Array.isArray(legacy.wrongAnswers) ? legacy.wrongAnswers : []
              }
              if (!Array.isArray(state.quizHistory) || state.quizHistory.length === 0) {
                state.quizHistory = Array.isArray(legacy.quizHistory) ? legacy.quizHistory : []
              }
              if (!Array.isArray(state.chatMessages) || state.chatMessages.length === 0) {
                state.chatMessages = Array.isArray(legacy.chatMessages) ? legacy.chatMessages : []
              }
            }
          } catch {
            // 旧数据损坏：跳过，不阻塞启动
          }
        }
        if (from < 4 && Array.isArray(state.words)) {
          // 种子词 id → 词典 slug；slug 已存在则丢弃旧种子条目（保词典侧进度）
          const seen = new Set(
            state.words.map((w) => w.id).filter((id) => !SEED_SLUG[id]),
          )
          state.words = state.words.flatMap((w) => {
            const slug = SEED_SLUG[w.id]
            if (!slug) return [w]
            if (seen.has(slug)) return []
            seen.add(slug)
            return [{ ...w, id: slug, source: w.source ?? 'seed' }]
          })
        }
        return state
      },
      // Only persist state fields, not action functions
      partialize: (s) => ({
        words: s.words,
        xp: s.xp,
        daily: s.daily,
        todayActivity: s.todayActivity,
        history: s.history,
        streakData: s.streakData,
        goalToday: s.goalToday,
        todayPack: s.todayPack,
        log: s.log,
        profile: s.profile,
        wrongAnswers: s.wrongAnswers,
        quizHistory: s.quizHistory,
        chatMessages: s.chatMessages,
      }),
    }
  )
)
