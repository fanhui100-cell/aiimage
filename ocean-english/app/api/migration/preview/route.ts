import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'
import type { CloudCounts } from '@/lib/migration/migration-types'

/**
 * GET /api/migration/preview
 * Returns the current user's cloud data counts so the client can show
 * a diff of "local data vs what's already in the cloud".
 */
export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'auth_not_configured' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const [
    savedWords, reviewWords, wrongAnswers, quizSessions,
    scanDocuments, quizDrafts, studyNotes, chatMessages,
  ] = await Promise.all([
    supabase.from('saved_words').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('review_words').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('wrong_answers').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('quiz_sessions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('scan_documents').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('quiz_drafts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('study_notes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('chat_messages').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  const cloudCounts: CloudCounts = {
    savedWords: savedWords.count ?? 0,
    reviewWords: reviewWords.count ?? 0,
    wrongAnswers: wrongAnswers.count ?? 0,
    quizSessions: quizSessions.count ?? 0,
    scanDocuments: scanDocuments.count ?? 0,
    quizDrafts: quizDrafts.count ?? 0,
    studyNotes: studyNotes.count ?? 0,
    chatMessages: chatMessages.count ?? 0,
  }

  return NextResponse.json({ ok: true, cloudCounts })
}
