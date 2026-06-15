/* ============================================================================
   /api/roots — 词根/词族串记（Task 3.3）
   基于 word_relations(type='derivative')：以词根(word_id)聚合派生词族，供
   「学一个词根 → 带出一串词」的学习视图（D9）。
     GET ?level=N  → 该档词族列表（按成员数降序）[{ root, word, level, count, members }]
     GET ?root=X   → 单个词族成员 + 轻量元数据（word/zh/phon）
   数据来源：word_relations + dictionary_words（均已在库）。
   ============================================================================ */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from '@/lib/supabase/client'

interface DerivRow { word_id: string; related_id: string }

function db() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })
}

// 拉全部 derivative 关系（按词根聚合）
async function loadFamilies(): Promise<Map<string, string[]>> {
  const fam = new Map<string, string[]>()
  const sb = db()
  for (let from = 0; from < 8000; from += 1000) {
    const { data, error } = await sb.from('word_relations')
      .select('word_id, related_id').eq('type', 'derivative')
      .range(from, from + 999)
    if (error) break
    const rows = (data ?? []) as DerivRow[]
    for (const r of rows) {
      const arr = fam.get(r.word_id) ?? []
      if (!arr.includes(r.related_id)) arr.push(r.related_id)
      fam.set(r.word_id, arr)
    }
    if (rows.length < 1000) break
  }
  return fam
}

export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: true, data: [] })
  const sp = req.nextUrl.searchParams
  const root = sp.get('root')?.toLowerCase().trim()
  const level = Number(sp.get('level'))
  const sb = db()

  try {
    // ── 单个词族详情 ──
    if (root) {
      const fam = await loadFamilies()
      const members = [root, ...(fam.get(root) ?? [])]
      const meta: Record<string, { word: string; zh: string; phon: string; level: number | null }> = {}
      for (let i = 0; i < members.length; i += 100) {
        const part = members.slice(i, i + 100)
        const { data } = await sb.from('dictionary_words')
          .select('id, word, phonetic_ipa, primary_level, dictionary_definitions(definition_zh, definition_en, order_index)')
          .in('id', part)
        for (const row of (data ?? []) as Record<string, unknown>[]) {
          const defs = ((row.dictionary_definitions ?? []) as { definition_zh: string | null; definition_en: string; order_index: number }[]).sort((a, b) => a.order_index - b.order_index)
          meta[String(row.id)] = {
            word: String(row.word), zh: defs[0]?.definition_zh ?? defs[0]?.definition_en ?? '',
            phon: (row.phonetic_ipa as string) ?? '', level: (row.primary_level as number) ?? null,
          }
        }
      }
      return NextResponse.json({ ok: true, data: { root, members: members.filter(m => meta[m]).map(m => ({ slug: m, ...meta[m] })) } })
    }

    // ── 词族列表（按档）──
    const fam = await loadFamilies()
    const roots = [...fam.keys()]
    // 词根档位/词形元数据
    const rootMeta = new Map<string, { word: string; level: number | null }>()
    for (let i = 0; i < roots.length; i += 100) {
      const part = roots.slice(i, i + 100)
      const { data } = await sb.from('dictionary_words').select('id, word, primary_level, levels').in('id', part)
      for (const row of (data ?? []) as { id: string; word: string; primary_level: number | null; levels: number[] | null }[]) {
        const inLevel = !level || row.primary_level === level || (row.levels ?? []).includes(level)
        if (inLevel) rootMeta.set(row.id, { word: row.word, level: row.primary_level })
      }
    }
    const families = roots
      .filter(r => rootMeta.has(r))
      .map(r => ({ root: r, word: rootMeta.get(r)!.word, level: rootMeta.get(r)!.level, count: (fam.get(r) ?? []).length, members: fam.get(r) ?? [] }))
      .filter(f => f.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 60)
    return NextResponse.json({ ok: true, data: families })
  } catch {
    return NextResponse.json({ ok: true, data: [] })
  }
}
