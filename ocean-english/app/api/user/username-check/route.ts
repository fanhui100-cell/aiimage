/* ============================================================================
   /api/user/username-check — 用户名唯一性校验（界面优化1·阶段2）
   GET ?name=X → { ok, available, reason? }
   大小写不敏感；service role 读 profiles 全表（绕过 RLS 看他人占用）。
   未配 service role 时返回 ok:false（前端按「无法校验」放行，不硬拦）。
   ============================================================================ */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL } from '@/lib/supabase/client'

export const runtime = 'nodejs'

// 2–20 位：字母/数字/下划线/中文
const VALID = /^[A-Za-z0-9_一-龥]{2,20}$/

export async function GET(req: NextRequest) {
  const name = (new URL(req.url).searchParams.get('name') ?? '').trim()
  if (!name) return NextResponse.json({ ok: true, available: false, reason: 'empty' })
  if (!VALID.test(name)) return NextResponse.json({ ok: true, available: false, reason: 'invalid' })

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !serviceKey) {
    // 无法校验：交给前端放行（DB 唯一索引仍是最终兜底）
    return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 })
  }

  try {
    const db = createClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false } })
    // 转义 LIKE 通配符（_ % \），让 ilike 做精确的大小写不敏感匹配
    const exact = name.replace(/[\\%_]/g, '\\$&')
    const { data, error } = await db
      .from('profiles').select('id').ilike('username', exact).limit(1)
    if (error) return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 })
    return NextResponse.json({ ok: true, available: (data?.length ?? 0) === 0 })
  } catch {
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}
