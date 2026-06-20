import type { LearningLevel } from '@/types/learning'

export interface PreferencesPayload {
  level?: LearningLevel
  numericLevel?: number
  dailyGoal?: number
  uiLanguage?: string
}

export interface PreferencesDbRow {
  level?: LearningLevel | null
  numeric_level?: number | null
  daily_goal?: number | null
  ui_language?: string | null
}

export interface PreferencesUpsertRow {
  user_id: string
  level: LearningLevel | null
  numeric_level: number | null
  daily_goal: number
  ui_language: string
  updated_at: string
}

export function buildPreferencesUpsertRow(
  userId: string,
  body: PreferencesPayload,
  existing?: PreferencesDbRow | null,
  now = new Date(),
): PreferencesUpsertRow {
  return {
    user_id: userId,
    level: body.level ?? existing?.level ?? null,
    numeric_level: body.numericLevel ?? existing?.numeric_level ?? null,
    daily_goal: body.dailyGoal ?? existing?.daily_goal ?? 10,
    ui_language: body.uiLanguage ?? existing?.ui_language ?? 'bilingual',
    updated_at: now.toISOString(),
  }
}
