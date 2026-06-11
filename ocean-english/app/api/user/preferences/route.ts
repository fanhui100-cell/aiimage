import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { NextResponse, type NextRequest } from 'next/server'

const VALID_LEVELS = ['beginner','elementary','intermediate','advanced','exam-prep','free-explore'] as const

export async function GET() {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false, error: 'auth_not_configured' }, { status: 503 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('user_learning_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, data: data ?? null })
}

export async function PUT(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false, error: 'auth_not_configured' }, { status: 503 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  let body: { level?: string; numericLevel?: number }
  try { body = await request.json() } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }) }

  const level = body.level
  if (level !== undefined && !(VALID_LEVELS as readonly string[]).includes(level)) {
    return NextResponse.json({ ok: false, error: 'invalid_level' }, { status: 400 })
  }
  // P1-2：7 档数字等级（需先执行 supabase/sql/final-p1-levels.sql 加列）
  const numericLevel = body.numericLevel
  if (numericLevel !== undefined
    && !(Number.isInteger(numericLevel) && numericLevel >= 1 && numericLevel <= 7)) {
    return NextResponse.json({ ok: false, error: 'invalid_numeric_level' }, { status: 400 })
  }

  const { error } = await supabase
    .from('user_learning_preferences')
    .upsert({
      user_id: user.id,
      level: level ?? null,
      ...(numericLevel !== undefined ? { numeric_level: numericLevel } : {}),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
