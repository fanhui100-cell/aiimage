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

// 已知成员里的最长公共词干（小写）
function commonPrefix(words: string[]): string {
  const ws = words.filter(Boolean).map(w => w.toLowerCase())
  if (!ws.length) return ''
  let p = ws[0]
  for (const w of ws.slice(1)) {
    let i = 0
    while (i < p.length && i < w.length && p[i] === w[i]) i++
    p = p.slice(0, i)
    if (!p) break
  }
  return p
}
// dictionary_words 行 → 轻量元数据
function metaRow(row: Record<string, unknown>): { word: string; zh: string; phon: string; level: number | null } {
  const defs = ((row.dictionary_definitions ?? []) as { definition_zh: string | null; definition_en: string; order_index: number }[]).sort((a, b) => a.order_index - b.order_index)
  return {
    word: String(row.word), zh: defs[0]?.definition_zh ?? defs[0]?.definition_en ?? '',
    phon: (row.phonetic_ipa as string) ?? '', level: (row.primary_level as number) ?? null,
  }
}
const DW_SELECT = 'id, word, phonetic_ipa, primary_level, dictionary_definitions(definition_zh, definition_en, order_index)'

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
  let root = sp.get('root')?.toLowerCase().trim()
  const wordParam = sp.get('word')?.toLowerCase().trim()   // 从某词进入：定位它所属词族（词根或成员）
  const level = Number(sp.get('level'))
  const sb = db()

  try {
    // ?word= → 找出含该词的词族根；找不到则把该词自身当作单成员族返回
    if (!root && wordParam) {
      const fam = await loadFamilies()
      let found: string | undefined
      for (const [rk, mem] of fam) { if (rk === wordParam || mem.includes(wordParam)) { found = rk; break } }
      root = found ?? wordParam
    }
    // ── 单个词族详情 ──
    if (root) {
      const fam = await loadFamilies()
      let members = [root, ...(fam.get(root) ?? [])]
      const meta: Record<string, { word: string; zh: string; phon: string; level: number | null }> = {}
      for (let i = 0; i < members.length; i += 100) {
        const part = members.slice(i, i + 100)
        const { data } = await sb.from('dictionary_words').select(DW_SELECT).in('id', part)
        for (const row of (data ?? []) as Record<string, unknown>[]) meta[String(row.id)] = metaRow(row)
      }
      // #5 返修：derivative 关系稀疏（~3/词根），词库里其实有更多同族词形。
      // 用「已知成员的最长公共词干」补同前缀同族词；词干 ≥6 才扩展，避免 colon→colonel 之类误并。
      const stem = commonPrefix(members.map(m => meta[m]?.word).filter(Boolean) as string[])
      if (stem.length >= 6) {
        const esc = stem.replace(/[\\%_]/g, '\\$&')
        const { data: pre } = await sb.from('dictionary_words').select(DW_SELECT).ilike('word', `${esc}%`).limit(40)
        const extra: string[] = []
        for (const row of (pre ?? []) as Record<string, unknown>[]) {
          const id = String(row.id)
          if (!meta[id]) { meta[id] = metaRow(row); extra.push(id) }
        }
        members = [...members, ...extra]
      }
      members = members.slice(0, 30)
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
