import {
  applyQuestionBankCorrectAnswers,
  buildQuizAttemptRows,
  type QuestionAnswerLookupRow,
  type QuizAttemptInsertRow,
  type QuizAttemptPayload,
} from '@/lib/sync/quiz-history-utils'

export type MigrationQuizAttemptPayload = QuizAttemptPayload

export function buildMigratedQuizAttemptRows(
  sessionId: string,
  userId: string,
  attempts: readonly MigrationQuizAttemptPayload[],
  questionRows: readonly QuestionAnswerLookupRow[] = [],
): QuizAttemptInsertRow[] {
  return buildQuizAttemptRows(
    sessionId,
    userId,
    applyQuestionBankCorrectAnswers(attempts, questionRows),
  )
}
