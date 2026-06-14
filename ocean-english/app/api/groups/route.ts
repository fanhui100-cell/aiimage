/* ============================================================================
   /api/groups — 学习小组列表 + 创建（Task 2.2）
   GET  → 我可见的小组（公开 + 我加入/创建的，RLS 已约束）+ 成员数 + 是否已加入
   POST → 创建小组（自动把创建者加为成员）
   需登录。表见 p2-study-groups.sql。
   ============================================================================ */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'

interface GroupRow { id: string; name: string; description: string; owner_id: string; invite_code: string | null; is_public: boolean }

function inviteCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export async function GET() {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false, error: 'auth_not_configured' }, { status: 503 })
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'unauthorized', data: [] }, { status: 401 })

    // RLS 已限制可见范围（公开 + 自己的 + 已加入的）
    const { data: groups, error } = await supabase
      .from('study_groups').select('id,name,description,owner_id,invite_code,is_public')
      .order('created_at', { ascending: false }).limit(100)
    if (error) return NextResponse.json({ ok: false, data: [] }, { status: 200 })

    const rows = (groups ?? []) as GroupRow[]
    const ids = rows.map((g) => g.id)

    // 成员数 + 我的加入集（一次查全部相关成员行）
    const counts = new Map<string, number>()
    const mine = new Set<string>()
    if (ids.length) {
      const { data: members } = await supabase.from('group_members').select('group_id,user_id').in('group_id', ids)
      for (const m of (members ?? []) as { group_id: string; user_id: string }[]) {
        counts.set(m.group_id, (counts.get(m.group_id) ?? 0) + 1)
        if (m.user_id === user.id) mine.add(m.group_id)
      }
    }

    const data = rows.map((g) => ({
      id: g.id,
      name: g.name,
      desc: g.description ?? '',
      inviteCode: g.invite_code ?? undefined,
      memberCount: counts.get(g.id) ?? 0,
      joined: mine.has(g.id),
      isOwner: g.owner_id === user.id,
    }))
    return NextResponse.json({ ok: true, data })
  } catch {
    return NextResponse.json({ ok: false, data: [] }, { status: 200 })
  }
}

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false, error: 'auth_not_configured' }, { status: 503 })
  let body: { name?: unknown; description?: unknown; isPublic?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }) }
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 40) : ''
  const description = typeof body.description === 'string' ? body.description.trim().slice(0, 200) : ''
  if (!name) return NextResponse.json({ ok: false, error: 'name_required' }, { status: 400 })

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

    const { data: created, error } = await supabase
      .from('study_groups')
      .insert({ name, description, owner_id: user.id, invite_code: inviteCode(), is_public: body.isPublic !== false })
      .select('id,name,description,owner_id,invite_code,is_public').single()
    if (error || !created) return NextResponse.json({ ok: false, error: 'create_failed' }, { status: 500 })

    // 创建者自动入组
    await supabase.from('group_members').insert({ group_id: (created as GroupRow).id, user_id: user.id })

    const g = created as GroupRow
    return NextResponse.json({ ok: true, data: { id: g.id, name: g.name, desc: g.description ?? '', inviteCode: g.invite_code ?? undefined, memberCount: 1, joined: true, isOwner: true } })
  } catch {
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}
