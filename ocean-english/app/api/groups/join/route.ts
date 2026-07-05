/* ============================================================================
   /api/groups/join — 凭邀请码加入私有小组
   私有组不可被发现（RLS 隐藏），只能凭 invite_code 加入。
   走 join_group_by_code RPC（SECURITY DEFINER）按码查组并加入。需登录。
   POST { code } → { ok, groupId }
   ============================================================================ */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false, error: 'auth_not_configured' }, { status: 503 })
  let body: { code?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }) }
  const code = typeof body.code === 'string' ? body.code.trim() : ''
  if (!code) return NextResponse.json({ ok: false, error: 'invite_required' }, { status: 400 })

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

    const { data, error } = await supabase.rpc('join_group_by_code', { code })
    if (error) {
      const msg = error.message || ''
      if (msg.includes('group_not_found')) return NextResponse.json({ ok: false, error: 'invalid_code' }, { status: 404 })
      if (msg.includes('invite_required')) return NextResponse.json({ ok: false, error: 'invite_required' }, { status: 400 })
      return NextResponse.json({ ok: false, error: 'join_failed' }, { status: 500 })
    }
    return NextResponse.json({ ok: true, groupId: data })
  } catch {
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}
