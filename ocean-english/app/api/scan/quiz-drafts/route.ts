import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { NextResponse, type NextRequest } from 'next/server'

interface QuizDraftPayload {
  id: string
  documentId?: string
  sourceFileName?: string
  source?: string
  status?: string
  questionType?: string
  prompt: string
  options?: unknown[]
  answerSuggestion?: string
  explanation?: string
  sourceText?: string
  copyrightWarning?: string
  createdAt: string
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false, error: 'auth_not_configured' }, { status: 503 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  let body: { draft?: QuizDraftPayload }
  try { body = await request.json() } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }) }

  const draft = body.draft
  if (!draft?.id || !draft.prompt || !draft.createdAt) {
    return NextResponse.json({ ok: false, error: 'missing_required_fields' }, { status: 400 })
  }

  const { error } = await supabase
    .from('quiz_drafts')
    .upsert({
      id: draft.id,
      user_id: user.id,
      scan_document_id: draft.documentId ?? null,
      source_file_name: draft.sourceFileName ?? null,
      source: draft.source ?? 'ai-document-analysis',
      status: draft.status ?? 'draft',
      question_type: draft.questionType ?? null,
      prompt: draft.prompt,
      options: draft.options ?? [],
      answer_suggestion: draft.answerSuggestion ?? null,
      explanation: draft.explanation ?? null,
      // Limit source_text to 2000 chars (potential copyright content)
      source_text: draft.sourceText ? draft.sourceText.slice(0, 2000) : null,
      copyright_warning: draft.copyrightWarning ?? null,
      created_at: draft.createdAt,
    }, { onConflict: 'id' })

  if (error) {
    console.warn('[5D] quiz_drafts upsert error:', error.message)
    return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
