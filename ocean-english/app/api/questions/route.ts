import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getQuestionFetchWindow,
  normalizeQuestionRowsForClient,
  questionTypeAliases,
} from '@/lib/question-bank/question-api-utils'
import {
  DEPRECATED_QUESTION_TYPES,
  isDeprecatedQuestionType,
} from '@/lib/question-bank/question-type-taxonomy'

// PostgREST `not in` 过滤值：退役题型（antonym_choice / cet_cloze）。Phase 0A。
const DEPRECATED_TYPE_FILTER = `(${DEPRECATED_QUESTION_TYPES.join(',')})`

const QUESTION_SELECT = [
  'id',
  'type',
  'input_mode',
  'word_id',
  'normalized_word',
  'prompt',
  'prompt_zh',
  'choices',
  'answer',
  'answer_text',
  'hint',
  'audio_ref',
  'explanation_zh',
  'exam_tags',
  'theme_tags',
].join(',')

function parseLimit(value: string | null): number {
  const parsed = Number(value ?? 12)
  // 上限 200：支持专练「按题数」最多 200 题（原 50 会把 100/200 截到 50）
  return Math.max(1, Math.min(Number.isFinite(parsed) ? parsed : 12, 200))
}

function shuffle<T>(items: T[]): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[items[index], items[swapIndex]] = [items[swapIndex], items[index]]
  }

  return items
}

// 给每题附上该词的中文释义 word_zh（反馈区「先讲词义再讲要点」用）。一次批量查询，仅 ~12 个 word_id。
const cleanZh = (z: string) => z.replace(/^\[[^\]]*\]/, '').replace(/^[a-z]+\.\s*/i, '').split(/[;；\n]/)[0].trim().slice(0, 40)
async function attachMeanings(
  db: Awaited<ReturnType<typeof createClient>>,
  rows: Record<string, unknown>[],
): Promise<Record<string, unknown>[]> {
  const ids = [...new Set(rows.map((r) => String(r.word_id ?? '')).filter(Boolean))]
  if (!ids.length) return rows
  const best = new Map<string, { oi: number; zh: string }>()
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await db
      .from('dictionary_definitions')
      .select('word_id, definition_zh, order_index')
      .in('word_id', ids.slice(i, i + 200))
    for (const d of (data ?? []) as { word_id: string; definition_zh: string | null; order_index: number }[]) {
      if (!d.definition_zh) continue
      const cur = best.get(d.word_id)
      if (!cur || (d.order_index ?? 99) < cur.oi) best.set(d.word_id, { oi: d.order_index ?? 99, zh: d.definition_zh })
    }
  }
  return rows.map((r) => {
    const hit = best.get(String(r.word_id ?? ''))
    return hit ? { ...r, word_zh: cleanZh(hit.zh) } : r
  })
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const word = sp.get('word')?.toLowerCase().trim()
  const level = sp.get('level')
  const exam = sp.get('exam')
  const type = sp.get('type')?.trim()
  const requestedTypes = sp.get('types')?.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 12)
  // Phase 0A：默认/多题型题池过滤退役题型（antonym_choice / cet_cloze），不再主动抽取。
  const types = requestedTypes?.filter((item) => !isDeprecatedQuestionType(item))
  const limit = parseLimit(sp.get('limit'))

  try {
    // 显式请求退役题型 → 返回空载荷（HTTP 200），不报 500，不静默回退到其他题型。
    if (type && isDeprecatedQuestionType(type)) {
      return NextResponse.json({ ok: true, data: [] })
    }
    // types 仅含退役题型（过滤后为空）→ 同样返回空载荷，而不是落到默认随机池。
    if (requestedTypes?.length && !types?.length) {
      return NextResponse.json({ ok: true, data: [] })
    }

    const db = await createClient()

    if (!word && types?.length) {
      // 每题型各取一个候选池（窗口足够大），再轮转填充到 limit。
      // 修复 underfill：之前按 word 全局去重 + 各 type 只取一小段，跨题型同词重叠→去重后不够。
      const pools: Record<string, unknown>[][] = []
      const winSize = getQuestionFetchWindow(limit).to + 1   // 目标候选池大小 = limit*8（≤500）
      const SUBWINDOWS = 4                                    // id 按词字母排序：单段=单字母，故跨 4 个随机段取再合并
      for (const questionType of types) {
        const aliases = questionTypeAliases(questionType)
        const filtered = () => {
          let qb = db.from('question_bank').select(QUESTION_SELECT).eq('status', 'active').eq('is_reviewed', true)
          qb = aliases.length > 1 ? qb.in('type', aliases) : qb.eq('type', questionType)
          if (exam) qb = qb.contains('exam_tags', [exam])
          if (level) qb = qb.contains('theme_tags', [`lv${level}`])
          return qb
        }
        let cq = db.from('question_bank').select('id', { count: 'exact', head: true }).eq('status', 'active').eq('is_reviewed', true)
        cq = aliases.length > 1 ? cq.in('type', aliases) : cq.eq('type', questionType)
        if (exam) cq = cq.contains('exam_tags', [exam])
        if (level) cq = cq.contains('theme_tags', [`lv${level}`])
        const { count } = await cq
        const total = count ?? 0
        const merged: Record<string, unknown>[] = []
        if (total <= winSize) {
          const { data } = await filtered().order('id', { ascending: true }).range(0, Math.max(total, 1) - 1)
          merged.push(...((data ?? []) as unknown as Record<string, unknown>[]))
        } else {
          const per = Math.ceil(winSize / SUBWINDOWS)
          const buckets = new Set<number>()
          for (let s = 0; s < SUBWINDOWS; s += 1) {
            const off = Math.floor(Math.random() * Math.max(1, total - per))
            const bucket = Math.floor(off / per)
            if (buckets.has(bucket)) continue   // 跳过落到同一段的重复窗口
            buckets.add(bucket)
            const { data } = await filtered().order('id', { ascending: true }).range(off, off + per - 1)
            merged.push(...((data ?? []) as unknown as Record<string, unknown>[]))
          }
        }
        pools.push(shuffle(normalizeQuestionRowsForClient(merged)))
      }
      const out: Record<string, unknown>[] = []
      const seenId = new Set<string>(); const seenWord = new Set<string>()
      // 第一轮：题型轮转，按 word 去重（保证多样性）
      let progress = true
      while (out.length < limit && progress) {
        progress = false
        for (const pool of pools) {
          const next = pool.find(r => !seenId.has(String(r.id)) && !seenWord.has(String(r.normalized_word ?? '')))
          if (next) { out.push(next); seenId.add(String(next.id)); seenWord.add(String(next.normalized_word ?? '')); progress = true; if (out.length >= limit) break }
        }
      }
      // 第二轮：仍不足则放宽 word 去重（同词不同题型/题目可重复），只按题目 id 去重，补满 limit
      if (out.length < limit) {
        for (const pool of pools) { for (const r of pool) { if (out.length >= limit) break; if (!seenId.has(String(r.id))) { out.push(r); seenId.add(String(r.id)) } } if (out.length >= limit) break }
      }
      return NextResponse.json({ ok: true, data: await attachMeanings(db, out.slice(0, limit)) })
    }

    let q = db.from('question_bank').select(QUESTION_SELECT).eq('status', 'active').eq('is_reviewed', true)
    if (word) q = q.eq('normalized_word', word)
    if (type) {
      const aliases = questionTypeAliases(type)
      q = aliases.length > 1 ? q.in('type', aliases) : q.eq('type', type)
    } else {
      // 无显式 type：默认随机池与按词查询都排除退役题型（Phase 0A）。
      q = q.not('type', 'in', DEPRECATED_TYPE_FILTER)
    }
    if (exam) q = q.contains('exam_tags', [exam])
    if (level) q = q.contains('theme_tags', [`lv${level}`])

    if (word) {
      q = q.limit(limit * 2)
    } else {
      const winSize = getQuestionFetchWindow(limit).to + 1
      // 随机偏移窗口（同 types 路径）：避免单题型每次只取 id 最小段
      let cq = db.from('question_bank').select('id', { count: 'exact', head: true }).eq('status', 'active').eq('is_reviewed', true)
      if (type) { const al = questionTypeAliases(type); cq = al.length > 1 ? cq.in('type', al) : cq.eq('type', type) }
      else { cq = cq.not('type', 'in', DEPRECATED_TYPE_FILTER) }   // 计数与取题口径一致：默认排除退役题型
      if (exam) cq = cq.contains('exam_tags', [exam])
      if (level) cq = cq.contains('theme_tags', [`lv${level}`])
      const { count } = await cq
      const total = count ?? 0
      const offset = total > winSize ? Math.floor(Math.random() * (total - winSize)) : 0
      q = q.order('id', { ascending: true }).range(offset, offset + winSize - 1)
    }

    const { data, error } = await q
    if (error) return NextResponse.json({ ok: false, data: [] }, { status: 200 })

    // 取到的是放大窗口（limit*8 / limit*2），需打乱后截到 limit，避免调用方传 limit=5 实拿 40 条
    const rows = shuffle((data ?? []) as unknown as Record<string, unknown>[]).slice(0, limit)
    return NextResponse.json({ ok: true, data: await attachMeanings(db, normalizeQuestionRowsForClient(rows)) })
  } catch {
    return NextResponse.json({ ok: false, data: [] }, { status: 200 })
  }
}
