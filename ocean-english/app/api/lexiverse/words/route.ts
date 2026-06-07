import { NextResponse } from 'next/server'
import { getAllDictionaryWords } from '@/lib/dictionary/dictionary-client'

/**
 * GET /api/lexiverse/words
 *
 * Returns all dictionary words (all seed adapters, deduped).
 * No limit — Lexiverse needs the full corpus to build galaxy planet lists.
 * Not paginated; result is module-cached client-side via useLexiverseDictionary.
 */
export async function GET() {
  const words = await getAllDictionaryWords()
  return NextResponse.json({ ok: true, count: words.length, data: words })
}
