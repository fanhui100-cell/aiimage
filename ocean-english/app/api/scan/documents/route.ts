import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { NextResponse, type NextRequest } from 'next/server'

const MAX_RAW_TEXT_PREVIEW = 3000

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false, error: 'auth_not_configured' }, { status: 503 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  let body: {
    id?: string
    fileName?: string
    fileType?: string
    status?: string
    extractionMethod?: string
    createdAt?: string
    updatedAt?: string
    summaryEn?: string
    summaryZh?: string
    rawTextPreview?: string
    rawTextLength?: number
    pageCount?: number
    confidence?: number
    warnings?: unknown[]
    questionCount?: number
    vocabularyCount?: number
    studyNoteCount?: number
    warningCount?: number
    reviewWordsAddedCount?: number
    quizDraftsSavedCount?: number
    wrongAnswersSavedCount?: number
    studyNotesSavedCount?: number
    questions?: unknown[]
    vocabulary?: unknown[]
    studyNotes?: unknown[]
    answerSuggestions?: unknown[]
  }
  try { body = await request.json() } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }) }

  if (!body.id || !body.fileName || !body.extractionMethod) {
    return NextResponse.json({ ok: false, error: 'missing_required_fields' }, { status: 400 })
  }

  // Enforce privacy: truncate rawTextPreview, reject any rawText field
  const rawTextPreview = body.rawTextPreview
    ? body.rawTextPreview.slice(0, MAX_RAW_TEXT_PREVIEW)
    : undefined

  const { error } = await supabase
    .from('scan_documents')
    .upsert({
      id: body.id,
      user_id: user.id,
      file_name: body.fileName,
      file_type: body.fileType ?? 'text',
      status: body.status ?? 'analyzed',
      extraction_method: body.extractionMethod,
      created_at: body.createdAt ?? new Date().toISOString(),
      updated_at: body.updatedAt ?? new Date().toISOString(),
      summary_en: body.summaryEn ?? null,
      summary_zh: body.summaryZh ?? null,
      raw_text_preview: rawTextPreview ?? null,
      raw_text_length: body.rawTextLength ?? null,
      page_count: body.pageCount ?? null,
      ocr_confidence: body.confidence ?? null,
      warnings: body.warnings ?? [],
      question_count: body.questionCount ?? 0,
      vocabulary_count: body.vocabularyCount ?? 0,
      study_note_count: body.studyNoteCount ?? 0,
      warning_count: body.warningCount ?? 0,
      review_words_added_count: body.reviewWordsAddedCount ?? 0,
      quiz_drafts_saved_count: body.quizDraftsSavedCount ?? 0,
      wrong_answers_saved_count: body.wrongAnswersSavedCount ?? 0,
      study_notes_saved_count: body.studyNotesSavedCount ?? 0,
      questions_json: body.questions ?? [],
      vocabulary_json: body.vocabulary ?? [],
      study_notes_json: body.studyNotes ?? [],
      answer_suggestions_json: body.answerSuggestions ?? [],
    }, { onConflict: 'id' })

  if (error) {
    console.warn('[5D] scan_documents upsert error:', error.message)
    return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false, error: 'auth_not_configured' }, { status: 503 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'clear-all') {
    // Delete ALL scan data for this user
    const { error } = await supabase
      .from('scan_documents')
      .delete()
      .eq('user_id', user.id)
    if (error) return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 })
    return NextResponse.json({ ok: true, action: 'cleared' })
  }

  const documentId = searchParams.get('id')
  if (!documentId) return NextResponse.json({ ok: false, error: 'missing_id' }, { status: 400 })

  const { error } = await supabase
    .from('scan_documents')
    .delete()
    .eq('user_id', user.id)
    .eq('id', documentId)

  if (error) return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
