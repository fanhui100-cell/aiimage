/* practice/practice-types.ts — PracticeRunner 类型（对齐 lib/practice/session-types） */
import type {
  PracticeItem,
  PracticeSessionResponse,
  RecordAttemptInput,
  RecordAttemptResponse,
} from '@/lib/practice/session-types'
import type { QuizAttempt } from '@/types/quiz'
import { isDeprecatedQuestionType } from '@/lib/question-bank/question-type-taxonomy'
import type { ClozeBody, MultiBlankReview } from './renderers/MultiBlankRenderer'
import type { MatchingBody, MatchingReview } from './renderers/MatchingRenderer'
import type { BuildSentenceBody, BuildSentenceReview } from './renderers/BuildSentenceRenderer'
import type { PassageClozeBody, PassageClozeReview } from './renderers/PassageClozeRenderer'
import type { SevenSelectBody, SevenSelectReview } from './renderers/SevenSelectRenderer'
import type { ParaMatchBody, ParaMatchReview } from './renderers/ParaMatchRenderer'
import type { FreeTextReview } from './renderers/FreeTextRenderer'

/** 前端退役题型双保险（后端默认已不下发）。 */
export function isDeprecatedSafe(type: string): boolean {
  return isDeprecatedQuestionType(type)
}

export type {
  PracticeItem,
  PracticeSessionResponse,
  RecordAttemptInput,
  RecordAttemptResponse,
}
export type { QuizAttempt }

/* ── 渲染层题体扩展（提交前只含题面，绝不含答案；正解只来自 review） ──
   后端 session-builder 就绪后按 inputMode 填充对应 body；当前可缺省 → 受控空态。 */
export type PracticeItemView = PracticeItem & {
  clozeBody?: ClozeBody | null
  matchBody?: MatchingBody | null
  buildBody?: BuildSentenceBody | null
  /** 分组阅读型（R3）：逐空四选 / 七选五 / 段落匹配 */
  passageClozeBody?: PassageClozeBody | null
  sevenSelectBody?: SevenSelectBody | null
  paraMatchBody?: ParaMatchBody | null
  /** free_text 字数指引（非强制） */
  wordMin?: number
  wordMax?: number
  guide?: string
}

/** 提交回合下发的批改（按题型；提交前必为 null/undefined）。各 renderer 只取自己那支。 */
export type PracticeReview = MultiBlankReview & {
  matching?: MatchingReview | null
  build?: BuildSentenceReview | null
  freeText?: FreeTextReview | null
  passageCloze?: PassageClozeReview
  sevenSelect?: SevenSelectReview
  paraMatch?: ParaMatchReview
}

export type PracticeRunnerMode = 'word' | 'task' | 'section' | 'paper'

export interface PracticeRunnerProps {
  mode: PracticeRunnerMode
  word?: string
  wordId?: string
  level?: number
  examId?: string
  sectionId?: string
  taskType?: string
  count?: number
  returnTo?: string
  /** 透传旧 /quiz 参数（仅用于诊断/未来扩展） */
  legacySearchParams?: Record<string, string>
}

export interface RunnerSession {
  step: 'play' | 'results'
  idx: number
  score: number
  xp: number
  combo: number
  maxCombo: number
  results: QuizAttempt[]
  startedAt: number
  completedAt: number
}

export type SpellPhase = '' | 'tol' | 'bad' | 'good'

export interface QState {
  locked: boolean
  picked: string | null
  correct: boolean | null
  spellTried: boolean
  spellPhase: SpellPhase
  spellDiffAns: string
  comboBump: boolean
  submitted: boolean   // free_text
  /** 提交回合下发的批改（multi_blank/matching/build_sentence/free_text 自渲染复审用）。 */
  review: PracticeReview | null
}

export const freshRunnerSession = (): RunnerSession => ({
  step: 'play', idx: 0, score: 0, xp: 0, combo: 0, maxCombo: 0, results: [], startedAt: Date.now(), completedAt: 0,
})
export const freshQState = (): QState => ({
  locked: false, picked: null, correct: null, spellTried: false, spellPhase: '', spellDiffAns: '', comboBump: false, submitted: false, review: null,
})

/** 题型 → 技能维度（认/拼/听），用于 lexiStore.recordDimPass */
export const DIM_OF: Record<string, string> = {
  en_to_zh: 'recognize', zh_to_en: 'recognize', def_to_word: 'recognize', synonym_choice: 'recognize',
  synonym_substitute: 'recognize', confusable_choice: 'recognize', collocation_choice: 'recognize',
  cloze_choice: 'recognize', reading_comprehension: 'recognize',
  zh_to_word_spell: 'spell', word_form: 'spell', cloze_spell: 'spell',
  listen_to_meaning: 'listen', dictation_spell: 'listen', listening_comprehension: 'listen',
}

/** 各题型固定提示语（与 /quiz BANK_ASK 对齐） */
export const ASK_OF: Record<string, string> = {
  en_to_zh: '选择正确的中文释义', zh_to_en: '选择对应的英文单词', def_to_word: '选择与释义匹配的单词',
  cloze_choice: '选词填空', zh_to_word_spell: '根据中文释义，拼出英文单词',
  synonym_choice: '选择与它意思最接近的词', confusable_choice: '选择与释义匹配的拼写',
  cloze_spell: '根据例句，敲出空格处的词', listen_to_meaning: '听发音，选出词义', dictation_spell: '听写：拼出你听到的单词',
  listening_comprehension: '听短文，回答下面的问题', reading_comprehension: '阅读短文，回答下面的问题',
  synonym_substitute: '选出与句中「」内词意思最接近的词', collocation_choice: '选出含该词的正确搭配',
}

export type SessionStatus = 'loading' | 'ready' | 'error'
