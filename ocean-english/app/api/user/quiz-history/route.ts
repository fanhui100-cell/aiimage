import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { NextResponse, type NextRequest } from 'next/server'

interface QuizAttemptPayload {
  questionId?: string
  wordId: string
  word: string
  userAnswer: string
  correct: boolean
  timestamp: number
}

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

  const { data: insertedSession, error: sessionError } = await supabase
    .from('quiz_sessions')
    .insert(sessionRow)
    .select('id')
    .single()

  if (sessionError || !insertedSession) {
    return NextResponse.json({ ok: false, error: 'session_insert_failed' }, { status: 500 })
  }

  const attempts = (session.attempts ?? []).map(a => ({
    session_id: insertedSession.id,
    user_id: user.id,
    question_id: a.questionId ?? null,
    word_id: a.wordId,
    word: a.word,
    user_answer: a.userAnswer,
    correct_answer: a.userAnswer, // we don't store correct answer in the attempt payload
    is_correct: a.correct,
    answered_at: new Date(a.timestamp).toISOString(),
  }))

  if (attempts.length > 0) {
    const { error: attemptsError } = await supabase.from('quiz_attempts').insert(attempts)
    if (attemptsError) {
      // Non-fatal: session was saved, attempts failed — log and continue
      console.warn('[5C] quiz_attempts insert failed:', attemptsError.message)
    }
  }

  return NextResponse.json({ ok: true, sessionId: insertedSession.id })
}
