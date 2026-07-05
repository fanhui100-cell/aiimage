/* ════════════════════════════════════════════════════════════════════════
   stats-all.ts — 全量数据统计：单词 / 释义 / 同义 / 反义 / 词族 / 词源 / 助记 / 题库
   题库按 题型 × 等级(lv1-7) 出矩阵。只读。
   用法：npx tsx scripts/stats-all.ts
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'; import { readFileSync } from 'fs'
const env = readFileSync('.env.local', 'utf8'); const g = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(g('NEXT_PUBLIC_SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'))
const LVN: Record<number, string> = { 1: '中考', 2: '高考', 3: 'CET4', 4: 'CET6', 5: '考研', 6: '托福', 7: 'SAT', 8: '雅思' }
async function cnt(t: string, f?: (q: any) => any) { let q: any = db.from(t).select('*', { count: 'exact', head: true }); if (f) q = f(q); const { count } = await q; return count ?? 0 }
async function pageCol<T>(t: string, c: string): Promise<T[]> { const o: T[] = []; for (let f = 0; ; f += 1000) { const { data } = await db.from(t).select(c).range(f, f + 999); const r = (data ?? []) as T[]; o.push(...r); if (r.length < 1000) break } return o }
async function distinctWordIds(t: string): Promise<number> { const s = new Set<string>(); for (const r of await pageCol<{ word_id: string }>(t, 'word_id')) s.add(r.word_id); return s.size }
const pad = (s: any, n: number) => String(s).padEnd(n)
const padL = (s: any, n: number) => String(s).padStart(n)

async function main() {
  const t0 = Date.now()
  const words = await pageCol<{ id: string; primary_level: number | null }>('dictionary_words', 'id, primary_level')
  const byLv = new Map<number, number>(); let noLv = 0
  for (const w of words) { if (w.primary_level == null) noLv++; else byLv.set(w.primary_level, (byLv.get(w.primary_level) ?? 0) + 1) }
  const W = words.length

  const defs = await cnt('dictionary_definitions')
  const syn = await cnt('dictionary_synonyms'), ant = await cnt('dictionary_antonyms')
  const synW = await distinctWordIds('dictionary_synonyms'), antW = await distinctWordIds('dictionary_antonyms')
  const ety = await cnt('dictionary_etymology'), mnem = await cnt('word_mnemonics')   // App 读 word_mnemonics
  const etyW = await distinctWordIds('dictionary_etymology'), mnemW = await distinctWordIds('word_mnemonics')
  const relTypes = ['derivative', 'confusable-form', 'synonym-candidate']
  const rel: Record<string, number> = {}; for (const t of relTypes) rel[t] = await cnt('word_relations', (q: any) => q.eq('type', t))

  // 题库矩阵
  const qb = await pageCol<{ type: string; theme_tags: string[] }>('question_bank', 'type, theme_tags')
  const types = new Map<string, number[]>()  // type -> [lv1..lv8] counts
  const lvTot = [0, 0, 0, 0, 0, 0, 0, 0]
  for (const r of qb) {
    const lvTag = (r.theme_tags ?? []).map(x => /^lv([1-8])$/.exec(x)?.[1]).find(Boolean)
    const lv = lvTag ? Number(lvTag) : 0
    if (!types.has(r.type)) types.set(r.type, [0, 0, 0, 0, 0, 0, 0, 0])
    if (lv >= 1 && lv <= 8) { types.get(r.type)![lv - 1]++; lvTot[lv - 1]++ }
  }

  // ── 输出 ──
  console.log('\n╔══════════════ 词渊 LexiVerse 全量数据统计 ══════════════╗\n')
  console.log('【词库】 单词 ' + W + ' 个')
  console.log('  按主等级: ' + [1, 2, 3, 4, 5, 6, 7, 8].map(l => `${LVN[l]} ${byLv.get(l) ?? 0}`).join(' · ') + (noLv ? ` · 未分级 ${noLv}` : ''))
  console.log('  释义条数 ' + defs)
  console.log('\n【词汇资料覆盖】(分母=' + W + ' 词)')
  const cov = (n: number) => `${n} 词 (${(n / W * 100).toFixed(1)}%)`
  console.log('  同义词   ' + syn + ' 条，覆盖 ' + cov(synW))
  console.log('  反义词   ' + ant + ' 条，覆盖 ' + cov(antW))
  console.log('  词源     ' + ety + ' 条，覆盖 ' + cov(etyW))
  console.log('  词根记忆 ' + mnem + ' 条，覆盖 ' + cov(mnemW))
  console.log('\n【词形/关系 word_relations】')
  console.log('  词族(derivative) ' + rel['derivative'] + ' 边 · 形近易混(confusable) ' + rel['confusable-form'] + ' 条 · 同义候选 ' + rel['synonym-candidate'] + ' 条')

  console.log('\n【题库】 共 ' + qb.length + ' 题 · ' + types.size + ' 种题型')
  const head = '题型'.padEnd(22) + [1, 2, 3, 4, 5, 6, 7, 8].map(l => padL(LVN[l], 6)).join('') + padL('合计', 8)
  console.log('  ' + head)
  console.log('  ' + '─'.repeat(head.length))
  const sorted = [...types.entries()].map(([t, a]) => [t, a, a.reduce((x, y) => x + y, 0)] as [string, number[], number]).sort((a, b) => b[2] - a[2])
  for (const [t, a, sum] of sorted) console.log('  ' + pad(t, 22) + a.map(n => padL(n || '·', 6)).join('') + padL(sum, 8))
  console.log('  ' + '─'.repeat(head.length))
  console.log('  ' + pad('各档合计', 22) + lvTot.map(n => padL(n, 6)).join('') + padL(qb.length, 8))
  console.log('\n（统计耗时 ' + ((Date.now() - t0) / 1000).toFixed(0) + 's）')
}
main().catch(e => { console.error('fatal', e?.message ?? e); process.exit(1) })
