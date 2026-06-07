import { NextResponse, type NextRequest } from 'next/server'
import { getDictionaryClient } from '@/lib/dictionary/dictionary-client'

/**
 * GET /api/dictionary/word/[slug]
 *
 * Public endpoint — no auth required (dictionary is public read).
 * Returns DictionaryWord JSON or 404.
 *
 * Lookup chain: CoreSeedAdapter → MockDictionaryAdapter → 404
 * Phase 6D+: SupabaseDictionaryClient prepended.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  if (!slug || slug.trim() === '') {
    return NextResponse.json({ ok: false, error: 'missing_slug' }, { status: 400 })
  }

  const word = await getDictionaryClient().lookupWord(slug.toLowerCase().trim())
  if (!word) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, data: word })
}
