/** LexiStar level thresholds and calculation. */

const THRESHOLDS = [0, 50, 150, 300, 600] as const

export interface LevelInfo {
  level: number
  progress: number      // 0..1 within current level band
  nextLevelTarget: number
}

export function calculateLevel(lexiStar: number): LevelInfo {
  for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
    if (lexiStar >= THRESHOLDS[i]) {
      const level = i + 1
      const bandStart = THRESHOLDS[i]
      const bandEnd: number = i + 1 < THRESHOLDS.length ? THRESHOLDS[i + 1] : THRESHOLDS[THRESHOLDS.length - 1] * 2
      const progress = Math.min(1, (lexiStar - bandStart) / (bandEnd - bandStart))
      return { level, progress, nextLevelTarget: bandEnd }
    }
  }
  return { level: 1, progress: 0, nextLevelTarget: 50 }
}
