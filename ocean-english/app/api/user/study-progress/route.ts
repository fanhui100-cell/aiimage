import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { NextResponse, type NextRequest } from 'next/server'

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

  let body: {
    totalWordsLearned?: number
    currentStreak?: number
    longestStreak?: number
    totalXp?: number
    lastStudyDate?: string
    levelProgress?: Record<string, number>
  }
  try { body = await request.json() } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }) }

  const { error } = await supabase
    .from('user_study_progress')
    .upsert({
      user_id: user.id,
      total_words_learned: body.totalWordsLearned ?? 0,
      current_streak: body.currentStreak ?? 0,
      longest_streak: body.longestStreak ?? 0,
      total_xp: body.totalXp ?? 0,
      last_study_date: body.lastStudyDate ?? null,
      level_progress: body.levelProgress ?? {},
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
