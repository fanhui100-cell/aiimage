/** Phase 6F Motivation types (v2). */

export interface DailyMission {
  id: string
  title: string
  titleZh: string
  target: number
  progress: number
  reward: number       // LexiStar reward on completion
  completed: boolean
  completedAt?: string
}

export interface LexiStarLedgerEntry {
  id: string
  action: string
  reason: string
  points: number
  word?: string
  createdAt: string
}

export interface AchievementLite {
  id: string
  title: string
  titleZh: string
  description: string
  descriptionZh: string
  unlocked: boolean
  unlockedAt?: string
}

export interface DailyMissionProgress {
  litCount: number
  reviewCount: number
  pronunciationCount: number
}

export interface MotivationSnapshotV2 {
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
  dailyMissionProgress: DailyMissionProgress
  unlockedAchievements: string[]
}
