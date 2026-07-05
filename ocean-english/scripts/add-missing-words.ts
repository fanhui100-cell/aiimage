/* ════════════════════════════════════════════════════════════════════════
   add-missing-words.ts — 扩充词库：把「被同义/反义引用但不在库」的词补成真实词条
   数据源 = ECDICT（scripts/.vocab-cache/ecdict.csv，真实音标 + 中文释义 + 考试 tag），
   非 AI 编造。补 dictionary_words + dictionary_definitions，id=词本身（与点击 slug 一致）。
   等级：优先按 ECDICT 考试 tag（zk/gk/cet4/cet6/ky/toefl/gre）映射，否则按词频。
   用法：npx tsx scripts/add-missing-words.ts [--apply]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'; import { readFileSync, createReadStream } from 'fs'; import { randomUUID } from 'crypto'; import readline from 'node:readline'
const env = readFileSync('.env.local', 'utf8'); const g = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(g('NEXT_PUBLIC_SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'))
const APPLY = process.argv.includes('--apply')
const CSV = 'scripts/.vocab-cache/ecdict.csv'

const TAGLV: Record<string, { lv: number; tag?: string }> = { zk: { lv: 1 }, gk: { lv: 2, tag: 'GAOKAO' }, cet4: { lv: 3, tag: 'CET-4' }, cet6: { lv: 4, tag: 'CET-6' }, ky: { lv: 5, tag: 'KAOYAN' }, toefl: { lv: 6, tag: 'TOEFL' }, ielts: { lv: 6, tag: 'TOEFL' }, gre: { lv: 7, tag: 'SAT' } }
const CEFR: Record<number, string> = { 1: 'A2', 2: 'B1', 3: 'B1', 4: 'B2', 5: 'C1', 6: 'C1', 7: 'C2' }
const freqLv = (r: number) => r <= 2500 ? 3 : r <= 6000 ? 4 : r <= 12000 ? 5 : r <= 25000 ? 6 : 7
const lvStr = (lv: number) => lv <= 2 ? 'elementary' : lv <= 4 ? 'intermediate' : 'advanced'
const diffOf = (lv: number) => lv <= 2 ? 2 : lv <= 4 ? 3 : lv <= 6 ? 4 : 5

const parseCsv = (line: string) => { const o: string[] = []; let c = '', q = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (q) { if (ch === '"') { if (line[i + 1] === '"') { c += '"'; i++ } else q = false } else c += ch } else { if (ch === '"') q = true; else if (ch === ',') { o.push(c); c = '' } else c += ch } } o.push(c); return o }
const POSRE = /^(n|v|vt|vi|adj|adv|prep|conj|pron|art|num|int|aux|abbr)\b\.?/i
function defLines(translation: string): { pos: string; zh: string }[] {
  const lines = translation.split(/\\n|\n/).map(s => s.trim()).filter(Boolean)
  const out: { pos: string; zh: string }[] = []
  for (const ln of lines) {
    if (/^\[(网络|医)\]/.test(ln)) continue   // 跳过「[网络]」等噪声释义
    const m = ln.match(POSRE); const pos = m ? m[1].toLowerCase().replace(/^vt$|^vi$/, 'v') : ''
    const zh = ln.replace(POSRE, '').replace(/^\.?\s*/, '').trim()
    if (zh) out.push({ pos, zh: zh.slice(0, 200) })
    if (out.length >= 4) break
  }
  return out.length ? out : [{ pos: '', zh: translation.replace(/\\n|\n/g, '；').slice(0, 200) }]
}

async function main() {
  const missing = JSON.parse(readFileSync('scripts/.missing-words.json', 'utf8')) as { word: string; count: number }[]
  const want = new Set(missing.map(m => m.word.toLowerCase().trim()))
  console.log(`待补缺失词 ${want.size}　${APPLY ? 'APPLY' : 'dry-run'}`)

  // 已存在的 id（避免冲突/重复）
  const haveId = new Set<string>()
  for (let f = 0; ; f += 1000) { const { data } = await db.from('dictionary_words').select('id').range(f, f + 999); const r = data ?? []; (r as any[]).forEach(x => haveId.add(x.id)); if (r.length < 1000) break }

  // 流式扫 ECDICT，取命中词
  type Row = { word: string; phonetic: string; definition: string; translation: string; pos: string; tag: string; bnc: number; frq: number }
  const hit = new Map<string, Row>()
  const rl = readline.createInterface({ input: createReadStream(CSV), crlfDelay: Infinity })
  let header = true, H: Record<string, number> = {}
  for await (const line of rl) {
    if (header) { const h = parseCsv(line); h.forEach((k, i) => H[k] = i); header = false; continue }
    const f = parseCsv(line); const w = (f[H.word] ?? '').toLowerCase().trim()
    if (!want.has(w) || hit.has(w)) continue
    hit.set(w, { word: w, phonetic: f[H.phonetic] ?? '', definition: f[H.definition] ?? '', translation: f[H.translation] ?? '', pos: f[H.pos] ?? '', tag: f[H.tag] ?? '', bnc: Number(f[H.bnc]) || 0, frq: Number(f[H.frq]) || 0 })
  }
  console.log(`ECDICT 命中 ${hit.size}/${want.size}（缺 ${want.size - hit.size} 词 ECDICT 无收录，跳过）`)

  const wordRows: Record<string, unknown>[] = []; const defRows: Record<string, unknown>[] = []
  let noTrans = 0, collide = 0
  for (const [w, r] of hit) {
    const id = w   // 与点击 slug（label.toLowerCase().trim()）一致
    if (haveId.has(id)) { collide++; continue }
    const defs = r.translation.trim() ? defLines(r.translation) : []
    if (!defs.length) { noTrans++; continue }
    // 等级：考试 tag 优先
    const tags = r.tag.split(/\s+/).map(t => t.trim().toLowerCase()).filter(Boolean)
    const tagLvs = tags.map(t => TAGLV[t]).filter(Boolean) as { lv: number; tag?: string }[]
    const examTags = [...new Set(tagLvs.map(t => t.tag).filter(Boolean))] as string[]
    const rank = [r.bnc, r.frq].filter(n => n > 0).length ? Math.min(...[r.bnc, r.frq].filter(n => n > 0)) : 0
    const levels = tagLvs.length ? [...new Set(tagLvs.map(t => t.lv))].sort((a, b) => a - b) : [freqLv(rank || 99999)]
    const primary = levels[0]
    wordRows.push({
      id, word: w, normalized_word: w,
      phonetic_ipa: r.phonetic.trim() ? `/${r.phonetic.trim()}/` : null,
      part_of_speech: defs[0].pos || (r.pos.split(/[:\/]/)[0] || null),
      cefr_level: CEFR[primary], level: lvStr(primary), difficulty: diffOf(primary),
      frequency_rank: rank || null, is_core_word: false, is_exam_word: examTags.length > 0,
      tags: examTags, levels, primary_level: primary,
      source_type: 'public-domain', source_note: 'ECDICT (skywind3000) — 补全同义/反义引用词', license: 'public-domain',
    })
    defs.forEach((d, i) => defRows.push({ id: randomUUID(), word_id: id, part_of_speech: d.pos || 'n', definition_en: d.zh, definition_zh: d.zh, language: 'en', order_index: i, source_type: 'public-domain', source_note: 'ECDICT' }))
  }
  console.log(`可补词条 ${wordRows.length}（释义 ${defRows.length} 条）；无释义跳过 ${noTrans}，id 冲突跳过 ${collide}`)
  console.log('样例：'); for (const r of wordRows.slice(0, 6)) console.log(`  ${r.word}  ${r.phonetic_ipa ?? ''}  lv${r.primary_level} [${(r.tags as string[]).join(',')}]  ${(defRows.find(d => d.word_id === r.id) as any)?.definition_zh ?? ''}`)

  if (!APPLY) { console.log('\ndry-run，未写库。加 --apply。'); return }
  for (let i = 0; i < wordRows.length; i += 500) { const { error } = await db.from('dictionary_words').upsert(wordRows.slice(i, i + 500), { onConflict: 'id', ignoreDuplicates: true }); if (error) { console.error('words insert err', error.message); process.exit(1) }; process.stdout.write(`\r写词条 ${Math.min(i + 500, wordRows.length)}/${wordRows.length}`) }
  console.log('')
  for (let i = 0; i < defRows.length; i += 500) { const { error } = await db.from('dictionary_definitions').insert(defRows.slice(i, i + 500)); if (error) { console.error('defs insert err', error.message); process.exit(1) }; process.stdout.write(`\r写释义 ${Math.min(i + 500, defRows.length)}/${defRows.length}`) }
  console.log(`\n已补 ${wordRows.length} 词 / ${defRows.length} 释义。`)
}
main().catch(e => { console.error('fatal', e?.message ?? e); process.exit(1) })
