/* ════════════════════════════════════════════════════════════════════════
   qa-etymology.ts — 词源可靠性抽查复核（dictionary_etymology）
   ① 结构扫描：roots 是否标明可识别的来源语言（拉丁/希腊/古法语…），否则疑似无效。
   ② AI 复核：随机抽样 + 全部「无来源语言」者，低温让 DeepSeek 判 正确/错误/存疑，
      估算错误率；--apply 时删除「错误/编造/存疑」条（宁缺毋滥，绝不留错）。
   用法：npx tsx scripts/qa-etymology.ts [--sample N=400] [--apply]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'; import { readFileSync, writeFileSync, existsSync } from 'fs'
const env = readFileSync('.env.local', 'utf8'); const g = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(g('NEXT_PUBLIC_SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'))
const DS = g('DEEPSEEK_API_KEY')
const APPLY = process.argv.includes('--apply')
const FULL = process.argv.includes('--full')           // 全量复核（否则随机抽样）
const N = process.argv.includes('--sample') ? Number(process.argv[process.argv.indexOf('--sample') + 1]) : 400
const VCACHE = 'scripts/.ety-verdicts.json'             // id -> verdict，断点续跑
const LANG = /(Latin|Greek|Old French|French|Old English|Middle English|Germanic|Proto|Norse|Old Norse|Arabic|Spanish|Italian|Portuguese|Sanskrit|Persian|Hebrew|Dutch|Celtic|Gaelic|Hindi|Turkish|Russian|Japanese|Chinese|Egyptian|Aleut|Nahuatl|Malay|拉丁|希腊|古法|法语|古英|日耳曼|诺斯|阿拉伯|西班牙|梵)/i

async function pageAll<T>(t: string, c: string): Promise<T[]> { const o: T[] = []; for (let f = 0; ; f += 1000) { const { data } = await db.from(t).select(c).range(f, f + 999); const r = (data ?? []) as T[]; o.push(...r); if (r.length < 1000) break } return o }

type V = { word: string; verdict: 'correct' | 'wrong' | 'uncertain' }
async function verify(items: { word: string; roots: string; zh: string }[], tryN = 0): Promise<Record<string, string>> {
  const list = items.map((it, i) => `${i + 1}. ${it.word} — roots: ${it.roots}｜释义说明: ${it.zh}`).join('\n')
  const prompt = `你是严谨的英语词源学专家。下面每行是一个单词及其声称的词源(roots)与中文说明。请逐条判断该词源是否**真实准确**（来源语言、词根、释义是否正确，有无编造/张冠李戴）。
对每条给 verdict：correct(正确) / wrong(错误或编造) / uncertain(无法确认)。务必客观，宁可判 uncertain 也不要放过错误。
只输出 JSON 数组：[{"word":"","verdict":"correct"}]
词条：
${list}`
  let res: Response
  try { res = await fetch('https://api.deepseek.com/chat/completions', { method: 'POST', headers: { Authorization: 'Bearer ' + DS, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.1, messages: [{ role: 'user', content: prompt }] }) }) }
  catch { if (tryN < 2) { await new Promise(r => setTimeout(r, 1500)); return verify(items, tryN + 1) } return {} }
  if (!res.ok) { if (tryN < 2) { await new Promise(r => setTimeout(r, 1500)); return verify(items, tryN + 1) } return {} }
  try { const j = await res.json() as any; let t = (j.choices?.[0]?.message?.content || '').replace(/```json|```/g, '').trim(); const m = t.match(/\[[\s\S]*\]/); if (m) t = m[0]; const a = JSON.parse(t) as V[]; const out: Record<string, string> = {}; for (const e of a) if (e.word) out[String(e.word).toLowerCase()] = e.verdict; return out }
  catch { return {} }
}

async function main() {
  if (!DS) { console.error('DEEPSEEK missing'); process.exit(1) }
  const idW = new Map((await pageAll<{ id: string; word: string }>('dictionary_words', 'id, word')).map(r => [r.id, r.word]))
  const ety = await pageAll<{ id: string; word_id: string; roots: string | null; explanation_zh: string | null }>('dictionary_etymology', 'id, word_id, roots, explanation_zh')
  const rows = ety.map(e => ({ id: e.id, word: idW.get(e.word_id) ?? e.word_id, roots: String(e.roots ?? '').trim(), zh: String(e.explanation_zh ?? '').trim() })).filter(r => r.word)

  const noLang = rows.filter(r => !LANG.test(r.roots))
  console.log(`词源总数 ${rows.length}　无可识别来源语言 ${noLang.length}（${(noLang.length / rows.length * 100).toFixed(1)}%）`)
  if (noLang.length) console.log('  无来源语言样例:', noLang.slice(0, 8).map(r => `${r.word}「${r.roots}」`).join(' | '))

  // 受检集：--full 全量；否则 随机 N 条 + 全部无来源语言者
  const shuffled = FULL ? rows : [...rows].sort(() => Math.random() - 0.5).slice(0, N)
  const checkMap = new Map<string, typeof rows[0]>()
  for (const r of [...shuffled, ...noLang]) checkMap.set(r.id, r)
  const check = [...checkMap.values()]
  console.log(`\nAI 复核 ${check.length} 条（${FULL ? '全量' : '随机 ' + shuffled.length} + 无来源语言 ${noLang.length}）…`)

  // 断点缓存：已判过的跳过，每批落盘
  const verdict = new Map<string, string>(existsSync(VCACHE) ? Object.entries(JSON.parse(readFileSync(VCACHE, 'utf8'))) : [])
  const todo = check.filter(r => !verdict.has(r.id))
  console.log(`已缓存 ${check.length - todo.length}，待判 ${todo.length}`)
  for (let i = 0; i < todo.length; i += 10) {
    const batch = todo.slice(i, i + 10)
    const got = await verify(batch.map(b => ({ word: b.word, roots: b.roots, zh: b.zh })))
    for (const b of batch) verdict.set(b.id, got[b.word.toLowerCase()] ?? 'uncertain')
    writeFileSync(VCACHE, JSON.stringify(Object.fromEntries(verdict)))
    process.stdout.write(`\r复核 ${Math.min(i + 10, todo.length)}/${todo.length}`)
  }
  console.log('')
  let ok = 0, wrong = 0, unc = 0; const wrongEx: string[] = []
  for (const r of check) { const v = verdict.get(r.id); if (v === 'correct') ok++; else if (v === 'wrong') { wrong++; if (wrongEx.length < 20) wrongEx.push(`${r.word}「${r.roots}」`) } else unc++ }
  // 随机样本错误率（不含定向 noLang，反映总体）
  const sampV = shuffled.map(r => verdict.get(r.id)); const sOk = sampV.filter(v => v === 'correct').length
  console.log(`\n【随机样本 ${shuffled.length} 条】正确 ${sOk}（${(sOk / shuffled.length * 100).toFixed(1)}%）→ 估算总体准确率 ≈ ${(sOk / shuffled.length * 100).toFixed(1)}%`)
  console.log(`【受检全部 ${check.length} 条】正确 ${ok} · 错误/编造 ${wrong} · 存疑 ${unc}`)
  console.log('错误/编造样例:', wrongEx.join(' | ') || '无')

  const toDel = check.filter(r => verdict.get(r.id) !== 'correct').map(r => r.id)
  writeFileSync('scripts/.ety-bad.json', JSON.stringify(toDel))
  if (!APPLY) { console.log(`\ndry-run：受检中 ${toDel.length} 条非正确（错误+存疑），加 --apply 删除。`); return }
  let n = 0
  for (let i = 0; i < toDel.length; i += 100) { const { count } = await db.from('dictionary_etymology').delete({ count: 'exact' }).in('id', toDel.slice(i, i + 100)); n += count ?? 0 }
  console.log(`\n已删除 ${n} 条 错误/存疑 词源（受检范围内）。`)
}
main().catch(e => { console.error('fatal', e?.message ?? e); process.exit(1) })
