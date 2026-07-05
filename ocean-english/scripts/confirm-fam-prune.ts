/* ════════════════════════════════════════════════════════════════════════
   confirm-fam-prune.ts — 对 AI 初判「错误词族边」(.fam-prune.json) 做严格二次确认
   只删「词源确实无关、纯拼写相似」的边；拼写变体(-ise/-ize)、真派生(X→Xation/Xary 同源)
   一律保留，纠正初判假阳性（如 characterize↔characterise、bound↔boundary）。
   用法：npx tsx scripts/confirm-fam-prune.ts [--apply]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'; import { readFileSync, writeFileSync } from 'fs'
const env = readFileSync('.env.local', 'utf8'); const g = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(g('NEXT_PUBLIC_SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'))
const DS = g('DEEPSEEK_API_KEY')
const APPLY = process.argv.includes('--apply')

type Pair = { word_id: string; related_id: string; root: string; member: string }
async function gen(pairs: Pair[], tryN = 0): Promise<Record<string, boolean>> {
  const list = pairs.map((p, i) => `${i + 1}. ${p.root} — ${p.member}`).join('\n')
  const prompt = `你是英语词源学专家。下面每行是一对词「A — B」，它们拼写相似、被某工具归为同一词族。请严格判断 B 与 A 是否**词源无关、只是拼写碰巧相似**。
判定规则：
- 同源应保留(related)：拼写变体(如 organize/organise)、屈折与派生(如 care/caring、characterize/characterization、bound→boundary)、同一拉丁/希腊/日耳曼词根。
- 无关应剔除(unrelated)：来自不同词根、仅前几个字母偶合（如 care/career、cent/center、arch/archive、both/bother、admiral/admirable）。
对每对输出 unrelated(true=应剔除/词源无关, false=同源保留)。务必准确。
只输出 JSON 数组：[{"i":1,"unrelated":true}]
词对：
${list}`
  let res: Response
  try { res = await fetch('https://api.deepseek.com/chat/completions', { method: 'POST', headers: { Authorization: 'Bearer ' + DS, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.1, messages: [{ role: 'user', content: prompt }] }) }) }
  catch { if (tryN < 2) { await new Promise(r => setTimeout(r, 1500)); return gen(pairs, tryN + 1) } return {} }
  if (!res.ok) { if (tryN < 2) { await new Promise(r => setTimeout(r, 1500)); return gen(pairs, tryN + 1) } return {} }
  try { const j = await res.json() as any; let t = (j.choices?.[0]?.message?.content || '').replace(/```json|```/g, '').trim(); const m = t.match(/\[[\s\S]*\]/); if (m) t = m[0]; const a = JSON.parse(t) as { i: number; unrelated: boolean }[]; const out: Record<string, boolean> = {}; for (const e of a) { const p = pairs[e.i - 1]; if (p) out[p.word_id + '|' + p.related_id] = !!e.unrelated } return out }
  catch { return {} }
}

async function main() {
  if (!DS) { console.error('DEEPSEEK missing'); process.exit(1) }
  const edges = JSON.parse(readFileSync('scripts/.fam-prune.json', 'utf8')) as { word_id: string; related_id: string }[]
  const ids = [...new Set(edges.flatMap(e => [e.word_id, e.related_id]))]
  const idW = new Map<string, string>()
  for (let i = 0; i < ids.length; i += 200) { const { data } = await db.from('dictionary_words').select('id, word').in('id', ids.slice(i, i + 200)); (data ?? []).forEach((x: any) => idW.set(x.id, x.word)) }
  const pairs: Pair[] = edges.map(e => ({ ...e, root: idW.get(e.word_id) ?? e.word_id, member: idW.get(e.related_id) ?? e.related_id }))
  console.log(`二次确认 ${pairs.length} 对　${APPLY ? 'APPLY' : 'dry-run'}`)

  const verdict: Record<string, boolean> = {}
  for (let i = 0; i < pairs.length; i += 20) { Object.assign(verdict, await gen(pairs.slice(i, i + 20))); process.stdout.write(`\r确认 ${Math.min(i + 20, pairs.length)}/${pairs.length}`) }
  console.log('')
  const del = pairs.filter(p => verdict[p.word_id + '|' + p.related_id])
  const keep = pairs.filter(p => !verdict[p.word_id + '|' + p.related_id])
  console.log(`\n确认剔除(词源无关) ${del.length}　纠回保留(同源/变体) ${keep.length}`)
  console.log('剔除样例:', del.slice(0, 24).map(p => `${p.root}⊅${p.member}`).join(' '))
  console.log('纠回样例:', keep.slice(0, 24).map(p => `${p.root}✓${p.member}`).join(' '))
  writeFileSync('scripts/.fam-prune-final.json', JSON.stringify(del.map(p => ({ word_id: p.word_id, related_id: p.related_id }))))

  if (!APPLY) { console.log('\ndry-run，未删。加 --apply。'); return }
  let n = 0
  for (const e of del) { const { error, count } = await db.from('word_relations').delete({ count: 'exact' }).eq('type', 'derivative').eq('word_id', e.word_id).eq('related_id', e.related_id); if (error) { console.error(error.message); process.exit(1) } n += count ?? 0 }
  console.log(`已剔除 ${n} 条确认错误的词族边。`)
}
main().catch(e => { console.error('fatal', e?.message ?? e); process.exit(1) })
