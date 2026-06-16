'use client'
/* OnboardingScreen — P0 定级重设计 v2（1:1 自 design_handoff_onboarding_redesign）
   goal → path → channel →（sweep 自适应 CAT → verify ｜ pick）→ result
   可返回 + 可点进度条 + 跳过；path 写进 Profile；结果页成长路径/定制摘要/今日配比/每日量。 */
import { useEffect, useState, type ReactNode } from 'react'
import { useLexiStore, bandToLevel } from '@/store/lexiStore'
import { levelToBand } from '@/lib/levels'
import { useNavigate } from '@/hooks/useNavigate'
import { buildVocabCard } from '@/lib/analytics/report'
import { VocabEstimateCard } from './VocabEstimateCard'
import './onboarding.css'

// ════════ DATA ════════
const GOALS = [
  { id: 'junior', zh: '初中', en: 'Junior High', galaxy: 'junior', band: 1, color: '#5b9bd5', cefr: 'A2', kind: 'band' },
  { id: 'senior', zh: '高中', en: 'Senior / Gaokao', galaxy: 'senior', band: 2, color: '#2f9e8f', cefr: 'B1', kind: 'band' },
  { id: 'CET4', zh: '四级', en: 'CET-4', galaxy: 'cet4', band: 3, color: '#d2792f', cefr: 'B1', kind: 'band' },
  { id: 'CET6', zh: '六级', en: 'CET-6', galaxy: 'cet6', band: 4, color: '#6d4bc4', cefr: 'B2', kind: 'band' },
  { id: 'KAOYAN', zh: '考研', en: 'Graduate', galaxy: 'kaoyan', band: 5, color: '#d4477e', cefr: 'B2', kind: 'band' },
  { id: 'TOEFL', zh: '托福', en: 'TOEFL iBT', galaxy: 'toefl', band: 6, color: '#3b5bd9', cefr: 'C1', kind: 'band' },
  { id: 'SAT', zh: 'SAT', en: 'SAT', galaxy: 'sat', band: 7, color: '#b3781f', cefr: 'C1', kind: 'band' },
  { id: 'IELTS', zh: '雅思', en: 'IELTS Academic', galaxy: 'ielts', band: null as number | null, color: '#1f9f8c', cefr: 'B2–C1', kind: 'theme' },
  { id: 'casual', zh: '休闲', en: 'Casual Vocabulary', galaxy: 'mine', band: null as number | null, color: '#5b6b78', cefr: '—', kind: 'free' },
]
const LEVELS = [
  { level: 1, key: 'junior', zh: '初中', desc: '基础词汇起步，覆盖日常表达', cefr: 'A2', wordCount: 3223 },
  { level: 2, key: 'senior', zh: '高中', desc: '高考核心词，读写听说全面打底', cefr: 'B1', wordCount: 6008 },
  { level: 3, key: 'cet4', zh: '四级', desc: '大学英语四级，应试与应用并重', cefr: 'B1', wordCount: 7508 },
  { level: 4, key: 'cet6', zh: '六级', desc: '六级进阶词汇，学术阅读起点', cefr: 'B2', wordCount: 5651 },
  { level: 5, key: 'kaoyan', zh: '考研', desc: '考研大纲词，长难句的基石', cefr: 'B2', wordCount: 9602 },
  { level: 6, key: 'toefl', zh: '托福', desc: '留学学术词汇，听说读写四项', cefr: 'C1', wordCount: 13477 },
  { level: 7, key: 'sat', zh: 'SAT', desc: '北美学术顶配，精确与文雅', cefr: 'C1', wordCount: 8887 },
]
const levelDef = (l: number) => LEVELS.find(x => x.level === l) || LEVELS[2]
const PATHS = [
  { id: 'full' as const, zh: '全面掌握', desc: '词汇 + 练习 + 阅读 + 复习完整闭环', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.6" fill="currentColor"/></svg>' },
  { id: 'words' as const, zh: '速记词汇', desc: '快速积累核心词汇，每日打卡', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>' },
  { id: 'reading' as const, zh: '精读提升', desc: '通过语境理解词汇用法', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5.5C10.5 4 8 3.5 4 4v14c4-.5 6.5 0 8 1.5M12 5.5C13.5 4 16 3.5 20 4v14c-4-.5-6.5 0-8 1.5M12 5.5v14"/></svg>' },
  { id: 'exam' as const, zh: '应试备考', desc: '针对性题型，模拟测试练习', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="m9 13 2 2 4-4"/></svg>' },
]
const pathDef = (id: string) => PATHS.find(p => p.id === id)
const WORD_BANK: Record<number, string[]> = {
  1: ['weather', 'borrow', 'decide', 'invite', 'garden', 'hungry', 'kitchen', 'repair', 'promise', 'season'],
  2: ['attitude', 'gradually', 'benefit', 'generous', 'manage', 'sincere', 'achieve', 'frequent', 'ignore', 'polite'],
  3: ['persuade', 'sustainable', 'evaluate', 'reliable', 'approximate', 'considerable', 'eliminate', 'sufficient', 'transfer', 'regardless'],
  4: ['consensus', 'ambiguous', 'inevitable', 'accumulate', 'comprehensive', 'plausible', 'advocate', 'prominent', 'versatile', 'deteriorate'],
  5: ['mitigate', 'paradigm', 'empirical', 'prevalent', 'scrutiny', 'compelling', 'intricate', 'notorious', 'profound', 'susceptible'],
  6: ['ubiquitous', 'meticulous', 'nuance', 'salient', 'cohesive', 'articulate', 'pragmatic', 'tangible', 'eloquent', 'robust'],
  7: ['perfunctory', 'obfuscate', 'esoteric', 'ephemeral', 'pernicious', 'sagacious', 'quintessential', 'surreptitious', 'magnanimous', 'recalcitrant'],
}
const BAND_N: Record<number, number> = { 1: 3223, 2: 6008, 3: 7508, 4: 5651, 5: 9602, 6: 13477, 7: 8887 }
const PSEUDO = ['crelt', 'glemp', 'frell', 'sploon', 'krall', 'plimth', 'fendle', 'morple', 'quenip', 'blunge', 'tarsel', 'vergle', 'drazzle', 'grindle', 'noctile', 'splethor', 'perulent', 'obrindle']
const VERIFY: Record<number, { word: string; zh: string; opts: string[] }[]> = {
  1: [{ word: 'borrow', zh: '借入', opts: ['借入', '决定', '邀请', '打扫'] }, { word: 'weather', zh: '天气', opts: ['天气', '花园', '态度', '重量'] }],
  2: [{ word: 'gradually', zh: '逐渐地', opts: ['逐渐地', '慷慨地', '偶然地', '勉强地'] }, { word: 'generous', zh: '慷慨的', opts: ['慷慨的', '真诚的', '谨慎的', '胆小的'] }],
  3: [{ word: 'persuade', zh: '说服', opts: ['说服', '借入', '推迟', '评估'] }, { word: 'sustainable', zh: '可持续的', opts: ['可持续的', '多余的', '短暂的', '模糊的'] }],
  4: [{ word: 'ambiguous', zh: '模棱两可的', opts: ['模棱两可的', '必然的', '透明的', '慷慨的'] }, { word: 'consensus', zh: '共识', opts: ['共识', '冲突', '假设', '偏见'] }],
  5: [{ word: 'empirical', zh: '实证的', opts: ['实证的', '理论的', '含糊的', '短暂的'] }, { word: 'paradigm', zh: '范式、典范', opts: ['范式、典范', '悖论', '边缘', '段落'] }],
  6: [{ word: 'ubiquitous', zh: '无处不在的', opts: ['无处不在的', '独一无二的', '短暂的', '模糊的'] }, { word: 'meticulous', zh: '一丝不苟的', opts: ['一丝不苟的', '粗心的', '顺从的', '慷慨的'] }],
  7: [{ word: 'obfuscate', zh: '使混乱、模糊', opts: ['使混乱、模糊', '阐明', '巩固', '召集'] }, { word: 'perfunctory', zh: '敷衍的', opts: ['敷衍的', '彻底的', '华丽的', '谨慎的'] }],
}
const GOAL_DAILY = [10, 15, 20, 30]
// 各路线推荐每日量（应试走考试日期倒计时）；suggestDaily=clamp(round(480/天数),8,40)
const PATH_REC: Record<string, number> = { full: 12, words: 20, reading: 8, exam: 16 }
const daysTo = (d: string) => { const ms = new Date(d + 'T00:00:00').getTime() - Date.now(); return Math.max(0, Math.ceil(ms / 86_400_000)) }
const suggestDaily = (days: number) => Math.max(8, Math.min(40, Math.round(480 / Math.max(days, 1))))
const PATH_MIX: Record<string, (n: number) => string[]> = {
  full: n => [`${n} 新词`, `${Math.round(n * 0.6)} 题练习`, `1 篇阅读`, `${Math.round(n * 0.5)} 词复习`],
  words: n => [`${n} 新词`, `${Math.round(n * 0.4)} 题快练`, `${Math.round(n * 0.6)} 词复习`],
  reading: n => [`${Math.round(n * 0.6)} 新词`, `2 篇精读`, `${Math.round(n * 0.4)} 题练习`],
  exam: n => [`${Math.round(n * 0.5)} 新词`, `${n} 题题型`, `1 套模拟`, `${Math.round(n * 0.4)} 错题复习`],
}
const SE_THRESH: Record<string, number> = { 快: 0.55, 准: 0.38 }
const MAX_GRIDS = 5
const PROG = ['goal', 'path', 'channel', 'assess', 'result']
const SEG_OF: Record<string, number> = { goal: 0, path: 1, channel: 2, sweep: 3, verify: 3, pick: 3, result: 4 }

// ════════ pure helpers ════════
function shuffle<T>(a: T[]): T[] { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a }
function pickN(arr: string[], n: number, exclude?: Set<string>): string[] { return shuffle(arr.filter(w => !exclude || !exclude.has(w))).slice(0, n) }
function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)) }
function pickPseudoMatched(realWords: string[], n: number, exclude?: Set<string>): string[] {
  const avg = realWords.reduce((s, w) => s + w.length, 0) / Math.max(1, realWords.length)
  const pool = PSEUDO.filter(w => !exclude || !exclude.has(w)).sort((a, b) => Math.abs(a.length - avg) - Math.abs(b.length - avg)).slice(0, Math.min(PSEUDO.length, n * 2))
  return shuffle(pool).slice(0, n)
}
function periodText(words: number, daily: number) { const days = Math.ceil(words / daily); return days <= 84 ? `约 ${Math.ceil(days / 7)} 周` : `约 ${Math.ceil(days / 30)} 个月` }
function pathMixChips(pid: string, n: number) { return (PATH_MIX[pid] || PATH_MIX.full)(n) }
const estMin = (n: number) => Math.max(4, Math.round(n * 1.2))
// 滑块 5–200；输入框可达 999（值超 200 时滑块停在满格）
const rangePct = (n: number) => clamp(Math.round((Math.min(n, 200) - 5) / 195 * 100), 0, 100)

type Step = 'goal' | 'path' | 'channel' | 'sweep' | 'verify' | 'pick' | 'result'
type PathId = 'full' | 'words' | 'reading' | 'exam'
interface SweepItem { word: string; band: number; fake: boolean }
interface VQ { word: string; zh: string; opts: string[]; level: number; role: 'confirm' | 'up'; choices: string[] }
interface OB {
  step: Step; history: Step[]; goal: string | null; path: PathId | null; channel: 'test' | 'pick' | null; level: number
  round: number; testMode: '快' | '准'; se: number; theta: number
  hits: Record<number, number>; seen: Record<number, number>; faHits: number; faSeen: number; usedWords: Set<string>
  rough: number; roughLevel: number; sweepItems: SweepItem[]; gridSel: Set<number>
  bandRates: Record<number, number> | null; fa: number; vocabEst: number; sharp: number
  verifyQ: VQ[]; vIdx: number; vResults: { level: number; role: string; correct: boolean }[]; confidence: '高' | '中' | '低'
  dailyGoal: number; custom: boolean; examDate: string
}
function initState(): OB {
  return { step: 'goal', history: [], goal: null, path: null, channel: null, level: 3, round: 0, testMode: '准', se: 1, theta: 3, hits: {}, seen: {}, faHits: 0, faSeen: 0, usedWords: new Set(), rough: 3, roughLevel: 3, sweepItems: [], gridSel: new Set(), bandRates: null, fa: 0, vocabEst: 0, sharp: 1, verifyQ: [], vIdx: 0, vResults: [], confidence: '高', dailyGoal: 12, custom: false, examDate: '' }
}
function estLevel(S: OB) {
  const fa = S.faSeen ? S.faHits / S.faSeen : 0
  const adj: Record<number, number> = {}
  for (let b = 1; b <= 7; b++) { const hr = S.seen[b] ? S.hits[b] / S.seen[b] : 0; adj[b] = fa >= 1 ? 0 : clamp((hr - fa) / (1 - fa), 0, 1) }
  let L = 1; for (let b = 7; b >= 1; b--) { if (adj[b] >= 0.5) { L = b; break } }
  const up = L < 7 ? adj[L + 1] : 0
  const gap = adj[L] - up
  const frac = gap > 0 ? clamp((adj[L] - 0.5) / gap, 0, 1) : 0
  const theta = L + frac
  const nBound = (S.seen[L] || 0) + (L < 7 ? (S.seen[L + 1] || 0) : 0)
  const se = 1 / Math.sqrt(Math.max(1, nBound)) + (1 - clamp(gap, 0, 1)) * 0.3
  let vocab = 0; for (let b = 1; b <= 7; b++) vocab += adj[b] * BAND_N[b]
  return { level: L, theta: +theta.toFixed(2), adj, fa, vocab: Math.round(vocab), sharp: gap, se: +se.toFixed(3) }
}
function buildSweep(d: OB, kind: 'broad' | 'focus') {
  const items: SweepItem[] = []; const reals: string[] = []
  if (kind === 'broad') { for (let b = 1; b <= 7; b++) pickN(WORD_BANK[b], 2, d.usedWords).forEach(w => { items.push({ word: w, band: b, fake: false }); reals.push(w); d.usedWords.add(w) }) }
  else { const bands = [...new Set([d.rough - 1, d.rough, d.rough + 1])].filter(b => b >= 1 && b <= 7); bands.forEach(b => pickN(WORD_BANK[b], 3, d.usedWords).forEach(w => { items.push({ word: w, band: b, fake: false }); reals.push(w); d.usedWords.add(w) })) }
  pickPseudoMatched(reals, kind === 'broad' ? 3 : 2, d.usedWords).forEach(w => { items.push({ word: w, band: 0, fake: true }); d.usedWords.add(w) })
  d.sweepItems = shuffle(items); d.gridSel = new Set()
}
function applyVerify(prev: OB, k: number): OB {
  const d: OB = { ...prev }
  const q = d.verifyQ[d.vIdx]; if (!q || k < 0 || k >= q.choices.length) return prev
  d.vResults = [...d.vResults, { level: q.level, role: q.role, correct: q.choices[k] === q.zh }]
  if (d.vIdx + 1 >= d.verifyQ.length) {
    let final = d.roughLevel
    d.vResults.forEach(r => { if (r.role === 'confirm' && !r.correct) final -= 1; if (r.role === 'up' && r.correct) final += 1 })
    d.level = clamp(final, 1, 7)
    const confirmWrong = d.vResults.some(r => r.role === 'confirm' && !r.correct)
    let conf: '高' | '中' | '低' = '高'; if (d.se > 0.30 || d.fa >= 0.34 || confirmWrong) conf = '中'; if (d.se > 0.45 || d.fa >= 0.6) conf = '低'
    d.confidence = conf; d.history = [...d.history, d.step]; d.step = 'result'
  } else d.vIdx++
  return d
}
const ICON: Record<string, string> = {
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.6" fill="currentColor"/>',
  level: '<path d="M12 3 4 8l8 5 8-5-8-5z"/><path d="M4 12l8 5 8-5"/>',
  words: '<path d="M4 19.5V6a2 2 0 0 1 2-2h12a1 1 0 0 1 1 1v13"/><path d="M6 17h13"/>',
  path: '<path d="M9 18V5l9-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
}
const Svg = ({ html, className }: { html: string; className?: string }) => <span className={className} dangerouslySetInnerHTML={{ __html: html }} />

export function OnboardingScreen() {
  const navigate = useNavigate()
  const setProfile = useLexiStore(st => st.setProfile)
  const skipOnboarding = useLexiStore(st => st.skipOnboarding)
  const [s, setS] = useState<OB>(initState)
  const update = (fn: (d: OB) => void) => setS(prev => { const n: OB = { ...prev }; fn(n); return n })

  // ── nav ──
  const go = (step: Step, push = true) => update(d => { if (push) d.history = [...d.history, d.step]; d.step = step })
  const back = () => update(d => { if (d.history.length) { const h = d.history.slice(); d.step = h.pop()!; d.history = h } })
  const startTest = () => update(d => { d.channel = 'test'; d.round = 0; d.se = 1; d.theta = 3; d.hits = {}; d.seen = {}; for (let b = 1; b <= 7; b++) { d.hits[b] = 0; d.seen[b] = 0 } d.faHits = 0; d.faSeen = 0; d.usedWords = new Set(); buildSweep(d, 'broad'); d.history = [...d.history, d.step]; d.step = 'sweep' })
  const jumpTo = (seg: number) => {
    const map: Record<number, Step | undefined> = { 0: 'goal', 1: 'path', 2: 'channel', 3: s.channel === 'pick' ? 'pick' : 'sweep', 4: 'result' }
    const target = map[seg]; if (!target) return
    if (target === 'sweep') { startTest(); return }
    update(d => { d.history = PROG.slice(0, seg) as Step[]; d.step = target })
  }
  // ── assess ──
  const setTestMode = (m: '快' | '准') => update(d => { d.testMode = m })
  const toggleKnown = (i: number) => update(d => { const g = new Set(d.gridSel); if (g.has(i)) g.delete(i); else g.add(i); d.gridSel = g })
  const submitSweep = () => update(d => {
    d.seen = { ...d.seen }; d.hits = { ...d.hits }
    d.sweepItems.forEach((it, i) => { const k = d.gridSel.has(i); if (it.fake) { d.faSeen++; if (k) d.faHits++ } else { d.seen[it.band]++; if (k) d.hits[it.band]++ } })
    d.round++
    const est = estLevel(d)
    d.roughLevel = est.level; d.rough = est.level; d.bandRates = est.adj; d.fa = est.fa; d.vocabEst = est.vocab; d.sharp = est.sharp; d.se = est.se; d.theta = est.theta
    const thresh = SE_THRESH[d.testMode] ?? 0.38
    if (d.round >= MAX_GRIDS || est.se <= thresh) {
      const la = clamp(est.level, 1, 7), lb = clamp(est.level + 1, 1, 7); const picks: { word: string; zh: string; opts: string[]; level: number; role: 'confirm' | 'up' }[] = []
      if (VERIFY[la]) picks.push({ ...VERIFY[la][0], level: la, role: 'confirm' })
      if (VERIFY[lb] && lb !== la) picks.push({ ...VERIFY[lb][0], level: lb, role: 'up' })
      if (picks.length < 2 && VERIFY[la] && VERIFY[la][1]) picks.push({ ...VERIFY[la][1], level: la, role: 'confirm' })
      d.verifyQ = picks.map(q => ({ ...q, choices: shuffle(q.opts) })); d.vIdx = 0; d.vResults = []
      d.history = [...d.history, d.step]; d.step = 'verify'
    } else buildSweep(d, 'focus')
  })
  const answerVerify = (k: number) => setS(prev => applyVerify(prev, k))
  // ── picks ──
  const pickGoal = (id: string) => update(d => { d.goal = id })
  const pickPath = (id: PathId) => update(d => { d.path = id })
  const pickLevel = (l: number) => { update(d => { d.channel = 'pick'; d.level = l }); setTimeout(() => go('result'), 200) }
  const setDaily = (g: number) => update(d => { d.dailyGoal = g; d.custom = false })
  const setCustom = () => update(d => { d.custom = true })
  const liveDaily = (raw: string) => { const v = parseInt(raw, 10); if (isNaN(v)) return; update(d => { d.dailyGoal = clamp(v, 1, 999); d.custom = true }) }
  // 应试：选考试日期 → 按倒计时自动推荐每日量（clamp(round(480/天数),8,40)）
  const setExamDate = (v: string) => update(d => { d.examDate = v; if (v) { d.dailyGoal = suggestDaily(daysTo(v)); d.custom = false } })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { const n = parseInt(e.key, 10); if (!(n >= 1 && n <= 4)) return; setS(prev => (prev.step === 'verify' ? applyVerify(prev, n - 1) : prev)); }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [])

  const finish = () => {
    const goal = GOALS.find(g => g.id === s.goal) || GOALS[2]
    const band = levelToBand(s.level)
    setProfile({ targetExam: s.goal ?? goal.id, path: s.path ?? 'full', level: s.level, band, dailyGoal: s.dailyGoal, onboarded: true, userLevel: bandToLevel(band), vocabEst: s.vocabEst || undefined, confidence: s.channel === 'test' ? s.confidence : undefined, examDate: s.path === 'exam' ? (s.examDate || null) : null })
    void useLexiStore.getState().buildTodayPack()
    navigate('today', { flow: true })
  }
  const skip = () => { skipOnboarding(); navigate('home') }

  // ════════ RENDER ════════
  const renderStep = (): ReactNode => {
    switch (s.step) {
      case 'goal':
        return <div className="fade-up">
          <p className="eyebrow">Step 1 of 4 · 目标</p>
          <h2 className="h2">你想去哪？</h2>
          <p className="sub">选择目标考试 / 阶段，我们按需配置词库与成长路径。</p>
          <div className="axis-note">
            <span className="ico"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4l2.5 2.5" /></svg></span>
            <p><b>目标 = 你想去哪</b>（终点星系）；<b>能力档 = 你现在在哪</b>（下一步定级得出）。初中 / 高中既能当起点，也能设为目标。</p>
          </div>
          <div className="goal-grid">
            {GOALS.map(g => {
              const sel = s.goal === g.id; const badge = g.kind === 'free' ? '不限' : g.cefr
              return <button key={g.id} className={`goal-card press${g.kind === 'free' ? ' span2' : ''} ${sel ? 'sel' : ''}`} style={sel ? { borderColor: g.color, background: g.color + '0f' } : undefined} onClick={() => pickGoal(g.id)}>
                <span className="gc-main"><span className="zh" style={{ color: g.color }}>{g.zh}</span><span className="en">{g.en}</span></span>
                {g.kind === 'free' && <span className="gc-desc">不锁定考试目标 · 在「我的星云」随兴趣自由生长</span>}
                <span className="gc-badge" style={sel ? { background: g.color, borderColor: g.color, color: '#fff' } : undefined}>
                  <span className="gc-cefr">{badge}</span>
                  <svg className="gc-check" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
              </button>
            })}
          </div>
          <div className="step-foot"><button className="cta press" disabled={!s.goal} onClick={() => go('path')}>下一步 →</button></div>
        </div>
      case 'path':
        return <div className="fade-up">
          <p className="eyebrow">Step 2 of 4 · 学习方式</p>
          <h2 className="h2">你想怎么学？</h2>
          <p className="sub">这一步的选择会写进你的「定制方案」，驱动每日活动配比。</p>
          <div className="stack">
            {PATHS.map(p => <button key={p.id} className={`opt press ${s.path === p.id ? 'sel' : ''}`} onClick={() => pickPath(p.id)}>
              <Svg className="oico" html={p.icon} />
              <span><span className="ttl">{p.zh}</span><span className="desc">{p.desc}</span></span>
              <span className="opt-radio"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></span>
            </button>)}
          </div>
          <div className="step-foot"><button className="cta press" disabled={!s.path} onClick={() => go('channel')}>下一步 →</button></div>
        </div>
      case 'channel':
        return <div className="fade-up">
          <p className="eyebrow">Step 3 of 4 · 定级方式</p>
          <h2 className="h2">怎么确定你的水平？</h2>
          <p className="sub">两种方式都不到一分钟，结果可随时在「我的」页重新定级。</p>
          <div className="stack">
            <button className="chan primary press" onClick={() => startTest()}><span className="ct">快速测评 <span className="badge">约 1 分钟</span></span><span className="cd">认词网格 + 释义确认，含伪词校准，更准地锁定能力档。</span></button>
            <button className="chan press" onClick={() => go('pick')}><span className="ct">我知道我的水平</span><span className="cd">直接从初中→SAT 七个能力档里选。</span></button>
          </div>
        </div>
      case 'sweep': {
        const first = s.round === 0
        return <div className="fade-up">
          <p className="eyebrow">快速测评 · 第 {s.round + 1} 组 · {first ? '广度认词' : '边界精测'}</p>
          <h2 className="h2">勾选你认识的词</h2>
          <p className="sub">{first ? <>勾选你<b>至少知道一个意思</b>的词，不确定就留空。</> : '再测你水平附近的一组，缩小不确定度。'}里面混了<b>不存在的词</b>，别硬猜。</p>
          {first && <div className="mode-toggle"><button className={s.testMode === '快' ? 'on' : ''} onClick={() => setTestMode('快')}>快 · ~1 分钟</button><button className={s.testMode === '准' ? 'on' : ''} onClick={() => setTestMode('准')}>准 · 自适应多测</button></div>}
          {!first && <div className="se-line">已测 {s.round} 组 · 不确定度 SE ≈ {s.se}（阈值 {SE_THRESH[s.testMode]}，达标即停）</div>}
          <div className="grid-words">{s.sweepItems.map((it, i) => <button key={i} className={`gw press ${s.gridSel.has(i) ? 'on' : ''}`} onClick={() => toggleKnown(i)}>{it.word}</button>)}</div>
          <div className="step-foot"><button className="cta press" onClick={() => submitSweep()}>提交本组（已选 {s.gridSel.size}）→</button></div>
        </div>
      }
      case 'verify': {
        const q = s.verifyQ[s.vIdx]; if (!q) return null
        return <div className="fade-up">
          <p className="eyebrow">快速测评 · 释义确认</p>
          <h2 className="h2">「{q.word}」是什么意思？</h2>
          <p className="sub">凭真实理解选择，验证识别结果。（{s.vIdx + 1}/{s.verifyQ.length}）</p>
          <div className="vopts">{q.choices.map((o, k) => <button key={k} className="vopt press" onClick={() => answerVerify(k)}>{o}<span className="vkey">{k + 1}</span></button>)}</div>
          <p className="kbd-hint">键盘：1–{q.choices.length} 选择</p>
        </div>
      }
      case 'pick':
        return <div className="fade-up">
          <p className="eyebrow">直选 · 七个能力档</p>
          <h2 className="h2">你的水平在哪一档？</h2>
          <p className="sub">与词库七档对齐，之后可随时在「我的」页重新定级。</p>
          <div className="stack" style={{ gap: 9 }}>
            {LEVELS.map(l => <button key={l.level} className={`lvl press ${s.level === l.level && s.channel === 'pick' ? 'sel' : ''}`} onClick={() => pickLevel(l.level)}>
              <span className="num">{l.level}</span>
              <span style={{ flex: 1, minWidth: 0 }}><span className="lz">{l.zh}</span><span className="ld">{l.desc}</span></span>
              <span className="lw">{l.wordCount.toLocaleString()} 词</span>
            </button>)}
          </div>
        </div>
      case 'result':
        return renderResult()
      default:
        return null
    }
  }

  function renderResult(): ReactNode {
    const def = levelDef(s.level)
    const goal = GOALS.find(g => g.id === s.goal) || GOALS[2]
    const path = pathDef(s.path || 'full') || PATHS[0]
    // 阶段3：应试考试日期 → 倒计时推荐；其余路线按节奏推荐
    const isExam = (s.path || 'full') === 'exam'
    const examDays = isExam && s.examDate ? daysTo(s.examDate) : null
    const recDaily = isExam ? (examDays != null ? suggestDaily(examDays) : null) : (PATH_REC[s.path || 'full'] ?? 12)
    const BAND_GAL = [{ nm: '初中', band: 1 }, { nm: '高中', band: 2 }, { nm: '四级', band: 3 }, { nm: '六级', band: 4 }, { nm: '考研', band: 5 }, { nm: '托福', band: 6 }, { nm: 'SAT', band: 7 }]
    const startBand = s.level
    const targetBand = goal.kind === 'band' ? goal.band : null
    const lo = targetBand !== null ? Math.min(startBand, targetBand) : startBand
    const hi = targetBand !== null ? Math.max(startBand, targetBand) : startBand
    const pct = (i: number) => i / 6 * 100
    const crossed = targetBand !== null ? Math.abs(targetBand - startBand) : 0
    let capText: ReactNode, themeNode: ReactNode = null, periodVal: string
    if (goal.kind === 'band') {
      const tgtDef = LEVELS.find(l => l.level === targetBand)!; periodVal = periodText(tgtDef.wordCount, s.dailyGoal)
      if (targetBand! > startBand) capText = <>从 <b>{def.zh}</b> 出发，跨越 <b>{crossed}</b> 座星系抵达 <b>{goal.zh}</b>。</>
      else if (targetBand! < startBand) capText = <>你已超过 <b>{goal.zh}</b> 档，将以查漏巩固的方式回扫该星系。</>
      else capText = <>你的能力档正好落在目标 <b>{goal.zh}</b> 上 —— 就地深耕。</>
    } else if (goal.kind === 'theme') {
      periodVal = periodText(4200, s.dailyGoal)
      capText = <>从 <b>{def.zh}</b> 出发，进入 <b>雅思主题星系</b> 专项突破。</>
      themeNode = <div className="theme-node"><span className="star">✦</span><span><span className="tt">雅思 IELTS · 主题星系</span><span className="td">不在等级带上，按场景 / 题型组织</span></span></div>
    } else {
      periodVal = '持续 · 无固定终点'
      capText = <>没有强目标 —— 在 <b>「我的」星云</b> 自由探索，随兴趣生长。</>
      themeNode = <div className="theme-node"><span className="star">✦</span><span><span className="tt">我的星云 · 自由探索</span><span className="td">按你点亮的词自然生长</span></span></div>
    }
    const sRow = (ico: string, k: string, v: ReactNode) => <div className="srow"><span className="sk"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: ICON[ico] }} />{k}</span><span className="sv">{v}</span></div>

    return <div className="fade-up">
      <p className="eyebrow">为你定制 · 测试完成</p>
      <h2 className="h2">这是你的成长方案</h2>
      <div className="res-card"><div className="zh">{def.zh}</div><div className="meta">能力档 Level {s.level} · {def.cefr}</div><div className="wl">该档词库</div><div className="wn">{def.wordCount.toLocaleString()} 词</div></div>

      {/* D3：词汇量反馈卡（界面优化17）— 用 CAT 估算 s.vocabEst；目标考试给差距 */}
      <div style={{ marginTop: 12 }}>
        <VocabEstimateCard data={buildVocabCard(
          s.level, 0,
          goal.kind === 'band' && targetBand ? { level: targetBand, examName: goal.zh } : undefined,
          s.vocabEst,
        )} />
      </div>

      {s.channel === 'test' && s.bandRates && (() => {
        const names = ['', '初中', '高中', '四级', '六级', '考研', '托福', 'SAT']
        const cc = ({ 高: 'hi', 中: 'mid', 低: 'lo' } as Record<string, string>)[s.confidence] || 'hi'
        const vc = s.vResults.filter(r => r.correct).length; const faPct = Math.round((s.fa || 0) * 100)
        const rates = s.bandRates
        return <details className="evidence"><summary>测评依据 · 置信度 <b className={`conf-${cc}`}>{s.confidence}</b></summary>
          <div className="ev-body">
            <div className="ev-cap"><b>猜测校正后</b>各档认词率 (hit−FA)/(1−FA)；跨过 50% 的最高档 = 能力档</div>
            {[1, 2, 3, 4, 5, 6, 7].map(b => { const r = Math.round((rates[b] || 0) * 100); const on = b === s.level; return <div key={b} className="ev-row"><span className={`ev-nm ${on ? 'on' : ''}`}>{names[b]}</span><span className="ev-bar"><i style={{ width: `${Math.max(r, 3)}%`, ...(on ? { background: 'var(--gold-ink)' } : {}) }} /></span><span className={`ev-pct ${on ? 'on' : ''}`}>{r}%</span></div> })}
            <div className="ev-foot">估算词汇量 <b>≈ {s.vocabEst.toLocaleString()} 词</b> · 释义确认 <b>{vc}/{s.vResults.length}</b> 正确 · 伪词误选 <b>{faPct}%</b>
              <div className="ev-foot2">自适应 <b>{s.round}</b> 组 · 能力 θ <b>{s.theta}</b> · 不确定度 SE <b>{s.se}</b>（越低越准）</div>
            </div>
          </div>
        </details>
      })()}

      <div className="growth">
        <div className="gh">成长路径 <span className="pill">起点 → 目标</span></div>
        <p className="gcap">{capText}</p>
        <div className="track">
          <div className="rail" />
          {targetBand !== null && hi > lo && <div className="rail-fill" style={{ left: `calc(12px + (100% - 24px)*${pct(lo - 1) / 100})`, width: `calc((100% - 24px)*${(pct(hi - 1) - pct(lo - 1)) / 100})` }} />}
          {BAND_GAL.map(st => {
            let cls = ''; if (st.band === startBand) cls = 'start'; else if (targetBand !== null && st.band === targetBand) cls = 'target'; else if (targetBand !== null && st.band > lo && st.band < hi) cls = 'between'
            const flag = st.band === startBand ? '你在这' : (targetBand !== null && st.band === targetBand ? '目标' : '')
            return <div key={st.band} className={`station ${cls}`}>{flag && <span className="flag">{flag}</span>}<span className="dot" /><span className="nm">{st.nm}</span></div>
          })}
        </div>
        {themeNode}
      </div>

      <div className="summary">
        {sRow('target', '目标', <span className="hl">{goal.zh}</span>)}
        {sRow('level', '当前能力档', <>{def.zh} · {def.cefr}</>)}
        {sRow('words', '每日新词', <>{s.dailyGoal} 词</>)}
        {sRow('path', '学习方式', <span className="hl">{path.zh}</span>)}
        {sRow('clock', '预计周期', <>{periodVal}</>)}
      </div>

      <div className="mix">
        <div className="mix-h"><span className="hl">{path.zh}</span> · 今日学习配比预览</div>
        <div className="mix-chips">{pathMixChips(path.id, s.dailyGoal).map((t, i) => <span key={i} className="mix-chip">{t}</span>)}</div>
      </div>

      <div className="daily">
        <div className="dl">{isExam ? '你的考试什么时候？' : '每天学多少？'} <span className="dl-sub">每天约 <b>{estMin(s.dailyGoal)}</b> 分钟</span></div>

        {/* 应试：考试日期 → 倒计时推荐每日量 */}
        {isExam && (
          <div className="custom-goal" style={{ marginBottom: 12 }}>
            <div className="cg-row">
              <input className="cg-input" style={{ width: 'auto' }} type="date" value={s.examDate} onChange={e => setExamDate(e.target.value)} />
              {examDays != null && <span className="cg-est">距 {goal.zh} 考试 <b>{examDays}</b> 天 · 建议每日 <b>{recDaily}</b> 词</span>}
            </div>
          </div>
        )}
        {!isExam && <div className="dl-sub" style={{ display: 'block', margin: '2px 0 8px' }}>按「{path.zh}」节奏推荐 <b>{recDaily}</b> 词 / 天，可自定义</div>}

        <div className="chips">
          {GOAL_DAILY.map(g => <button key={g} className={`chip press ${s.dailyGoal === g && !s.custom ? 'sel' : ''}`} onClick={() => setDaily(g)}>{g} 词</button>)}
          {recDaily != null && !GOAL_DAILY.includes(recDaily) && <button className={`chip press ${s.dailyGoal === recDaily && !s.custom ? 'sel' : ''}`} onClick={() => setDaily(recDaily)}>建议 {recDaily}</button>}
          <button className={`chip press ${s.custom ? 'sel' : ''}`} onClick={() => setCustom()}>自定义</button>
        </div>
        {s.custom && <div className="custom-goal">
          <div className="cg-row">
            <input className="cg-input" type="number" min={1} max={999} value={s.dailyGoal} inputMode="numeric" onChange={e => liveDaily(e.target.value)} />
            <span className="cg-unit">词 / 天</span><span className="cg-est">可填 1–999</span>
          </div>
          <input className="cg-range" type="range" min={5} max={200} step={1} value={Math.min(200, s.dailyGoal)} style={{ background: `linear-gradient(90deg,var(--teal-ink) ${rangePct(s.dailyGoal)}%,var(--line) ${rangePct(s.dailyGoal)}%)` }} onChange={e => liveDaily(e.target.value)} />
          <div className="cg-scale"><span>5</span><span>轻松</span><span>标准</span><span>强化</span><span>200+</span></div>
        </div>}
      </div>

      <button className="cta press" onClick={finish}>开始学习 →</button>
    </div>
  }

  const cur = SEG_OF[s.step]
  return (
    <div className="theme-light ob-v2">
      <header className="ob-head">
        <span className="brand">词渊 <em>Lexiverse</em></span>
        <button className="skip" onClick={skip}>跳过设置</button>
      </header>
      <div className="progress">
        {PROG.map((p, i) => { const done = i < cur, isCur = i === cur, clickable = i < cur; return <div key={p} className={`seg ${done ? 'done' : ''} ${isCur ? 'cur' : ''} ${clickable ? 'clickable' : ''}`} onClick={clickable ? () => jumpTo(i) : undefined} /> })}
      </div>
      <div className="backrow">
        {s.step !== 'goal' && <button className="backbtn press" onClick={back}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>上一步</button>}
      </div>
      <main className="ob-main">{renderStep()}</main>
    </div>
  )
}
