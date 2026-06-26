/* ════════════════════════════════════════════════════════════════════════
   retag-dictionary-levels.ts — 八档统一·以 ECDICT(MIT) 为权威重打全库等级（Phase 3）

   背景：现有 dictionary_words.levels/primary_level/tags 来自 KyleBing 七档词表，派生形覆盖不全
   → quickly/cultural 等常见派生形只在超大托福表里 → 错挂 primary_level=6/TOEFL。
   方案：用 ECDICT 的 tag(zk/gk/cet4/cet6/ky/toefl/ielts) 重算 levels；派生形用「后缀还原」找词基继承其档
   （quickly→quick 的 zk/gk → level 1,2）。第 7 档 SAT 不在 ECDICT → 保留现有 levels∋7 不动（owner 决策）。
   ECDICT 覆盖不到、且无现有 SAT 的词 → 保留现有 levels 不动（绝不清空/孤儿化）。
   无 curated 列 → 无人工 override 需保留，为受控全量重算（owner 复审#3）。

   口径：primary_level = min(levels)；examTags 由 levels 派生；按某档取词一律 levels∋L（owner 复审#1）。
   产出三张审计表（owner 复审#5）：ielts-only / ielts+lower / primary_level changes。
   用法：npx tsx scripts/retag-dictionary-levels.ts          （dry-run + 三表 + 自检）
        npx tsx scripts/retag-dictionary-levels.ts -- --apply（写库）
   ════════════════════════════════════════════════════════════════════════ */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { loadDotenv } from './load-dotenv'
import { LEVELS } from '@/lib/levels'

loadDotenv()
const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db: SupabaseClient = createClient(readEnv('NEXT_PUBLIC_SUPABASE_URL'), readEnv('SUPABASE_SERVICE_ROLE_KEY'))
const APPLY = process.argv.includes('--apply')
const ECDICT = path.join(__dirname, '.vocab-cache', 'ecdict.csv')

const norm = (w: string) => String(w || '').toLowerCase().trim()
const TAG_TO_LEVEL: Record<string, number> = { zk: 1, gk: 2, cet4: 3, cet6: 4, ky: 5, toefl: 6, ielts: 8 }
// level → examTag（由 LEVELS 单源派生；level 1 无标签）
const LEVEL_TO_TAG = new Map(LEVELS.filter(l => l.examTag).map(l => [l.level, l.examTag as string]))

function forEachCsvRow(content: string, cb: (r: string[]) => void) {
  let f = '', row: string[] = [], q = false
  for (let i = 0; i < content.length; i++) { const c = content[i]
    if (q) { if (c === '"') { if (content[i + 1] === '"') { f += '"'; i++ } else q = false } else f += c }
    else if (c === '"') q = true; else if (c === ',') { row.push(f); f = '' }
    else if (c === '\n') { row.push(f); cb(row); row = []; f = '' } else if (c !== '\r') f += c }
  if (f.length || row.length) { row.push(f); cb(row) }
}

/** 后缀还原候选词基（与 reports ⑤b 诊断同口径）。 */
function bases(w: string): string[] {
  const c = new Set<string>(); const add = (s: string) => { if (s && s.length >= 2) c.add(s) }
  if (w.endsWith('ies')) add(w.slice(0, -3) + 'y')
  if (w.endsWith('ally')) add(w.slice(0, -4)); if (w.endsWith('ly')) { add(w.slice(0, -2)); add(w.slice(0, -3) + 'y'); add(w.slice(0, -2) + 'e') }
  if (w.endsWith('al')) { add(w.slice(0, -2) + 'e'); add(w.slice(0, -2)) }
  if (w.endsWith('ed')) { add(w.slice(0, -2)); add(w.slice(0, -1)); add(w.slice(0, -3)) }
  if (w.endsWith('ing')) { add(w.slice(0, -3)); add(w.slice(0, -3) + 'e') }
  if (w.endsWith('es')) add(w.slice(0, -2)); if (w.endsWith('s')) add(w.slice(0, -1))
  if (w.endsWith('er')) { add(w.slice(0, -2)); add(w.slice(0, -1)) }; if (w.endsWith('est')) { add(w.slice(0, -3)); add(w.slice(0, -2)) }
  if (w.endsWith('ness')) add(w.slice(0, -4)); if (w.endsWith('ment')) add(w.slice(0, -4))
  if (w.endsWith('tion')) { add(w.slice(0, -3) + 'e'); add(w.slice(0, -4) + 'e') }; if (w.endsWith('ity')) add(w.slice(0, -3) + 'e')
  return [...c]
}

function tagToLevels(tag: string): number[] {
  const out = new Set<number>()
  for (const t of (tag || '').toLowerCase().split(/\s+/)) { if (TAG_TO_LEVEL[t]) out.add(TAG_TO_LEVEL[t]) }
  return [...out]
}

async function fetchAll(table: string, cols: string): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = []
  for (let from = 0; ; from += 1000) { const { data, error } = await db.from(table).select(cols).range(from, from + 999); if (error) throw new Error(error.message); out.push(...((data ?? []) as unknown as Record<string, unknown>[])); if (!data || data.length < 1000) break }
  return out
}

async function main() {
  console.log(`\n=== ECDICT 重打全库等级 ${APPLY ? '【写库】' : '【dry-run】'} ===\n`)

  // 1) 载 ECDICT：word → {levels(由 tag), frq}（仅留有 tag 的词，供本词与词基查询）
  process.stdout.write('载 ECDICT tag… ')
  const ecdictLv = new Map<string, number[]>(); const ecdictFrq = new Map<string, number>()
  let idx: Record<string, number> | null = null
  forEachCsvRow(readFileSync(ECDICT, 'utf-8'), (r) => {
    if (!idx) { idx = {}; r.forEach((h, k) => (idx![h.trim()] = k)); return }
    const w = norm(r[idx.word]); if (!w) return
    const frq = Number(r[idx.frq]); if (Number.isFinite(frq) && frq > 0 && !ecdictFrq.has(w)) ecdictFrq.set(w, frq)
    const lv = tagToLevels(r[idx.tag] || ''); if (lv.length && !ecdictLv.has(w)) ecdictLv.set(w, lv)
  })
  console.log(`tagged ${ecdictLv.size} 词`)

  // 2) 全库词
  const words = await fetchAll('dictionary_words', 'id, normalized_word, levels, primary_level, tags')
  console.log(`dictionary_words: ${words.length}\n`)

  const sameArr = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i])
  // 词 → 现有 levels：供词基跨词查现有档（fix 派生形：cultural 继承 culture 的现有档）
  const existingByWord = new Map<string, number[]>()
  for (const w of words) { const ww = norm(String(w.normalized_word || '')); if (ww && !existingByWord.has(ww)) existingByWord.set(ww, Array.isArray(w.levels) ? (w.levels as number[]) : []) }

  interface Row { id: string; word: string; oldLv: number[]; oldPl: number; newLv: number[]; newPl: number; newTags: string[]; via: 'own' | 'base' | 'kept'; changed: boolean }
  const rows: Row[] = []
  let kept = 0, viaBase = 0, viaOwn = 0
  for (const w of words) {
    const word = norm(String(w.normalized_word || ''))
    const oldLv = Array.isArray(w.levels) ? (w.levels as number[]).slice().sort((a, b) => a - b) : []
    const oldPl = Number(w.primary_level) || (oldLv[0] ?? 0)

    // union（add-only，单调不删）：现有 ∪ ECDICT(本词) ∪ Σ词基[ ECDICT(base) ∪ base 现有档 ]
    // → 修派生形 primary 误高（quickly 继承 quick→1）；ECDICT 无 zk/gk 的常见词也不会被改难（保留现有低档）。
    const add = new Set<number>(oldLv)
    const self = ecdictLv.get(word)
    if (self) self.forEach(l => add.add(l))
    let baseHit = false
    for (const b of bases(word)) {
      const be = ecdictLv.get(b); if (be) { be.forEach(l => add.add(l)); baseHit = true }
      const bx = existingByWord.get(b); if (bx && bx.length) { bx.forEach(l => add.add(l)); baseHit = true }
    }
    const via: Row['via'] = self ? 'own' : (baseHit ? 'base' : 'kept')
    if (via === 'own') viaOwn++; else if (via === 'base') viaBase++; else kept++
    const newLv = [...add].sort((a, b) => a - b)
    const newPl = newLv.length ? newLv[0] : oldPl
    const newTags = newLv.map(l => LEVEL_TO_TAG.get(l)).filter((t): t is string => !!t)
    const oldTags = Array.isArray(w.tags) ? (w.tags as string[]) : []
    const changed = !sameArr(oldLv, newLv) || oldPl !== newPl || newTags.slice().sort().join('|') !== oldTags.slice().sort().join('|')
    rows.push({ id: String(w.id), word, oldLv, oldPl, newLv, newPl, newTags, via, changed })
  }

  // 3) 自检：levels 非空、primary∈levels、SAT 保留
  let bad = 0
  for (const r of rows) {
    if (r.newLv.length === 0 && r.oldLv.length > 0) { bad++; if (bad <= 5) console.error('  ✗ 清空了 levels:', r.word) }
    if (r.newLv.length && !r.newLv.includes(r.newPl)) { bad++; if (bad <= 5) console.error('  ✗ primary∉levels:', r.word) }
    if (r.oldLv.includes(7) && !r.newLv.includes(7)) { bad++; if (bad <= 5) console.error('  ✗ 丢了 SAT(7):', r.word) }
  }

  // 4) 分布 + 变更
  const distOf = (sel: (r: Row) => number[]) => { const d: Record<number, number> = {}; for (const r of rows) for (const l of sel(r)) d[l] = (d[l] ?? 0) + 1; return d }
  const primOf = (sel: (r: Row) => number) => { const d: Record<number, number> = {}; for (const r of rows) d[sel(r)] = (d[sel(r)] ?? 0) + 1; return d }
  console.log('primary_level 分布 BEFORE:', JSON.stringify(primOf(r => r.oldPl)))
  console.log('primary_level 分布 AFTER :', JSON.stringify(primOf(r => r.newPl)))
  console.log('levels∋L 分布   BEFORE:', JSON.stringify(distOf(r => r.oldLv)))
  console.log('levels∋L 分布   AFTER :', JSON.stringify(distOf(r => r.newLv)))
  const changes = rows.filter(r => r.changed)
  console.log(`\n变更 ${changes.length} / ${words.length} 词 · ECDICT 直接命中 ${viaOwn} · 词基继承 ${viaBase} · 保留现有(ECDICT 未覆盖) ${kept}`)
  console.log('注：union(add-only)，primary 只会变低或不变（不会把词改难）。')
  console.log(`自检违例 ${bad}（须 0：不清空/ primary∈levels / 不丢 SAT）`)

  // 5) 三张审计表
  const ieltsOnly = rows.filter(r => r.newLv.length === 1 && r.newLv[0] === 8).sort((a, b) => (ecdictFrq.get(a.word) ?? 9e9) - (ecdictFrq.get(b.word) ?? 9e9))
  const ieltsLower = rows.filter(r => r.newLv.includes(8) && r.newLv.some(l => l < 8))
  const plChanges = changes.filter(r => r.oldPl !== r.newPl)
  console.log(`\n── 审计① ielts-only（newLevels=[8]）：${ieltsOnly.length} 词。最高频 20（疑似常见词误标雅思专属）──`)
  console.log('  ' + ieltsOnly.slice(0, 20).map(r => `${r.word}(frq ${ecdictFrq.get(r.word) ?? '-'})`).join(', '))
  console.log(`\n── 审计② ielts + 更低档（合理大纲重叠）：${ieltsLower.length} 词。样本 ──`)
  console.log('  ' + ieltsLower.slice(0, 15).map(r => `${r.word}[${r.newLv}]`).join(', '))
  console.log(`\n── 审计③ primary_level 变化：${plChanges.length} 词。样本（含 quickly 类派生形修复）──`)
  console.log('  ' + plChanges.slice(0, 25).map(r => `${r.word} ${r.oldPl}→${r.newPl}`).join(', '))

  if (bad > 0) { console.error('\n自检未过，拒绝写库。'); process.exit(1) }
  if (!APPLY) { console.log('\n(dry-run：未写库。审完三表 + 确认无误后加 --apply。)'); return }

  console.log('\n── APPLY：写 levels / primary_level / tags（并发批量）──')
  let done = 0, failed = 0
  const CONC = 25
  for (let i = 0; i < changes.length; i += CONC) {
    const chunk = changes.slice(i, i + CONC)
    await Promise.all(chunk.map(r =>
      db.from('dictionary_words').update({ levels: r.newLv, primary_level: r.newPl, tags: r.newTags }).eq('id', r.id)
        .then(({ error }) => { if (error) { failed++; if (failed <= 5) console.error('  ✗', r.word, error.message) } else done++ })))
    if (i % 2000 < CONC) console.log(`  …${done}/${changes.length}`)
  }
  console.log(`✓ 写入 ${done}/${changes.length} 词（失败 ${failed}）`)
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
