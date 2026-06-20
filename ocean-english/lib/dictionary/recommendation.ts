import type { CefrLevel, DictionaryClient, DictionaryWord, ExamTag } from './dictionary-types'

const BAND_CEFR: Record<number, CefrLevel> = {
  1: 'A1',
  2: 'A2',
  3: 'B1',
  4: 'B1',
  5: 'B2',
  6: 'B2',
  7: 'C1',
  8: 'C1',
}

const RECOMMENDATION_PAGE_SIZE = 200
const RECOMMENDATION_MAX_PAGES = 25

export const VALID_RECOMMEND_EXAM_TAGS = new Set<ExamTag>([
  'TOEFL',
  'IELTS',
  'CET-4',
  'CET-6',
  'KAOYAN',
  'GAOKAO',
  'SAT',
  'GRE',
])

export type RecommendationExcludeInput = string | readonly string[] | ReadonlySet<string> | null | undefined

export interface RecommendationParams {
  band: number
  level?: number | null
  exam?: ExamTag | null
  limit: number
  exclude?: RecommendationExcludeInput
  /** 3.4：true = 按考试大纲全量选词（levels 含 level，如考研 5047 词）；
   *  false/缺省 = 按本档原生词（primary_level = level，逐档进阶） */
  syllabus?: boolean
}

// P0：停用词（冠词/介词/连词/代词等功能词）不作为新词推荐目标
const FUNCTION_POS = /\b(art|article|prep|preposition|conj|conjunction|pron|pronoun|det|determiner|aux|auxiliary)\b/i
function isStudyWord(word: DictionaryWord): boolean {
  return !FUNCTION_POS.test((word.partOfSpeech ?? '').toLowerCase())
}

export function bandToCefrWindow(band: number): CefrLevel[] {
  const clamped = [band - 1, band, band + 1].map((value) => Math.min(8, Math.max(1, value)))

  return [...new Set(clamped.map((value) => BAND_CEFR[value]))]
}

export function normalizeRecommendationExclude(input: RecommendationExcludeInput): Set<string> {
  if (!input) return new Set()

  const values = typeof input === 'string'
    ? input.split(',')
    : input instanceof Set
      ? [...input]
      : [...input]

  return new Set(values.map((value) => value.trim()).filter(Boolean))
}

export function normalizeRecommendationExam(raw: string | null | undefined): ExamTag | null {
  const normalized = raw?.trim().toUpperCase()
  if (!normalized) return null

  return VALID_RECOMMEND_EXAM_TAGS.has(normalized as ExamTag) ? (normalized as ExamTag) : null
}

function isLevelMatch(word: DictionaryWord, level: number | null, cefrs: CefrLevel[]): boolean {
  if (level != null && word.levels?.length) {
    return word.levels.some((wordLevel) => Math.abs(wordLevel - level) <= 1)
  }

  return !word.cefrLevel || cefrs.includes(word.cefrLevel)
}

function exactLevelScore(word: DictionaryWord, level: number | null): number {
  return level != null && word.levels?.includes(level) ? 1 : 0
}

function examScore(word: DictionaryWord, exam: ExamTag | null): number {
  return exam && word.examTags.includes(exam) ? 1 : 0
}

export async function collectRecommendedWords(
  client: DictionaryClient,
  params: RecommendationParams,
): Promise<DictionaryWord[]> {
  const safeLimit = Math.min(50, Math.max(1, Math.floor(params.limit)))
  const safeBand = Number.isFinite(params.band) ? params.band : 5
  const level = params.level ?? null
  const exam = params.exam ?? null
  const cefrs = bandToCefrWindow(safeBand)
  const exclude = normalizeRecommendationExclude(params.exclude)
  const seen = new Set<string>()
  const candidates: DictionaryWord[] = []

  for (let page = 0; page < RECOMMENDATION_MAX_PAGES && candidates.length < safeLimit; page += 1) {
    const offset = page * RECOMMENDATION_PAGE_SIZE
    // P0：level 已知 → 取本档原生词（primary_level）+ 高频优先（与题库同口径）；
    // 仅 band（无 level）→ 维持原默认排序，靠 cefr 窗口过滤
    const batch = await client.searchWords('', {
      limit: RECOMMENDATION_PAGE_SIZE,
      offset,
      ...(level != null
        ? (params.syllabus
            ? { syllabusLevel: level, minPrimaryLevel: Math.max(1, level - 2), orderBy: 'frequency' as const }
            : { primaryLevel: level, orderBy: 'frequency' as const })
        : {}),
    })
    if (!batch.length) break

    for (const word of batch) {
      if (seen.has(word.id) || exclude.has(word.id) || !isLevelMatch(word, level, cefrs) || !isStudyWord(word)) continue
      seen.add(word.id)
      candidates.push(word)
    }

    if (batch.length < RECOMMENDATION_PAGE_SIZE) break
  }

  return candidates
    .sort((a, b) =>
      exactLevelScore(b, level) - exactLevelScore(a, level)
      || examScore(b, exam) - examScore(a, exam)
      || (a.frequencyRank ?? 9e9) - (b.frequencyRank ?? 9e9))
    .slice(0, safeLimit)
}
