/* ============================================================================
   scripts/gen-lexiverse-ielts.ts — 八档统一 P5：新增雅思星系数据（仅增量，不动 7 档）

   从本地 ECDICT(MIT) ecdict.csv 抽 tag 含 'ielts' 的单词，离线确定性生成雅思档
   WU_DATA 单包，同时写两份（宇宙 + 词图，格式一致）：
     · public/lexiverse-reference-v3/data/words-ielts.js      （宇宙等级带）
     · public/lexigraph-reference/data/words-ielts-full.js    （词图等级带）

   WU_DATA 格式（与 words-cet4-full.js 等一致）：
     window.WU_DATA = { list, words, edges, families }
       words   [word, ipa, zh, pos, stars(1-5), phrases[[p,zh]], example[en,zh]|[]]
       edges   [a, b, type]   type 1=近义(syn) 2=形近(conf) —— 局部下标
       families [idx, idx, ...] 词形家族
   注：ECDICT 无短语/例句 → phrases/example 留空（雅思装饰星系，视觉可接受）。

   关系层算法（families/synonyms/confusables）平移自 gen-lexigraph-data.ts，
   星等分桶用同一 STAR_CUMULATIVE，保证与其余等级带星系观感一致。

   用法：
     npx tsx scripts/gen-lexiverse-ielts.ts            # 默认 cap 6000（按真词频取最常用）
     npx tsx scripts/gen-lexiverse-ielts.ts --cap 8000
   ============================================================================ */

import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.join(__dirname, '..')
const ECDICT = path.join(__dirname, '.vocab-cache', 'ecdict.csv')
const OUT_UNIVERSE = path.join(ROOT, 'public', 'lexiverse-reference-v3', 'data', 'words-ielts.js')
const OUT_LEXIGRAPH = path.join(ROOT, 'public', 'lexigraph-reference', 'data', 'words-ielts-full.js')

interface Entry {
  word: string
  ipa: string
  zh: string
  pos: string
  rank: number       // min(bnc, frq) 正值；越小越常用，Infinity = 无数据
  stars: number
}

// ── CSV 流式解析（带引号转义）──────────────────────────────────────────────
function forEachCsvRow(content: string, cb: (row: string[]) => void) {
  let field = '', row: string[] = [], inQ = false
  for (let i = 0; i < content.length; i++) {
    const ch = content[i]
    if (inQ) {
      if (ch === '"') { if (content[i + 1] === '"') { field += '"'; i++ } else inQ = false }
      else field += ch
    } else {
      if (ch === '"') inQ = true
      else if (ch === ',') { row.push(field); field = '' }
      else if (ch === '\n') { row.push(field); cb(row); row = []; field = '' }
      else if (ch === '\r') { /* skip */ }
      else field += ch
    }
  }
  if (field.length || row.length) { row.push(field); cb(row) }
}

// ECDICT translation（多行中文释义）→ 紧凑 zh + 首词性
function parseTranslation(translation: string): { zh: string; pos: string } {
  const lines = translation.split(/\\n|\n/).map(s => s.trim()).filter(Boolean)
  const zh = lines.slice(0, 4).join('；')
  const m = lines[0]?.match(/^([a-z]+)\.\s*/i)
  return { zh, pos: m ? m[1].toLowerCase() : '' }
}

function loadIeltsEntries(): Entry[] {
  if (!fs.existsSync(ECDICT)) throw new Error(`缺少 ${path.relative(ROOT, ECDICT)} —— 先运行 lexiverse-level-coverage.ts 下载 ECDICT`)
  const content = fs.readFileSync(ECDICT, 'utf-8')
  const out: Entry[] = []
  const seen = new Set<string>()
  let header: string[] | null = null
  const idx: Record<string, number> = {}
  forEachCsvRow(content, (row) => {
    if (!header) { header = row; header.forEach((h, k) => { idx[h.trim()] = k }); return }
    const tag = (row[idx.tag] ?? '')
    if (!/\bielts\b/.test(tag)) return
    const word = (row[idx.word] ?? '').trim().toLowerCase()
    // 词图/宇宙只放单词节点：去含空格/标点的短语，长度 2..41
    if (!/^[a-z][a-z'-]{1,40}$/.test(word) || seen.has(word)) return
    const { zh, pos } = parseTranslation(row[idx.translation] ?? '')
    if (!zh) return
    const bnc = parseInt(row[idx.bnc] ?? '0', 10) || 0
    const frq = parseInt(row[idx.frq] ?? '0', 10) || 0
    const ranks = [bnc, frq].filter(n => n > 0)
    seen.add(word)
    out.push({ word, ipa: (row[idx.phonetic] ?? '').trim(), zh, pos, rank: ranks.length ? Math.min(...ranks) : Infinity, stars: 0 })
  })
  return out
}

// ── 星等：档内按真词频百分位分桶（与 gen-lexigraph-data 一致）─────────────────
const STAR_CUMULATIVE: [number, number][] = [[0.49, 5], [0.82, 4], [0.94, 3], [0.98, 2], [1.01, 1]]
function assignStars(entries: Entry[]): void {
  const order = [...entries].sort((a, b) => a.rank - b.rank)
  const n = order.length
  order.forEach((e, i) => {
    const pct = (i + 0.5) / n
    e.stars = STAR_CUMULATIVE.find(([t]) => pct <= t)?.[1] ?? 3
  })
}

// ── 关系层（平移自 gen-lexigraph-data.ts）────────────────────────────────────
const SUFFIXES = [
  'ization', 'isation', 'ability', 'ibility', 'fulness', 'lessness',
  'ation', 'ition', 'ment', 'ness', 'tion', 'sion', 'ance', 'ence', 'ship',
  'able', 'ible', 'ical', 'ious', 'eous', 'less', 'ling',
  'ity', 'ize', 'ise', 'ful', 'ous', 'ive', 'ant', 'ent', 'ism', 'ist', 'ary', 'ory',
  'al', 'er', 'or', 'ly', 'ed', 'es', 'ing', 's', 'y',
].sort((a, b) => b.length - a.length)

function stemOf(word: string): string {
  for (const suf of SUFFIXES) {
    if (word.length - suf.length >= 4 && word.endsWith(suf)) {
      let stem = word.slice(0, -suf.length)
      if (stem.length > 4 && stem[stem.length - 1] === stem[stem.length - 2]) stem = stem.slice(0, -1)
      return stem
    }
  }
  return word
}

function buildFamilies(entries: Entry[]): number[][] {
  const byStem = new Map<string, number[]>()
  entries.forEach((e, i) => {
    if (!/^[a-z]+$/.test(e.word)) return
    const stem = stemOf(e.word)
    if (stem.length < 4) return
    byStem.get(stem)?.push(i) ?? byStem.set(stem, [i])
  })
  const out: number[][] = []
  for (const fam of byStem.values()) {
    if (fam.length < 2) continue
    fam.sort((a, b) => entries[a].word.length - entries[b].word.length)
    out.push(fam)
  }
  return out
}

function editDistanceLe2(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 2) return false
  const m = a.length, n = b.length
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const cur = [i, ...Array(n).fill(99)]
    for (let j = Math.max(1, i - 2); j <= Math.min(n, i + 2); j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = cur
    if (Math.min(...prev) > 2) return false
  }
  return prev[n] <= 2
}

function buildConfusables(entries: Entry[]): [number, number, number][] {
  const buckets = new Map<string, number[]>()
  const eligible: number[] = []
  entries.forEach((e, i) => { if (/^[a-z]{4,}$/.test(e.word)) { eligible.push(i); const k = `${e.word[0]}:${e.word.length}`; buckets.get(k)?.push(i) ?? buckets.set(k, [i]) } })
  const counts = new Map<number, number>()
  const seen = new Set<string>()
  const out: [number, number, number][] = []
  for (const i of eligible) {
    if ((counts.get(i) ?? 0) >= 3) continue
    const ew = entries[i].word
    for (let len = ew.length - 2; len <= ew.length + 2; len++) {
      for (const j of buckets.get(`${ew[0]}:${len}`) ?? []) {
        if (j <= i) continue
        if ((counts.get(i) ?? 0) >= 3 || (counts.get(j) ?? 0) >= 3) continue
        const key = `${i}|${j}`
        if (seen.has(key)) continue
        if (stemOf(ew) === stemOf(entries[j].word)) continue
        if (editDistanceLe2(ew, entries[j].word)) {
          seen.add(key)
          out.push([i, j, 2])
          counts.set(i, (counts.get(i) ?? 0) + 1)
          counts.set(j, (counts.get(j) ?? 0) + 1)
        }
      }
    }
  }
  return out
}

function normalizeZh(t: string): string {
  return t.replace(/[（(].*?[)）]/g, '').split(/[;；,，]/)[0].trim()
}

function buildSynonyms(entries: Entry[]): [number, number, number][] {
  const byDef = new Map<string, number[]>()
  entries.forEach((e, i) => {
    const firstZh = e.zh.split('；')[0] ?? ''
    const m = firstZh.match(/^([a-z]+)\.\s*(.+)$/i)
    const type = m ? m[1] : e.pos
    const def = normalizeZh(m ? m[2] : firstZh)
    const key = `${type}:${def}`
    if (key.length < 4 || !def) return
    byDef.get(key)?.push(i) ?? byDef.set(key, [i])
  })
  const out: [number, number, number][] = []
  for (const group of byDef.values()) {
    if (group.length < 2 || group.length > 6) continue
    for (let a = 0; a < group.length; a++)
      for (let b = a + 1; b < group.length; b++)
        out.push([group[a], group[b], 1])
  }
  return out
}

// ── 主流程 ──────────────────────────────────────────────────────────────────
function main() {
  const argv = process.argv
  const cap = Number(argv[argv.indexOf('--cap') + 1]) || 6000

  console.log('═══ 雅思星系数据生成（ECDICT ielts tag，仅增量）═══')
  let entries = loadIeltsEntries()
  console.log(`ECDICT ielts tag 单词：${entries.length}`)
  entries.sort((a, b) => a.rank - b.rank)         // 常用在前
  if (entries.length > cap) { entries = entries.slice(0, cap); console.log(`按真词频裁剪至 cap ${cap}`) }
  assignStars(entries)

  const families = buildFamilies(entries)
  const edges = [...buildSynonyms(entries), ...buildConfusables(entries)]
  const words = entries.map(e => [e.word, e.ipa, e.zh, e.pos, e.stars, [], []])
  const data = { list: '雅思', words, edges, families }
  const payload = `window.WU_DATA = ${JSON.stringify(data)};`

  for (const out of [OUT_UNIVERSE, OUT_LEXIGRAPH]) {
    fs.mkdirSync(path.dirname(out), { recursive: true })
    fs.writeFileSync(out, payload)
    const kb = (fs.statSync(out).size / 1024) | 0
    console.log(`✓ ${path.relative(ROOT, out)}  词${words.length}  边${edges.length}  族${families.length}  ${kb}KB`)
  }
  console.log(`\n═══ 完成 ═══  catalog.js 的 ielts.wordCount 填：${words.length}`)
}

main()
