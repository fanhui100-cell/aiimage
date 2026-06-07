import { NextResponse, type NextRequest } from 'next/server'
import { getDictionaryClient } from '@/lib/dictionary/dictionary-client'
import type { WordLevel } from '@/lib/dictionary/dictionary-types'

const VALID_LEVELS: WordLevel[] = ['beginner', 'elementary', 'intermediate', 'advanced', 'exam-prep']
const VALID_DIFFICULTY = [1, 2, 3, 4, 5] as const
const MAX_LIMIT = 50

/**
 * GET /api/dictionary/search?q=&level=&difficulty=&limit=&offset=
 *
 * Public endpoint — no auth required.
 * Chain: SupabaseDictionaryClient → ExpandedSeedAdapter → CoreSeedAdapter → MockDictionaryAdapter
 *
 * Params:
 *   q          — search query (word text or definition substring)
 *   level      — WordLevel filter
 *   difficulty — 1-5 filter
 *   limit      — max results, default 20, max 50
 *   offset     — pagination offset, default 0
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const q = searchParams.get('q')?.trim() ?? ''
  const levelRaw = searchParams.get('level') ?? ''
  const diffRaw = parseInt(searchParams.get('difficulty') ?? '', 10)
  const limitRaw = parseInt(searchParams.get('limit') ?? '20', 10)
  const offsetRaw = parseInt(searchParams.get('offset') ?? '0', 10)

  const level = VALID_LEVELS.includes(levelRaw as WordLevel) ? (levelRaw as WordLevel) : undefined
  const difficulty = (VALID_DIFFICULTY as readonly number[]).includes(diffRaw)
    ? (diffRaw as 1 | 2 | 3 | 4 | 5)
    : undefined
  const limit = Math.min(isNaN(limitRaw) ? 20 : Math.max(1, limitRaw), MAX_LIMIT)
  const offset = isNaN(offsetRaw) ? 0 : Math.max(0, offsetRaw)

  const results = await getDictionaryClient().searchWords(q, { level, difficulty, limit, offset })

  return NextResponse.json({
    ok: true,
    query: q,
    total: results.length,
    data: results,
  })
}
