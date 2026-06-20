/* ============================================================================
   scripts/ai-nuance.ts — 近义辨析（DeepSeek → dictionary_word_nuance）

   给"有同义词的词"（约 1.1 万）让 DeepSeek 生成中文辨析（目标词 + 其近义词各一句差别）。
   - 生成缓存 scripts/.vocab-cache/ai-nuance.json（断点续跑）
   - --sample N：只跑前 N 词、打印、不写（验证）
   - 默认：全量生成+缓存（不写库）
   - --write：写入 dictionary_word_nuance（source_type='ai-generated', is_reviewed=false），记录回退 id
   后续 Opus 审高频（stars≥4）置 is_reviewed=true。
   ============================================================================ */
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const args = process.argv.slice(2)
const WRITE = args.includes('--write')
const SAMPLE = args.includes('--sample') ? parseInt(args[args.indexOf('--sample') + 1] || '12', 10) : 0
const ROOT = path.join(__dirname, '..')
const GEN = path.join(__dirname, '.vocab-cache', 'ai-nuance.json')
const RB = path.join(__dirname, '.vocab-cache', 'ai-nuance-rollback.json')
const CONC = 8, SYN_IN_PROMPT = 5
function env(k: string): string { for (const l of fs.readFileSync(path.join(ROOT, '.env.local'), 'utf-8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && m[1] === k) return m[2].trim() } return '' }
const DS = env('DEEPSEEK_API_KEY')
const db = createClient(env('NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'))

async function fetchAll(table: string, cols: string) {
  const out: Record<string, unknown>[] = []
  for (let from = 0; ; from += 1000) { const { data, error } = await db.from(table).select(cols).range(from, from + 999); if (error) throw new Error(error.message); out.push(...(data as unknown as Record<string, unknown>[])); if (!data || data.length < 1000) break }
  return out
}
type Row = { member: string; nuance: string }
async function gen(word: string, syns: string[]): Promise<Row[] | null> {
  const prompt = `你是英语词汇辨析专家。下面一组近义词，第一个是目标词。用中文简洁辨析每个词的语义/语域/搭配差别，每词不超过28字。只输出 JSON 数组，不要解释：[{"word":"...","nuance":"..."}]\n目标词: ${word}\n近义词: ${syns.join(', ')}`
  const res = await fetch('https://api.deepseek.com/chat/completions', { method: 'POST', headers: { Authorization: 'Bearer ' + DS, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.3, messages: [{ role: 'user', content: prompt }] }) })
  if (!res.ok) return null
  const j = await res.json() as { choices?: { message?: { content?: string } }[] }
  const txt = (j.choices?.[0]?.message?.content || '').trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim()
  try { const arr = JSON.parse(txt) as { word: string; nuance: string }[]; if (Array.isArray(arr)) return arr.filter(x => x.word && x.nuance).map(x => ({ member: String(x.word), nuance: String(x.nuance) })) } catch { /* skip */ }
  return null
}

async function main() {
  console.log(`\n=== 近义辨析 (DeepSeek) ${SAMPLE ? `【样例 ${SAMPLE}】` : WRITE ? '【全量+写库】' : '【全量生成+缓存】'} ===\n`)
  const wordRows = await fetchAll('dictionary_words', 'id,word,difficulty')
  const idWord = new Map(wordRows.map(w => [String(w.id), String(w.word)]))
  const synRows = await fetchAll('dictionary_synonyms', 'word_id,synonym,order_index')
  const synOf = new Map<string, string[]>()
  for (const r of synRows.sort((a, b) => (a.order_index as number) - (b.order_index as number))) { const k = String(r.word_id); (synOf.get(k) || synOf.set(k, []).get(k)!).push(String(r.synonym)) }
  let targets = [...synOf.keys()].filter(id => idWord.has(id))
  // 高难优先（先把生僻/高阶的辨析做出来，常见词靠后）
  targets.sort((a, b) => ((wordRows.find(w => w.id === b)?.difficulty as number) || 0) - ((wordRows.find(w => w.id === a)?.difficulty as number) || 0))
  if (SAMPLE) targets = targets.slice(0, SAMPLE)
  console.log(`有同义词的目标词：${targets.length}`)

  const cache: Record<string, Row[]> = fs.existsSync(GEN) ? JSON.parse(fs.readFileSync(GEN, 'utf-8')) : {}
  const todo = targets.filter(id => !cache[id])
  console.log(`已缓存 ${Object.keys(cache).length} · 待生成 ${todo.length}`)

  let ok = 0, fail = 0
  for (let i = 0; i < todo.length; i += CONC) {
    await Promise.all(todo.slice(i, i + CONC).map(async id => {
      const r = await gen(idWord.get(id)!, (synOf.get(id) || []).slice(0, SYN_IN_PROMPT)).catch(() => null)
      if (r && r.length) { cache[id] = r; ok++ } else fail++
    }))
    if (i % 80 < CONC) { fs.writeFileSync(GEN, JSON.stringify(cache)); process.stdout.write(`  ${ok}/${todo.length} (失败${fail})\r`) }
  }
  fs.writeFileSync(GEN, JSON.stringify(cache))
  console.log(`\n生成完成：成功 ${ok} 失败 ${fail} · 缓存共 ${Object.keys(cache).length}`)

  if (SAMPLE) {
    for (const id of targets.slice(0, Math.min(SAMPLE, 6))) {
      console.log(`\n[${idWord.get(id)}]`); for (const r of (cache[id] || [])) console.log(`  ${r.member}: ${r.nuance}`)
    }
    console.log('\n[样例模式] 未写库。'); return
  }
  if (!WRITE) { console.log('\n[未写库] 加 --write 插入 dictionary_word_nuance。'); return }

  const rows = targets.filter(id => cache[id]).flatMap(id => cache[id].map((r, k) => ({ word_id: id, member: r.member, nuance_zh: r.nuance, source_type: 'ai-generated', source_note: 'DeepSeek draft (P1 nuance)', is_reviewed: false, order_index: k })))
  console.log(`\n写 dictionary_word_nuance：${rows.length} 条…`)
  const ids: string[] = []
  for (let i = 0; i < rows.length; i += 500) {
    const { data, error } = await db.from('dictionary_word_nuance').insert(rows.slice(i, i + 500)).select('id')
    if (error) { console.error('  插入错误：', error.message); break }
    ids.push(...(data as { id: string }[]).map(r => r.id)); process.stdout.write(`  ${Math.min(i + 500, rows.length)}/${rows.length}\r`)
  }
  fs.writeFileSync(RB, JSON.stringify({ at: new Date().toISOString(), table: 'dictionary_word_nuance', ids }))
  console.log(`\n✅ 写入 ${ids.length} 条辨析；回退 id 存 ${path.relative(ROOT, RB)}`)
}
main().catch(e => { console.error(e); process.exit(1) })
