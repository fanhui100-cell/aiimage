import { NextResponse, type NextRequest } from 'next/server'
import { getDictionaryClient } from '@/lib/dictionary/dictionary-client'
import type { CefrLevel, ExamTag } from '@/lib/dictionary/dictionary-types'

/**
 * GET /api/dictionary/recommend?band=6&exam=CET-6&exclude=a,b,c&limit=5
 *
 * Public endpoint — 今日包个性化推荐（spec A5-1）。
 * band → CEFR 窗口（band±1 对应的 CEFR 级），exam 命中优先，
 * 再按 frequencyRank 升序；exclude 排除已在学习库的词。
 */

const BAND_CEFR: Record<number, CefrLevel> = {
  1: 'A1', 2: 'A2', 3: 'B1', 4: 'B1', 5: 'B2', 6: 'B2', 7: 'C1', 8: 'C1',
}

function bandToCefrWindow(band: number): CefrLevel[] {
  const clamped = [band - 1, band, band + 1].map(b => Math.min(8, Math.max(1, b)))
  return [...new Set(clamped.map(b => BAND_CEFR[b]))]
}

const VALID_EXAM_TAGS = new Set<string>([
  'TOEFL', 'IELTS', 'CET-4', 'CET-6', 'KAOYAN', 'GAOKAO', 'SAT', 'GRE',
])

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const bandRaw = Number(sp.get('band') ?? 5)
  const band = Number.isFinite(bandRaw) ? bandRaw : 5
  const examRaw = sp.get('exam')
  const exam = examRaw && VALID_EXAM_TAGS.has(examRaw) ? (examRaw as ExamTag) : null
  const exclude = new Set((sp.get('exclude') ?? '').split(',').filter(Boolean))
  const limitRaw = Number(sp.get('limit') ?? 5)
  const limit = Math.min(50, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 5))

  const cefrs = bandToCefrWindow(band)
  const pool = await getDictionaryClient().searchWords('', { limit: 200 })
  const picks = pool
    .filter(w => !exclude.has(w.id))
    .filter(w => !w.cefrLevel || cefrs.includes(w.cefrLevel))
    .sort((a, b) =>
      Number(exam ? b.examTags.includes(exam) : 0) - Number(exam ? a.examTags.includes(exam) : 0)
      || (a.frequencyRank ?? 9e9) - (b.frequencyRank ?? 9e9))
    .slice(0, limit)

  return NextResponse.json({ ok: true, data: picks })
}
