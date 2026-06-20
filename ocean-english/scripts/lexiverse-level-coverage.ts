/* ============================================================================
   scripts/lexiverse-level-coverage.ts — 等级带七星系「词库体检」(只读 / P0)

   做什么：读现有七星系的静态词表 (public/lexiverse-reference-v3/data/words-*.js)，
   统计每词的字段缺失率 / 孤词 / 星等分布 / 连线，再下载 ECDICT(MIT) 交叉核对
   「缺多少、能补多少」——真实词频、词形变化、音标、中文是否可补，假星等错配率。

   只读：不写 Supabase、不改任何项目数据。只产出 reports/lexiverse-coverage.{md,json}
   并把 ECDICT 缓存到 scripts/.vocab-cache/ecdict.csv（复用，避免重复下载）。

   用法：
     npx tsx scripts/lexiverse-level-coverage.ts            # 含 ECDICT 交叉核对
     npx tsx scripts/lexiverse-level-coverage.ts --no-ecdict # 只跑本地统计
   ============================================================================ */

import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.join(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'public', 'lexiverse-reference-v3', 'data')
const CACHE_DIR = path.join(__dirname, '.vocab-cache')
const ECDICT_CACHE = path.join(CACHE_DIR, 'ecdict.csv')
const ECDICT_URL = 'https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv'
const REPORT_DIR = path.join(ROOT, 'reports')

const NO_ECDICT = process.argv.includes('--no-ecdict')

// 七星系 → 数据文件 + ECDICT 等级 tag（sat 在 ECDICT 中无 tag）
const GALAXIES: { id: string; zh: string; file: string; tag: string | null }[] = [
  { id: 'junior', zh: '初中', file: 'words-junior.js',    tag: 'zk' },
  { id: 'senior', zh: '高中', file: 'words-senior.js',    tag: 'gk' },
  { id: 'cet4',   zh: '四级', file: 'words-cet4-full.js', tag: 'cet4' },
  { id: 'cet6',   zh: '六级', file: 'words-cet6.js',      tag: 'cet6' },
  { id: 'kaoyan', zh: '考研', file: 'words-kaoyan.js',    tag: 'ky' },
  { id: 'toefl',  zh: '托福', file: 'words-toefl.js',     tag: 'toefl' },
  { id: 'sat',    zh: 'SAT',  file: 'words-sat.js',       tag: null },
]

// ── WU_DATA 类型（紧凑数组）────────────────────────────────────────────────
type WuWord = [string, string, string, string, number, [string, string][], [string, string] | null]
interface WuData { list: string; words: WuWord[]; edges: [number, number, number][]; families: number[][] }

function loadWuData(file: string): WuData | null {
  const p = path.join(DATA_DIR, file)
  if (!fs.existsSync(p)) return null
  const raw = fs.readFileSync(p, 'utf-8')
  const i = raw.indexOf('{')
  const j = raw.lastIndexOf('}')
  if (i < 0 || j < 0) return null
  return JSON.parse(raw.slice(i, j + 1)) as WuData
}

const norm = (w: string) => w.toLowerCase().trim()

// ── ECDICT：流式 CSV 解析，只保留出现在七星系里的词 ─────────────────────────
interface EcEntry { phonetic: string; translation: string; pos: string; collins: string; tag: string; bnc: number; frq: number; exchange: string }

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

async function ensureEcdict(): Promise<void> {
  if (fs.existsSync(ECDICT_CACHE)) return
  fs.mkdirSync(CACHE_DIR, { recursive: true })
  process.stdout.write(`下载 ECDICT (~66MB) → ${path.relative(ROOT, ECDICT_CACHE)} … `)
  const res = await fetch(ECDICT_URL)
  if (!res.ok) throw new Error(`ECDICT 下载失败 HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(ECDICT_CACHE, buf)
  console.log(`完成 (${(buf.length / 1e6).toFixed(1)}MB)`)
}

function loadEcdict(keep: Set<string>): Map<string, EcEntry> {
  const content = fs.readFileSync(ECDICT_CACHE, 'utf-8')
  const map = new Map<string, EcEntry>()
  let header: string[] | null = null
  const idx: Record<string, number> = {}
  forEachCsvRow(content, (row) => {
    if (!header) {
      header = row
      header.forEach((h, k) => { idx[h.trim()] = k })
      return
    }
    const w = norm(row[idx.word] ?? '')
    if (!w || !keep.has(w) || map.has(w)) return
    map.set(w, {
      phonetic: row[idx.phonetic] ?? '',
      translation: row[idx.translation] ?? '',
      pos: row[idx.pos] ?? '',
      collins: row[idx.collins] ?? '',
      tag: row[idx.tag] ?? '',
      bnc: parseInt(row[idx.bnc] ?? '0', 10) || 0,
      frq: parseInt(row[idx.frq] ?? '0', 10) || 0,
      exchange: row[idx.exchange] ?? '',
    })
  })
  return map
}

// ── 指标 ────────────────────────────────────────────────────────────────────
const pct = (n: number, d: number) => (d ? (n / d * 100) : 0)
const fp = (n: number, d: number) => `${pct(n, d).toFixed(1)}%`

interface LocalStat {
  total: number
  noIpa: number; noZh: number; noPos: number; noExample: number; noPhrases: number
  orphan: number          // 不属于任何词族
  edges0: number; edges1: number; edges2: number  // 派生/同义/易混
  families: number; famAvg: number
  starDist: number[]      // index 1..5
}

function localStats(d: WuData): LocalStat {
  const inFamily = new Set<number>()
  for (const f of d.families) for (const wi of f) inFamily.add(wi)
  const starDist = [0, 0, 0, 0, 0, 0]
  let noIpa = 0, noZh = 0, noPos = 0, noExample = 0, noPhrases = 0, orphan = 0
  d.words.forEach((w, i) => {
    const [, ipa, zh, pos, stars, phrases, sent] = w
    if (!ipa || !String(ipa).trim()) noIpa++
    if (!zh || !String(zh).trim()) noZh++
    if (!pos || !String(pos).trim()) noPos++
    if (!sent || !sent[0] || !String(sent[0]).trim()) noExample++
    if (!phrases || phrases.length === 0) noPhrases++
    if (!inFamily.has(i)) orphan++
    const s = Math.max(0, Math.min(5, Math.round(stars || 0)))
    starDist[s]++
  })
  let e0 = 0, e1 = 0, e2 = 0
  for (const e of d.edges) { if (e[2] === 0) e0++; else if (e[2] === 1) e1++; else e2++ }
  const famSizes = d.families.map(f => f.length)
  return {
    total: d.words.length, noIpa, noZh, noPos, noExample, noPhrases, orphan,
    edges0: e0, edges1: e1, edges2: e2,
    families: d.families.length,
    famAvg: famSizes.length ? famSizes.reduce((a, b) => a + b, 0) / famSizes.length : 0,
    starDist,
  }
}

interface EcStat {
  matched: number
  realFreq: number          // ECDICT frq>0 → 可换真实词频
  hasExchange: number       // 有词形变化
  ipaFillable: number       // 我们缺音标 & ECDICT 有
  zhFillable: number        // 我们缺中文 & ECDICT 有
  tagHit: number            // ECDICT 该等级 tag 命中（sat 恒 0）
  starMismatch: number      // 现星等 vs 真实词频星等 差 ≥2（在有真频的词中）
  starCompared: number
}

function freqToStar(frq: number, maxFrq: number): number {
  // frq 越小越高频 → 星等越高(5)。按对数分位粗分 5 档
  if (!frq) return 0
  const r = Math.log(frq + 1) / Math.log(maxFrq + 1) // 0..1，越大越低频
  return Math.max(1, Math.min(5, 5 - Math.floor(r * 5)))
}

function ecdictStats(d: WuData, ec: Map<string, EcEntry>, tag: string | null): EcStat {
  let matched = 0, realFreq = 0, hasExchange = 0, ipaFillable = 0, zhFillable = 0, tagHit = 0
  let starMismatch = 0, starCompared = 0
  // maxFrq 用于分位
  let maxFrq = 1
  for (const w of d.words) { const e = ec.get(norm(w[0])); if (e && e.frq > maxFrq) maxFrq = e.frq }
  for (const w of d.words) {
    const e = ec.get(norm(w[0]))
    if (!e) continue
    matched++
    if (e.frq > 0) realFreq++
    if (e.exchange && e.exchange.trim()) hasExchange++
    if ((!w[1] || !String(w[1]).trim()) && e.phonetic.trim()) ipaFillable++
    if ((!w[2] || !String(w[2]).trim()) && e.translation.trim()) zhFillable++
    if (tag && e.tag.split(/\s+/).includes(tag)) tagHit++
    if (e.frq > 0) {
      starCompared++
      const fs = freqToStar(e.frq, maxFrq)
      if (Math.abs((w[4] || 0) - fs) >= 2) starMismatch++
    }
  }
  return { matched, realFreq, hasExchange, ipaFillable, zhFillable, tagHit, starMismatch, starCompared }
}

// ── 主流程 ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n=== Lexiverse 等级带 · 词库体检 (只读) ===\n')

  const loaded = GALAXIES.map(g => ({ g, data: loadWuData(g.file) }))
  for (const { g, data } of loaded) {
    if (!data) console.warn(`⚠️  缺数据文件：${g.file}（${g.zh}）`)
  }
  const present = loaded.filter(x => x.data) as { g: typeof GALAXIES[0]; data: WuData }[]

  // 本地统计
  const local = present.map(({ g, data }) => ({ g, data, s: localStats(data) }))

  // ECDICT 交叉核对
  let ecMap: Map<string, EcEntry> | null = null
  if (!NO_ECDICT) {
    try {
      await ensureEcdict()
      const keep = new Set<string>()
      for (const { data } of present) for (const w of data.words) keep.add(norm(w[0]))
      process.stdout.write(`解析 ECDICT（保留七星系 ${keep.size} 个词头）… `)
      ecMap = loadEcdict(keep)
      console.log(`匹配到 ${ecMap.size} 词\n`)
    } catch (e) {
      console.warn(`ECDICT 跳过：${(e as Error).message}\n`)
    }
  }

  const rows = local.map(({ g, data, s }) => {
    const ec = ecMap ? ecdictStats(data, ecMap, g.tag) : null
    return { g, s, ec }
  })

  // ── 控制台表格 1：本地字段缺失 ──
  console.log('【本地字段缺失率】')
  console.log('星系     词数   缺音标  缺中文  缺词性  缺例句  缺短语  孤词    词族   派生/同义/易混')
  for (const { g, s } of rows) {
    console.log(
      `${g.zh.padEnd(4)} ${String(s.total).padStart(6)}  ${fp(s.noIpa, s.total).padStart(6)} ${fp(s.noZh, s.total).padStart(6)} ` +
      `${fp(s.noPos, s.total).padStart(6)} ${fp(s.noExample, s.total).padStart(6)} ${fp(s.noPhrases, s.total).padStart(6)} ` +
      `${fp(s.orphan, s.total).padStart(6)} ${String(s.families).padStart(5)}  ${s.edges0}/${s.edges1}/${s.edges2}`,
    )
  }

  // ── 控制台表格 2：星等分布 ──
  console.log('\n【星等分布 (★1..★5)】')
  for (const { g, s } of rows) {
    console.log(`${g.zh.padEnd(4)} ` + [1, 2, 3, 4, 5].map(k => `★${k}:${fp(s.starDist[k], s.total)}`).join('  '))
  }

  // ── 控制台表格 3：ECDICT 可补潜力 ──
  if (ecMap) {
    console.log('\n【ECDICT 交叉核对 · 可补潜力】')
    console.log('星系     匹配率   可补真频  有词形   音标可补  中文可补  tag命中  假星等错配率')
    for (const { g, s, ec } of rows) {
      if (!ec) continue
      console.log(
        `${g.zh.padEnd(4)} ${fp(ec.matched, s.total).padStart(7)} ${fp(ec.realFreq, s.total).padStart(8)} ` +
        `${fp(ec.hasExchange, s.total).padStart(7)} ${String(ec.ipaFillable).padStart(8)} ${String(ec.zhFillable).padStart(8)} ` +
        `${(g.tag ? fp(ec.tagHit, s.total) : '—(无tag)').padStart(8)} ${fp(ec.starMismatch, ec.starCompared).padStart(8)} (n=${ec.starCompared})`,
      )
    }
  }

  // ── 写报告文件 ──
  fs.mkdirSync(REPORT_DIR, { recursive: true })
  const json = {
    generatedAt: new Date().toISOString(),
    ecdict: !!ecMap,
    galaxies: rows.map(({ g, s, ec }) => ({ id: g.id, zh: g.zh, tag: g.tag, local: s, ecdict: ec })),
  }
  fs.writeFileSync(path.join(REPORT_DIR, 'lexiverse-coverage.json'), JSON.stringify(json, null, 2))

  const md: string[] = []
  md.push('# Lexiverse 等级带 · 词库体检报告（只读）', '')
  md.push(`生成时间：${json.generatedAt}　ECDICT 交叉核对：${ecMap ? '是' : '否'}`, '')
  md.push('## 本地字段缺失率', '')
  md.push('| 星系 | 词数 | 缺音标 | 缺中文 | 缺词性 | 缺例句 | 缺短语 | 孤词 | 词族 | 派生/同义/易混 |')
  md.push('|---|--:|--:|--:|--:|--:|--:|--:|--:|--|')
  for (const { g, s } of rows) {
    md.push(`| ${g.zh} | ${s.total} | ${fp(s.noIpa, s.total)} | ${fp(s.noZh, s.total)} | ${fp(s.noPos, s.total)} | ${fp(s.noExample, s.total)} | ${fp(s.noPhrases, s.total)} | ${fp(s.orphan, s.total)} | ${s.families} | ${s.edges0}/${s.edges1}/${s.edges2} |`)
  }
  if (ecMap) {
    md.push('', '## ECDICT 交叉核对 · 可补潜力', '')
    md.push('| 星系 | 匹配率 | 可补真频 | 有词形变化 | 音标可补(词数) | 中文可补(词数) | tag命中 | 假星等错配率 |')
    md.push('|---|--:|--:|--:|--:|--:|--:|--:|')
    for (const { g, s, ec } of rows) {
      if (!ec) continue
      md.push(`| ${g.zh} | ${fp(ec.matched, s.total)} | ${fp(ec.realFreq, s.total)} | ${fp(ec.hasExchange, s.total)} | ${ec.ipaFillable} | ${ec.zhFillable} | ${g.tag ? fp(ec.tagHit, s.total) : '—(无tag)'} | ${fp(ec.starMismatch, ec.starCompared)} |`)
    }
  }
  md.push('', '> 只读体检：未写库、未改项目数据。')
  fs.writeFileSync(path.join(REPORT_DIR, 'lexiverse-coverage.md'), md.join('\n'))

  console.log(`\n报告已写入：${path.relative(ROOT, path.join(REPORT_DIR, 'lexiverse-coverage.md'))} / .json`)
}

main().catch(e => { console.error(e); process.exit(1) })
