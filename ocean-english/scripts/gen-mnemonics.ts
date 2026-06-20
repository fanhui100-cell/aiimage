/* ════════════════════════════════════════════════════════════════════════
   gen-mnemonics.ts — 词根记忆/助记补全（dictionary_mnemonics，需先跑建表 SQL）
   DeepSeek 为每词生成「拆词根/音节 + 联想」的中文助记（standard 风格）。
   合规：原创助记。默认 dry-run；--apply 写库。可断点 --after <id>。
   用法：npx tsx scripts/gen-mnemonics.ts <count=15000> [--apply] [--after id]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'; import { readFileSync } from 'fs'; import { randomUUID } from 'crypto'
const env = readFileSync('.env.local', 'utf8'); const g = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(g('NEXT_PUBLIC_SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'))
const DS = g('DEEPSEEK_API_KEY')
const COUNT = Number(process.argv[2] || 15000)
const APPLY = process.argv.includes('--apply')
const AFTER0 = process.argv.includes('--after') ? process.argv[process.argv.indexOf('--after') + 1] : ''

type M = { word: string; mnemonic_zh: string; mnemonic_en?: string }
async function gen(words: string[], tryN = 0): Promise<M[]> {
  const prompt = `你是面向【中国英语学习者】的单词记忆专家。为下列每个单词写一条**对中国人友好**的中文助记，优先采用中国学生常用的方法：①谐音（用中文谐音串起读音）②拆词根/词缀 + 中文联想 ③拆成熟悉的小词/字母 + 画面联想 ④形象故事联想。
要求：纯中文表达、生动好记、紧扣该词的「读音 + 词义」，≤40 字；**不得生硬直译，不得套用英语母语者式记忆法**，务必针对该词、准确不离谱。
mnemonic_en 可留空（仅当确有简短英文词根提示时再给，≤12 词）。
只输出 JSON 数组：[{"word":"","mnemonic_zh":"","mnemonic_en":""}]
单词：${words.join(', ')}`
  let res: Response
  try { res = await fetch('https://api.deepseek.com/chat/completions', { method: 'POST', headers: { Authorization: 'Bearer ' + DS, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.6, messages: [{ role: 'user', content: prompt }] }) }) }
  catch { if (tryN < 2) { await new Promise(r => setTimeout(r, 1200)); return gen(words, tryN + 1) } return [] }
  if (!res.ok) { if (tryN < 2) { await new Promise(r => setTimeout(r, 1200)); return gen(words, tryN + 1) } return [] }
  try { const j = await res.json() as { choices?: { message?: { content?: string } }[] }; let t = (j.choices?.[0]?.message?.content || '').replace(/```json|```/g, '').trim(); const m = t.match(/\[[\s\S]*\]/); if (m) t = m[0]; const a = JSON.parse(t) as M[]; return Array.isArray(a) ? a : [] }
  catch { return [] }
}

async function main() {
  console.log(`[mnem] 处理 ${COUNT} 词 ${APPLY ? 'APPLY' : 'dry-run'}`)
  if (!DS) { console.error('DEEPSEEK_API_KEY missing'); process.exit(1) }
  const have = new Set<string>()
  for (let f = 0; ; f += 1000) { const { data, error } = await db.from('word_mnemonics').select('word_id').range(f, f + 999); if (error) { console.error('word_mnemonics 读取失败', error.message); process.exit(1) } const r = data ?? []; r.forEach((x: { word_id: string }) => have.add(x.word_id)); if (r.length < 1000) break }
  const targets: { id: string; word: string }[] = []; let after = AFTER0
  while (targets.length < COUNT) {
    let q = db.from('dictionary_words').select('id, word').order('id', { ascending: true }).limit(1000); if (after) q = q.gt('id', after)
    const { data } = await q; const rows = (data ?? []) as { id: string; word: string }[]; if (!rows.length) break
    for (const r of rows) { if (!have.has(r.id) && /^[a-zA-Z][a-zA-Z'-]{2,}$/.test(r.word)) targets.push(r); if (targets.length >= COUNT) break }
    after = rows[rows.length - 1].id
  }
  console.log(`[mnem] 待补 ${targets.length} 词；末尾 id=${after}`)
  const sample: Record<string, unknown>[] = []; let total = 0
  for (let i = 0; i < targets.length; i += 14) {
    const batch = targets.slice(i, i + 14); const byWord = new Map(batch.map(b => [b.word.toLowerCase(), b.id]))
    const rows: Record<string, unknown>[] = []
    for (const e of await gen(batch.map(b => b.word))) {
      const wid = byWord.get(String(e.word).toLowerCase()); const zh = String(e.mnemonic_zh ?? '').trim()
      if (!wid || !zh) continue
      rows.push({ id: randomUUID(), word_id: wid, mnemonic_zh: zh, mnemonic_en: String(e.mnemonic_en ?? '').trim(), mnemonic_style: 'standard', is_ai_generated: true, is_reviewed: false, order_index: 0, source_type: 'ai-generated' })
    }
    // 每批即写库（word_mnemonics = App 实际读取的表），避免中断丢全部
    if (APPLY && rows.length) { const { error } = await db.from('word_mnemonics').insert(rows); if (error) { console.error('[mnem] insert err', error.message); process.exit(1) } }
    total += rows.length; if (sample.length < 4) sample.push(...rows.slice(0, 4 - sample.length))
    process.stdout.write(`\r[mnem] 已写 ${total} 条（处理 ${Math.min(i + 14, targets.length)}/${targets.length}）`)
  }
  console.log(`\n[mnem] ${APPLY ? '已写入' : '可写'} ${total} 条助记`)
  for (const r of sample) console.log(`  ${r.word_id}: ${r.mnemonic_zh}`)
  if (!APPLY) console.log('dry-run（未写库）。加 --apply。')
}
main().catch(e => { console.error('[mnem] fatal', e?.message ?? e); process.exit(1) })
