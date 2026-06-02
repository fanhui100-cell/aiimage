import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { NextResponse, type NextRequest } from 'next/server'

interface ReviewWordPayload {
  wordId: string
  word: string
  nextReviewAt: number  // ms timestamp
  interval: number      // days
  ease: number          // ease factor
  repetitions: number
}

export async function PUT(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false, error: 'auth_not_configured' }, { status: 503 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  let body: { reviewWords?: ReviewWordPayload[] }
  try { body = await request.json() } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }) }

  const words = body.reviewWords
  if (!Array.isArray(words) || words.length === 0) return NextResponse.json({ ok: true, upserted: 0 })

  // Validate and sanitize
  const rows = words
    .filter(w => w.wordId && w.word && typeof w.nextReviewAt === 'number')
    .map(w => ({
      user_id: user.id,
      word_id: w.wordId,
      word: w.word,
      next_review_at: new Date(w.nextReviewAt).toISOString(),
      interval_days: w.interval ?? 1,
      ease_factor: w.ease ?? 2.5,
      repetitions: w.repetitions ?? 0,
      updated_at: new Date().toISOString(),
    }))

  if (rows.length === 0) return NextResponse.json({ ok: true, upserted: 0 })

  const { error } = await supabase
    .from('review_words')
    .upsert(rows, { onConflict: 'user_id,word_id' })

  if (error) return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 })
  return NextResponse.json({ ok: true, upserted: rows.length })
}

export async function DELETE(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false, error: 'auth_not_configured' }, { status: 503 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const wordId = searchParams.get('wordId')
  if (!wordId) return NextResponse.json({ ok: false, error: 'missing_wordId' }, { status: 400 })

  const { error } = await supabase
    .from('review_words')
    .delete()
    .eq('user_id', user.id)
    .eq('word_id', wordId)

  if (error) return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
