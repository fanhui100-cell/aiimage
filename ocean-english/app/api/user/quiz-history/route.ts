import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { NextResponse, type NextRequest } from 'next/server'
import {
  applyQuestionBankCorrectAnswers,
  buildQuizAttemptRows,
  type QuestionAnswerLookupRow,
  type QuizAttemptPayload,
} from '@/lib/sync/quiz-history-utils'

interface QuizSessionPayload {
  id: string
  startedAt: number
  completedAt?: number
  score: number
  total: number
  attempts: QuizAttemptPayload[]
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false, error: 'auth_not_configured' }, { status: 503 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  let body: { session?: QuizSessionPayload }
  try { body = await request.json() } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }) }

  const session = body.session
  if (!session || !session.id || typeof session.startedAt !== 'number') {
    return NextResponse.json({ ok: false, error: 'missing_session' }, { status: 400 })
  }

  const sessionRow = {
    user_id: user.id,
    client_id: session.id,
    started_at: new Date(session.startedAt).toISOString(),
    completed_at: session.completedAt ? new Date(session.completedAt).toISOString() : null,
    score: session.score ?? 0,
    total: session.total ?? 0,
    quiz_type: 'vocabulary',
  }

  const { data: existingSession, error: existingSessionError } = await supabase
    .from('quiz_sessions')
    .select('id')
    .eq('user_id', user.id)
    .eq('client_id', session.id)
    .maybeSingle()

  if (existingSessionError && existingSessionError.code !== 'PGRST116') {
    return NextResponse.json({ ok: false, error: 'session_lookup_failed' }, { status: 500 })
  }

  if (existingSession?.id) {
    return NextResponse.json({ ok: true, sessionId: existingSession.id, duplicate: true })
  }

  const { data: insertedSession, error: sessionError } = await supabase
    .from('quiz_sessions')
    .insert(sessionRow)
    .select('id')
    .single()

  if (sessionError || !insertedSession) {
    const { data: duplicateSession } = await supabase
      .from('quiz_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('client_id', session.id)
      .maybeSingle()

    if (duplicateSession?.id) {
      return NextResponse.json({ ok: true, sessionId: duplicateSession.id, duplicate: true })
    }

    return NextResponse.json({ ok: false, error: 'session_insert_failed' }, { status: 500 })
  }

  let attemptPayloads = session.attempts ?? []
  const missingAnswerQuestionIds = [
    ...new Set(
      attemptPayloads
        .filter((attempt) => !attempt.correctAnswer && attempt.questionId)
        .map((attempt) => attempt.questionId as string),
    ),
  ]

  if (missingAnswerQuestionIds.length > 0) {
    const { data: answerRows, error: answerRowsError } = await supabase
      .from('question_bank')
      .select('id,answer,answer_text,choices')
      .in('id', missingAnswerQuestionIds)

    if (answerRowsError) {
      console.warn('[5C] question_bank answer lookup failed:', answerRowsError.message)
    } else {
      attemptPayloads = applyQuestionBankCorrectAnswers(
        attemptPayloads,
        (answerRows ?? []) as QuestionAnswerLookupRow[],
      )
    }
  }

  const attempts = buildQuizAttemptRows(insertedSession.id, user.id, attemptPayloads)

  if (attempts.length > 0) {
    const { error: attemptsError } = await supabase.from('quiz_attempts').insert(attempts)
    if (attemptsError) {
      // Non-fatal: session was saved, attempts failed — log and continue
      console.warn('[5C] quiz_attempts insert failed:', attemptsError.message)
    }
  }

  return NextResponse.json({ ok: true, sessionId: insertedSession.id })
}
