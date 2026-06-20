/* ════════════════════════════════════════════════════════════════════════
   audit-synonyms-semantic.ts — 同义/反义关系「语义」抽样复核（只读，出清单不删）
   结构层 audit-relations 已 0 死链；本脚本查语义：B 是否真是 A 的同义/反义，
   还是只相关/上下义/同主题（如 coherent→tenacious 不应作强同义）。
   DeepSeek 低温判 good/loose/wrong，输出可疑清单到 reports/，**不自动删除**。
   用法：npx tsx scripts/audit-synonyms-semantic.ts [--n 1000] [--antonyms]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'; import { readFileSync, writeFileSync, mkdirSync } from 'fs'
const env = readFileSync('.env.local', 'utf8'); const g = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(g('NEXT_PUBLIC_SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'))
const DS = g('DEEPSEEK_API_KEY')
const ANTO = process.argv.includes('--antonyms')
const N = process.argv.includes('--n') ? Number(process.argv[process.argv.indexOf('--n') + 1]) : 1000
const REL = ANTO ? '反义' : '同义'

async function pageAll<T>(t: string, c: string): Promise<T[]> { const o: T[] = []; for (let f = 0; ; f += 1000) { const { data } = await db.from(t).select(c).range(f, f + 999); const r = (data ?? []) as T[]; o.push(...r); if (r.length < 1000) break } return o }
type V = { i: number; verdict: 'good' | 'loose' | 'wrong' }
async function judge(pairs: { a: string; b: string }[], tryN = 0): Promise<Record<number, string>> {
  const list = pairs.map((p, i) => `${i + 1}. ${p.a} ⇒ ${p.b}`).join('\n')
  const prompt = `你是英语词汇语义专家。下面每行是一对词「A ⇒ B」，B 被标注为 A 的${REL}词。请判断该${REL}关系是否成立：
- good：B 确是 A 的${ANTO ? '准确反义词' : '可替换/强同义词'}。
- loose：仅相关/程度或语境${ANTO ? '相对' : '近似'}/上下义/同主题，不算强${REL}（如 coherent⇒tenacious）。
- wrong：词义无关或明显错误。
只输出 JSON：[{"i":1,"verdict":"good"}]
词对：
${list}`
  let res: Response
  try { res = await fetch('https://api.deepseek.com/chat/completions', { method: 'POST', headers: { Authorization: 'Bearer ' + DS, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.1, messages: [{ role: 'user', content: prompt }] }) }) }
  catch { if (tryN < 2) { await new Promise(r => setTimeout(r, 1500)); return judge(pairs, tryN + 1) } return {} }
  if (!res.ok) { if (tryN < 2) { await new Promise(r => setTimeout(r, 1500)); return judge(pairs, tryN + 1) } return {} }
  try { const j = await res.json() as any; let t = (j.choices?.[0]?.message?.content || '').replace(/```json|```/g, '').trim(); const m = t.match(/\[[\s\S]*\]/); if (m) t = m[0]; const a = JSON.parse(t) as V[]; const o: Record<number, string> = {}; for (const e of a) o[e.i] = e.verdict; return o }
  catch { return {} }
}

async function main() {
  if (!DS) { console.error('DEEPSEEK missing'); process.exit(1) }
  const idW = new Map((await pageAll<{ id: string; word: string }>('dictionary_words', 'id, word')).map(r => [r.id, r.word]))
  const table = ANTO ? 'dictionary_antonyms' : 'dictionary_synonyms'; const col = ANTO ? 'antonym' : 'synonym'
  const all = (await pageAll<any>(table, `word_id, ${col}`)).map(r => ({ a: idW.get(r.word_id) ?? '', b: String(r[col] ?? '') })).filter(p => p.a && p.b)
  const sample = [...all].sort(() => Math.random() - 0.5).slice(0, N)
  console.log(`${REL}词总 ${all.length}，抽样复核 ${sample.length} 对…`)
  const verdict: string[] = []
  for (let i = 0; i < sample.length; i += 20) {
    const got = await judge(sample.slice(i, i + 20).map(p => ({ a: p.a, b: p.b })))
    sample.slice(i, i + 20).forEach((_, k) => verdict[i + k] = got[k + 1] ?? 'unknown')
    process.stdout.write(`\r复核 ${Math.min(i + 20, sample.length)}/${sample.length}`)
  }
  console.log('')
  const good = verdict.filter(v => v === 'good').length, loose = verdict.filter(v => v === 'loose').length, wrong = verdict.filter(v => v === 'wrong').length
  const suspicious = sample.map((p, i) => ({ ...p, v: verdict[i] })).filter(p => p.v === 'wrong' || p.v === 'loose')
  console.log(`\n样本 ${sample.length}：good ${good}（${(good / sample.length * 100).toFixed(1)}%）· loose ${loose} · wrong ${wrong}`)
  console.log(`估算：强${REL}约 ${(good / sample.length * 100).toFixed(0)}%，可疑（loose+wrong）约 ${((loose + wrong) / sample.length * 100).toFixed(0)}%`)
  mkdirSync('reports', { recursive: true })
  const out = `reports/${ANTO ? 'antonym' : 'synonym'}-semantic-audit.md`
  const lines = [`# ${REL}词语义抽样复核（${new Date().toISOString().slice(0, 10)}）`, '',
    `样本 ${sample.length} / 总 ${all.length}。强${REL} ${(good / sample.length * 100).toFixed(1)}% · loose ${loose} · wrong ${wrong}。**仅清单，未删除。**`, '',
    '| A | ⇒ B | 判定 |', '|---|---|---|',
    ...suspicious.map(p => `| ${p.a} | ${p.b} | ${p.v} |`)]
  writeFileSync(out, lines.join('\n'))
  console.log(`\n可疑清单（${suspicious.length} 条）已写 ${out}（不自动删除，供人工复核）`)
}
main().catch(e => { console.error('fatal', e?.message ?? e); process.exit(1) })
