import { NextResponse, type NextRequest } from 'next/server'
import { getDictionaryClient } from '@/lib/dictionary/dictionary-client'
import { collectDictionarySearchResults } from '@/lib/dictionary/search-utils'
import type { CefrLevel, ExamTag, WordLevel } from '@/lib/dictionary/dictionary-types'

const VALID_LEVELS: WordLevel[] = ['beginner', 'elementary', 'intermediate', 'advanced', 'exam-prep']
const VALID_DIFFICULTY = [1, 2, 3, 4, 5] as const
const VALID_CEFR = new Set<string>(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
const VALID_EXAM = new Set<string>(['TOEFL', 'IELTS', 'CET-4', 'CET-6', 'KAOYAN', 'GAOKAO', 'SAT', 'GRE'])
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
  // P2：level 传数字 1-7 时按 7 档 ±1 过滤（与 WordLevel 字符串共用参数名，按值区分）
  const numericLevelRaw = parseInt(levelRaw, 10)
  const numericLevel = Number.isInteger(numericLevelRaw) && numericLevelRaw >= 1 && numericLevelRaw <= 7
    ? numericLevelRaw : undefined
  const difficulty = (VALID_DIFFICULTY as readonly number[]).includes(diffRaw)
    ? (diffRaw as 1 | 2 | 3 | 4 | 5)
    : undefined
  const limit = Math.min(isNaN(limitRaw) ? 20 : Math.max(1, limitRaw), MAX_LIMIT)
  const offset = isNaN(offsetRaw) ? 0 : Math.max(0, offsetRaw)

  // B7：cefr / exam 过滤（WordSearchOptions 不含 cefr，取大池后置过滤再分页）
  const cefrRaw = searchParams.get('cefr') ?? ''
  const examRaw = searchParams.get('exam') ?? ''
  const cefr = VALID_CEFR.has(cefrRaw) ? (cefrRaw as CefrLevel) : undefined
  const exam = VALID_EXAM.has(examRaw) ? (examRaw as ExamTag) : undefined

  const result = await collectDictionarySearchResults(getDictionaryClient(), {
    query: q,
    prefix: searchParams.get('prefix') || undefined,
    level,
    numericLevel,
    difficulty,
    cefr,
    exam,
    limit,
    offset,
  })

  return NextResponse.json({
    ok: true,
    query: q,
    prefix: searchParams.get('prefix') || undefined,
    total: result.total,
    data: result.data,
  })
}
