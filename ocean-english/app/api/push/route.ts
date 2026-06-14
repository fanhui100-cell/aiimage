/* ============================================================================
   /api/push — Web Push 订阅管理（Task 3.5 · 后端部分）
   POST  存订阅（push_subscriptions，见 p2-push-subscriptions.sql）
   DELETE 按 endpoint 退订
   需登录。实际「发送推送」另需：VAPID 公私钥 + web-push 库 + 定时任务（待接）。
   ============================================================================ */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'

interface SubBody {
  endpoint?: unknown
  keys?: { p256dh?: unknown; auth?: unknown }
}

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false, error: 'auth_not_configured' }, { status: 503 })
  let body: SubBody
  try { body = await req.json() as SubBody } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }) }

  const endpoint = typeof body.endpoint === 'string' ? body.endpoint : ''
  const p256dh = typeof body.keys?.p256dh === 'string' ? body.keys.p256dh : ''
  const auth = typeof body.keys?.auth === 'string' ? body.keys.auth : ''
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ ok: false, error: 'invalid_subscription' }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: user.id,
      endpoint,
      p256dh,
      auth,
      user_agent: req.headers.get('user-agent') ?? null,
    }, { onConflict: 'user_id,endpoint' })
    if (error) return NextResponse.json({ ok: false, error: 'store_failed' }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false, error: 'auth_not_configured' }, { status: 503 })
  const endpoint = req.nextUrl.searchParams.get('endpoint')
  if (!endpoint) return NextResponse.json({ ok: false, error: 'missing_endpoint' }, { status: 400 })
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    await supabase.from('push_subscriptions').delete().eq('user_id', user.id).eq('endpoint', endpoint)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}
