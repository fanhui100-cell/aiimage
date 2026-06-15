/* ============================================================================
   lib/srs/schedule.ts — FSRS 记忆调度（纯函数，方便测试）
   2.3：SM-2 → FSRS（对标墨墨「时序模型」）。在不改 store 字段的前提下，用现有
   {interval, ease, streak} 承载 FSRS 状态：interval = 稳定性 S(天)，ease = 难度旋钮
   （1.3-2.9，映射到 FSRS 难度 D 1-10）。复习按到期进行 → 取回率 R≈目标，故 (1-R)
   取常量；难度越低、上次间隔越短、本次评分越好 → 稳定性增长越多。
   四档评分接口与 lexiStore / ReviewScreen 完全不变。
   ============================================================================ */

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy'

export interface SrsState {
  interval: number
  ease: number
  streak: number
}

const DAY = 86_400_000
const HOUR = 60 * 60 * 1000

// FSRS-5 公开默认权重（取核心子集：初始稳定性 w0-3、难度 w4-6、稳定性更新 w8-16）
const W = [
  0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575,
  0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621,
]
const DECAY = -0.5
const R_TARGET = 0.9
const ONE_MINUS_R = 1 - R_TARGET   // 按到期复习 → R≈目标，(1-R) 视为常量
const MAX_INTERVAL = 365

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))
const gradeNum = (g: ReviewGrade): 1 | 2 | 3 | 4 => (g === 'again' ? 1 : g === 'hard' ? 2 : g === 'good' ? 3 : 4)

// ease(1.3-2.9) → FSRS 难度 D(1-10)：ease 越低越难
const diffOf = (ease: number) => clamp(11 - ((clamp(ease, 1.3, 2.9) - 1.3) / 1.6) * 9, 1, 10)

// R=0.9 时 interval 即等于稳定性；取整并夹界
const intervalFromStability = (S: number) => clamp(Math.round(S), 1, MAX_INTERVAL)

const initStability = (g: 1 | 2 | 3 | 4) => Math.max(0.5, W[g - 1])

function recallStability(S: number, D: number, g: 1 | 2 | 3 | 4): number {
  const hard = g === 2 ? W[15] : 1
  const easy = g === 4 ? W[16] : 1
  const inc = Math.exp(W[8]) * (11 - D) * Math.pow(S, -W[9]) * (Math.exp(W[10] * ONE_MINUS_R) - 1) * hard * easy
  return S * (1 + inc)
}

function lapseStability(S: number, D: number): number {
  const post = W[11] * Math.pow(D, -W[12]) * (Math.pow(S + 1, W[13]) - 1) * Math.exp(W[14] * ONE_MINUS_R)
  return Math.min(S, Math.max(0.5, post))   // 遗忘后稳定性不增
}

function nextEase(ease: number, g: ReviewGrade): number {
  const e = g === 'again' ? ease - 0.2 : g === 'hard' ? ease - 0.15 : g === 'easy' ? ease + 0.15 : ease
  return clamp(e, 1.3, 2.9)
}

/**
 * 给定当前调度状态与本次评分，算出下一次调度（FSRS）。
 * - again：遗忘 → 稳定性回落（post-lapse），连对清零，1 小时后当日回炉
 * - hard/good/easy：稳定性按难度/评分增长，间隔 = 新稳定性（天）
 */
export function gradeSrs(s: SrsState, g: ReviewGrade): SrsState & { nextReviewAt: number } {
  const now = Date.now()
  const ease = nextEase(s.ease, g)
  const D = diffOf(s.ease)                 // 用复习前难度算稳定性
  const first = !s.interval || s.streak === 0
  const g4 = gradeNum(g)

  if (g === 'again') {
    const S = first ? initStability(1) : lapseStability(s.interval || 1, D)
    return { interval: intervalFromStability(S), ease, streak: 0, nextReviewAt: now + HOUR }
  }

  const S = first ? initStability(g4) : recallStability(s.interval || 1, D, g4)
  const interval = intervalFromStability(S)
  return { interval, ease, streak: s.streak + 1, nextReviewAt: now + interval * DAY }
}

/** 给 UI 用：四档各自的预览间隔（印在按钮上的真实数字）。 */
export function previewIntervals(s: SrsState): Record<ReviewGrade, string> {
  const dayOf = (g: ReviewGrade) => `${gradeSrs(s, g).interval}天`
  return { again: '1小时', hard: dayOf('hard'), good: dayOf('good'), easy: dayOf('easy') }
}

/** 「已掌握」的统一判定：连对 ≥ 3 且 interval（稳定性）≥ 16 天。 */
export function isMastered(r: Pick<SrsState, 'streak' | 'interval'>): boolean {
  return r.streak >= 3 && r.interval >= 16
}

/** 评分对应的状态流转备注（写进 log）。 */
export const GRADE_NOTE: Record<ReviewGrade, string> = {
  again: '复习答错',
  hard: '复习勉强',
  good: '复习答对',
  easy: '复习轻松',
}
