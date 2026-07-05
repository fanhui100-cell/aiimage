import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { NextResponse, type NextRequest } from 'next/server'
import { buildWrongAnswerRows, type WrongAnswerPayload } from '@/lib/sync/wrong-answer-utils'

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false, error: 'auth_not_configured' }, { status: 503 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  let body: { wrongAnswers?: WrongAnswerPayload[] }
  try { body = await request.json() } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }) }

  const answers = body.wrongAnswers
  if (!Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ ok: true, inserted: 0 })
  }

  const rows = buildWrongAnswerRows(user.id, answers)
  if (rows.length === 0) return NextResponse.json({ ok: true, inserted: 0 })

  const { error } = await supabase
    .from('wrong_answers')
    .upsert(rows, { onConflict: 'user_id,dedupe_key', ignoreDuplicates: true })

  if (error) return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 })
  return NextResponse.json({ ok: true, inserted: rows.length })
}
