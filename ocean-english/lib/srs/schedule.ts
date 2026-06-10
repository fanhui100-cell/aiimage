/* ============================================================================
   lib/srs/schedule.ts — 真 SRS 调度（纯函数，方便测试）
   四档 SM-2。lexiStore 的复习/测验路径与 ReviewScreen 的按钮共用这一份。
   ============================================================================ */

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy'

export interface SrsState {
  interval: number
  ease: number
  streak: number
}

const DAY = 86_400_000
const HOUR = 60 * 60 * 1000

/**
 * 给定当前调度状态与本次评分，算出下一次调度。
 * - again：忘了，重置连对，1 小时后当日回炉
 * - hard/good/easy：连对 +1，间隔按倍率增长（首次 1 天、第二次 3 天、之后按 ease）
 */
export function gradeSrs(s: SrsState, g: ReviewGrade): SrsState & { nextReviewAt: number } {
  const now = Date.now()

  if (g === 'again') {
    return {
      interval: 0,
      ease: Math.max(1.3, s.ease - 0.2),
      streak: 0,
      nextReviewAt: now + HOUR,
    }
  }

  const streak = s.streak + 1
  const base = s.interval || 1
  const factor = g === 'hard' ? 1.2 : g === 'good' ? s.ease : s.ease * 1.3
  const ease =
    g === 'hard' ? Math.max(1.3, s.ease - 0.15)
    : g === 'easy' ? Math.min(2.9, s.ease + 0.15)
    : s.ease
  // 首次复习固定 1 天，第二次 3 天，之后按倍率走
  const interval =
    streak === 1 ? 1
    : streak === 2 ? 3
    : Math.min(180, Math.round(base * factor))

  return { interval, ease, streak, nextReviewAt: now + interval * DAY }
}

/** 给 UI 用：四档各自的预览间隔（印在按钮上的真实数字）。 */
export function previewIntervals(s: SrsState): Record<ReviewGrade, string> {
  return {
    again: '1小时',
    hard: `${Math.max(1, Math.round((s.interval || 1) * 1.2))}天`,
    good: `${s.streak === 0 ? 1 : s.streak === 1 ? 3 : Math.round((s.interval || 1) * s.ease)}天`,
    easy: `${Math.max(2, Math.round((s.interval || 1) * s.ease * 1.3))}天`,
  }
}

/** 「已掌握」的统一判定：连对 ≥ 3 且 interval ≥ 16 天。 */
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
