import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * /api/user/word-states — 词状态机云同步端点（A7）
 * GET    全量拉取当前用户的词状态（登录换浏览器恢复用）
 * POST   批量 upsert 变更词条（CloudSyncProvider 1.5s 防抖 diff 上传）
 * DELETE ?wordId= 删除单词条（B7-3「移出学习」，防止水合复活）
 */

interface WordStatePayload {
  wordId: string
  word: string
  state: string
  streak: number
  ease: number
  interval: number
  nextReviewAt?: number | null  // ms timestamp
  saved?: boolean
  source?: string | null
}

const VALID_STATES = new Set(['locked', 'unknown', 'recommended', 'learning', 'review', 'weak', 'mastered'])
const VALID_SOURCES = new Set(['today-pack', 'lookup', 'scan', 'reading', 'seed'])

export async function GET() {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false, error: 'auth_not_configured' }, { status: 503 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('word_states')
    .select('word_id, word, state, streak, ease, interval_days, next_review_at, saved, source, updated_at')
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 })

  const states = (data ?? []).map(r => ({
    wordId: r.word_id as string,
    word: (r.word as string) ?? '',
    state: r.state as string,
    streak: (r.streak as number) ?? 0,
    ease: (r.ease as number) ?? 2.5,
    interval: (r.interval_days as number) ?? 0,
    nextReviewAt: r.next_review_at ? new Date(r.next_review_at as string).getTime() : null,
    saved: !!r.saved,
    source: (r.source as string) ?? 'lookup',
    updatedAt: r.updated_at ? new Date(r.updated_at as string).getTime() : 0,
  }))

  return NextResponse.json({ ok: true, data: states })
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false, error: 'auth_not_configured' }, { status: 503 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  let body: { wordStates?: WordStatePayload[] }
  try { body = await request.json() } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }) }

  const states = body.wordStates
  if (!Array.isArray(states) || states.length === 0) return NextResponse.json({ ok: true, upserted: 0 })

  const rows = states
    .filter(s => s.wordId && VALID_STATES.has(s.state))
    .slice(0, 500)
    .map(s => ({
      user_id: user.id,
      word_id: s.wordId,
      word: s.word ?? '',
      state: s.state,
      streak: Number.isFinite(s.streak) ? s.streak : 0,
      ease: Number.isFinite(s.ease) ? s.ease : 2.5,
      interval_days: Number.isFinite(s.interval) ? Math.round(s.interval) : 0,
      next_review_at: typeof s.nextReviewAt === 'number' ? new Date(s.nextReviewAt).toISOString() : null,
      saved: !!s.saved,
      source: s.source && VALID_SOURCES.has(s.source) ? s.source : 'lookup',
      updated_at: new Date().toISOString(),
    }))

  if (rows.length === 0) return NextResponse.json({ ok: true, upserted: 0 })

  const { error } = await supabase
    .from('word_states')
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
    .from('word_states')
    .delete()
    .eq('user_id', user.id)
    .eq('word_id', wordId)

  if (error) return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
