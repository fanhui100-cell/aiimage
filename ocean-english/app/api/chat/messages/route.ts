import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { NextResponse, type NextRequest } from 'next/server'
import { resolveChatMessageCount } from '@/lib/sync/chat-message-utils'

interface ChatMessagePayload {
  id: string
  role: 'user' | 'assistant'
  content: string
  wordRef?: string
  timestamp: number
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false, error: 'auth_not_configured' }, { status: 503 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  let body: { sessionId?: string; messages?: ChatMessagePayload[] }
  try { body = await request.json() } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }) }

  if (!body.sessionId || !Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 })
  }

  // Verify this session belongs to the current user
  const { data: session } = await supabase
    .from('chat_sessions')
    .select('id,message_count')
    .eq('id', body.sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) return NextResponse.json({ ok: false, error: 'session_not_found' }, { status: 404 })

  // Filter: only 'user' and 'assistant' roles — never 'system'
  const rows = body.messages
    .filter(m => m.id && (m.role === 'user' || m.role === 'assistant') && m.content)
    .map(m => ({
      id: m.id,
      session_id: body.sessionId!,
      user_id: user.id,
      role: m.role,
      content: m.content,
      word_ref: m.wordRef ?? null,
      sent_at: new Date(m.timestamp).toISOString(),
    }))

  if (rows.length === 0) return NextResponse.json({ ok: true, inserted: 0 })

  const { error } = await supabase
    .from('chat_messages')
    .upsert(rows, { onConflict: 'id' })

  if (error) {
    console.warn('[5D] chat_messages upsert error:', error.message)
    return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 })
  }

  const { count } = await supabase
    .from('chat_messages')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', body.sessionId)
    .eq('user_id', user.id)
  const messageCount = count ?? resolveChatMessageCount(session.message_count as number | null, rows.length)

  await supabase
    .from('chat_sessions')
    .update({ message_count: messageCount, ended_at: new Date().toISOString() })
    .eq('id', body.sessionId)
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true, inserted: rows.length })
}
