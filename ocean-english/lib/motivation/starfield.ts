/**
 * 点亮星河 — brightness mapping + milestone definitions
 * mastery → screen brightness, forgetting → dim, review → maintain
 */

/** Map a mastery score (0–1) to a star brightness value (0–1). */
export function masteryToBrightness(mastery: number): number {
  if (mastery <= 0) return 0.06          // locked: ember glow only
  if (mastery < 0.25) return 0.20 + mastery * 1.2
  if (mastery < 0.75) return 0.50 + (mastery - 0.25) * 0.8
  return Math.min(1.0, 0.90 + (mastery - 0.75) * 0.4)
}

export interface Milestone {
  id: string
  threshold: number     // total lit-word count
  labelZh: string
  labelEn: string
  color: string
}

export const MILESTONES: Milestone[] = [
  { id: 'first_light',   threshold: 1,    labelZh: '第一颗星点亮', labelEn: 'First Star Lit',   color: '#4fe6ce' },
  { id: 'ten_stars',     threshold: 10,   labelZh: '十颗星熠熠',  labelEn: '10 Stars Shining', color: '#f1c879' },
  { id: 'fifty_stars',   threshold: 50,   labelZh: '五十星河',    labelEn: '50 Stars Deep',    color: '#f1c879' },
  { id: 'century',       threshold: 100,  labelZh: '百词成海',    labelEn: '100 Words Lit',    color: '#ff8a72' },
  { id: 'five_hundred',  threshold: 500,  labelZh: '五百词汇宇宙', labelEn: '500-Word Universe', color: '#ff8a72' },
  { id: 'thousand',      threshold: 1000, labelZh: '千词成星河',  labelEn: '1000 Stars',       color: '#8b5cf6' },
]

/** Return any milestone crossed when going from prevCount → nextCount. */
export function checkMilestoneCrossed(prevCount: number, nextCount: number): Milestone | null {
  for (const m of MILESTONES) {
    if (prevCount < m.threshold && nextCount >= m.threshold) return m
  }
  return null
}
