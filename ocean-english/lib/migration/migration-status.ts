/**
 * Helpers for reading/writing the lexiocean-migration-status localStorage key.
 * Safe to call in any client context — never throws.
 */

import type { MigrationStatusRecord, MigrationStatusValue, MigratedCounts } from './migration-types'

export const MIGRATION_STATUS_KEY = 'lexiocean-migration-status'

const EMPTY_COUNTS: MigratedCounts = {
  savedWords: 0,
  reviewWords: 0,
  wrongAnswers: 0,
  quizSessions: 0,
  quizAttempts: 0,
  scanDocuments: 0,
  quizDrafts: 0,
  studyNotes: 0,
  chatMessages: 0,
}

const DEFAULT_STATUS: MigrationStatusRecord = {
  version: 1,
  status: 'not_started',
  completedAt: null,
  lastAttemptAt: null,
  migratedCounts: { ...EMPTY_COUNTS },
  errors: [],
}

export function readMigrationStatus(): MigrationStatusRecord {
  try {
    const raw = localStorage.getItem(MIGRATION_STATUS_KEY)
    if (!raw) return { ...DEFAULT_STATUS, migratedCounts: { ...EMPTY_COUNTS } }
    const parsed = JSON.parse(raw) as Partial<MigrationStatusRecord>
    return {
      ...DEFAULT_STATUS,
      ...parsed,
      migratedCounts: { ...EMPTY_COUNTS, ...(parsed.migratedCounts ?? {}) },
    }
  } catch {
    return { ...DEFAULT_STATUS, migratedCounts: { ...EMPTY_COUNTS } }
  }
}

export function writeMigrationStatus(record: MigrationStatusRecord): void {
  try {
    localStorage.setItem(MIGRATION_STATUS_KEY, JSON.stringify(record))
  } catch {
    // localStorage quota exceeded or SSR — silently ignore
  }
}

export function setMigrationCompleted(counts: MigratedCounts): void {
  const current = readMigrationStatus()
  writeMigrationStatus({
    ...current,
    status: 'completed',
    completedAt: new Date().toISOString(),
    lastAttemptAt: new Date().toISOString(),
    migratedCounts: counts,
    errors: [],
  })
}

export function setMigrationFailed(errors: string[]): void {
  const current = readMigrationStatus()
  writeMigrationStatus({
    ...current,
    status: 'failed',
    lastAttemptAt: new Date().toISOString(),
    errors,
  })
}

export function setMigrationDismissed(): void {
  const current = readMigrationStatus()
  writeMigrationStatus({
    ...current,
    status: 'dismissed',
    lastAttemptAt: new Date().toISOString(),
  })
}

export function setMigrationPreviewed(): void {
  const current = readMigrationStatus()
  if (current.status === 'not_started') {
    writeMigrationStatus({
      ...current,
      status: 'previewed',
      lastAttemptAt: new Date().toISOString(),
    })
  }
}

export function resetMigrationStatus(
  to: MigrationStatusValue = 'not_started',
): void {
  writeMigrationStatus({
    ...DEFAULT_STATUS,
    migratedCounts: { ...EMPTY_COUNTS },
    status: to,
  })
}
