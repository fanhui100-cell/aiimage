/* ============================================================================
   lib/knowledge/smart-folders.ts — LexiVault 知识库数据层（word-as-spine）

   每个词是脊柱；收藏 / 复习 / 错题 / 扫描 都是它的 facet，靠 word_id 聚合。
   分类 = 智能文件夹（实时 predicate，不是写死字段），count 永远当下计算。
   全部输入来自真实 store：lexiStore.words / wrongAnswers + scanStore + question-bank。
   设计稿 lv-data.js 的 STATE_META/MISTAKE_META/SOURCE_META/riskOf/relationsOf/
   backlinksOf/sortWords 在此对接真实模型。
   ============================================================================ */

import type { WordEntry, WrongAnswer } from '@/store/lexiStore'
import { getQuestionsForWord } from '@/lib/question-bank/question-bank-client'
import type { QuestionBankItem } from '@/types/question-bank'

// ── 错误模式（错题本智能子类）── 与设计稿 MISTAKE_META 同色 ────────────────
export type MistakeType = 'form' | 'meaning' | 'spell' | 'collo' | 'synonym' | 'listen'
export const MISTAKE_META: Record<MistakeType, { zh: string; c: string }> = {
  form: { zh: '形近混淆', c: '#bf4a30' },
  meaning: { zh: '词义记反', c: '#b3781f' },
  spell: { zh: '拼写遗漏', c: '#2f6db0' },
  collo: { zh: '搭配错误', c: '#8b5cf6' },
  synonym: { zh: '同义误选', c: '#0e8c7a' },
  listen: { zh: '听辨错误', c: '#2f9bd6' },
}

// ── 出处（反向链接 surface）── href 走站内真实路由 ─────────────────────────
export type SourceKey = 'dictionary' | 'quiz' | 'wrong' | 'scan' | 'memory' | 'lexigraph' | 'lexiverse'
export const SOURCE_META: Record<SourceKey, { zh: string; href: string; accent: string }> = {
  dictionary: { zh: '词典', href: '/dictionary', accent: '#2f6db0' },
  quiz: { zh: '题库', href: '/quiz', accent: '#0e8c7a' },
  wrong: { zh: '错题本', href: '/memory', accent: '#bf4a30' },
  scan: { zh: '扫描导入', href: '/scan', accent: '#b3781f' },
  memory: { zh: '复习队列', href: '/memory', accent: '#2f9bd6' },
  lexigraph: { zh: 'LexiGraph', href: '/lexigraph', accent: '#8b5cf6' },
  lexiverse: { zh: 'Lexiverse', href: '/lexiverse', accent: '#0e8c7a' },
}

// ── 掌握度 0..1：由真实 SRS 字段（state / streak / interval / dims）派生 ──────
const STATE_BASE: Partial<Record<WordEntry['state'], number>> = {
  mastered: 0.82, review: 0.55, learning: 0.4, weak: 0.3, recommended: 0.15, unknown: 0.06, locked: 0,
}
export function masteryOf(w: WordEntry): number {
  let m = STATE_BASE[w.state] ?? 0.2
  m += Math.min(0.14, (w.streak ?? 0) * 0.03)          // 连对加成
  if ((w.dims?.length ?? 0) >= 2) m += 0.06             // 跨维通过
  if ((w.interval ?? 0) >= 16) m += 0.04                // 长间隔稳固
  return Math.max(0, Math.min(1, m))
}

// ── 遗忘风险 0..1（越高越该复习）= (1-掌握) 叠加逾期 + 错题权重 ───────────────
const DAY = 86_400_000
export function riskOf(w: WordEntry, wrongCount = 0): number {
  let r = 1 - masteryOf(w)
  if (w.nextReviewAt != null) {
    const overdueDays = (Date.now() - w.nextReviewAt) / DAY
    if (overdueDays >= 1) r += 0.25 + 0.06 * Math.min(5, overdueDays)
    else if (overdueDays >= 0) r += 0.12
  }
  if (wrongCount > 0) r += Math.min(0.2, 0.05 * wrongCount)
  return Math.max(0, Math.min(1, r))
}
export function riskColor(r: number): string {
  return r > 0.6 ? '#bf4a30' : r > 0.4 ? '#b3781f' : '#0e8c7a'
}

// ── 错误类型推断：由产生该错题的题面/答案文本推断 ──────────────────────────
function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)])
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return dp[m][n]
}
export function mistakeTypeOf(wa: WrongAnswer): MistakeType {
  const q = (wa.question || '') + ' '
  const you = (wa.userAnswer || '').trim()
  const ans = (wa.correctAnswer || '').trim()
  const isEn = (s: string) => /^[a-zA-Z][a-zA-Z'\- ]*$/.test(s)
  if (/听写|听辨|听音|listen/i.test(q)) return 'listen'
  if (/拼写|拼\s*写|spell/i.test(q)) return 'spell'
  if (/搭配|collocat/i.test(q)) return 'collo'
  // 英文对英文：拼写极近 → 形近混淆；其余英文混淆 → 同义误选
  if (isEn(you) && isEn(ans) && you.toLowerCase() !== ans.toLowerCase()) {
    const d = editDistance(you.toLowerCase(), ans.toLowerCase())
    if (d <= 2 && Math.abs(you.length - ans.length) <= 2) return 'form'
    if (/≈|近义|同义|synonym|closest|means/i.test(q)) return 'synonym'
    return 'form'
  }
  if (/≈|近义|同义|synonym/i.test(q)) return 'synonym'
  return 'meaning'   // 中文对中文 / 选释义 → 词义记反
}

// ── 词根词缀检测（由拼写确定性计算，非伪造数据）──────────────────────────
const AFFIX_RE = /^(un|re|in|im|dis|pre|pro|de|en|ex|sub|inter|trans|anti|over|under|fore|semi|mis|non)|(tion|sion|ment|ness|able|ible|ous|ive|ial|ical|ize|ise|ify|ity|ism|ist|ance|ence|ful|less|ship|hood|ward|wise)$/
export function hasAffix(word: string): boolean {
  return word.length >= 6 && AFFIX_RE.test(word.toLowerCase())
}
const ACADEMIC_EXAMS = new Set(['TOEFL', 'IELTS', 'GRE', 'KAOYAN', 'CET6', 'GMAT'])
function isAcademic(w: WordEntry): boolean {
  if ((w.examTags ?? []).some(t => ACADEMIC_EXAMS.has(t.toUpperCase()))) return true
  return w.cefr === 'C1' || w.cefr === 'C2'
}
function isCore(w: WordEntry): boolean {
  if (w.levels?.some(l => l <= 4)) return true
  return (w.band ?? 9) <= 5
}

// ── 智能文件夹（实时 predicate；count 当下计算）──────────────────────────────
export interface FolderKid { zh: string; match: (w: WordEntry) => boolean }
export interface Folder { id: string; code: string; zh: string; src: SourceKey; kids: FolderKid[] }

export interface KnowledgeInput {
  words: WordEntry[]
  wrongAnswers: WrongAnswer[]
  scanDocTitles: string[]
}

/** 题库命中索引：wordId → 该词题型集合（同步，来自 original-vocab-drill-lite） */
function quizSkillIndex(words: WordEntry[]): Map<string, QuestionBankItem[]> {
  const map = new Map<string, QuestionBankItem[]>()
  for (const w of words) {
    const qs = getQuestionsForWord(w.id, 20)
    if (qs.length) map.set(w.id, qs)
  }
  return map
}

export function buildFolders(input: KnowledgeInput): Folder[] {
  const { words, wrongAnswers } = input
  // 每词错误类型集合
  const wrongTypes = new Map<string, Set<MistakeType>>()
  for (const wa of wrongAnswers) {
    const t = mistakeTypeOf(wa)
    const s = wrongTypes.get(wa.wordId) ?? new Set<MistakeType>()
    s.add(t); wrongTypes.set(wa.wordId, s)
  }
  const qi = quizSkillIndex(words)
  const hasQType = (w: WordEntry, types: string[]) =>
    (qi.get(w.id) ?? []).some(q => types.includes(q.type))
  const hasSkill = (w: WordEntry, skills: string[]) =>
    (qi.get(w.id) ?? []).some(q => q.skillTags.some(s => skills.includes(s)))
  const hasMistake = (w: WordEntry, t: MistakeType) => wrongTypes.get(w.id)?.has(t) ?? false

  return [
    { id: 'vocab', code: '01', zh: '词汇库', src: 'dictionary', kids: [
      { zh: '核心高频', match: isCore },
      { zh: '学术词汇', match: isAcademic },
      { zh: '词根词缀', match: w => hasAffix(w.word) },
      { zh: '易混词对', match: w => hasMistake(w, 'form') },
      { zh: '薄弱词', match: w => w.state === 'weak' || riskOf(w, wrongTypes.get(w.id)?.size ?? 0) > 0.6 },
    ] },
    { id: 'quiz', code: '02', zh: '题库', src: 'quiz', kids: [
      { zh: '同义辨析', match: w => hasSkill(w, ['synonym']) || hasQType(w, ['synonym_choice', 'synonym_substitute']) || hasMistake(w, 'synonym') },
      { zh: '拼写题', match: w => hasSkill(w, ['spelling']) || hasQType(w, ['cloze_spell', 'dictation_spell', 'zh_to_word_spell']) || hasMistake(w, 'spell') },
      { zh: '听写题', match: w => hasSkill(w, ['listening']) || hasQType(w, ['listen_to_meaning', 'dictation_spell', 'listen_to_word', 'listening_comprehension']) || hasMistake(w, 'listen') },
      { zh: '词性辨析', match: w => hasSkill(w, ['word_form']) || hasQType(w, ['word_form', 'confusable_choice']) || hasMistake(w, 'form') },
    ] },
    { id: 'wrong', code: '03', zh: '错题本', src: 'wrong', kids: [
      { zh: '形近混淆', match: w => hasMistake(w, 'form') },
      { zh: '词义记反', match: w => hasMistake(w, 'meaning') },
      { zh: '拼写遗漏', match: w => hasMistake(w, 'spell') },
      { zh: '同义误选', match: w => hasMistake(w, 'synonym') },
      { zh: '听辨错误', match: w => hasMistake(w, 'listen') },
    ] },
    { id: 'reading', code: '04', zh: '阅读笔记', src: 'scan', kids: [
      { zh: '生词摘录', match: w => w.source === 'scan' || w.source === 'reading' },
      { zh: '阅读收藏', match: w => w.source === 'reading' },
    ] },
    { id: 'scan', code: '05', zh: '扫描导入', src: 'scan', kids: [
      { zh: '扫描生词', match: w => w.source === 'scan' },
    ] },
  ]
}

/** 文件夹某子项的实时命中词 */
export function kidWords(words: WordEntry[], match: (w: WordEntry) => boolean): WordEntry[] {
  return words.filter(match)
}

// ── 关系链（近义/反义/易混 → [[link]]）── 来自真实 syn/ant + 错题形近 ─────────
export interface Relation { rel: 'syn' | 'ant' | 'confused'; label: string }
export function relationsOf(w: WordEntry, confusedExtra: string[] = []): Relation[] {
  const out: Relation[] = []
  for (const s of w.syn ?? []) out.push({ rel: 'syn', label: s })
  for (const s of w.ant ?? []) out.push({ rel: 'ant', label: s })
  const seen = new Set<string>()
  for (const c of confusedExtra) { if (c && !seen.has(c)) { seen.add(c); out.push({ rel: 'confused', label: c }) } }
  return out
}

// ── 反向链接 / 出处：这个词在哪些 surface 出现过（全部真实足迹）─────────────
export interface Backlink { src: SourceKey; note: string }
function relDay(ts: number): string {
  const d = (Date.now() - ts) / DAY
  if (d < 1) return '今天'
  if (d < 2) return '昨天'
  if (d < 7) return `${Math.floor(d)} 天前`
  if (d < 30) return `${Math.floor(d / 7)} 周前`
  return `${Math.floor(d / 30)} 个月前`
}
export function backlinksOf(w: WordEntry, wrongAnswers: WrongAnswer[]): Backlink[] {
  const out: Backlink[] = []
  if (w.addedAt) {
    const srcZh = w.source === 'scan' ? '扫描导入' : w.source === 'reading' ? '阅读收藏' : '词典收藏'
    out.push({ src: w.source === 'scan' || w.source === 'reading' ? 'scan' : 'dictionary', note: `${srcZh} · ${relDay(w.addedAt)}` })
  }
  if (w.nextReviewAt != null) {
    const due = w.nextReviewAt <= Date.now()
    out.push({ src: 'memory', note: `复习队列 · ${due ? '已到期' : new Date(w.nextReviewAt).toLocaleDateString('zh-CN')} · 第 ${w.streak ?? 0} 次` })
  }
  for (const wa of wrongAnswers.filter(x => x.wordId === w.id)) {
    const mt = MISTAKE_META[mistakeTypeOf(wa)]
    out.push({ src: 'wrong', note: `${mt.zh} · ${relDay(wa.timestamp)} · 「${wa.question.slice(0, 28)}」` })
  }
  return out
}

// ── 排序：risk | mastery | alpha ────────────────────────────────────────────
export function sortWords(list: WordEntry[], by: 'risk' | 'mastery' | 'alpha', wrongCount: (id: string) => number = () => 0): WordEntry[] {
  const arr = [...list]
  if (by === 'risk') arr.sort((a, b) => riskOf(b, wrongCount(b.id)) - riskOf(a, wrongCount(a.id)))
  else if (by === 'alpha') arr.sort((a, b) => a.word.localeCompare(b.word))
  else if (by === 'mastery') arr.sort((a, b) => masteryOf(b) - masteryOf(a))
  return arr
}
