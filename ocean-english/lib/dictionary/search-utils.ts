import type { CefrLevel, DictionaryClient, DictionaryWord, ExamTag, WordLevel } from './dictionary-types'

const SEARCH_PAGE_SIZE = 500
const SEARCH_MAX_WORDS = 50000

export interface DictionarySearchParams {
  query: string
  prefix?: string
  level?: WordLevel
  numericLevel?: number
  difficulty?: 1 | 2 | 3 | 4 | 5
  cefr?: CefrLevel
  exam?: ExamTag
  limit: number
  offset: number
}

export interface DictionarySearchResult {
  total: number
  data: DictionaryWord[]
}

function matchesPostFilters(word: DictionaryWord, params: DictionarySearchParams): boolean {
  if (params.cefr && word.cefrLevel !== params.cefr) return false
  if (params.exam && !word.examTags.includes(params.exam)) return false
  return true
}

export async function collectDictionarySearchResults(
  client: DictionaryClient,
  params: DictionarySearchParams,
): Promise<DictionarySearchResult> {
  const safeOffset = Math.max(0, Math.floor(params.offset))
  const safeLimit = Math.max(1, Math.floor(params.limit))
  const data: DictionaryWord[] = []
  let total = 0

  for (let offset = 0; offset < SEARCH_MAX_WORDS; offset += SEARCH_PAGE_SIZE) {
    const batch = await client.searchWords(params.query, {
      level: params.level,
      prefix: params.prefix,
      numericLevel: params.numericLevel,
      difficulty: params.difficulty,
      examTag: params.cefr ? undefined : params.exam,
      limit: SEARCH_PAGE_SIZE,
      offset,
    })
    if (!batch.length) break

    for (const word of batch) {
      if (!matchesPostFilters(word, params)) continue
      if (total >= safeOffset && data.length < safeLimit) data.push(word)
      total += 1
    }

    if (batch.length < SEARCH_PAGE_SIZE) break
  }

  return { total, data }
}
