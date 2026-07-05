/* ════════════════════════════════════════════════════════════════════════
   audit-families-ai.ts — 词族「错误分类」AI 复核（拼写词干碰撞，如 press↔present）
   word_relations(type='derivative') 是按表面词干归并的，会把词源无关、仅拼写相似的
   词误并一族。本脚本让 DeepSeek 逐家族判定哪些成员与词根「非同源」，标记待剔除的边。
   结果缓存 scripts/.fam-ai-cache.json（按 root 断点续跑）。
   用法：npx tsx scripts/audit-families-ai.ts [--apply]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'; import { readFileSync, writeFileSync, existsSync } from 'fs'
const env = readFileSync('.env.local', 'utf8'); const g = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(g('NEXT_PUBLIC_SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'))
const DS = g('DEEPSEEK_API_KEY')
const APPLY = process.argv.includes('--apply')
const CACHE = 'scripts/.fam-ai-cache.json'

type Fam = { rootId: string; root: string; members: { id: string; word: string }[] }
type Judge = { root: string; wrong: string[] }

async function gen(fams: Fam[], tryN = 0): Promise<Judge[]> {
  const list = fams.map((f, i) => `${i + 1}. root=${f.root} members=[${f.members.map(m => m.word).join(', ')}]`).join('\n')
  const prompt = `你是英语词源与构词法专家。下面是若干「词形家族」，每个有一个词根词 root 和若干候选成员。请判断每个成员是否与 root **真正同源**（同一拉丁/希腊/日耳曼词根，构词派生/屈折关系），还是只是**拼写表面相似而词源无关**（例：press 与 present/presence 无关；car 与 carpet 无关；man 与 manage 无关）。
对每个家族，列出**应剔除**（与 root 非同源）的成员。若全部正确则 wrong 给空数组。务必严格、准确，只依据真实词源。
只输出 JSON 数组：[{"root":"press","wrong":["present","presence"]}]
家族：
${list}`
  let res: Response
  try { res = await fetch('https://api.deepseek.com/chat/completions', { method: 'POST', headers: { Authorization: 'Bearer ' + DS, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.2, messages: [{ role: 'user', content: prompt }] }) }) }
  catch { if (tryN < 2) { await new Promise(r => setTimeout(r, 1500)); return gen(fams, tryN + 1) } return [] }
  if (!res.ok) { if (tryN < 2) { await new Promise(r => setTimeout(r, 1500)); return gen(fams, tryN + 1) } return [] }
  try { const j = await res.json() as { choices?: { message?: { content?: string } }[] }; let t = (j.choices?.[0]?.message?.content || '').replace(/```json|```/g, '').trim(); const m = t.match(/\[[\s\S]*\]/); if (m) t = m[0]; const a = JSON.parse(t) as Judge[]; return Array.isArray(a) ? a : [] }
  catch { return [] }
}

async function main() {
  if (!DS) { console.error('DEEPSEEK_API_KEY missing'); process.exit(1) }
  // 载入词库 + derivative 边
  const idToWord = new Map<string, string>()
  for (let f = 0; ; f += 1000) { const { data } = await db.from('dictionary_words').select('id, word').range(f, f + 999); const r = data ?? []; (r as any[]).forEach(x => idToWord.set(x.id, x.word)); if (r.length < 1000) break }
  const edges: { word_id: string; related_id: string }[] = []
  for (let f = 0; ; f += 1000) { const { data } = await db.from('word_relations').select('word_id, related_id, type').range(f, f + 999); const r = (data ?? []) as any[]; edges.push(...r.filter(x => x.type === 'derivative')); if (r.length < 1000) break }
  const famMap = new Map<string, { id: string; word: string }[]>()
  for (const e of edges) { const a = famMap.get(e.word_id) ?? []; if (idToWord.has(e.related_id)) a.push({ id: e.related_id, word: idToWord.get(e.related_id)! }); famMap.set(e.word_id, a) }
  const fams: Fam[] = [...famMap].filter(([rid, mem]) => idToWord.has(rid) && mem.length).map(([rid, mem]) => ({ rootId: rid, root: idToWord.get(rid)!, members: mem }))
  console.log(`复核 ${fams.length} 家族 / ${edges.length} 边　${APPLY ? 'APPLY' : 'dry-run'}`)

  const cache: Record<string, string[]> = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {}
  const todo = fams.filter(f => !(f.root in cache))
  console.log(`已缓存 ${fams.length - todo.length}，待判 ${todo.length}`)
  for (let i = 0; i < todo.length; i += 12) {
    const batch = todo.slice(i, i + 12)
    const judged = await gen(batch)
    const byRoot = new Map(judged.map(j => [String(j.root).toLowerCase(), (j.wrong ?? []).map(w => String(w).toLowerCase())]))
    for (const f of batch) cache[f.root] = byRoot.get(f.root.toLowerCase()) ?? []
    writeFileSync(CACHE, JSON.stringify(cache))
    process.stdout.write(`\r判定 ${Math.min(i + 12, todo.length)}/${todo.length}`)
  }
  console.log('')

  // 统计待剔除边
  const toDelete: { word_id: string; related_id: string }[] = []
  const samples: string[] = []
  for (const f of fams) {
    const wrong = new Set((cache[f.root] ?? []).map(w => w.toLowerCase()))
    for (const m of f.members) if (wrong.has(m.word.toLowerCase())) { toDelete.push({ word_id: f.rootId, related_id: m.id }); if (samples.length < 30) samples.push(`${f.root} ⊅ ${m.word}`) }
  }
  console.log(`\n判定为错误分类（拼写碰撞、应剔除）的边：${toDelete.length} / ${edges.length}`)
  console.log('样例：\n  ' + samples.join('\n  '))
  writeFileSync('scripts/.fam-prune.json', JSON.stringify(toDelete))

  if (!APPLY) { console.log('\ndry-run，未删。加 --apply 执行剔除。'); return }
  let n = 0
  for (const e of toDelete) { const { error, count } = await db.from('word_relations').delete({ count: 'exact' }).eq('type', 'derivative').eq('word_id', e.word_id).eq('related_id', e.related_id); if (error) { console.error(error.message); process.exit(1) } n += count ?? 0 }
  console.log(`已剔除 ${n} 条错误词族边。`)
}
main().catch(e => { console.error('fatal', e?.message ?? e); process.exit(1) })
