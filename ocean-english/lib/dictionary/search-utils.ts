import type { CefrLevel, DictionaryClient, DictionaryWord, ExamTag, WordLevel, WordSearchOptions } from './dictionary-types'

const SEARCH_PAGE_SIZE = 1000   // 与 PostgREST max-rows 对齐；仅回退分页路径用
const SEARCH_MAX_WORDS = 50000
const COUNT_TIMEOUT_MS = 8000   // 精确 count / 单页取数放宽超时，避免默认 2.5s 误杀把总数截断成整数倍

export interface DictionarySearchParams {
  query: string
  prefix?: string
  level?: WordLevel
  numericLevel?: number
  /** 3.4：按考试大纲成员过滤（levels 含该档）；词库「按等级」浏览用 */
  syllabusLevel?: number
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
  const baseOpts: WordSearchOptions = {
    level: params.level,
    prefix: params.prefix,
    numericLevel: params.numericLevel,
    syllabusLevel: params.syllabusLevel,
    difficulty: params.difficulty,
    examTag: params.cefr ? undefined : params.exam,   // cefr 走后置过滤；其余在 DB 端过滤
    adapterTimeoutMs: COUNT_TIMEOUT_MS,
  }

  // 快路径：无 cefr 后置过滤 ⇒ 所有过滤都在 DB ⇒ 单次精确 count + 单页取数。
  // 根治「翻全表逐页累加 + 2.5s 每页超时 → 总数被截成 500/1000 的整数倍」。
  if (!params.cefr && client.countWords) {
    const exact = await client.countWords(params.query, baseOpts)
    if (exact != null) {
      const data = await client.searchWords(params.query, { ...baseOpts, limit: safeLimit, offset: safeOffset })
      return { total: exact, data }
    }
  }

  // 回退路径：countWords 不可用（seed/未配置）或有 cefr 后置过滤 → 分页累加（带放宽超时）。
  const data: DictionaryWord[] = []
  let total = 0
  for (let offset = 0; offset < SEARCH_MAX_WORDS; offset += SEARCH_PAGE_SIZE) {
    const batch = await client.searchWords(params.query, { ...baseOpts, limit: SEARCH_PAGE_SIZE, offset })
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
