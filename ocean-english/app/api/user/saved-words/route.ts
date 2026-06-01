import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false, error: 'auth_not_configured' }, { status: 503 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  let body: { wordId?: string; word?: string }
  try { body = await request.json() } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }) }

  if (!body.wordId || !body.word) return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 })

  const { error } = await supabase
    .from('saved_words')
    .upsert({ user_id: user.id, word_id: body.wordId, word: body.word }, { onConflict: 'user_id,word_id' })

  if (error) return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 })
  return NextResponse.json({ ok: true })
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
    .from('saved_words')
    .delete()
    .eq('user_id', user.id)
    .eq('word_id', wordId)

  if (error) return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
