import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'
import type { DbCloudStats } from '@/types/database'

export async function GET() {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false, error: 'auth_not_configured' }, { status: 503 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const [
    savedWords, reviewWords, wrongAnswers, quizSessions,
    scanDocuments, quizDrafts, studyNotes, chatSessions, chatMessages,
  ] = await Promise.all([
    supabase.from('saved_words').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('review_words').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('wrong_answers').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('quiz_sessions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    // Phase 5D
    supabase.from('scan_documents').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('quiz_drafts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('study_notes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('chat_sessions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('chat_messages').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  const stats: DbCloudStats = {
    savedWordsCount: savedWords.count ?? 0,
    reviewWordsCount: reviewWords.count ?? 0,
    wrongAnswersCount: wrongAnswers.count ?? 0,
    quizSessionsCount: quizSessions.count ?? 0,
    scanDocumentsCount: scanDocuments.count ?? 0,
    quizDraftsCount: quizDrafts.count ?? 0,
    studyNotesCount: studyNotes.count ?? 0,
    chatSessionsCount: chatSessions.count ?? 0,
    chatMessagesCount: chatMessages.count ?? 0,
  }

  return NextResponse.json({ ok: true, data: stats })
}
