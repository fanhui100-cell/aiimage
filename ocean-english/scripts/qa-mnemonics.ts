/* ════════════════════════════════════════════════════════════════════════
   qa-mnemonics.ts — 助记质量复核：挑出「弱助记」并重生成（word_mnemonics）
   弱助记判定（启发式）：
     · 过短（中文 < 12 字，多为纯谐音/复述释义，如「阿娇」「一个惹事者」）
     · 与该词中文释义无任何实义字重叠（只谐音、没扣住词义，如 agio→阿娇）
   重生成提示词强制：谐音/拆解 + **联想必须落到词义**，传入该词释义作上下文。
   用法：npx tsx scripts/qa-mnemonics.ts [--apply]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'; import { readFileSync, writeFileSync } from 'fs'
const env = readFileSync('.env.local', 'utf8'); const g = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(g('NEXT_PUBLIC_SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'))
const DS = g('DEEPSEEK_API_KEY')
const APPLY = process.argv.includes('--apply')
const STOP = new Set('的了一个是在有人着把被和与为之者地得很都也就要这那他她它们你我'.split(''))
const cn = (s: string) => (s.match(/[一-鿿]/g) ?? [])
const cleanDef = (z: string) => z.replace(/^\[[^\]]*\]/, '').replace(/^[a-z]+\.\s*/i, '').replace(/[；;，,].*$/, '').trim()

async function pageAll<T>(t: string, c: string): Promise<T[]> { const o: T[] = []; for (let f = 0; ; f += 1000) { const { data } = await db.from(t).select(c).range(f, f + 999); const r = (data ?? []) as T[]; o.push(...r); if (r.length < 1000) break } return o }

type M = { word: string; mnemonic_zh: string }
async function regen(items: { word: string; def: string }[], tryN = 0): Promise<Record<string, string>> {
  const list = items.map((it, i) => `${i + 1}. ${it.word}（释义：${it.def || '—'}）`).join('\n')
  const prompt = `你是面向【中国英语学习者】的单词记忆专家。下面给出单词及其中文释义，为每个词写一条**优质中文助记**，必须同时满足：
① 用谐音、或拆词根/词缀/字母，把单词的读音或拼写串起来；
② **联想必须落到该词的中文释义上**——看到助记就能想起词义；
③ 纯中文、生动可记、≤40字。
禁止：只写谐音却不关联词义；直接复述释义当助记；套用英语母语者记忆法。
只输出 JSON 数组：[{"word":"","mnemonic_zh":""}]
单词：
${list}`
  let res: Response
  try { res = await fetch('https://api.deepseek.com/chat/completions', { method: 'POST', headers: { Authorization: 'Bearer ' + DS, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.7, messages: [{ role: 'user', content: prompt }] }) }) }
  catch { if (tryN < 2) { await new Promise(r => setTimeout(r, 1500)); return regen(items, tryN + 1) } return {} }
  if (!res.ok) { if (tryN < 2) { await new Promise(r => setTimeout(r, 1500)); return regen(items, tryN + 1) } return {} }
  try { const j = await res.json() as any; let t = (j.choices?.[0]?.message?.content || '').replace(/```json|```/g, '').trim(); const m = t.match(/\[[\s\S]*\]/); if (m) t = m[0]; const a = JSON.parse(t) as M[]; const out: Record<string, string> = {}; for (const e of a) { const z = String(e.mnemonic_zh ?? '').trim(); if (e.word && z) out[String(e.word).toLowerCase()] = z } return out }
  catch { return {} }
}

async function main() {
  if (!DS) { console.error('DEEPSEEK missing'); process.exit(1) }
  const idW = new Map((await pageAll<{ id: string; word: string }>('dictionary_words', 'id, word')).map(r => [r.id, r.word]))
  const defZh = new Map<string, string>()
  for (const r of await pageAll<{ word_id: string; definition_zh: string | null; order_index: number }>('dictionary_definitions', 'word_id, definition_zh, order_index')) {
    if (r.order_index === 0 && r.definition_zh && !defZh.has(r.word_id)) defZh.set(r.word_id, cleanDef(r.definition_zh))
  }
  const mns = await pageAll<{ id: string; word_id: string; mnemonic_zh: string | null }>('word_mnemonics', 'id, word_id, mnemonic_zh')

  // 有意义长度 = 中文字 + 拉丁字母（词根标签如 contra/dict 也算）；纯谐音短助记会很短
  const meaningfulLen = (s: string) => (s.match(/[一-鿿a-zA-Z]/g) ?? []).length
  const weak: { id: string; word_id: string; word: string; def: string; zh: string; why: string }[] = []
  for (const m of mns) {
    const zh = String(m.mnemonic_zh ?? '').trim(); const word = idW.get(m.word_id) ?? ''; const def = defZh.get(m.word_id) ?? ''
    if (!word) continue
    const mlen = meaningfulLen(zh)
    // 弱：过短（≈纯谐音无展开，如「阿娇」「一个惹事者」），或与单词本身无任何字母搭桥（纯中文复述释义）
    const hasBridge = /[a-zA-Z]/.test(zh) || cn(zh).some(c => word.toLowerCase().includes(c))   // 含字母/词根 = 有音形搭桥
    let why = ''
    if (mlen > 0 && mlen < 10) why = '过短'
    else if (!hasBridge && def && cn(zh).every(c => !cleanDef(def).includes(c))) why = '纯复述无音形桥'
    if (why) weak.push({ id: m.id, word_id: m.word_id, word, def, zh, why })
  }
  const short = weak.filter(w => w.why === '过短').length, noLink = weak.filter(w => w.why !== '过短').length
  console.log(`助记总数 ${mns.length}　判为弱 ${weak.length}（过短 ${short} · 纯复述无桥 ${noLink}）　${APPLY ? 'APPLY' : 'dry-run'}`)
  console.log('弱助记样例：'); for (const w of weak.slice(0, 16)) console.log(`  ${w.word}「${w.zh}」(${w.why}; 释义:${w.def})`)
  writeFileSync('scripts/.weak-mnem.json', JSON.stringify(weak.map(w => ({ id: w.id, word: w.word }))))
  if (!APPLY) { console.log('\ndry-run，未重生成。加 --apply。'); return }

  let fixed = 0
  for (let i = 0; i < weak.length; i += 16) {
    const batch = weak.slice(i, i + 16)
    const got = await regen(batch.map(w => ({ word: w.word, def: w.def })))
    for (const w of batch) { const nz = got[w.word.toLowerCase()]; if (nz && cn(nz).length >= 8) { const { error } = await db.from('word_mnemonics').update({ mnemonic_zh: nz, is_reviewed: true }).eq('id', w.id); if (!error) fixed++ } }
    process.stdout.write(`\r重生成 ${Math.min(i + 16, weak.length)}/${weak.length}（已更新 ${fixed}）`)
  }
  console.log(`\n已重生成并更新 ${fixed} 条弱助记。`)
}
main().catch(e => { console.error('fatal', e?.message ?? e); process.exit(1) })
