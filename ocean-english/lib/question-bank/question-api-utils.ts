const DEFINITION_TO_WORD_ALIASES = [
  'def_to_word',
  'definition_to_word',
  'zh_definition_to_word',
] as const

const QUESTION_FETCH_MULTIPLIER = 8
const QUESTION_FETCH_MAX_ROWS = 500

export interface QuestionFetchWindow {
  from: number
  to: number
}

export function getQuestionFetchWindow(limit: number): QuestionFetchWindow {
  const safeLimit = Math.max(1, Math.floor(Number.isFinite(limit) ? limit : 1))
  const size = Math.min(safeLimit * QUESTION_FETCH_MULTIPLIER, QUESTION_FETCH_MAX_ROWS)

  return { from: 0, to: size - 1 }
}

export function normalizeQuestionTypeForClient(type: string): string {
  return (DEFINITION_TO_WORD_ALIASES as readonly string[]).includes(type)
    ? 'def_to_word'
    : type
}

export function questionTypeAliases(type: string): string[] {
  const trimmed = type.trim()
  if (normalizeQuestionTypeForClient(trimmed) === 'def_to_word') {
    return [...DEFINITION_TO_WORD_ALIASES]
  }

  return [trimmed]
}

export function normalizeQuestionRowsForClient<T extends { type?: unknown }>(rows: readonly T[]): T[] {
  return rows.map((row) => {
    if (typeof row.type !== 'string') return row

    const normalizedType = normalizeQuestionTypeForClient(row.type)
    if (normalizedType === row.type) return row

    return { ...row, type: normalizedType } as T
  })
}
