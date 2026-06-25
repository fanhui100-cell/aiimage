'use client'
/* useV2DailyPlan — POST /api/daily-plan（Phase 13 今日计划）。词数据在客户端 lexiStore，
   由调用方把 dueWords/weakWords/recentMistakes/goal/examTarget 传入；服务端在已登录时用
   v2 skill_states 覆盖弱项（source==='v2'），否则纯客户端产出（source==='client'）。
   叠加层：UI 据 source==='v2' 决定是否展示「服务端编排」卡，否则保留本地静态编排，不替换。 */
import { useEffect, useState } from 'react'

export interface V2PlanCard {
  type: 'word_review' | 'new_words' | 'exam_task' | 'mistake_fix' | 'output' | 'mock_review'
  titleZh: string
  reason: string
  estimatedMinutes: number
  priority: number
  payload?: Record<string, unknown>
}
export interface V2DailyPlanInput {
  dueWords: { id: string; word: string }[]
  weakWords: { id: string; word: string }[]
  recentMistakes: { wordId?: string; errorType?: string; taskType?: string }[]
  goal: { dailyGoal: number; goals: string[] }
  examTarget?: string | null
  mockPending?: boolean
}
export interface V2DailyPlan {
  loading: boolean
  source: 'client' | 'v2'
  cards: V2PlanCard[]
  warnings: string[]
}

const EMPTY: V2DailyPlan = { loading: true, source: 'client', cards: [], warnings: [] }

/** 输入签名：仅以「会改变计划」的粗粒度信号为依赖，避免每次词变动都重拉。 */
function sig(i: V2DailyPlanInput): string {
  return [i.dueWords.length, i.weakWords.length, i.recentMistakes.length, i.goal.dailyGoal, i.examTarget ?? '', i.mockPending ? 1 : 0].join('|')
}

export function useV2DailyPlan(input: V2DailyPlanInput): V2DailyPlan {
  const [state, setState] = useState<V2DailyPlan>(EMPTY)
  const key = sig(input)
  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true }))
    fetch('/api/daily-plan', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: Record<string, unknown> | null) => {
        if (!alive) return
        if (!j || j.ok !== true) { setState({ ...EMPTY, loading: false }); return }
        setState({
          loading: false,
          source: j.source === 'v2' ? 'v2' : 'client',
          cards: Array.isArray(j.cards) ? (j.cards as V2PlanCard[]) : [],
          warnings: Array.isArray(j.warnings) ? (j.warnings as string[]) : [],
        })
      })
      .catch(() => { if (alive) setState({ ...EMPTY, loading: false }) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return state
}

/** 计划卡类型 → 图标色/中文兜底（titleZh 已由引擎给出，这里仅补类型色）。 */
export const PLAN_CARD_TONE: Record<V2PlanCard['type'], string> = {
  word_review: 'var(--blue-ink)',
  new_words: 'var(--teal-ink)',
  exam_task: 'var(--gold-ink)',
  mistake_fix: 'var(--rose-ink)',
  output: 'var(--violet-ink, var(--teal-ink))',
  mock_review: 'var(--gold-ink)',
}
