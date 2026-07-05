/* ============================================================================
   scripts/gen-lexigraph-data.ts — LexiGraph 全量词表/星系数据（P4，仍按单包）

   为「等级带七星系」生成 LexiGraph 原型的 WU_DATA 单包数据文件，格式与
   public/lexigraph-reference/data/words-cet4-full.js 完全一致：

     window.WU_DATA = { list, words, edges, families }
       words   [word, ipa, zh, pos, stars(1-5), phrases[[p,zh]], example[en,zh]]
       edges   [a, b, type]   type 0=派生(der) 1=近义(syn) 2=形近(conf) —— 局部下标
       families [idx, idx, ...] 词形家族（graph.js 内按 type 0 连接）

   数据来源（全本地，确定性，无需 Supabase）：
     · scripts/.vocab-cache/*.json  KyleBing 词表（us/uk 音标 + 释义 + 短语 + 例句）
     · scripts/.vocab-cache/ecdict.csv  ECDICT(MIT) 真词频 bnc/frq → 星级
   关系规则层复用 generate-relations.ts 的 stem 归并 / 编辑距离 / 同义首释义算法。

   CET-4 沿用既有人工策展版（4544 词），不在此生成 —— 仅产其余六档。

   用法：
     npx tsx scripts/gen-lexigraph-data.ts            # 生成六档（默认 cap 5000）
     npx tsx scripts/gen-lexigraph-data.ts --cap 6000 # 自定义每档上限
     npx tsx scripts/gen-lexigraph-data.ts --belt sat # 只生成某一档
   ============================================================================ */

import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'

const CACHE_DIR = path.join(__dirname, '.vocab-cache')
const ECDICT = path.join(CACHE_DIR, 'ecdict.csv')
const OUT_DIR = path.join(__dirname, '..', 'public', 'lexigraph-reference', 'data')

// ── 档配置（与 generate-relations 的 SOURCES 一致；CET-4 用策展版，此处跳过）──
interface Belt { slug: string; list: string; files: string[] }
const BELTS: Belt[] = [
  { slug: 'chuzhong', list: '初中', files: ['ChuZhong_2.json', 'ChuZhong_3.json'] },
  { slug: 'gaozhong', list: '高中', files: ['GaoZhong_2.json', 'GaoZhong_3.json'] },
  { slug: 'cet6', list: 'CET-6', files: ['CET6_1.json', 'CET6_2.json', 'CET6_3.json'] },
  { slug: 'kaoyan', list: '考研', files: ['KaoYan_1.json', 'KaoYan_2.json', 'KaoYan_3.json'] },
  { slug: 'toefl', list: 'TOEFL', files: ['TOEFL_2.json', 'TOEFL_3.json'] },
  { slug: 'sat', list: 'SAT', files: ['SAT_2.json', 'SAT_3.json'] },
]

// ── KyleBing 原始词条 ────────────────────────────────────────────────────────
interface RawWord {
  word: string
  us?: string
  uk?: string
  translations?: { translation: string; type?: string }[]
  phrases?: { phrase: string; translation: string }[]
  sentences?: { sentence: string; translation: string }[]
}

interface Entry {
  word: string                       // 小写显示词
  ipa: string
  zh: string
  pos: string
  phrases: [string, string][]
  example: [string, string] | []
  rank: number                       // 真词频排名（越小越常用，Infinity=无数据）
  stars: number                      // 后填
  primaryLevel: number               // 同档恒定（占位，满足规则函数签名）
}

// ── ECDICT 真词频：word → min(bnc, frq) 正值 ─────────────────────────────────
function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = '', q = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (q) {
      if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++ } else q = false }
      else cur += c
    } else {
      if (c === '"') q = true
      else if (c === ',') { out.push(cur); cur = '' }
      else cur += c
    }
  }
  out.push(cur)
  return out
}

async function loadFrequency(): Promise<Map<string, number>> {
  const freq = new Map<string, number>()
  if (!fs.existsSync(ECDICT)) {
    console.warn('⚠ 缺少 ecdict.csv —— 星级将退化为词长启发式')
    return freq
  }
  const rl = readline.createInterface({ input: fs.createReadStream(ECDICT), crlfDelay: Infinity })
  let header: string[] | null = null
  let bncIdx = 8, frqIdx = 9
  for await (const line of rl) {
    if (!header) {
      header = parseCsvLine(line)
      bncIdx = header.indexOf('bnc'); frqIdx = header.indexOf('frq')
      continue
    }
    const f = parseCsvLine(line)
    const w = f[0]?.toLowerCase()
    if (!w) continue
    const bnc = Number(f[bncIdx]); const frq = Number(f[frqIdx])
    const ranks = [bnc, frq].filter(n => Number.isFinite(n) && n > 0)
    if (ranks.length) freq.set(w, Math.min(...ranks))
  }
  return freq
}

// ── 合并某档词条（去重 + 富化）─────────────────────────────────────────────
function buildBeltEntries(belt: Belt, freq: Map<string, number>): Entry[] {
  const map = new Map<string, Entry>()
  for (const file of belt.files) {
    const p = path.join(CACHE_DIR, file)
    if (!fs.existsSync(p)) throw new Error(`缺少缓存 ${file} —— 先运行 import-vocabulary.ts`)
    const raw: RawWord[] = JSON.parse(fs.readFileSync(p, 'utf-8'))
    for (const e of raw) {
      if (!e.word) continue
      const word = e.word.trim().toLowerCase()
      // 词图只放单词节点：去掉含空格/标点的短语条目
      if (!/^[a-z][a-z'-]{0,40}$/.test(word) || word.length < 2) continue
      if (map.has(word)) continue
      const tr = (e.translations ?? []).filter(t => t.translation)
      const zh = tr.slice(0, 4).map(t => `${t.type ? t.type + '. ' : ''}${t.translation}`).join('；')
      const pos = tr[0]?.type?.split(/[\s.,]/)[0] ?? ''
      const phrases: [string, string][] = (e.phrases ?? [])
        .filter(p2 => p2.phrase && p2.translation)
        .slice(0, 6)
        .map(p2 => [p2.phrase, p2.translation])
      const s0 = (e.sentences ?? []).find(s => s.sentence)
      const example: [string, string] | [] = s0 ? [s0.sentence, s0.translation ?? ''] : []
      map.set(word, {
        word, ipa: (e.us || e.uk || '').trim(), zh, pos,
        phrases, example,
        rank: freq.get(word) ?? Infinity,
        stars: 0, primaryLevel: 1,
      })
    }
  }
  return [...map.values()]
}

// ── 星级：档内按真词频百分位分桶（贴合策展版 CET-4 的 1↑5 形态）──────────────
// 累计：5≈49% 4≈33% 3≈12% 2≈4% 1≈2%（最常用→5 星）
const STAR_CUMULATIVE: [number, number][] = [[0.49, 5], [0.82, 4], [0.94, 3], [0.98, 2], [1.01, 1]]
function assignStars(entries: Entry[]): void {
  const order = [...entries].sort((a, b) => a.rank - b.rank) // 常用在前
  const n = order.length
  order.forEach((e, i) => {
    const pct = (i + 0.5) / n
    e.stars = STAR_CUMULATIVE.find(([t]) => pct <= t)?.[1] ?? 3
  })
}

// ── 关系规则层（复用 generate-relations 算法；产档内局部下标）────────────────
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

/** 词形家族 → families（局部下标数组，size≥2，根=最短词排首）*/
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
    fam.sort((a, b) => entries[a].word.length - entries[b].word.length) // 根在前
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

/** 形近易混 → edges type 2（每词 ≤3）*/
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

/** 同义候选（同义首释义 + 同词性）→ edges type 1 */
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
async function main() {
  const argv = process.argv
  const cap = Number(argv[argv.indexOf('--cap') + 1]) || 5000
  const onlyBelt = argv.includes('--belt') ? argv[argv.indexOf('--belt') + 1] : null

  console.log('═══ LexiGraph 全量词表生成 ═══')
  console.log(`真词频源：${fs.existsSync(ECDICT) ? 'ecdict.csv' : '（缺失，退化）'}  ·  每档上限 ${cap}`)
  const freq = await loadFrequency()
  console.log(`ECDICT 词频：${freq.size} 词`)
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

  const summary: Record<string, unknown>[] = []
  for (const belt of BELTS) {
    if (onlyBelt && belt.slug !== onlyBelt) continue
    let entries = buildBeltEntries(belt, freq)
    // 词频在前裁剪到 cap（保留最常用），保持图性能与 CET-4 同量级
    entries.sort((a, b) => a.rank - b.rank)
    if (entries.length > cap) entries = entries.slice(0, cap)
    assignStars(entries)

    const families = buildFamilies(entries)
    const edges = [...buildSynonyms(entries), ...buildConfusables(entries)]

    const words = entries.map(e => [e.word, e.ipa, e.zh, e.pos, e.stars, e.phrases, e.example])
    const data = { list: belt.list, words, edges, families }
    const outFile = path.join(OUT_DIR, `words-${belt.slug}-full.js`)
    fs.writeFileSync(outFile, `window.WU_DATA = ${JSON.stringify(data)};`)
    const sizeKB = (fs.statSync(outFile).size / 1024) | 0
    const row = { belt: belt.list, slug: belt.slug, words: words.length, edges: edges.length, families: families.length, sizeKB }
    summary.push(row)
    console.log(`✓ ${belt.list.padEnd(6)} → words-${belt.slug}-full.js  词${words.length}  边${edges.length}  族${families.length}  ${sizeKB}KB`)
  }
  console.log('\n═══ 完成 ═══')
  console.table(summary)
}

main().catch(e => { console.error('✗', e?.message ?? e); process.exit(1) })
