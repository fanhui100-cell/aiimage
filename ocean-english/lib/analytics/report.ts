/* ============================================================================
   lib/analytics/report.ts — 学习报告纯函数（Task 1.3）
   从 store 数据（words / history / level）算出报告页所需指标：词汇量估算、
   状态分布、记忆矩阵、SRS 间隔强度、跨维掌握、活动热力图。
   纯函数、无副作用、无运行时 @ 依赖（类型 import 在编译期擦除），便于单测。
   消费方：/report 页（D2）+ onboarding 结果页词汇量卡（D3）。
   ============================================================================ */
import type { WordState } from '@/lib/state-meta'
import type { WordEntry, DailyHistory } from '@/store/lexiStore'

const DAY = 86_400_000

// 镜像 lib/state-meta.ts 的 STATE_ORDER（仅本文件用，避免运行时 @ 依赖）
const ALL_STATES: WordState[] = [
  'unknown', 'recommended', 'learning', 'review', 'weak', 'mastered', 'locked',
]

// 累计词汇量基线（达到该档通常掌握的词量，含更低档）。估算口径、非精确测量。
const VOCAB_FLOOR: Record<number, number> = {
  1: 1500, 2: 3000, 3: 4500, 4: 6000, 5: 8000, 6: 11000, 7: 14000,
}
const LEVEL_NAMES: Record<number, string> = { 1: '初中', 2: '高中', 3: '四级', 4: '六级', 5: '考研', 6: '托福', 7: 'SAT' }
const lvName = (level: number) => LEVEL_NAMES[Math.max(1, Math.min(7, Math.round(level || 1)))] ?? '初学'

/** 估算词汇量 = 该档累计基线 + 应用内已掌握词数（粗估，结果页/复测展示用） */
export function estimateVocab(level: number, masteredCount: number): number {
  const lv = Math.max(1, Math.min(7, Math.round(level || 1)))
  return (VOCAB_FLOOR[lv] ?? 4500) + Math.max(0, masteredCount)
}

export interface MatrixPoint {
  word: string
  ease: number
  interval: number
  dueInDays: number          // <0 = 已过期待复习
  state: WordState
}

export interface IntervalBucket {
  interval: number           // SRS 间隔天数（1/3/7/16/35…）
  healthy: number            // mastered/review/learning 等健康词
  weak: number               // 薄弱词
}

export type SkillDim = 'recognize' | 'spell' | 'listen'

export interface DimStat {
  dim: SkillDim
  rate: number               // 命中率 0-100（含该维通过的活跃词 / 活跃词）
  gold: number               // 该维 + mastered（镀金）词数
  total: number              // 活跃词总数
}

export interface LearnReport {
  vocabEstimate: number
  levelName: string
  byState: Record<WordState, number>
  totals: { mastered: number; learning: number; due: number; active: number }
  matrix: MatrixPoint[]
  intervalBuckets: IntervalBucket[]
  dims: DimStat[]
  heatmap: Record<string, number>   // 日期(YYYY-MM-DD) → 当日活动数
}

export interface BuildReportInput {
  words: WordEntry[]
  history: DailyHistory
  level: number
  now?: number
}

export function buildReport(input: BuildReportInput): LearnReport {
  const { words, history, level, now = Date.now() } = input

  const byState = Object.fromEntries(ALL_STATES.map((s) => [s, 0])) as Record<WordState, number>
  for (const w of words) byState[w.state] = (byState[w.state] ?? 0) + 1

  const active = words.filter((w) => w.state !== 'locked' && w.state !== 'unknown')
  const mastered = byState.mastered
  const due = words.filter((w) => w.nextReviewAt != null && w.nextReviewAt <= now).length

  // 记忆矩阵：活跃词的 ease × interval 散点（前端画散点/网格）
  const matrix: MatrixPoint[] = active.map((w) => ({
    word: w.word,
    ease: Math.round((w.ease ?? 2.5) * 100) / 100,
    interval: w.interval ?? 0,
    dueInDays: w.nextReviewAt != null ? Math.round((w.nextReviewAt - now) / DAY) : 0,
    state: w.state,
  }))

  // SRS 间隔强度分布：每个 interval 桶内 健康 vs 薄弱（记忆强度可视化）
  const bucketMap = new Map<number, { healthy: number; weak: number }>()
  for (const w of active) {
    const iv = w.interval ?? 0
    const b = bucketMap.get(iv) ?? { healthy: 0, weak: 0 }
    if (w.state === 'weak') b.weak += 1
    else b.healthy += 1
    bucketMap.set(iv, b)
  }
  const intervalBuckets: IntervalBucket[] = [...bucketMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([interval, v]) => ({ interval, healthy: v.healthy, weak: v.weak }))

  // 跨维掌握（认/拼/听）：dims 字段统计
  const totalActive = active.length
  const dims: DimStat[] = (['recognize', 'spell', 'listen'] as SkillDim[]).map((dim) => {
    const hit = active.filter((w) => (w.dims ?? []).includes(dim)).length
    const gold = active.filter((w) => w.state === 'mastered' && (w.dims ?? []).includes(dim)).length
    return { dim, rate: totalActive ? Math.round((hit / totalActive) * 100) : 0, gold, total: totalActive }
  })

  // 活动热力图：history 日期 → 当日活动总数
  const heatmap: Record<string, number> = {}
  for (const [date, d] of Object.entries(history ?? {})) {
    heatmap[date] = (d?.learned ?? 0) + (d?.quizzed ?? 0) + (d?.reviewed ?? 0)
  }

  return {
    vocabEstimate: estimateVocab(level, mastered),
    levelName: lvName(level),
    byState,
    totals: { mastered, learning: byState.learning, due, active: active.length },
    matrix,
    intervalBuckets,
    dims,
    heatmap,
  }
}
