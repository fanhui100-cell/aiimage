/* ============================================================================
   /api/leaderboard — 排行榜（Task 2.1）
   读 leaderboard 视图（p2-leaderboard.sql：user_study_progress + profiles，
   定义者视图绕 RLS 只暴露排行字段）。board=weekly|total|streak。
   需登录（视图仅授权 authenticated）；未登录返回空。
   ============================================================================ */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'

type Board = 'weekly' | 'total' | 'streak'
const COL: Record<Board, 'week_xp' | 'total_xp' | 'current_streak'> = {
  weekly: 'week_xp', total: 'total_xp', streak: 'current_streak',
}
const LB_SELECT = 'user_id,name,avatar_url,total_xp,week_xp,current_streak,longest_streak'

interface LbRow {
  user_id: string; name: string; avatar_url: string | null
  total_xp: number; week_xp: number; current_streak: number; longest_streak: number
}

function toRow(r: LbRow, col: keyof LbRow, rank: number, meId?: string) {
  return {
    rank,
    userId: r.user_id,
    name: r.name,
    avatar: r.avatar_url ?? undefined,
    value: Number(r[col] ?? 0),
    streak: r.current_streak,
    isMe: meId === r.user_id,
  }
}

export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false, error: 'auth_not_configured' }, { status: 503 })
  const sp = req.nextUrl.searchParams
  const board: Board = (['weekly', 'total', 'streak'] as Board[]).includes(sp.get('board') as Board)
    ? (sp.get('board') as Board) : 'weekly'
  const col = COL[board]
  const limit = Math.min(100, Math.max(1, Number(sp.get('limit') ?? 50)))

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('leaderboard').select(LB_SELECT)
      .order(col, { ascending: false })
      .limit(limit)
    if (error) return NextResponse.json({ ok: false, board, rows: [], me: null }, { status: 200 })

    const rows = (data as LbRow[]).map((r, i) => toRow(r, col, i + 1, user?.id))
    let me = rows.find((r) => r.isMe) ?? null

    // 我若不在前 N，单独取我的值并按 col 算排名
    if (!me && user) {
      const { data: mine } = await supabase.from('leaderboard').select(LB_SELECT).eq('user_id', user.id).maybeSingle()
      if (mine) {
        const myVal = Number((mine as LbRow)[col] ?? 0)
        const { count } = await supabase.from('leaderboard').select('user_id', { count: 'exact', head: true }).gt(col, myVal)
        me = toRow(mine as LbRow, col, (count ?? 0) + 1, user.id)
      }
    }

    return NextResponse.json({ ok: true, board, rows, me })
  } catch {
    return NextResponse.json({ ok: false, board, rows: [], me: null }, { status: 200 })
  }
}
