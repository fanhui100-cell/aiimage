import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { NextResponse, type NextRequest } from 'next/server'
import {
  buildStudyProgressUpsertRow,
  type StudyProgressPayload,
} from '@/lib/sync/study-progress-utils'

export async function GET() {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false, error: 'auth_not_configured' }, { status: 503 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('user_study_progress')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 })
  return NextResponse.json({ ok: true, data: data ?? null })
}

export async function PUT(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false, error: 'auth_not_configured' }, { status: 503 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  let body: StudyProgressPayload
  try { body = await request.json() } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }) }

  const { data: existing, error: existingError } = await supabase
    .from('user_study_progress')
    .select('total_words_learned,current_streak,longest_streak,total_xp,last_study_date,level_progress,week_xp,week_start')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingError && existingError.code !== 'PGRST116') {
    return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 })
  }

  const { error } = await supabase
    .from('user_study_progress')
    .upsert(buildStudyProgressUpsertRow(user.id, body, existing ?? null), { onConflict: 'user_id' })

  if (error) return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export const PATCH = PUT
