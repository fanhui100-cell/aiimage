import { NextResponse, type NextRequest } from 'next/server'
import { getDictionaryClient } from '@/lib/dictionary/dictionary-client'
import {
  collectRecommendedWords,
  normalizeRecommendationExam,
  normalizeRecommendationExclude,
  type RecommendationExcludeInput,
} from '@/lib/dictionary/recommendation'

interface RecommendRequestBody {
  band?: unknown
  level?: unknown
  exam?: unknown
  limit?: unknown
  exclude?: unknown
  syllabus?: unknown
}

function parseBool(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true'
}

function parseNumber(value: unknown, fallback: number): number {
  const parsed = Number(value ?? fallback)

  return Number.isFinite(parsed) ? parsed : fallback
}

function parseLevel(value: unknown): number | null {
  const parsed = Number(value)

  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 8 ? parsed : null  // 八档统一：上限 7→8（IELTS）
}

function parseLimit(value: unknown): number {
  const parsed = parseNumber(value, 5)

  return Math.min(50, Math.max(1, parsed))
}

function parseExclude(value: unknown): RecommendationExcludeInput {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }

  return null
}

async function respondWithRecommendations(params: {
  band: unknown
  level: unknown
  exam: unknown
  limit: unknown
  exclude: unknown
  syllabus: unknown
}) {
  const band = parseNumber(params.band, 5)
  const level = parseLevel(params.level)
  const exam = typeof params.exam === 'string' ? normalizeRecommendationExam(params.exam) : null
  const limit = parseLimit(params.limit)
  const exclude = normalizeRecommendationExclude(parseExclude(params.exclude))
  const syllabus = parseBool(params.syllabus)
  const data = await collectRecommendedWords(getDictionaryClient(), {
    band,
    level,
    exam,
    limit,
    exclude,
    syllabus,
  })

  return NextResponse.json({ ok: true, data })
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const excludeValues = sp.getAll('exclude')

  return respondWithRecommendations({
    band: sp.get('band'),
    level: sp.get('level'),
    exam: sp.get('exam'),
    limit: sp.get('limit'),
    exclude: excludeValues.length > 1 ? excludeValues : sp.get('exclude'),
    syllabus: sp.get('syllabus'),
  })
}

export async function POST(req: NextRequest) {
  let body: RecommendRequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  return respondWithRecommendations({
    band: body.band,
    level: body.level,
    exam: body.exam,
    limit: body.limit,
    exclude: body.exclude,
    syllabus: body.syllabus,
  })
}
