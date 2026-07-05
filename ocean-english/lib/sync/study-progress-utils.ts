export interface StudyProgressPayload {
  totalWordsLearned?: number
  currentStreak?: number
  longestStreak?: number
  totalXp?: number
  lastStudyDate?: string | null
  levelProgress?: Record<string, number>
}

export interface StudyProgressDbRow {
  total_words_learned?: number | null
  current_streak?: number | null
  longest_streak?: number | null
  total_xp?: number | null
  last_study_date?: string | null
  level_progress?: Record<string, number> | null
  week_xp?: number | null
  week_start?: string | null
}

export interface StudyProgressUpsertRow {
  user_id: string
  total_words_learned: number
  current_streak: number
  longest_streak: number
  total_xp: number
  last_study_date: string | null
  level_progress: Record<string, number>
  week_xp: number
  week_start: string
  updated_at: string
}

/** 本周一（UTC，YYYY-MM-DD）——周榜 week_start 基准 */
export function mondayISO(d: Date): string {
  const x = new Date(d)
  const dow = (x.getUTCDay() + 6) % 7 // 0 = 周一
  x.setUTCDate(x.getUTCDate() - dow)
  return x.toISOString().slice(0, 10)
}

function patchNumber(
  nextValue: number | undefined,
  currentValue: number | null | undefined,
  fallback: number,
): number {
  return nextValue ?? currentValue ?? fallback
}

export function buildStudyProgressUpsertRow(
  userId: string,
  body: StudyProgressPayload,
  existing?: StudyProgressDbRow | null,
  now = new Date(),
): StudyProgressUpsertRow {
  const total_xp = patchNumber(body.totalXp, existing?.total_xp, 0)
  // 周榜：week_xp = 本周内 total_xp 累计增量；跨周（week_start 变化）归零重计。
  // 首次同步（无 existing.total_xp）不把历史 XP 计入本周，避免新设备一次性灌满周榜。
  const weekStart = mondayISO(now)
  const sameWeek = existing?.week_start === weekStart
  const delta = existing?.total_xp == null ? 0 : Math.max(0, total_xp - existing.total_xp)
  const week_xp = sameWeek ? (existing?.week_xp ?? 0) + delta : delta
  return {
    user_id: userId,
    total_words_learned: patchNumber(body.totalWordsLearned, existing?.total_words_learned, 0),
    current_streak: patchNumber(body.currentStreak, existing?.current_streak, 0),
    longest_streak: patchNumber(body.longestStreak, existing?.longest_streak, 0),
    total_xp,
    last_study_date: body.lastStudyDate ?? existing?.last_study_date ?? null,
    level_progress: body.levelProgress ?? existing?.level_progress ?? {},
    week_xp,
    week_start: weekStart,
    updated_at: now.toISOString(),
  }
}
