'use client'
/* useV2Diagnostics — 拉取 GET /api/diagnostics（v2 服务端学习闭环：真实作答聚合的技能掌握度
   + 置信度 + 错误直方图 + 分考试正确率）。仅在登录且有 v2 作答时 source==='real'；否则 'empty'。
   叠加层：UI 据 source==='real' 决定是否渲染 v2 面板，与现有 lexiStore 体验并存、不替换。 */
import { useEffect, useState } from 'react'

export interface V2SkillState {
  examId: string
  skillKey: string
  mastery: number          // 0..1（EMA）
  attempts: number
  confidence: 'insufficient' | 'low' | 'medium' | 'high'
  isEstimate: boolean      // confidence!=='high' → UI 标「估算·样本不足」，不展示精确分
}
export interface V2ExamAccuracy { examId: string; attempts: number; accuracy: number; isEstimate: boolean }
export interface V2ErrorBucket { errorType: string; count: number }

export interface V2Diagnostics {
  loading: boolean
  source: 'real' | 'empty'
  skill: V2SkillState[]
  weakSkills: V2SkillState[]
  exam: V2ExamAccuracy[]
  errorHistogram: V2ErrorBucket[]
  note?: string
}

const EMPTY: V2Diagnostics = { loading: true, source: 'empty', skill: [], weakSkills: [], exam: [], errorHistogram: [] }

export function useV2Diagnostics(): V2Diagnostics {
  const [state, setState] = useState<V2Diagnostics>(EMPTY)
  useEffect(() => {
    let alive = true
    fetch('/api/diagnostics')
      .then((r) => (r.ok ? r.json() : null))
      .then((j: Record<string, unknown> | null) => {
        if (!alive) return
        if (!j || j.ok !== true) { setState({ ...EMPTY, loading: false }); return }
        setState({
          loading: false,
          source: j.source === 'real' ? 'real' : 'empty',
          skill: Array.isArray(j.skill) ? (j.skill as V2SkillState[]) : [],
          weakSkills: Array.isArray(j.weakSkills) ? (j.weakSkills as V2SkillState[]) : [],
          exam: Array.isArray(j.exam) ? (j.exam as V2ExamAccuracy[]) : [],
          errorHistogram: Array.isArray(j.errorHistogram) ? (j.errorHistogram as V2ErrorBucket[]) : [],
          note: typeof j.note === 'string' ? j.note : undefined,
        })
      })
      .catch(() => { if (alive) setState({ ...EMPTY, loading: false }) })
    return () => { alive = false }
  }, [])
  return state
}

/** 置信度 → 中文标签（UI 徽章用）。 */
export const CONFIDENCE_ZH: Record<V2SkillState['confidence'], string> = {
  insufficient: '样本极少', low: '低置信', medium: '中置信', high: '高置信',
}
/** skillKey → 可读中文（启发式；无映射则原样）。 */
export function skillKeyZh(k: string): string {
  const map: Record<string, string> = {
    reading_comprehension: '阅读理解', listening_comprehension: '听力理解', banked_cloze: '选词填空',
    grammar_fill: '语法填空', cloze_passage: '完形填空', seven_select: '七选五', para_match: '段落匹配',
    essay_writing: '写作', applied_writing: '应用文', continuation_writing: '读后续写',
    translation_zh_en: '汉译英', translation_en_zh: '英译汉', vocab_in_context: '语境词义',
    logical_cohesion: '逻辑衔接', cohesion: '衔接', inference: '推断', listening_inference: '听力推断',
  }
  return map[k] ?? k
}
