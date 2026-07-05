/* ============================================================================
   /api/groups/[id] — 小组详情 + 加入/退出（Task 2.2）
   GET  → 小组信息 + 成员（含连击/今日是否打卡，取自 leaderboard 视图）
   POST → { action: 'join' | 'leave' }
   需登录。
   ============================================================================ */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'

interface GroupRow { id: string; name: string; description: string; owner_id: string; invite_code: string | null; is_public: boolean }
interface LbRow { user_id: string; name: string; avatar_url: string | null; current_streak: number; week_xp: number; last_study_date: string | null }

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false, error: 'auth_not_configured' }, { status: 503 })
  const { id } = await params
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

    const { data: group } = await supabase
      .from('study_groups').select('id,name,description,owner_id,invite_code,is_public').eq('id', id).maybeSingle()
    if (!group) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
    const g = group as GroupRow

    const { data: memberRows } = await supabase.from('group_members').select('user_id,joined_at').eq('group_id', id)
    const memberIds = (memberRows ?? []).map((m: { user_id: string }) => m.user_id)

    // 成员档案/连击/今日打卡（leaderboard 视图跨用户可读）
    let members: { userId: string; name: string; avatar?: string; streak: number; weekXp: number; todayDone: boolean }[] = []
    if (memberIds.length) {
      const today = new Date().toISOString().slice(0, 10)
      const { data: lb } = await supabase
        .from('leaderboard').select('user_id,name,avatar_url,current_streak,week_xp,last_study_date')
        .in('user_id', memberIds)
      members = (lb as LbRow[] ?? []).map((r) => ({
        userId: r.user_id, name: r.name, avatar: r.avatar_url ?? undefined,
        streak: r.current_streak ?? 0, weekXp: r.week_xp ?? 0,
        todayDone: r.last_study_date === today,
      })).sort((a, b) => b.weekXp - a.weekXp)
    }

    return NextResponse.json({
      ok: true,
      data: {
        id: g.id, name: g.name, desc: g.description ?? '',
        inviteCode: g.invite_code ?? undefined,
        memberCount: memberIds.length,
        joined: memberIds.includes(user.id),
        isOwner: g.owner_id === user.id,
        members,
      },
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false, error: 'auth_not_configured' }, { status: 503 })
  const { id } = await params
  let body: { action?: unknown; inviteCode?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }) }
  const action = body.action === 'leave' ? 'leave' : body.action === 'join' ? 'join' : null
  if (!action) return NextResponse.json({ ok: false, error: 'invalid_action' }, { status: 400 })
  const inviteCode = typeof body.inviteCode === 'string' ? body.inviteCode.trim() : null

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

    if (action === 'join') {
      // 经 join_group RPC：公开组直接加入；私有组需匹配邀请码（防止凭 group_id 直接进私有组）
      const { error } = await supabase.rpc('join_group', { gid: id, code: inviteCode })
      if (error) {
        const msg = error.message || ''
        if (msg.includes('invite_required')) return NextResponse.json({ ok: false, error: 'invite_required' }, { status: 403 })
        if (msg.includes('group_not_found')) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
        return NextResponse.json({ ok: false, error: 'join_failed' }, { status: 500 })
      }
    } else {
      const { error } = await supabase.from('group_members').delete().eq('group_id', id).eq('user_id', user.id)
      if (error) return NextResponse.json({ ok: false, error: 'leave_failed' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}
