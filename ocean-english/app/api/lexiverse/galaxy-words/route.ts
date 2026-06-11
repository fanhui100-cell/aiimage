/**
 * GET /api/lexiverse/galaxy-words?galaxy=<id>
 * 真词星池：按星系 filter 从词库取真词（≤260），并附 derivative 卫星（词形）。
 *
 * 取词策略（真实分类，不混档凑数）：
 *   ring   星系：primary_level = N（7 档星环，全量真词）
 *   exam   星系：tags ⋂ examTags（考试光柱）
 *   cefr   星系：cefr_level ∈ cefrLevels（能级阶梯）
 *   theme  星系：seed 词内存池按 themeTags 匹配（DB 词暂无主题标签——
 *               AI 标注批处理跑完后自动扩容；池小是真实现状）
 * 卫星：word_relations derivative（词根 → 派生词），每母星 ≤3。
 */
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from '@/lib/supabase/client'
import { ALL_GALAXIES } from '@/config/lexiverse-galaxies'
import { scoreWord } from '@/lib/lexiverse/lexiverse-word-filter'
import { getExpandedSeedAdapter } from '@/lib/dictionary/expanded-seed-adapter'
import { getCoreSeedAdapter } from '@/lib/dictionary/core-seed-adapter'
import { NextResponse, type NextRequest } from 'next/server'

const POOL_CAP = 260
const SAT_PER_WORD = 3

interface PoolWord {
  id: string
  word: string
  zh: string
  pos: string
  satellites: { word: string; zh: string }[]
}

// 进程内缓存（词池只随导入变化）：10 分钟；key = galaxyId#sector
const cache = new Map<string, { at: number; data: { galaxyId: string; sector: number; sectorCount: number; total: number; words: PoolWord[] } }>()
const TTL = 10 * 60 * 1000

interface DbRow {
  id: string
  word: string
  part_of_speech: string | null
  dictionary_definitions?: { definition_zh: string | null; definition_en: string; part_of_speech: string; order_index: number }[]
}

function mapRows(rows: DbRow[]): PoolWord[] {
  return rows.map(r => {
    const defs = [...(r.dictionary_definitions ?? [])].sort((a, b) => a.order_index - b.order_index)
    return {
      id: r.id,
      word: r.word,
      zh: defs[0]?.definition_zh ?? defs[0]?.definition_en ?? '',
      pos: defs[0]?.part_of_speech ?? r.part_of_speech ?? '',
      satellites: [],
    }
  })
}

export async function GET(req: NextRequest) {
  const galaxyId = req.nextUrl.searchParams.get('galaxy') ?? ''
  const galaxy = ALL_GALAXIES.find(g => g.id === galaxyId)
  if (!galaxy) return NextResponse.json({ ok: false, error: 'unknown_galaxy' }, { status: 404 })
  // 方案 A 星区分页：星系全量词按词频切片，每片 ≤POOL_CAP 颗星球；
  // 星区数 = ceil(total / POOL_CAP)，随词库增长自动增加
  const sectorRaw = parseInt(req.nextUrl.searchParams.get('sector') ?? '0', 10)
  const sector = Number.isInteger(sectorRaw) && sectorRaw >= 0 ? sectorRaw : 0

  const cacheKey = `${galaxyId}#${sector}`
  const hit = cache.get(cacheKey)
  if (hit && Date.now() - hit.at < TTL) return NextResponse.json({ ok: true, data: hit.data })

  const f = galaxy.filter
  let words: PoolWord[] = []
  let total = 0

  try {
    if (isSupabaseConfigured && (f.ringLevels?.length || f.examTags?.length || f.cefrLevels?.length)) {
      const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })
      const applyFilter = <T extends { in: (...a: never[]) => T; overlaps: (...a: never[]) => T }>(q0: T): T => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let q: any = q0
        if (f.ringLevels?.length) q = q.in('primary_level', f.ringLevels)
        if (f.examTags?.length) q = q.overlaps('tags', f.examTags)
        if (f.cefrLevels?.length) q = q.in('cefr_level', f.cefrLevels)
        if (f.difficultyLevels?.length) q = q.in('difficulty', f.difficultyLevels)
        return q
      }
      // 总数（星区数动态计算）
      const { count } = await applyFilter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        db.from('dictionary_words').select('id', { count: 'exact', head: true }) as any)
      total = count ?? 0
      const { data, error } = await applyFilter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        db.from('dictionary_words')
          .select('id, word, part_of_speech, dictionary_definitions(definition_zh, definition_en, part_of_speech, order_index)') as any)
        .order('frequency_rank', { ascending: true, nullsFirst: false })
        .order('id', { ascending: true })
        .range(sector * POOL_CAP, sector * POOL_CAP + POOL_CAP - 1)
      if (!error && data?.length) words = mapRows(data as DbRow[])
    }

    // theme/custom 星系（或 DB 不可用）：seed 内存池按 scoreWord 真实匹配
    if (!words.length) {
      const pools = await Promise.all([
        getExpandedSeedAdapter().searchWords('', { limit: 9999 }),
        getCoreSeedAdapter().searchWords('', { limit: 9999 }),
      ])
      const seen = new Set<string>()
      for (const w of pools.flat()) {
        if (seen.has(w.id)) continue
        seen.add(w.id)
        if (scoreWord({ ...w, cefrLevel: w.cefrLevel ?? undefined }, f) == null) continue
        const def = w.definitions?.[0]
        words.push({
          id: w.id, word: w.word,
          zh: def?.definitionZh ?? def?.definitionEn ?? '',
          pos: def?.partOfSpeech ?? w.partOfSpeech ?? '',
          satellites: [],
        })
        if (words.length >= POOL_CAP) break
      }
      total = words.length
    }

    // ── 卫星：词池内词作词根的 derivative 派生词（真实词形关系）──
    if (isSupabaseConfigured && words.length) {
      const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })
      const byId = new Map(words.map(w => [w.id, w]))
      const ids = words.map(w => w.id)
      const satIds = new Set<string>()
      const satOf = new Map<string, string[]>()
      for (let i = 0; i < ids.length; i += 100) {
        const { data } = await db.from('word_relations')
          .select('word_id, related_id')
          .eq('type', 'derivative')
          .in('word_id', ids.slice(i, i + 100))
          .limit(600)
        for (const r of data ?? []) {
          const list = satOf.get(r.word_id) ?? []
          if (list.length >= SAT_PER_WORD || byId.has(r.related_id)) continue
          list.push(r.related_id)
          satOf.set(r.word_id, list)
          satIds.add(r.related_id)
        }
      }
      // 卫星中文
      const satZh = new Map<string, { zh: string }>()
      const satList = [...satIds]
      for (let i = 0; i < satList.length; i += 100) {
        const { data } = await db.from('dictionary_words')
          .select('id, dictionary_definitions(definition_zh, definition_en, order_index)')
          .in('id', satList.slice(i, i + 100))
        for (const r of data ?? []) {
          const defs = [...((r as DbRow).dictionary_definitions ?? [])].sort((a, b) => a.order_index - b.order_index)
          satZh.set(r.id, { zh: defs[0]?.definition_zh ?? defs[0]?.definition_en ?? '' })
        }
      }
      for (const [rootId, sats] of satOf) {
        const w = byId.get(rootId)
        if (!w) continue
        w.satellites = sats.map(s => ({ word: s, zh: satZh.get(s)?.zh ?? '' }))
      }
    }
  } catch { /* 任何失败 → 退回演示池（前端 fallback） */ }

  if (!words.length) return NextResponse.json({ ok: false, error: 'empty_pool' }, { status: 404 })

  const sectorCount = Math.max(1, Math.ceil(total / POOL_CAP))
  const data = { galaxyId, sector, sectorCount, total, words }
  cache.set(cacheKey, { at: Date.now(), data })
  return NextResponse.json({ ok: true, data })
}
