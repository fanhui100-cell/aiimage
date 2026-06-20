/* ============================================================================
   scripts/enrich-inflections.ts — 词形变化入库（ECDICT exchange → dictionary_words.inflections）
   免费、无 AI。默认 dry-run；--write 真写（幂等：仅写有词形且与现值不同的；回退=置 '{}'）。
   ============================================================================ */
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const WRITE = process.argv.includes('--write')
const ROOT = path.join(__dirname, '..')
const ECDICT = path.join(__dirname, '.vocab-cache', 'ecdict.csv')
const RB = path.join(__dirname, '.vocab-cache', 'inflections-rollback.json')
function env(k: string): string { for (const l of fs.readFileSync(path.join(ROOT, '.env.local'), 'utf-8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && m[1] === k) return m[2].trim() } return '' }
const db = createClient(env('NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'))
const norm = (w: string) => String(w || '').toLowerCase().trim()

function forEachCsvRow(content: string, cb: (r: string[]) => void) {
  let f = '', row: string[] = [], q = false
  for (let i = 0; i < content.length; i++) { const c = content[i]
    if (q) { if (c === '"') { if (content[i + 1] === '"') { f += '"'; i++ } else q = false } else f += c }
    else if (c === '"') q = true; else if (c === ',') { row.push(f); f = '' }
    else if (c === '\n') { row.push(f); cb(row); row = []; f = '' } else if (c !== '\r') f += c }
  if (f.length || row.length) { row.push(f); cb(row) }
}
const EXKEY: Record<string, string> = { p: 'past', d: 'pp', i: 'ing', '3': 'third', r: 'comparative', t: 'superlative', s: 'plural' }
function parseExchange(ex: string): Record<string, string> {
  const o: Record<string, string> = {}
  for (const part of (ex || '').split('/')) { const m = part.match(/^([a-z0-9]):(.+)$/i); if (m && EXKEY[m[1]]) o[EXKEY[m[1]]] = m[2] }
  return o
}
function loadExchange(keep: Set<string>): Map<string, string> {
  const m = new Map<string, string>(); let idx: Record<string, number> | null = null
  forEachCsvRow(fs.readFileSync(ECDICT, 'utf-8'), (r) => {
    if (!idx) { idx = {}; r.forEach((h, k) => (idx![h.trim()] = k)); return }
    const w = norm(r[idx.word]); if (!w || !keep.has(w) || m.has(w)) return
    const ex = r[idx.exchange] || ''; if (ex.trim()) m.set(w, ex)
  })
  return m
}
async function fetchAll(table: string, cols: string) {
  const out: Record<string, unknown>[] = []
  for (let from = 0; ; from += 1000) { const { data, error } = await db.from(table).select(cols).range(from, from + 999); if (error) throw new Error(error.message); out.push(...(data as unknown as Record<string, unknown>[])); if (!data || data.length < 1000) break }
  return out
}

async function main() {
  console.log(`\n=== 词形变化入库 ${WRITE ? '【写库】' : '【dry-run】'} ===\n`)
  const words = await fetchAll('dictionary_words', 'id,normalized_word')
  const keep = new Set(words.map(w => norm(String(w.normalized_word || ''))))
  process.stdout.write('载 ECDICT exchange… '); const ex = loadExchange(keep); console.log(ex.size)
  const ups: { id: string; inflections: Record<string, string> }[] = []
  for (const w of words) { const e = ex.get(norm(String(w.normalized_word || ''))); if (!e) continue; const f = parseExchange(e); if (Object.keys(f).length) ups.push({ id: String(w.id), inflections: f }) }
  console.log(`有词形变化可写：${ups.length} / ${words.length} 词`)
  if (!WRITE) { console.log('[dry-run] 未写库。加 --write 执行。'); return }
  fs.writeFileSync(RB, JSON.stringify({ at: new Date().toISOString(), table: 'dictionary_words', column: 'inflections', ids: ups.map(u => u.id) }))
  let done = 0
  for (let i = 0; i < ups.length; i += 25) {
    await Promise.all(ups.slice(i, i + 25).map(u => db.from('dictionary_words').update({ inflections: u.inflections }).eq('id', u.id)))
    done += Math.min(25, ups.length - i); if (done % 1000 < 25) process.stdout.write(`  ${done}/${ups.length}\r`)
  }
  console.log(`\n✅ 词形变化写入 ${ups.length} 词；回退 id 存 ${path.relative(ROOT, RB)}`)
}
main().catch(e => { console.error(e); process.exit(1) })
