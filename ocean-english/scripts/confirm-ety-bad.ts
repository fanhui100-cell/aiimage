/* 对 qa-etymology 初判「非正确」的词源做严格二次确认，只删【确凿错误/编造】的，
   保护被一次复核误伤的正确条目（如 liquid: Latin liquidus）。
   用法：npx tsx scripts/confirm-ety-bad.ts [--apply] */
import { createClient } from '@supabase/supabase-js'; import { readFileSync, writeFileSync, existsSync } from 'fs'
const env = readFileSync('.env.local', 'utf8'); const g = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(g('NEXT_PUBLIC_SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'))
const DS = g('DEEPSEEK_API_KEY')
const APPLY = process.argv.includes('--apply')

async function verify(items: { word: string; roots: string; zh: string }[], tryN = 0): Promise<Record<string, boolean>> {
  const list = items.map((it, i) => `${i + 1}. ${it.word} — roots: ${it.roots}｜${it.zh}`).join('\n')
  const prompt = `你是顶级英语词源学专家。下面的词源条目曾被初步怀疑有误，请你**严格而公允**地复核：仅当该词源**确凿错误或属于编造**（来源语言错、词根张冠李戴、释义与事实矛盾）时判 wrong=true；若它本质正确、或只是合理简化/可接受的近似（如 liquid←Latin liquidus、judgment←Latin judicare 的简写），一律判 wrong=false 予以保留。
只输出 JSON 数组：[{"word":"","wrong":false}]
词条：
${list}`
  let res: Response
  try { res = await fetch('https://api.deepseek.com/chat/completions', { method: 'POST', headers: { Authorization: 'Bearer ' + DS, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.1, messages: [{ role: 'user', content: prompt }] }) }) }
  catch { if (tryN < 2) { await new Promise(r => setTimeout(r, 1500)); return verify(items, tryN + 1) } return {} }
  if (!res.ok) { if (tryN < 2) { await new Promise(r => setTimeout(r, 1500)); return verify(items, tryN + 1) } return {} }
  try { const j = await res.json() as any; let t = (j.choices?.[0]?.message?.content || '').replace(/```json|```/g, '').trim(); const m = t.match(/\[[\s\S]*\]/); if (m) t = m[0]; const a = JSON.parse(t) as { word: string; wrong: boolean }[]; const out: Record<string, boolean> = {}; for (const e of a) if (e.word) out[String(e.word).toLowerCase()] = !!e.wrong; return out }
  catch { return {} }
}
async function pageAll<T>(t: string, c: string): Promise<T[]> { const o: T[] = []; for (let f = 0; ; f += 1000) { const { data } = await db.from(t).select(c).range(f, f + 999); const r = (data ?? []) as T[]; o.push(...r); if (r.length < 1000) break } return o }

async function main() {
  if (!DS) { console.error('DEEPSEEK missing'); process.exit(1) }
  const ids = JSON.parse(readFileSync('scripts/.ety-bad.json', 'utf8')) as string[]
  const idW = new Map((await pageAll<{ id: string; word: string }>('dictionary_words', 'id, word')).map(r => [r.id, r.word]))
  const rows: { id: string; word: string; roots: string; zh: string }[] = []
  for (let i = 0; i < ids.length; i += 100) { const { data } = await db.from('dictionary_etymology').select('id, word_id, roots, explanation_zh').in('id', ids.slice(i, i + 100)); (data ?? []).forEach((e: any) => rows.push({ id: e.id, word: idW.get(e.word_id) ?? e.word_id, roots: String(e.roots ?? ''), zh: String(e.explanation_zh ?? '') })) }
  console.log(`二次严格确认 ${rows.length} 条　${APPLY ? 'APPLY' : 'dry-run'}`)
  const CC = 'scripts/.ety-confirm.json'   // id -> wrong bool，断点续跑
  const conf = new Map<string, boolean>(existsSync(CC) ? Object.entries(JSON.parse(readFileSync(CC, 'utf8'))) : [])
  const todo = rows.filter(r => !conf.has(r.id))
  console.log(`已缓存 ${rows.length - todo.length}，待确认 ${todo.length}`)
  for (let i = 0; i < todo.length; i += 12) {
    const batch = todo.slice(i, i + 12)
    const got = await verify(batch.map(b => ({ word: b.word, roots: b.roots, zh: b.zh })))
    for (const b of batch) conf.set(b.id, !!got[b.word.toLowerCase()])
    writeFileSync(CC, JSON.stringify(Object.fromEntries(conf)))
    process.stdout.write(`\r确认 ${Math.min(i + 12, todo.length)}/${todo.length}`)
  }
  const wrong = rows.filter(r => conf.get(r.id))
  console.log(`\n确凿错误/编造 ${wrong.length} / ${rows.length}（其余为一次复核误伤，保留）`)
  console.log('确认删除:', wrong.slice(0, 30).map(w => `${w.word}「${w.roots}」`).join(' | ') || '无')
  writeFileSync('scripts/.ety-del.json', JSON.stringify(wrong.map(w => w.id)))
  if (!APPLY) { console.log('\ndry-run。加 --apply 删除确认错误项。'); return }
  let n = 0
  for (let i = 0; i < wrong.length; i += 100) { const { count } = await db.from('dictionary_etymology').delete({ count: 'exact' }).in('id', wrong.slice(i, i + 100).map(w => w.id)); n += count ?? 0 }
  console.log(`已删除 ${n} 条确凿错误词源。`)
}
main().catch(e => { console.error('fatal', e?.message ?? e); process.exit(1) })
