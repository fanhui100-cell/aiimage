import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { NextResponse, type NextRequest } from 'next/server'

interface StudyNotePayload {
  id: string
  documentId?: string
  sourceFileName?: string
  title: string
  titleZh?: string
  content: string
  contentZh?: string
  createdAt: string
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false, error: 'auth_not_configured' }, { status: 503 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  let body: { note?: StudyNotePayload }
  try { body = await request.json() } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }) }

  const note = body.note
  if (!note?.id || !note.title || !note.content || !note.createdAt) {
    return NextResponse.json({ ok: false, error: 'missing_required_fields' }, { status: 400 })
  }

  const { error } = await supabase
    .from('study_notes')
    .upsert({
      id: note.id,
      user_id: user.id,
      scan_document_id: note.documentId ?? null,
      source_file_name: note.sourceFileName ?? null,
      title: note.title,
      title_zh: note.titleZh ?? null,
      content: note.content,
      content_zh: note.contentZh ?? null,
      created_at: note.createdAt,
    }, { onConflict: 'id' })

  if (error) {
    console.warn('[5D] study_notes upsert error:', error.message)
    return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
