import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { NextResponse, type NextRequest } from 'next/server'

interface WrongAnswerPayload {
  wordId: string
  word: string
  question: string
  userAnswer: string
  correctAnswer: string
  explanation: string
  timestamp: number
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false, error: 'auth_not_configured' }, { status: 503 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  let body: { wrongAnswers?: WrongAnswerPayload[] }
  try { body = await request.json() } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }) }

  const answers = body.wrongAnswers
  if (!Array.isArray(answers) || answers.length === 0) return NextResponse.json({ ok: true, inserted: 0 })

  const rows = answers
    .filter(a => a.wordId && a.question && typeof a.timestamp === 'number')
    .map(a => ({
      user_id: user.id,
      word_id: a.wordId,
      word: a.word ?? '',
      question: a.question,
      user_answer: a.userAnswer ?? '',
      correct_answer: a.correctAnswer ?? '',
      explanation: a.explanation ?? '',
      // Detect scan-sourced wrong answers by wordId prefix
      source: a.wordId.startsWith('scan-') ? 'scan' : 'quiz',
      occurred_at: new Date(a.timestamp).toISOString(),
    }))

  if (rows.length === 0) return NextResponse.json({ ok: true, inserted: 0 })

  // INSERT — ignore duplicates by using ignoreDuplicates
  const { error } = await supabase
    .from('wrong_answers')
    .insert(rows)

  if (error) return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 })
  return NextResponse.json({ ok: true, inserted: rows.length })
}
