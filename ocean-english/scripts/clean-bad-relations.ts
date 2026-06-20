/* ════════════════════════════════════════════════════════════════════════
   clean-bad-relations.ts — 清除「语义错误」的同义/反义关系（两轮防误删，可断点）
   Pass1：低温判全量 good/loose/wrong（缓存 id→verdict）。
   Pass2：对 wrong 严格二次确认——仅「确实词义无关/错误」才删；valid 或 loose 一律保留。
   只删 Pass2 确认为 wrong 的；loose（相关/近似/上下义）保留（对学习者有用）。
   用法：npx tsx scripts/clean-bad-relations.ts [--antonyms] [--apply]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'; import { readFileSync, writeFileSync, existsSync } from 'fs'
const env = readFileSync('.env.local', 'utf8'); const g = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(g('NEXT_PUBLIC_SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'))
const DS = g('DEEPSEEK_API_KEY')
const ANTO = process.argv.includes('--antonyms')
const APPLY = process.argv.includes('--apply')
const REL = ANTO ? '反义' : '同义'
const TABLE = ANTO ? 'dictionary_antonyms' : 'dictionary_synonyms'
const COL = ANTO ? 'antonym' : 'synonym'
const VCACHE = `scripts/.rel-v-${ANTO ? 'ant' : 'syn'}.json`   // id -> verdict
const CCACHE = `scripts/.rel-c-${ANTO ? 'ant' : 'syn'}.json`   // id -> wrong bool

async function pageAll<T>(t: string, c: string): Promise<T[]> { const o: T[] = []; for (let f = 0; ; f += 1000) { const { data } = await db.from(t).select(c).range(f, f + 999); const r = (data ?? []) as T[]; o.push(...r); if (r.length < 1000) break } return o }
async function call(prompt: string, tryN = 0): Promise<any[]> {
  let res: Response
  try { res = await fetch('https://api.deepseek.com/chat/completions', { method: 'POST', headers: { Authorization: 'Bearer ' + DS, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.1, messages: [{ role: 'user', content: prompt }] }) }) }
  catch { if (tryN < 2) { await new Promise(r => setTimeout(r, 1500)); return call(prompt, tryN + 1) } return [] }
  if (!res.ok) { if (tryN < 2) { await new Promise(r => setTimeout(r, 1500)); return call(prompt, tryN + 1) } return [] }
  try { const j = await res.json() as any; let t = (j.choices?.[0]?.message?.content || '').replace(/```json|```/g, '').trim(); const m = t.match(/\[[\s\S]*\]/); if (m) t = m[0]; const a = JSON.parse(t); return Array.isArray(a) ? a : [] }
  catch { return [] }
}

async function main() {
  if (!DS) { console.error('DEEPSEEK missing'); process.exit(1) }
  const idW = new Map((await pageAll<{ id: string; word: string }>('dictionary_words', 'id, word')).map(r => [r.id, r.word]))
  const rels = (await pageAll<any>(TABLE, `id, word_id, ${COL}`)).map(r => ({ id: r.id as string, a: idW.get(r.word_id) ?? '', b: String(r[COL] ?? '') })).filter(p => p.a && p.b)
  console.log(`${REL}关系 ${rels.length}　${APPLY ? 'APPLY' : 'dry-run'}`)

  // ── Pass1：全量判 good/loose/wrong（缓存续跑）──
  const verdict = new Map<string, string>(existsSync(VCACHE) ? Object.entries(JSON.parse(readFileSync(VCACHE, 'utf8'))) : [])
  const todo1 = rels.filter(r => !verdict.has(r.id))
  console.log(`Pass1 已缓存 ${rels.length - todo1.length}，待判 ${todo1.length}`)
  for (let i = 0; i < todo1.length; i += 20) {
    const b = todo1.slice(i, i + 20)
    const prompt = `你是英语词汇语义专家。每行「A ⇒ B」，B 标注为 A 的${REL}词。判定：good=确实强${REL}；loose=仅相关/近似/上下义/同主题；wrong=词义无关或错误。只输出 JSON：[{"i":1,"verdict":"good"}]\n${b.map((p, k) => `${k + 1}. ${p.a} ⇒ ${p.b}`).join('\n')}`
    const got = await call(prompt); const mp = new Map<number, string>(); for (const e of got) mp.set(e.i, e.verdict)
    b.forEach((p, k) => verdict.set(p.id, mp.get(k + 1) ?? 'unknown'))
    writeFileSync(VCACHE, JSON.stringify(Object.fromEntries(verdict)))
    process.stdout.write(`\rPass1 ${Math.min(i + 20, todo1.length)}/${todo1.length}`)
  }
  console.log('')
  const wrong1 = rels.filter(r => verdict.get(r.id) === 'wrong')
  const good = [...verdict.values()].filter(v => v === 'good').length, loose = [...verdict.values()].filter(v => v === 'loose').length
  console.log(`Pass1：good ${good} · loose ${loose} · wrong ${wrong1.length}（loose 全部保留）`)

  // ── Pass2：对 wrong 严格二次确认（缓存续跑）──
  const conf = new Map<string, boolean>(existsSync(CCACHE) ? Object.entries(JSON.parse(readFileSync(CCACHE, 'utf8'))) : [])
  const todo2 = wrong1.filter(r => !conf.has(r.id))
  console.log(`Pass2 待确认 ${todo2.length}（已缓存 ${wrong1.length - todo2.length}）`)
  for (let i = 0; i < todo2.length; i += 15) {
    const b = todo2.slice(i, i + 15)
    const prompt = `你是顶级英语词典语义专家。下列「A ⇒ B」此前被怀疑是错误的${REL}关系。请**严格公允**复核：仅当 B 与 A **词义确实无关或明显错误**（不是任何意义上的${REL}词）时判 wrong=true；只要 B 是 A 的有效${REL}词、或合理的近似/${ANTO ? '相对' : '弱'}${REL}，一律判 wrong=false 予以保留。只输出 JSON：[{"i":1,"wrong":false}]\n${b.map((p, k) => `${k + 1}. ${p.a} ⇒ ${p.b}`).join('\n')}`
    const got = await call(prompt); const mp = new Map<number, boolean>(); for (const e of got) mp.set(e.i, !!e.wrong)
    b.forEach((p, k) => conf.set(p.id, mp.get(k + 1) ?? false))
    writeFileSync(CCACHE, JSON.stringify(Object.fromEntries(conf)))
    process.stdout.write(`\rPass2 ${Math.min(i + 15, todo2.length)}/${todo2.length}`)
  }
  console.log('')
  const del = wrong1.filter(r => conf.get(r.id))
  console.log(`\n确凿错误（两轮确认，将删）${del.length} / 一次疑似 ${wrong1.length}（救回 ${wrong1.length - del.length}）`)
  console.log('删除样例:', del.slice(0, 24).map(r => `${r.a}⇏${r.b}`).join(' '))
  if (!APPLY) { console.log('\ndry-run，未删。加 --apply。'); return }
  let n = 0
  for (let i = 0; i < del.length; i += 100) { const { count } = await db.from(TABLE).delete({ count: 'exact' }).in('id', del.slice(i, i + 100).map(r => r.id)); n += count ?? 0 }
  console.log(`已删除 ${n} 条确凿错误的${REL}关系（loose 保留）。`)
}
main().catch(e => { console.error('fatal', e?.message ?? e); process.exit(1) })
