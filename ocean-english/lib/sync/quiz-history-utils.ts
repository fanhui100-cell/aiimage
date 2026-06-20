export interface QuizAttemptPayload {
  questionId?: string
  wordId: string
  word: string
  userAnswer: string
  correctAnswer?: string
  correct: boolean
  timestamp: number
}

export interface QuizAttemptInsertRow {
  session_id: string
  user_id: string
  question_id: string | null
  word_id: string
  word: string
  user_answer: string
  correct_answer: string
  is_correct: boolean
  answered_at: string
}

export interface QuestionAnswerLookupRow {
  id: string
  answer: string | null
  answer_text: string | null
  choices: unknown
}

function isChoice(value: unknown): value is { id: string; text: string } {
  return Boolean(
    value
    && typeof value === 'object'
    && 'id' in value
    && 'text' in value
    && typeof value.id === 'string'
    && typeof value.text === 'string',
  )
}

export function resolveQuestionBankCorrectAnswer(row: QuestionAnswerLookupRow): string {
  if (row.answer_text) return row.answer_text
  if (!row.answer) return ''

  const choices = Array.isArray(row.choices) ? row.choices.filter(isChoice) : []
  return choices.find((choice) => choice.id === row.answer)?.text ?? row.answer
}

export function applyQuestionBankCorrectAnswers(
  attempts: readonly QuizAttemptPayload[],
  rows: readonly QuestionAnswerLookupRow[],
): QuizAttemptPayload[] {
  const answersByQuestionId = new Map(
    rows.map((row) => [row.id, resolveQuestionBankCorrectAnswer(row)]),
  )

  return attempts.map((attempt) => {
    if (attempt.correctAnswer || !attempt.questionId) return attempt

    const correctAnswer = answersByQuestionId.get(attempt.questionId)
    return correctAnswer ? { ...attempt, correctAnswer } : attempt
  })
}

export function buildQuizAttemptRows(
  sessionId: string,
  userId: string,
  attempts: readonly QuizAttemptPayload[],
): QuizAttemptInsertRow[] {
  return attempts.map((attempt) => ({
    session_id: sessionId,
    user_id: userId,
    question_id: attempt.questionId ?? null,
    word_id: attempt.wordId,
    word: attempt.word,
    user_answer: attempt.userAnswer,
    correct_answer: attempt.correctAnswer ?? (attempt.correct ? attempt.userAnswer : ''),
    is_correct: attempt.correct,
    answered_at: new Date(attempt.timestamp).toISOString(),
  }))
}
