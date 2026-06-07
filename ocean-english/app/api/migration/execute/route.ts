import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { NextResponse, type NextRequest } from 'next/server'
import type {
  MigrationExecutePayload,
  MigratedCounts,
  MigrationResult,
  LocalReviewWord,
  LocalWrongAnswer,
  LocalQuizSession,
  LocalScanDocument,
  LocalScanQuizDraft,
  LocalScanStudyNote,
  LocalChatMessage,
  MigrationSavedWord,
  LocalStudyProgress,
} from '@/lib/migration/migration-types'
import type { SupabaseClient } from '@supabase/supabase-js'

const MAX_RAW_TEXT_PREVIEW = 3000
const MAX_SOURCE_TEXT = 2000
const MAX_CHAT_MESSAGES = 100

// ── Section migration helpers ──────────────────────────────────────────────

async function migrateSavedWords(
  supabase: SupabaseClient,
  userId: string,
  items: MigrationSavedWord[],
): Promise<number> {
  if (items.length === 0) return 0
  const rows = items.map(w => ({
    user_id: userId,
    word_id: w.wordId,
    word: w.word || w.wordId,
    saved_at: new Date().toISOString(),
  }))
  const { error } = await supabase
    .from('saved_words')
    .upsert(rows, { onConflict: 'user_id,word_id', ignoreDuplicates: true })
  if (error) throw new Error(error.message)
  return rows.length
}

async function migrateReviewWords(
  supabase: SupabaseClient,
  userId: string,
  items: LocalReviewWord[],
): Promise<number> {
  if (items.length === 0) return 0
  const rows = items.map(r => ({
    user_id: userId,
    word_id: r.wordId,
    word: r.word,
    next_review_at: new Date(r.nextReviewAt).toISOString(),
    interval_days: r.interval ?? 1,
    ease_factor: r.ease ?? 2.5,
    repetitions: r.repetitions ?? 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }))
  // Upsert: local review state is authoritative (user studied locally)
  const { error } = await supabase
    .from('review_words')
    .upsert(rows, { onConflict: 'user_id,word_id' })
  if (error) throw new Error(error.message)
  return rows.length
}

async function migrateWrongAnswers(
  supabase: SupabaseClient,
  userId: string,
  items: LocalWrongAnswer[],
): Promise<number> {
  if (items.length === 0) return 0
  const rows = items.map(w => ({
    user_id: userId,
    word_id: w.wordId,
    word: w.word,
    question: w.question,
    user_answer: w.userAnswer,
    correct_answer: w.correctAnswer,
    explanation: w.explanation ?? '',
    source: 'quiz' as const,
    occurred_at: new Date(w.timestamp).toISOString(),
  }))
  const { error } = await supabase.from('wrong_answers').insert(rows)
  if (error) throw new Error(error.message)
  return rows.length
}

async function migrateQuizSessions(
  supabase: SupabaseClient,
  userId: string,
  sessions: LocalQuizSession[],
): Promise<{ sessions: number; attempts: number }> {
  if (sessions.length === 0) return { sessions: 0, attempts: 0 }

  // Fetch existing client_ids to skip duplicates
  const { data: existingRows } = await supabase
    .from('quiz_sessions')
    .select('client_id')
    .eq('user_id', userId)
    .not('client_id', 'is', null)
  const existingIds = new Set((existingRows ?? []).map(r => r.client_id as string))

  const newSessions = sessions.filter(s => !existingIds.has(s.id))
  if (newSessions.length === 0) return { sessions: 0, attempts: 0 }

  let totalAttempts = 0

  for (const s of newSessions) {
    const { data: inserted, error: sErr } = await supabase
      .from('quiz_sessions')
      .insert({
        user_id: userId,
        client_id: s.id,
        started_at: new Date(s.startedAt).toISOString(),
        completed_at: s.completedAt ? new Date(s.completedAt).toISOString() : null,
        score: s.score ?? 0,
        total: s.total ?? 0,
        quiz_type: 'vocabulary',
      })
      .select('id')
      .single()

    if (sErr || !inserted) continue

    const attemptRows = (Array.isArray(s.attempts) ? s.attempts : []).map(a => ({
      session_id: inserted.id,
      user_id: userId,
      question_id: a.questionId ?? null,
      word_id: a.wordId,
      word: a.word,
      user_answer: a.userAnswer,
      correct_answer: a.userAnswer,   // local attempt doesn't store correct answer separately
      is_correct: a.correct,
      answered_at: new Date(a.timestamp).toISOString(),
    }))

    if (attemptRows.length > 0) {
      const { error: aErr } = await supabase.from('quiz_attempts').insert(attemptRows)
      if (!aErr) totalAttempts += attemptRows.length
    }
  }

  return { sessions: newSessions.length, attempts: totalAttempts }
}

async function migrateStudyProgress(
  supabase: SupabaseClient,
  userId: string,
  progress: LocalStudyProgress | null,
  userLevel: string | null,
): Promise<void> {
  if (progress) {
    await supabase.from('user_study_progress').upsert(
      {
        user_id: userId,
        total_words_learned: progress.totalWordsLearned ?? 0,
        current_streak: progress.currentStreak ?? 0,
        longest_streak: progress.longestStreak ?? 0,
        total_xp: progress.totalXp ?? 0,
        last_study_date: progress.lastStudyDate || null,
        level_progress: progress.levelProgress ?? {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
  }
  if (userLevel) {
    await supabase.from('user_learning_preferences').upsert(
      {
        user_id: userId,
        level: userLevel,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
  }
}

async function migrateScanDocuments(
  supabase: SupabaseClient,
  userId: string,
  docs: LocalScanDocument[],
): Promise<number> {
  if (docs.length === 0) return 0
  const rows = docs.map(d => ({
    id: d.id,
    user_id: userId,
    file_name: d.fileName,
    file_type: d.fileType ?? 'text',
    status: d.status ?? 'analyzed',
    extraction_method: d.extractionMethod,
    created_at: d.createdAt,
    updated_at: d.updatedAt,
    summary_en: d.summaryEn ?? null,
    summary_zh: d.summaryZh ?? null,
    // Enforce rawTextPreview cap — double protection (client also caps, but we enforce server-side)
    raw_text_preview: d.rawTextPreview
      ? d.rawTextPreview.slice(0, MAX_RAW_TEXT_PREVIEW)
      : null,
    raw_text_length: d.rawTextLength ?? null,
    page_count: d.pageCount ?? null,
    ocr_confidence: d.confidence ?? null,
    warnings: d.warnings ?? [],
    question_count: d.questionCount ?? 0,
    vocabulary_count: d.vocabularyCount ?? 0,
    study_note_count: d.studyNoteCount ?? 0,
    warning_count: d.warningCount ?? 0,
    review_words_added_count: d.reviewWordsAddedCount ?? 0,
    quiz_drafts_saved_count: d.quizDraftsSavedCount ?? 0,
    wrong_answers_saved_count: d.wrongAnswersSavedCount ?? 0,
    study_notes_saved_count: d.studyNotesSavedCount ?? 0,
    questions_json: d.questions ?? [],
    vocabulary_json: d.vocabulary ?? [],
    study_notes_json: d.studyNotes ?? [],
    answer_suggestions_json: d.answerSuggestions ?? [],
  }))
  const { error } = await supabase
    .from('scan_documents')
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
  if (error) throw new Error(error.message)
  return rows.length
}

async function migrateQuizDrafts(
  supabase: SupabaseClient,
  userId: string,
  drafts: LocalScanQuizDraft[],
): Promise<number> {
  if (drafts.length === 0) return 0
  const rows = drafts.map(d => ({
    id: d.id,
    user_id: userId,
    scan_document_id: d.documentId ?? null,
    source_file_name: d.sourceFileName ?? null,
    source: d.source ?? 'ai-document-analysis',
    status: d.status ?? 'draft',
    question_type: d.questionType ?? null,
    prompt: d.prompt,
    options: d.options ?? [],
    answer_suggestion: d.answerSuggestion ?? null,
    explanation: d.explanation ?? null,
    source_text: d.sourceText ? d.sourceText.slice(0, MAX_SOURCE_TEXT) : null,
    copyright_warning: d.copyrightWarning ?? null,
    created_at: d.createdAt,
  }))
  const { error } = await supabase
    .from('quiz_drafts')
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
  if (error) throw new Error(error.message)
  return rows.length
}

async function migrateStudyNotes(
  supabase: SupabaseClient,
  userId: string,
  notes: LocalScanStudyNote[],
): Promise<number> {
  if (notes.length === 0) return 0
  const rows = notes.map(n => ({
    id: n.id,
    user_id: userId,
    scan_document_id: n.documentId ?? null,
    source_file_name: n.sourceFileName ?? null,
    title: n.title,
    title_zh: n.titleZh ?? null,
    content: n.content,
    content_zh: n.contentZh ?? null,
    created_at: n.createdAt,
  }))
  const { error } = await supabase
    .from('study_notes')
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
  if (error) throw new Error(error.message)
  return rows.length
}

async function migrateChatMessages(
  supabase: SupabaseClient,
  userId: string,
  messages: LocalChatMessage[],
): Promise<number> {
  if (messages.length === 0) return 0

  // Take max 100 most recent messages
  const capped = messages.slice(-MAX_CHAT_MESSAGES)
  // Only user/assistant roles
  const filtered = capped.filter(m => m.role === 'user' || m.role === 'assistant')
  if (filtered.length === 0) return 0

  // Create a migration chat session
  const { data: session, error: sErr } = await supabase
    .from('chat_sessions')
    .insert({ user_id: userId, topic_context: 'migrated-from-local' })
    .select('id')
    .single()
  if (sErr || !session) throw new Error(sErr?.message ?? 'session_insert_failed')

  const rows = filtered.map(m => ({
    id: m.id,
    session_id: session.id,
    user_id: userId,
    role: m.role,
    content: m.content,
    word_ref: m.wordRef ?? null,
    sent_at: new Date(m.timestamp).toISOString(),
  }))

  const { error } = await supabase
    .from('chat_messages')
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
  if (error) throw new Error(error.message)
  return rows.length
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'auth_not_configured' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  let body: MigrationExecutePayload
  try {
    body = await request.json() as MigrationExecutePayload
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  if (!body.confirmed) {
    return NextResponse.json({ ok: false, error: 'confirmation_required' }, { status: 400 })
  }

  const counts: MigratedCounts = {
    savedWords: 0, reviewWords: 0, wrongAnswers: 0,
    quizSessions: 0, quizAttempts: 0, scanDocuments: 0,
    quizDrafts: 0, studyNotes: 0, chatMessages: 0,
  }
  const failedSections: string[] = []
  const errors: Record<string, string> = {}

  // ── savedWords ────────────────────────────────────────────────────────────
  try {
    counts.savedWords = await migrateSavedWords(
      supabase, user.id, body.savedWords ?? [],
    )
  } catch (e) {
    failedSections.push('savedWords')
    errors.savedWords = e instanceof Error ? e.message : 'unknown'
  }

  // ── reviewWords ───────────────────────────────────────────────────────────
  try {
    counts.reviewWords = await migrateReviewWords(
      supabase, user.id, body.reviewWords ?? [],
    )
  } catch (e) {
    failedSections.push('reviewWords')
    errors.reviewWords = e instanceof Error ? e.message : 'unknown'
  }

  // ── wrongAnswers ──────────────────────────────────────────────────────────
  try {
    counts.wrongAnswers = await migrateWrongAnswers(
      supabase, user.id, body.wrongAnswers ?? [],
    )
  } catch (e) {
    failedSections.push('wrongAnswers')
    errors.wrongAnswers = e instanceof Error ? e.message : 'unknown'
  }

  // ── quizSessions + attempts ───────────────────────────────────────────────
  try {
    const r = await migrateQuizSessions(
      supabase, user.id, body.quizSessions ?? [],
    )
    counts.quizSessions = r.sessions
    counts.quizAttempts = r.attempts
  } catch (e) {
    failedSections.push('quizSessions')
    errors.quizSessions = e instanceof Error ? e.message : 'unknown'
  }

  // ── studyProgress + userLevel ────────────────────────────────────────────
  try {
    await migrateStudyProgress(
      supabase, user.id, body.studyProgress ?? null, body.userLevel ?? null,
    )
  } catch (e) {
    failedSections.push('studyProgress')
    errors.studyProgress = e instanceof Error ? e.message : 'unknown'
  }

  // ── scan documents (requires document consent) ────────────────────────────
  if (body.documentConsent) {
    try {
      counts.scanDocuments = await migrateScanDocuments(
        supabase, user.id, body.scanDocuments ?? [],
      )
    } catch (e) {
      failedSections.push('scanDocuments')
      errors.scanDocuments = e instanceof Error ? e.message : 'unknown'
    }

    try {
      counts.quizDrafts = await migrateQuizDrafts(
        supabase, user.id, body.scanQuizDrafts ?? [],
      )
    } catch (e) {
      failedSections.push('quizDrafts')
      errors.quizDrafts = e instanceof Error ? e.message : 'unknown'
    }

    try {
      counts.studyNotes = await migrateStudyNotes(
        supabase, user.id, body.scanStudyNotes ?? [],
      )
    } catch (e) {
      failedSections.push('studyNotes')
      errors.studyNotes = e instanceof Error ? e.message : 'unknown'
    }
  }

  // ── chatMessages (optional) ───────────────────────────────────────────────
  if (Array.isArray(body.chatMessages) && body.chatMessages.length > 0) {
    try {
      counts.chatMessages = await migrateChatMessages(
        supabase, user.id, body.chatMessages,
      )
    } catch (e) {
      failedSections.push('chatMessages')
      errors.chatMessages = e instanceof Error ? e.message : 'unknown'
    }
  }

  const result: MigrationResult = {
    ok: failedSections.length === 0,
    migratedCounts: counts,
    failedSections,
    errors,
  }

  return NextResponse.json(result)
}
