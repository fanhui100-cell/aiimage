/* 7 状态元信息 — 唯一来源，从 prototype/store.jsx 1:1 移植 */

export type WordState =
  | 'unknown' | 'recommended' | 'learning'
  | 'review'  | 'weak'        | 'mastered' | 'locked'

export const STATE_ORDER: WordState[] = [
  'unknown', 'recommended', 'learning', 'review', 'weak', 'mastered', 'locked',
]

export const STATE_META: Record<WordState, {
  zh: string; en: string; dark: string; light: string; desc: string
}> = {
  unknown:     { zh: '未学',  en: 'Unknown',     dark: '#7a8a9a', light: '#94a3ad', desc: '还没接触' },
  recommended: { zh: '推荐',  en: 'Recommended', dark: '#f1c879', light: '#b3781f', desc: '今日算法选中、该学' },
  learning:    { zh: '学习中', en: 'Learning',    dark: '#5b8bff', light: '#3b5bd9', desc: '已开始学、未稳固' },
  review:      { zh: '待复习', en: 'Review',      dark: '#ff9e4d', light: '#d2792f', desc: 'SRS 到期、该复习' },
  weak:        { zh: '薄弱',  en: 'Weak',        dark: '#ff6b9d', light: '#d4477e', desc: '做错过、易忘' },
  mastered:    { zh: '已掌握', en: 'Mastered',    dark: '#4fe6ce', light: '#0e8c7a', desc: '连续答对、稳固' },
  locked:      { zh: '静默',  en: 'Locked',      dark: '#3a4452', light: '#c4ccd2', desc: '未解锁' },
}

export const STATE_COLOR_LIGHT = Object.fromEntries(
  Object.entries(STATE_META).map(([k, v]) => [k, v.light])
) as Record<WordState, string>

export const STATE_COLOR_DARK = Object.fromEntries(
  Object.entries(STATE_META).map(([k, v]) => [k, v.dark])
) as Record<WordState, string>
