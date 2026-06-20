/* ════════════════════════════════════════════════════════════════════════
   data-quality-gate.ts — 线上数据质量门禁（CI 用）。任一项不达标 → exit 1。
   检查：① definition_en 中文污染比例 ② 已知坏词黑名单（库+静态文件）
        ③ 同义/反义死链 ④ dictionary_collocations 非空。
   用法：npx tsx scripts/data-quality-gate.ts
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'; import { readFileSync, readdirSync, statSync } from 'fs'; import { join } from 'path'
const env = readFileSync('.env.local', 'utf8'); const g = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(g('NEXT_PUBLIC_SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'))
const CJK = /[一-鿿぀-ゟ゠-ヿ]/
const BADWORDS = ['rusia', 'guilde', 'lvory', 'aluminumal', 'distingusihed', 'phosphorusp', 'undersize d', 'oxygen o', 'iron fe', 'sulfur disoxide']
// 扫 public + scripts/.vocab-cache 的派生数据；排除上游原始词库（含 guilder/guilded 等合法子串）
const SCAN_DIRS = ['public', 'scripts/.vocab-cache']
const EXCLUDE = /ecdict\.csv|[\\/]wn31[\\/]|[\\/]tatoeba[\\/]/i
function walk(dir: string, out: string[] = []): string[] {
  let ents: string[]; try { ents = readdirSync(dir) } catch { return out }
  for (const e of ents) { const p = join(dir, e); if (EXCLUDE.test(p)) continue; let st; try { st = statSync(p) } catch { continue }; if (st.isDirectory()) walk(p, out); else if (/\.(js|json)$/.test(e)) out.push(p) }
  return out
}
async function pageAll<T>(t: string, c: string): Promise<T[]> { const o: T[] = []; for (let f = 0; ; f += 1000) { const { data } = await db.from(t).select(c).range(f, f + 999); const r = (data ?? []) as T[]; o.push(...r); if (r.length < 1000) break } return o }
const fails: string[] = []; const oks: string[] = []

async function main() {
  // ① definition_en CJK 污染（阈值 1%）
  let cjk = 0, defs = 0
  for (const r of await pageAll<{ definition_en: string | null }>('dictionary_definitions', 'definition_en')) { defs++; if (CJK.test(String(r.definition_en ?? ''))) cjk++ }
  const cjkPct = defs ? cjk / defs * 100 : 0
  ;(cjkPct <= 1 ? oks : fails).push(`definition_en 中文污染 ${cjk}/${defs} (${cjkPct.toFixed(2)}%) ≤1%`)

  // ② 坏词黑名单（库 + public/.vocab-cache 派生文件，按词边界匹配避免 guilder/guilded 误报）
  const wordSet = new Set((await pageAll<{ id: string }>('dictionary_words', 'id')).map(r => r.id))
  const dbBad = BADWORDS.filter(b => wordSet.has(b.replace(/ /g, '-')))
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const res = BADWORDS.map(b => ({ b, re: new RegExp(`\\b${esc(b)}\\b`, 'i') }))
  const fileBad: string[] = []
  for (const f of SCAN_DIRS.flatMap(d => walk(d))) { let txt = ''; try { txt = readFileSync(f, 'utf8') } catch { continue }; for (const { b, re } of res) if (re.test(txt)) fileBad.push(`${f}:${b}`) }
  ;(dbBad.length === 0 && fileBad.length === 0 ? oks : fails).push(`坏词黑名单 库内 ${dbBad.length} 文件 ${fileBad.length}${dbBad.length ? ' ' + dbBad : ''}${fileBad.length ? ' ' + fileBad.slice(0, 3) : ''}`)

  // ③ 同义/反义死链（目标词须在库）
  const wordStrs = new Set((await pageAll<{ word: string }>('dictionary_words', 'word')).map(r => r.word.toLowerCase().trim()))
  let synDead = 0; for (const r of await pageAll<{ synonym: string }>('dictionary_synonyms', 'synonym')) { const s = String(r.synonym ?? '').toLowerCase().trim(); if (s && !wordStrs.has(s)) synDead++ }
  let antDead = 0; for (const r of await pageAll<{ antonym: string }>('dictionary_antonyms', 'antonym')) { const s = String(r.antonym ?? '').toLowerCase().trim(); if (s && !wordStrs.has(s)) antDead++ }
  ;(synDead === 0 && antDead === 0 ? oks : fails).push(`同义/反义死链 ${synDead}/${antDead} =0`)

  // ④ dictionary_collocations 非空
  const { count: col } = await db.from('dictionary_collocations').select('*', { count: 'exact', head: true })
  ;((col ?? 0) > 0 ? oks : fails).push(`dictionary_collocations ${col} >0`)

  console.log('数据质量门禁：')
  for (const o of oks) console.log('  ✓ ' + o)
  for (const f of fails) console.log('  ✗ ' + f)
  if (fails.length) { console.error(`\n门禁未通过：${fails.length} 项不达标`); process.exit(1) }
  console.log('\n全部通过 ✓')
}
main().catch(e => { console.error('fatal', e?.message ?? e); process.exit(1) })
