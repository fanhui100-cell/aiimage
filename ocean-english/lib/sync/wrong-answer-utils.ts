export interface WrongAnswerPayload {
  wordId: string
  word: string
  question: string
  userAnswer: string
  correctAnswer: string
  explanation: string
  timestamp: number
}

export interface WrongAnswerInsertRow {
  user_id: string
  word_id: string
  word: string
  question: string
  user_answer: string
  correct_answer: string
  explanation: string
  source: 'quiz' | 'scan'
  occurred_at: string
  dedupe_key: string
}

function isWrongAnswerPayload(value: unknown): value is WrongAnswerPayload {
  if (!value || typeof value !== 'object') return false
  const answer = value as Partial<WrongAnswerPayload>
  return Boolean(
    answer.wordId &&
      answer.question &&
      typeof answer.timestamp === 'number' &&
      Number.isFinite(answer.timestamp),
  )
}

function sourceFor(answer: WrongAnswerPayload): WrongAnswerInsertRow['source'] {
  return answer.wordId.startsWith('scan-') ? 'scan' : 'quiz'
}

function dedupeKeyFor(answer: WrongAnswerPayload): string {
  return `${sourceFor(answer)}:${answer.wordId}:${answer.timestamp}`
}

export function buildWrongAnswerRows(
  userId: string,
  answers: readonly unknown[],
): WrongAnswerInsertRow[] {
  const seen = new Set<string>()
  const rows: WrongAnswerInsertRow[] = []

  for (const answer of answers) {
    if (!isWrongAnswerPayload(answer)) continue

    const dedupeKey = dedupeKeyFor(answer)
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)

    rows.push({
      user_id: userId,
      word_id: answer.wordId,
      word: answer.word ?? '',
      question: answer.question,
      user_answer: answer.userAnswer ?? '',
      correct_answer: answer.correctAnswer ?? '',
      explanation: answer.explanation ?? '',
      source: sourceFor(answer),
      occurred_at: new Date(answer.timestamp).toISOString(),
      dedupe_key: dedupeKey,
    })
  }

  return rows
}
