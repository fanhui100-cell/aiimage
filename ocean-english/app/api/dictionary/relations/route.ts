/**
 * GET /api/dictionary/relations?word=<slug>
 * P4：LexiGraph 数据源 — word_relations 双向查询 + 词形家族根反查 + 关联词中文。
 *
 * 返回：
 *   root        词形家族词根（center 是派生词时 FORM_PARENT 反查，否则为自身/null）
 *   relations   [{ type, a, b, note }]（a→b 与库中 word_id→related_id 一致）
 *   words       { [slug]: { word, zh, phon, pos, levels } } 所有涉及词的轻量元数据
 */
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from '@/lib/supabase/client'
import { NextResponse, type NextRequest } from 'next/server'

interface RelRow { word_id: string; related_id: string; type: string; note: string | null }

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('word')?.toLowerCase().trim()
  // 批量模式（记忆图谱语义边）：?words=a,b,c（≤80）→ 仅这些词之间的关系
  const batch = req.nextUrl.searchParams.get('words')?.toLowerCase().split(',').map(s => s.trim()).filter(Boolean).slice(0, 80)
  if (!slug && !batch?.length) return NextResponse.json({ ok: false, error: 'missing_word' }, { status: 400 })
  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: true, data: { root: null, relations: [], words: {} } })
  }

  try {
    const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })

    if (batch?.length) {
      const { data: rows } = await db
        .from('word_relations')
        .select('word_id, related_id, type, note')
        .in('word_id', batch)
        .in('related_id', batch)
        .limit(400)
      return NextResponse.json({
        ok: true,
        data: { root: null, relations: (rows ?? []).map(r => ({ type: r.type, a: r.word_id, b: r.related_id, note: r.note })), words: {} },
      })
    }
    if (!slug) return NextResponse.json({ ok: false, error: 'missing_word' }, { status: 400 })

    // 双向取 center 的关系
    const { data: direct, error: e1 } = await db
      .from('word_relations')
      .select('word_id, related_id, type, note')
      .or(`word_id.eq.${slug},related_id.eq.${slug}`)
      .limit(120)
    if (e1) throw e1

    let relations: RelRow[] = direct ?? []

    // 词形家族：center 是派生词（derivative 的 related_id）→ 反查词根 + 兄弟
    const parentRel = relations.find(r => r.type === 'derivative' && r.related_id === slug)
    const root = parentRel ? parentRel.word_id : (relations.some(r => r.type === 'derivative' && r.word_id === slug) ? slug : null)
    if (root && root !== slug) {
      const { data: sibs } = await db
        .from('word_relations')
        .select('word_id, related_id, type, note')
        .eq('word_id', root)
        .eq('type', 'derivative')
        .limit(40)
      const seen = new Set(relations.map(r => `${r.word_id}|${r.related_id}|${r.type}`))
      for (const s of sibs ?? []) {
        const k = `${s.word_id}|${s.related_id}|${s.type}`
        if (!seen.has(k)) { relations.push(s); seen.add(k) }
      }
    }

    // P2 fix (cc-full-project-review-2026-07-05): word_relations 无 antonym 行；反义词存于 dictionary_antonyms(text)。
    // 补入 center 的反义为 'antonym' 关系，使 /relations 语义完整（LexiGraph 反义扇区/记忆图谱据此渲染），
    // 与词详情 /api/dictionary/word 的 word.antonyms 口径一致。additive、只读、失败不影响其余关系。
    const { data: antRows } = await db
      .from('dictionary_antonyms')
      .select('antonym, order_index')
      .eq('word_id', slug)
      .order('order_index', { ascending: true })
      .limit(12)
    for (const a of (antRows ?? []) as { antonym: string | null }[]) {
      const other = (a.antonym ?? '').toLowerCase().trim()
      if (!other || other === slug) continue
      if (relations.some(r => r.type === 'antonym' && (r.related_id === other || r.word_id === other))) continue
      relations.push({ word_id: slug, related_id: other, type: 'antonym', note: null })
    }

    // 每类截断（易混每词 ≤3 在生成端已保证；这里防御性整体截断）
    const byType = new Map<string, RelRow[]>()
    for (const r of relations) {
      const arr = byType.get(r.type) ?? []
      if (arr.length < 24) arr.push(r)
      byType.set(r.type, arr)
    }
    relations = [...byType.values()].flat()

    // 关联词轻量元数据（词形/中文/音标/档位）
    const slugs = [...new Set(relations.flatMap(r => [r.word_id, r.related_id]).concat(slug))]
    const words: Record<string, { word: string; zh: string; phon: string; pos: string; levels: number[] }> = {}
    for (let i = 0; i < slugs.length; i += 100) {
      const part = slugs.slice(i, i + 100)
      const { data: rows } = await db
        .from('dictionary_words')
        .select('id, word, phonetic_ipa, part_of_speech, levels, dictionary_definitions(definition_zh, definition_en, part_of_speech, order_index)')
        .in('id', part)
      for (const row of rows ?? []) {
        const defs = (row.dictionary_definitions ?? []) as { definition_zh: string | null; definition_en: string; part_of_speech: string; order_index: number }[]
        defs.sort((a, b) => a.order_index - b.order_index)
        words[row.id] = {
          word: row.word,
          zh: defs[0]?.definition_zh ?? defs[0]?.definition_en ?? '',
          phon: row.phonetic_ipa ?? '',
          pos: defs[0]?.part_of_speech ?? row.part_of_speech ?? '',
          levels: row.levels ?? [],
        }
      }
    }

    return NextResponse.json({
      ok: true,
      data: { root: root === slug ? slug : root, relations: relations.map(r => ({ type: r.type, a: r.word_id, b: r.related_id, note: r.note })), words },
    })
  } catch {
    return NextResponse.json({ ok: true, data: { root: null, relations: [], words: {} } })
  }
}
