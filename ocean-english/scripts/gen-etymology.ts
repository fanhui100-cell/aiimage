/* ════════════════════════════════════════════════════════════════════════
   gen-etymology.ts — 词源补全（dictionary_etymology）
   现状：14624 词仅 27 条词源。用 DeepSeek 批量为有意义的词补 词根 + 中英解释。
   只补真有词源的词（拉丁/希腊/古英语等）；无明确词源的简单词跳过（不存占位）。
   合规：原创解释。默认 dry-run；--apply 写库（--active 等价，词源无 status）。
   用法：npx tsx scripts/gen-etymology.ts <count=400> [--apply]   （count=本次处理词数；分批跑）
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'; import { readFileSync } from 'fs'; import { randomUUID } from 'crypto'
const env = readFileSync('.env.local', 'utf8'); const g = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(g('NEXT_PUBLIC_SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'))
const DS = g('DEEPSEEK_API_KEY')
const COUNT = Number(process.argv[2] || 400)
const APPLY = process.argv.includes('--apply')
const AFTER = process.argv.includes('--after') ? process.argv[process.argv.indexOf('--after') + 1] : ''  // 断点续跑：从该 id 之后

type E = { word: string; roots: string; explanation_en: string; explanation_zh: string }
async function gen(words: string[], tryN = 0): Promise<E[]> {
  const prompt = `你是严谨的英语词源学专家。为下列单词给出**真实、可靠、有据可查**的词源信息：
- roots：词根来源，**务必标明来源语言**，如 "Latin: actus" / "Greek: bios" / "Old French: ..." / "Old English: ..."（可含前后缀拆解）
- explanation_en：英文词源说明（≤22 词）
- explanation_zh：中文词源说明（≤30 字，点明词根语言与本义）
【铁律 · 宁缺毋滥】只要你对该词词源没有十足把握、或可能记错、或属于来源不明/功能词/专有名词/现代合成词，一律把 roots 置为空字符串 ""（将被跳过）。**绝不允许猜测、编造或杜撰不存在的词根/来源**——不知道就留空，这比编一个错的重要得多。
只输出 JSON 数组、无其它文字：[{"word":"","roots":"","explanation_en":"","explanation_zh":""}]
单词：${words.join(', ')}`
  let res: Response
  try {
    res = await fetch('https://api.deepseek.com/chat/completions', { method: 'POST', headers: { Authorization: 'Bearer ' + DS, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.3, messages: [{ role: 'user', content: prompt }] }) })
  } catch { if (tryN < 2) { await new Promise(r => setTimeout(r, 1200)); return gen(words, tryN + 1) } return [] }
  if (!res.ok) { if (tryN < 2) { await new Promise(r => setTimeout(r, 1200)); return gen(words, tryN + 1) } console.error('  HTTP', res.status); return [] }
  try {
    const j = await res.json() as { choices?: { message?: { content?: string } }[] }
    let t = (j.choices?.[0]?.message?.content || '').replace(/```json|```/g, '').trim(); const m = t.match(/\[[\s\S]*\]/); if (m) t = m[0]
    const arr = JSON.parse(t) as E[]; return Array.isArray(arr) ? arr : []
  } catch { console.error('  parse fail'); return [] }
}

async function main() {
  console.log(`[ety] 处理 ${COUNT} 词 ${APPLY ? 'APPLY' : 'dry-run'}${AFTER ? ` (after ${AFTER})` : ''}`)
  if (!DS) { console.error('DEEPSEEK_API_KEY missing'); process.exit(1) }
  // 已有词源的 word_id 集合（跳过）
  const have = new Set<string>()
  for (let from = 0; ; from += 1000) { const { data } = await db.from('dictionary_etymology').select('word_id').range(from, from + 999); const rows = data ?? []; rows.forEach((r: { word_id: string }) => have.add(r.word_id)); if (rows.length < 1000) break }
  // 取待补词（有释义、长度≥4、字母词）：keyset 翻页
  const targets: { id: string; word: string }[] = []
  let after = AFTER
  while (targets.length < COUNT) {
    let q = db.from('dictionary_words').select('id, word').order('id', { ascending: true }).limit(1000)
    if (after) q = q.gt('id', after)
    const { data } = await q; const rows = (data ?? []) as { id: string; word: string }[]
    if (!rows.length) break
    for (const r of rows) { if (!have.has(r.id) && /^[a-zA-Z]{4,}$/.test(r.word)) targets.push({ id: r.id, word: r.word }); if (targets.length >= COUNT) break }
    after = rows[rows.length - 1].id
  }
  console.log(`[ety] 待补 ${targets.length} 词；末尾 id=${after}（断点用 --after ${after}）`)

  const sample: Record<string, unknown>[] = []; let total = 0
  for (let i = 0; i < targets.length; i += 12) {
    const batch = targets.slice(i, i + 12)
    const byWord = new Map(batch.map(b => [b.word.toLowerCase(), b.id]))
    const rows: Record<string, unknown>[] = []
    for (const e of await gen(batch.map(b => b.word))) {
      const wid = byWord.get(String(e.word).toLowerCase()); const roots = String(e.roots ?? '').trim()
      if (!wid || !roots) continue
      rows.push({ id: randomUUID(), word_id: wid, roots, explanation_en: String(e.explanation_en ?? '').trim(), explanation_zh: String(e.explanation_zh ?? '').trim(), source_type: 'ai-generated', source_note: 'DeepSeek 词源补全' })
    }
    // 每批即写库，避免中断丢全部（之前 accumulate-then-insert 被杀进程会全丢）
    if (APPLY && rows.length) { const { error } = await db.from('dictionary_etymology').upsert(rows, { onConflict: 'word_id' }); if (error) { console.error('[ety] upsert err', error.message); process.exit(1) } }
    total += rows.length; if (sample.length < 5) sample.push(...rows.slice(0, 5 - sample.length))
    process.stdout.write(`\r[ety] 已写 ${total} 条（处理 ${Math.min(i + 12, targets.length)}/${targets.length}）`)
  }
  console.log(`\n[ety] ${APPLY ? '已写入' : '可写'} ${total} 条词源`)
  for (const r of sample) console.log(`  ${r.word_id}: ${r.roots} — ${r.explanation_zh}`)
  if (!APPLY) console.log('dry-run（未写库）。加 --apply。')
}
main().catch(e => { console.error('[ety] fatal', e?.message ?? e); process.exit(1) })
