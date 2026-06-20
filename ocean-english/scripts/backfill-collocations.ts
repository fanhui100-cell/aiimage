/* ════════════════════════════════════════════════════════════════════════
   backfill-collocations.ts — 回填 dictionary_collocations（现 0 条）
   数据源 = dictionary_words.phrases（ECDICT 词组，7869 词 / 30868 条）。
   词条详情「常见搭配」读 dictionary_collocations，之前空 → 搭配区不显示。
   映射：phrase→phrase，translation→example_zh，order_index 按数组序。
   用法：npx tsx scripts/backfill-collocations.ts [--apply]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'; import { readFileSync } from 'fs'; import { randomUUID } from 'crypto'
const env = readFileSync('.env.local', 'utf8'); const g = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(g('NEXT_PUBLIC_SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'))
const APPLY = process.argv.includes('--apply')
const WORDRE = /[a-zA-Z]/

async function main() {
  const { count: existing } = await db.from('dictionary_collocations').select('*', { count: 'exact', head: true })
  console.log(`dictionary_collocations 现有 ${existing}　${APPLY ? 'APPLY' : 'dry-run'}`)
  const rows: Record<string, unknown>[] = []
  let words = 0
  for (let f = 0; ; f += 1000) {
    const { data } = await db.from('dictionary_words').select('id, phrases').range(f, f + 999)
    const r = (data ?? []) as { id: string; phrases: { phrase?: string; translation?: string }[] | null }[]
    if (!r.length) break
    for (const w of r) {
      const ps = Array.isArray(w.phrases) ? w.phrases : []
      const seen = new Set<string>(); let oi = 0; let added = false
      for (const p of ps) {
        const phrase = String(p?.phrase ?? '').trim()
        if (!phrase || !WORDRE.test(phrase) || seen.has(phrase.toLowerCase())) continue
        seen.add(phrase.toLowerCase())
        rows.push({ id: randomUUID(), word_id: w.id, phrase, example_en: null, example_zh: String(p?.translation ?? '').trim() || null, order_index: oi++ })
        added = true
      }
      if (added) words++
    }
    if (r.length < 1000) break
  }
  console.log(`可回填 ${rows.length} 条搭配（覆盖 ${words} 词）`)
  console.log('样例:', rows.slice(0, 5).map(r => `${r.word_id}:${r.phrase}`).join(' | '))
  if (!APPLY) { console.log('\ndry-run。加 --apply 写入。'); return }
  let n = 0
  for (let i = 0; i < rows.length; i += 500) { const { error } = await db.from('dictionary_collocations').insert(rows.slice(i, i + 500)); if (error) { console.error('insert err', error.message); process.exit(1) } n += rows.slice(i, i + 500).length; process.stdout.write(`\r写入 ${n}/${rows.length}`) }
  console.log(`\n已回填 ${n} 条搭配到 dictionary_collocations。`)
}
main().catch(e => { console.error('fatal', e?.message ?? e); process.exit(1) })
