/* ════════════════════════════════════════════════════════════════════════
   audit-relations.ts — 词族/同义词/反义词 数据质量审查（只读，默认 dry-run）
   检查三类缺陷：
     ① 格式非法/疑似编造  synonym/antonym 不是合法英文词（含数字/标点/>3词/自指）
     ② 死链（不在词库）   synonym/antonym/词族成员 指向的词不在 dictionary_words
     ③ 错误分类（词族）   词形家族里成员与词根明显不同源（拼写词干碰撞，如 press↔present）
   输出统计 + 样例；写 /tmp/audit-flags.json 供 --fix 步骤使用。
   用法：npx tsx scripts/audit-relations.ts
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'; import { readFileSync, writeFileSync } from 'fs'
const env = readFileSync('.env.local', 'utf8'); const g = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(g('NEXT_PUBLIC_SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'))

const WORDRE = /^[a-z][a-z'-]*$/   // 单个合法英文词（小写）
async function pageAll<T>(table: string, cols: string): Promise<T[]> {
  const out: T[] = []
  for (let f = 0; ; f += 1000) { const { data, error } = await db.from(table).select(cols).range(f, f + 999); if (error) throw new Error(table + ': ' + error.message); const r = (data ?? []) as T[]; out.push(...r); if (r.length < 1000) break }
  return out
}

async function main() {
  console.log('载入 dictionary_words …')
  const words = await pageAll<{ id: string; word: string }>('dictionary_words', 'id, word')
  const idSet = new Set(words.map(w => w.id))
  const wordSet = new Set(words.map(w => w.word.toLowerCase().trim()))
  const idToWord = new Map(words.map(w => [w.id, w.word]))
  console.log(`词库 ${words.length} 词\n`)

  const flags = { syn: [] as string[], ant: [] as string[], famMember: [] as string[] }

  // ── 同义词 ──
  const syns = await pageAll<{ id: string; word_id: string; synonym: string }>('dictionary_synonyms', 'id, word_id, synonym')
  let sSelf = 0, sBad = 0, sDead = 0, sOk = 0
  const sBadEx: string[] = [], sDeadEx: string[] = []
  for (const r of syns) {
    const base = idToWord.get(r.word_id)?.toLowerCase() ?? ''
    const s = String(r.synonym ?? '').toLowerCase().trim()
    if (!s || s === base) { sSelf++; flags.syn.push(r.id); continue }
    if (!WORDRE.test(s)) { sBad++; if (sBadEx.length < 18) sBadEx.push(`${base} → "${r.synonym}"`); flags.syn.push(r.id); continue }
    if (!wordSet.has(s)) { sDead++; if (sDeadEx.length < 18) sDeadEx.push(`${base} → ${s}`); continue }   // 死链：不在词库（不一定删，先报告）
    sOk++
  }

  // ── 反义词 ──
  const ants = await pageAll<{ id: string; word_id: string; antonym: string }>('dictionary_antonyms', 'id, word_id, antonym')
  let aSelf = 0, aBad = 0, aDead = 0, aOk = 0
  const aBadEx: string[] = [], aDeadEx: string[] = []
  for (const r of ants) {
    const base = idToWord.get(r.word_id)?.toLowerCase() ?? ''
    const s = String(r.antonym ?? '').toLowerCase().trim()
    if (!s || s === base) { aSelf++; flags.ant.push(r.id); continue }
    if (!WORDRE.test(s)) { aBad++; if (aBadEx.length < 18) aBadEx.push(`${base} ⇄ "${r.antonym}"`); flags.ant.push(r.id); continue }
    if (!wordSet.has(s)) { aDead++; if (aDeadEx.length < 18) aDeadEx.push(`${base} ⇄ ${s}`); continue }
    aOk++
  }

  // ── 词族（derivative）──
  const der = await pageAll<{ word_id: string; related_id: string }>('word_relations', 'word_id, related_id')
    .then(() => pageAll<{ word_id: string; related_id: string; type: string }>('word_relations', 'word_id, related_id, type'))
  const derivs = der.filter(r => r.type === 'derivative')
  const fam = new Map<string, string[]>()
  for (const r of derivs) { const a = fam.get(r.word_id) ?? []; a.push(r.related_id); fam.set(r.word_id, a) }
  let dDeadRoot = 0, dDeadMember = 0
  const dDeadEx: string[] = []
  for (const [root, members] of fam) {
    if (!idSet.has(root)) { dDeadRoot++; members.forEach(m => flags.famMember.push(`${root}|${m}`)); continue }
    for (const m of members) {
      if (!idSet.has(m)) { dDeadMember++; if (dDeadEx.length < 12) dDeadEx.push(`${root} ← ${m}(死链)`); flags.famMember.push(`${root}|${m}`) }
    }
  }

  writeFileSync('scripts/.audit-flags.json', JSON.stringify(flags))

  const fmt = (n: number, t: number) => `${n} (${(n / t * 100).toFixed(1)}%)`
  console.log('══════════ 同义词 dictionary_synonyms ══════════')
  console.log(`总 ${syns.length}　合法在库 ${fmt(sOk, syns.length)}　死链(不在词库) ${fmt(sDead, syns.length)}　格式非法/疑似编造 ${fmt(sBad, syns.length)}　自指 ${sSelf}`)
  console.log('  · 格式非法样例:', sBadEx.slice(0, 12).join(' | ') || '无')
  console.log('  · 死链样例:', sDeadEx.slice(0, 12).join(' | ') || '无')
  console.log('\n══════════ 反义词 dictionary_antonyms ══════════')
  console.log(`总 ${ants.length}　合法在库 ${fmt(aOk, ants.length)}　死链(不在词库) ${fmt(aDead, ants.length)}　格式非法/疑似编造 ${fmt(aBad, ants.length)}　自指 ${aSelf}`)
  console.log('  · 格式非法样例:', aBadEx.slice(0, 12).join(' | ') || '无')
  console.log('  · 死链样例:', aDeadEx.slice(0, 12).join(' | ') || '无')
  console.log('\n══════════ 词族 word_relations(derivative) ══════════')
  console.log(`家族数(根) ${fam.size}　边数 ${derivs.length}　根本身死链 ${dDeadRoot}　成员死链 ${dDeadMember}`)
  console.log('  · 成员死链样例:', dDeadEx.join(' | ') || '无')
  console.log('\n（错误分类——拼写词干碰撞，如 press↔present——需 AI 复核，见下一步）')
  console.log(`\nflags 写入 scripts/.audit-flags.json：syn=${flags.syn.length} ant=${flags.ant.length} famMember=${flags.famMember.length}`)
}
main().catch(e => { console.error('fatal', e?.message ?? e); process.exit(1) })
