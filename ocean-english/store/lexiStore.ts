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
import type { DictionaryWord } from '@/lib/dictionary/dictionary-types'

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
  ex?: string
  exZh?: string
  syn?: string[]
  ant?: string[]
}

export interface Profile {
  onboarded: boolean
  skipped: boolean
  targetExam: string | null
  band: number
  dailyGoal: number
  goals?: string[]
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

export const EXTRA_DICT: WordEntry[] = [
  { id: 'd_ubiquitous', word: 'ubiquitous', phon: '/juːˈbɪkwɪtəs/', pos: 'adj.',    zh: '无处不在的',      galaxy: 'cognition', state: 'unknown', streak: 0, ease: 2.5, interval: 0, cefr: 'C2', band: 8, examTags: ['GRE', 'TOEFL'],    ex: 'Smartphones have become ubiquitous.',  exZh: '智能手机已无处不在。',     syn: ['omnipresent', 'pervasive'], ant: ['rare'] },
  { id: 'd_ephemeral',  word: 'ephemeral',  phon: '/ɪˈfemərəl/',    pos: 'adj.',    zh: '短暂的、转瞬即逝的', galaxy: 'cognition', state: 'unknown', streak: 0, ease: 2.5, interval: 0, cefr: 'C2', band: 8, examTags: ['GRE', 'IELTS'],    ex: 'Fame can be ephemeral.',               exZh: '名声可能转瞬即逝。',       syn: ['transient', 'fleeting'],    ant: ['permanent'] },
  { id: 'd_benefit',    word: 'benefit',    phon: '/ˈbenɪfɪt/',     pos: 'n./v.',   zh: '益处；得益',       galaxy: 'cognition', state: 'unknown', streak: 0, ease: 2.5, interval: 0, cefr: 'B1', band: 3, examTags: ['CET4', 'GAOKAO'],  ex: 'Exercise benefits your health.',       exZh: '锻炼有益健康。',           syn: ['advantage', 'gain'],        ant: ['drawback'] },
  { id: 'd_persuade',   word: 'persuade',   phon: '/pəˈsweɪd/',     pos: 'v.',      zh: '说服、劝说',       galaxy: 'cognition', state: 'unknown', streak: 0, ease: 2.5, interval: 0, cefr: 'B1', band: 4, examTags: ['CET4', 'GAOKAO'],  ex: 'She persuaded him to stay.',           exZh: '她说服他留下。',           syn: ['convince'],                 ant: ['dissuade'] },
  { id: 'd_resilient',  word: 'resilient',  phon: '/rɪˈzɪliənt/',   pos: 'adj.',    zh: '有韧性的、能复原的',  galaxy: 'cognition', state: 'unknown', streak: 0, ease: 2.5, interval: 0, cefr: 'C1', band: 7, examTags: ['IELTS', 'TOEFL'], ex: 'Children are remarkably resilient.',   exZh: '孩子的恢复力惊人。',       syn: ['tough', 'flexible'],        ant: ['fragile'] },
]

const DISTRACTORS = [
  '显著的增长', '短暂的停留', '公开的声明', '强烈的反对',
  '微弱的信号', '彻底的改变', '细致的观察', '广泛的影响',
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

const INITIAL_WORDS: WordEntry[] = SEED_WORDS_BASE.map(w => ({
  ...(w as WordEntry),
  ...(WORD_AUG[w.id] ?? {}),
}))

// ─────────────────────────────────────────────────────────────
// Store interface
// ─────────────────────────────────────────────────────────────
export interface DailyRecord {
  date: string
  learned: number
  quizzed: number
  reviewed: number
}

export interface StreakData {
  current: number
  longest: number
  lastStudyDate: string
}

interface LexiStoreState {
  words: WordEntry[]
  xp: number
  daily: DailyRecord
  streakData: StreakData
  goalToday: number
  log: LogEntry[]
  profile: Profile
  user: { loggedIn: boolean; name: string; email: string }
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
  extraDict: () => WordEntry[]
  probeLadder: () => typeof PROBE_LADDER
  examBands: () => typeof EXAM_BANDS
  bandCefr: (b: number) => string
  goals: () => string[]
  distractorsFor: (w: WordEntry) => DistractorOption[]
  // write views
  markLearning: (id: string) => void
  markCorrect: (id: string) => void
  markWrong: (id: string) => void
  reviewGrade: (id: string, g: ReviewGrade) => void
  relearn: (id: string) => void
  addToReview: (id: string) => void
  // A4 缝合：唯一词典入库入口（已存在不重置学习进度）
  ensureWord: (dw: DictionaryWord, source: NonNullable<WordEntry['source']>, state?: WordState) => WordEntry
  setSaved: (id: string, value: boolean, fallbackWord?: string) => void
  addWord: (entry: Partial<WordEntry> & Pick<WordEntry, 'id' | 'word' | 'zh'>) => WordEntry | undefined
  incXp: (n: number) => void
  recordActivity: (kind: 'learned' | 'quizzed' | 'reviewed') => void
  setProfile: (p: Partial<Profile>) => void
  skipOnboarding: () => void
  toggleGoal: (exam: string) => void
  login: (name?: string) => void
  logout: () => void
}

type LexiStore = LexiStoreState & LexiStoreActions

// ─────────────────────────────────────────────────────────────
// Internal helper: push log entry + update words
// ─────────────────────────────────────────────────────────────
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
      words: INITIAL_WORDS,
      xp: 0,
      daily: { date: '', learned: 0, quizzed: 0, reviewed: 0 },
      streakData: { current: 0, longest: 0, lastStudyDate: '' },
      goalToday: 12,
      log: [],
      profile: { onboarded: false, skipped: false, targetExam: null, band: 5, dailyGoal: 12 },
      user: { loggedIn: false, name: '', email: '' },

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
      getToday: () => {
        const ws = get().words
        const recommended = ws.filter(w => w.state === 'recommended')
        const review = get().getDue()
        const dueIds = new Set(review.map(w => w.id))
        const weak = ws.filter(w => w.state === 'weak' && !dueIds.has(w.id))
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
      extraDict: () => EXTRA_DICT,
      probeLadder: () => PROBE_LADDER,
      examBands: () => EXAM_BANDS,
      bandCefr: (b) => BAND_CEFR[b] ?? 'B2',
      goals: () => {
        const p = get().profile
        return p.goals?.length ? p.goals : (p.targetExam ? [p.targetExam] : [])
      },
      distractorsFor: (w) => {
        const pool = DISTRACTORS.filter(d => d !== w.zh)
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

      incXp: (n) => set(s => ({ xp: s.xp + n })),

      // 统一活动记录入口：跨天自动清零 + streak 计算
      recordActivity: (kind) => set(s => {
        const today = new Date().toISOString().slice(0, 10)
        const d = s.daily.date === today
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
        return { daily: { ...d, [kind]: d[kind] + 1 }, streakData }
      }),

      setProfile: (p) => set(s => {
        const profile = {
          ...s.profile, ...p, onboarded: true, skipped: false,
          ...(p.dailyGoal ? {} : {}),
          ...(p.targetExam && (!s.profile.goals?.length) ? { goals: [p.targetExam] } : {}),
        }
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

      login: (name) => set(() => ({
        user: {
          loggedIn: true,
          name: name ?? 'Voyager',
          email: (name ?? 'voyager').toLowerCase() + '@lexiverse.app',
        },
      })),

      logout: () => set(() => ({ user: { loggedIn: false, name: '', email: '' } })),
    }),
    {
      name: 'lexi-store-v1',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      // v1 → v2：给存量词补时间戳调度字段，去掉假进度
      migrate: (persisted: any, from: number) => {
        if (!persisted) return persisted
        if (from < 2) {
          const DAY = 86_400_000
          if (Array.isArray(persisted.words)) {
            persisted.words = persisted.words.map((w: any) => {
              const nextReviewAt = w.nextReviewAt ?? (
                w.due ? Date.now()
                : w.state === 'review' ? Date.now() + (w.interval || 1) * DAY
                : w.state === 'weak' ? Date.now() + DAY
                : undefined
              )
              const { due: _due, ...rest } = w
              return { ...rest, nextReviewAt }
            })
          }
          // 假进度归零：fake 基线 xp=1240，扣掉后保留真实积累
          persisted.xp = Math.max(0, (typeof persisted.xp === 'number' ? persisted.xp : 0) - 1240)
          delete persisted.streak
          delete persisted.studiedToday
          persisted.daily = persisted.daily ?? { date: '', learned: 0, quizzed: 0, reviewed: 0 }
          persisted.streakData = persisted.streakData ?? { current: 0, longest: 0, lastStudyDate: '' }
        }
        return persisted
      },
      // Only persist state fields, not action functions
      partialize: (s) => ({
        words: s.words,
        xp: s.xp,
        daily: s.daily,
        streakData: s.streakData,
        goalToday: s.goalToday,
        log: s.log,
        profile: s.profile,
        user: s.user,
      }),
    }
  )
)
