/* ============================================================================
   scripts/enrich-supabase.ts — 落地 B v1：把免费富化写进 Supabase 词典库

   对已有的 dictionary_words（14,624 行）增强：
     ① frequency_rank ← ECDICT 真实词频（lower = 更常见）
     ② dictionary_synonyms ← WordNet 同义词（每词上限 8，去重已有，仅补不删）
   不含：inflections（需先加列，v2）、examples 补缺（v2）。

   默认 dry-run（只读+预览，不写）；加 --write 才真正写库（幂等：freq 仅更新有变化的；
   synonyms 仅插入不存在的）。需 .env.local: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY。
   用法： npx tsx scripts/enrich-supabase.ts            # dry-run
          npx tsx scripts/enrich-supabase.ts --write    # 真写
   ============================================================================ */
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const WRITE = process.argv.includes('--write')
const ROOT = path.join(__dirname, '..')
const CACHE = path.join(__dirname, '.vocab-cache')
const ECDICT = path.join(CACHE, 'ecdict.csv')
const WN = path.join(CACHE, 'wn31', 'dict')
const SYN_CAP = 8

function env(k: string): string {
  for (const l of fs.readFileSync(path.join(ROOT, '.env.local'), 'utf-8').split(/\r?\n/)) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && m[1] === k) return m[2].trim()
  }
  return ''
}
const norm = (w: string) => String(w || '').toLowerCase().trim()
const db = createClient(env('NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'))

// ── ECDICT frq（只留 DB 里的词）──
function forEachCsvRow(content: string, cb: (r: string[]) => void) {
  let f = '', row: string[] = [], q = false
  for (let i = 0; i < content.length; i++) { const c = content[i]
    if (q) { if (c === '"') { if (content[i + 1] === '"') { f += '"'; i++ } else q = false } else f += c }
    else if (c === '"') q = true
    else if (c === ',') { row.push(f); f = '' }
    else if (c === '\n') { row.push(f); cb(row); row = []; f = '' }
    else if (c !== '\r') f += c }
  if (f.length || row.length) { row.push(f); cb(row) }
}
function loadFrq(keep: Set<string>): Map<string, number> {
  const m = new Map<string, number>(); let idx: Record<string, number> | null = null
  forEachCsvRow(fs.readFileSync(ECDICT, 'utf-8'), (r) => {
    if (!idx) { idx = {}; r.forEach((h, k) => (idx![h.trim()] = k)); return }
    const w = norm(r[idx.word]); if (!w || !keep.has(w) || m.has(w)) return
    const frq = parseInt(r[idx.frq] || '0', 10) || 0; if (frq > 0) m.set(w, frq)
  })
  return m
}

// ── WordNet 同义（单词 lemma 同 synset 互为同义）──
function loadSynonyms(): Map<string, string[]> {
  const cl = (w: string) => w.toLowerCase().replace(/\(.*?\)$/, '').replace(/_/g, ' ')
  const syn = new Map<string, Set<string>>()
  for (const file of ['data.noun', 'data.verb', 'data.adj', 'data.adv']) {
    const fp = path.join(WN, file); if (!fs.existsSync(fp)) continue
    for (const line of fs.readFileSync(fp, 'utf-8').split('\n')) {
      if (!/^\d{8} /.test(line)) continue
      const t = line.split(' | ')[0].split(' '); const wc = parseInt(t[3], 16)
      const words: string[] = []; for (let k = 0; k < wc; k++) words.push(cl(t[4 + 2 * k]))
      const singles = words.filter(w => !w.includes(' '))
      for (const a of singles) for (const b of singles) if (a !== b) (syn.get(a) || syn.set(a, new Set()).get(a)!).add(b)
    }
  }
  const out = new Map<string, string[]>()
  for (const [w, s] of syn) out.set(w, [...s])
  return out
}

async function fetchAll(table: string, cols: string): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select(cols).range(from, from + 999)
    if (error) throw new Error(`${table}: ${error.message}`)
    out.push(...(data as unknown as Record<string, unknown>[])); if (!data || data.length < 1000) break
  }
  return out
}

async function main() {
  console.log(`\n=== 落地 B v1 (Supabase 富化) ${WRITE ? '【真写 --write】' : '【dry-run 预览】'} ===\n`)

  process.stdout.write('拉 dictionary_words… ')
  const words = await fetchAll('dictionary_words', 'id,normalized_word,frequency_rank')
  console.log(words.length)
  process.stdout.write('拉 dictionary_synonyms… ')
  const existSyn = await fetchAll('dictionary_synonyms', 'word_id,synonym')
  console.log(existSyn.length)
  const haveSyn = new Set(existSyn.map(r => `${r.word_id}\t${norm(String(r.synonym))}`))

  const keep = new Set(words.map(w => norm(String(w.normalized_word || ''))))
  process.stdout.write('载 ECDICT 词频… '); const frq = loadFrq(keep); console.log(frq.size)
  process.stdout.write('载 WordNet 同义… '); const syn = loadSynonyms(); console.log(syn.size)

  // 计算 freq 更新 + synonyms 插入
  const freqUpdates: { id: string; frequency_rank: number }[] = []
  const synInserts: { word_id: string; synonym: string; order_index: number }[] = []
  for (const w of words) {
    const id = String(w.id), nw = norm(String(w.normalized_word || ''))
    const f = frq.get(nw)
    if (f != null && w.frequency_rank !== f) freqUpdates.push({ id, frequency_rank: f })
    const cands = (syn.get(nw) || []).slice(0, SYN_CAP)
    let oi = 0
    for (const s of cands) {
      const key = `${id}\t${norm(s)}`
      if (haveSyn.has(key)) continue
      haveSyn.add(key); synInserts.push({ word_id: id, synonym: s, order_index: oi++ })
    }
  }
  const synWords = new Set(synInserts.map(s => s.word_id)).size
  console.log(`\n预览：`)
  console.log(`  frequency_rank 待更新：${freqUpdates.length} / ${words.length} 词`)
  console.log(`  synonyms 待新增：${synInserts.length} 条（覆盖 ${synWords} 词；现有 ${existSyn.length} 条）`)

  if (!WRITE) { console.log('\n[dry-run] 未写库。确认无误后加 --write 执行。'); return }

  // 写库前存回退数据（可逆）：旧 freq 值 + 新增 synonym 清单
  const oldFreq = new Map(words.map(w => [String(w.id), (w.frequency_rank as number | null) ?? null]))
  const rbFile = path.join(CACHE, 'landingB-rollback.json')
  fs.writeFileSync(rbFile, JSON.stringify({ at: new Date().toISOString(), freq: freqUpdates.map(u => ({ id: u.id, old: oldFreq.get(u.id) ?? null })), syn: synInserts }))
  console.log(`回退数据已存：${path.relative(ROOT, rbFile)}`)

  // 写：freq 更新（并发限速）
  console.log('\n写 frequency_rank…')
  let done = 0
  for (let i = 0; i < freqUpdates.length; i += 25) {
    await Promise.all(freqUpdates.slice(i, i + 25).map(u =>
      db.from('dictionary_words').update({ frequency_rank: u.frequency_rank }).eq('id', u.id)))
    done += Math.min(25, freqUpdates.length - i)
    if (done % 1000 < 25) process.stdout.write(`  ${done}/${freqUpdates.length}\r`)
  }
  console.log(`  freq 完成 ${freqUpdates.length}        `)

  // 写：synonyms 批量插入
  console.log('写 synonyms…')
  for (let i = 0; i < synInserts.length; i += 500) {
    const { error } = await db.from('dictionary_synonyms').insert(synInserts.slice(i, i + 500))
    if (error) { console.error('  插入错误：', error.message); break }
    process.stdout.write(`  ${Math.min(i + 500, synInserts.length)}/${synInserts.length}\r`)
  }
  console.log(`  synonyms 完成 ${synInserts.length}        `)
  console.log('\n✅ 落地 B v1 写库完成（frequency_rank + synonyms）。')
}
main().catch(e => { console.error(e); process.exit(1) })
