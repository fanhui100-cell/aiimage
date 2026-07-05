/* ════════════════════════════════════════════════════════════════════════
   gen-antonyms.ts — 反义词补全（dictionary_antonyms，现仅 59 词）
   DeepSeek 为每词给 0-2 个准确反义词；无明确反义词则跳过（不强造）。
   跳过已有反义词的词。默认 dry-run；--apply 写库。可断点 --after id。
   用法：npx tsx scripts/gen-antonyms.ts <count=15000> [--apply] [--after id]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'; import { readFileSync } from 'fs'; import { randomUUID } from 'crypto'
const env = readFileSync('.env.local', 'utf8'); const g = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(g('NEXT_PUBLIC_SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'))
const DS = g('DEEPSEEK_API_KEY')
const COUNT = Number(process.argv[2] || 15000)
const APPLY = process.argv.includes('--apply')
const AFTER0 = process.argv.includes('--after') ? process.argv[process.argv.indexOf('--after') + 1] : ''

type A = { word: string; antonyms: string[] }
async function gen(words: string[], tryN = 0): Promise<A[]> {
  const prompt = `你是英语词汇专家。为下列单词各给出 **0-2 个最贴切的英文反义词**（antonyms，按相关度排序）。若该词没有明确反义词（多数名词/专有名词/中性词），antonyms 给空数组 []。务必准确，不得编造或给近义词。
只输出 JSON 数组：[{"word":"","antonyms":["",""]}]
单词：${words.join(', ')}`
  let res: Response
  try { res = await fetch('https://api.deepseek.com/chat/completions', { method: 'POST', headers: { Authorization: 'Bearer ' + DS, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.3, messages: [{ role: 'user', content: prompt }] }) }) }
  catch { if (tryN < 2) { await new Promise(r => setTimeout(r, 1200)); return gen(words, tryN + 1) } return [] }
  if (!res.ok) { if (tryN < 2) { await new Promise(r => setTimeout(r, 1200)); return gen(words, tryN + 1) } return [] }
  try { const j = await res.json() as { choices?: { message?: { content?: string } }[] }; let t = (j.choices?.[0]?.message?.content || '').replace(/```json|```/g, '').trim(); const m = t.match(/\[[\s\S]*\]/); if (m) t = m[0]; const a = JSON.parse(t) as A[]; return Array.isArray(a) ? a : [] }
  catch { return [] }
}

async function main() {
  console.log(`[anto] 处理 ${COUNT} 词 ${APPLY ? 'APPLY' : 'dry-run'}`)
  if (!DS) { console.error('DEEPSEEK_API_KEY missing'); process.exit(1) }
  const have = new Set<string>()
  for (let f = 0; ; f += 1000) { const { data } = await db.from('dictionary_antonyms').select('word_id').range(f, f + 999); const r = data ?? []; r.forEach((x: { word_id: string }) => have.add(x.word_id)); if (r.length < 1000) break }
  const targets: { id: string; word: string }[] = []; let after = AFTER0
  while (targets.length < COUNT) {
    let q = db.from('dictionary_words').select('id, word').order('id', { ascending: true }).limit(1000); if (after) q = q.gt('id', after)
    const { data } = await q; const rows = (data ?? []) as { id: string; word: string }[]; if (!rows.length) break
    for (const r of rows) { if (!have.has(r.id) && /^[a-zA-Z][a-zA-Z'-]{2,}$/.test(r.word)) targets.push(r); if (targets.length >= COUNT) break }
    after = rows[rows.length - 1].id
  }
  console.log(`[anto] 待补 ${targets.length} 词；末尾 id=${after}`)
  const rows: Record<string, unknown>[] = []; let withAnt = 0
  for (let i = 0; i < targets.length; i += 14) {
    const batch = targets.slice(i, i + 14); const byWord = new Map(batch.map(b => [b.word.toLowerCase(), b.id]))
    for (const e of await gen(batch.map(b => b.word))) {
      const wid = byWord.get(String(e.word).toLowerCase()); if (!wid || !Array.isArray(e.antonyms)) continue
      const ants = [...new Set(e.antonyms.map(a => String(a).trim()).filter(a => /^[a-zA-Z][a-zA-Z' -]*$/.test(a) && a.toLowerCase() !== e.word.toLowerCase()))].slice(0, 2)
      if (ants.length) withAnt++
      ants.forEach((a, k) => rows.push({ id: randomUUID(), word_id: wid, antonym: a, order_index: k }))
    }
    process.stdout.write(`\r[anto] ${rows.length} 条/${withAnt} 词有反义（处理 ${Math.min(i + 14, targets.length)}/${targets.length}）`)
  }
  console.log(`\n[anto] 有效 ${rows.length} 条（${withAnt} 词）`)
  for (const r of rows.slice(0, 6)) console.log(`  ${r.word_id} ⇄ ${r.antonym}`)
  if (!APPLY) { console.log('\ndry-run，未写库。'); return }
  for (let i = 0; i < rows.length; i += 200) { const { error } = await db.from('dictionary_antonyms').insert(rows.slice(i, i + 200)); if (error) { console.error('[anto] insert err', error.message); process.exit(1) } }
  console.log(`[anto] 已写入 ${rows.length} 条反义词。`)
}
main().catch(e => { console.error('[anto] fatal', e?.message ?? e); process.exit(1) })
