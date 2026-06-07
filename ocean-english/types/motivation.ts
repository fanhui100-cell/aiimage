export type LexiStarReason =
  | 'pronunciation'
  | 'review'
  | 'quiz'
  | 'nodeOpen'
  | 'achievement'
  | 'mission'

/** Compact snapshot exposed to UI (HUD, Lumi bubble). */
export interface MotivationSnapshot {
  lexiStar: number
  litNodeCount: number
  reviewActionCount: number
  pronunciationPlayCount: number
  quizActionCount: number
  graphSearchCount: number
  currentLevel: number
  levelProgress: number       // 0..1
  nextLevelTarget: number
  lastCompanionMessage: string
}
