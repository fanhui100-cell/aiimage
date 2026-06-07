/**
 * Companion interface types — Phase 6F reserve.
 *
 * These types define the event bus and message catalog that future
 * CatPet / Lumi Cat integrations can subscribe to.
 * Phase 6F: no 3D pet rendered; events fire into the bus only.
 * Phase 6G+: CatPet subscribes via onCompanionEvent().
 */

export type CompanionEventType =
  | 'word_opened'
  | 'node_lit'
  | 'pronunciation_played'
  | 'word_added_to_review'
  | 'quiz_started'
  | 'daily_mission_completed'
  | 'achievement_unlocked'
  | 'streak_kept'
  | 'error_encouragement'

export interface CompanionEventPayload {
  word?: string
  missionId?: string
  achievementId?: string
  points?: number
}

export type CompanionMessageCategory =
  | 'welcome'
  | 'pronunciation'
  | 'addToReview'
  | 'quiz'
  | 'dailyMission'
  | 'achievement'
  | 'streak'
  | 'idle'
  | 'mistake'
  | 'fallback'

export interface CompanionMessage {
  en: string
  zh: string
  category: CompanionMessageCategory
}

export type CompanionListener = (payload: CompanionEventPayload) => void
