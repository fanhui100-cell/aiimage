/* ============================================================================
   scripts/enrich-vocab.ts — 七等级词库富化 · Pass 1 (ECDICT, dry-run)

   只读富化预览：读现有七星系静态词表，用 ECDICT(MIT) 补：
     ① 真实词频 → stars 五档（修正"假星等"）
     ② 词形变化 inflections（过去式/分词/三单/复数/比较级…）
     ③ 词族重建 families v2（现有 ∪ 同 lemma ∪ 同 stem）→ 砍孤词率
     ④ 补缺失的音标/词性
   产物写 scripts/.vocab-cache/enriched/words-<id>.json + reports/enrich-pass1.md
   **dry-run：不覆盖线上 public 数据、不写 Supabase。** 看报告后再决定落地。

   用法： npx tsx scripts/enrich-vocab.ts
   ============================================================================ */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.join(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'public', 'lexiverse-reference-v3', 'data')
const CACHE_DIR = path.join(__dirname, '.vocab-cache')
const ECDICT_CACHE = path.join(CACHE_DIR, 'ecdict.csv')
const ECDICT_URL = 'https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv'
const OUT_DIR = path.join(CACHE_DIR, 'enriched')
const REPORT = path.join(ROOT, 'reports', 'enrich-pass1.md')

const GALAXIES = [
  { id: 'junior', zh: '初中', file: 'words-junior.js' },
  { id: 'senior', zh: '高中', file: 'words-senior.js' },
  { id: 'cet4', zh: '四级', file: 'words-cet4-full.js' },
  { id: 'cet6', zh: '六级', file: 'words-cet6.js' },
  { id: 'kaoyan', zh: '考研', file: 'words-kaoyan.js' },
  { id: 'toefl', zh: '托福', file: 'words-toefl.js' },
  { id: 'sat', zh: 'SAT', file: 'words-sat.js' },
]

type WuWord = [string, string, string, string, number, [string, string][], [string, string] | null]
interface WuData { list: string; words: WuWord[]; edges: [number, number, number][]; families: number[][] }

const norm = (w: string) => String(w || '').toLowerCase().trim()

function loadWu(file: string): WuData | null {
  const p = path.join(DATA_DIR, file)
  if (!fs.existsSync(p)) return null
  const raw = fs.readFileSync(p, 'utf-8')
  const i = raw.indexOf('{'), j = raw.lastIndexOf('}')
  return i < 0 ? null : (JSON.parse(raw.slice(i, j + 1)) as WuData)
}

// ── ECDICT ──────────────────────────────────────────────────────────────────
interface Ec { phonetic: string; pos: string; frq: number; bnc: number; exchange: string }
function forEachCsvRow(content: string, cb: (row: string[]) => void) {
  let field = '', row: string[] = [], inQ = false
  for (let i = 0; i < content.length; i++) {
    const ch = content[i]
    if (inQ) { if (ch === '"') { if (content[i + 1] === '"') { field += '"'; i++ } else inQ = false } else field += ch }
    else if (ch === '"') inQ = true
    else if (ch === ',') { row.push(field); field = '' }
    else if (ch === '\n') { row.push(field); cb(row); row = []; field = '' }
    else if (ch !== '\r') field += ch
  }
  if (field.length || row.length) { row.push(field); cb(row) }
}
async function ensureEcdict() {
  if (fs.existsSync(ECDICT_CACHE)) return
  fs.mkdirSync(CACHE_DIR, { recursive: true })
  process.stdout.write('下载 ECDICT (~66MB)… ')
  const res = await fetch(ECDICT_URL); if (!res.ok) throw new Error('ECDICT ' + res.status)
  fs.writeFileSync(ECDICT_CACHE, Buffer.from(await res.arrayBuffer())); console.log('完成')
}
function loadEcdict(keep: Set<string>): Map<string, Ec> {
  const content = fs.readFileSync(ECDICT_CACHE, 'utf-8')
  const m = new Map<string, Ec>(); let idx: Record<string, number> | null = null
  forEachCsvRow(content, (row) => {
    if (!idx) { idx = {}; row.forEach((h, k) => (idx![h.trim()] = k)); return }
    const w = norm(row[idx.word]); if (!w || !keep.has(w) || m.has(w)) return
    m.set(w, { phonetic: row[idx.phonetic] || '', pos: row[idx.pos] || '', frq: parseInt(row[idx.frq] || '0', 10) || 0, bnc: parseInt(row[idx.bnc] || '0', 10) || 0, exchange: row[idx.exchange] || '' })
  })
  return m
}

// 解析 exchange → 词形变化
const EX_LABEL: Record<string, string> = { p: '过去式', d: '过去分词', i: '现在分词', '3': '三单', r: '比较级', t: '最高级', s: '复数', '0': '原形' }
function parseExchange(ex: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const part of (ex || '').split('/')) {
    const m = part.match(/^([a-z0-9]):(.+)$/i)
    if (m && EX_LABEL[m[1]] && m[1] !== '0' && m[1] !== '1') out[EX_LABEL[m[1]]] = m[2]
  }
  return out
}
function lemmaOf(ex: string, word: string): string {
  const m = (ex || '').match(/(?:^|\/)0:([^/]+)/)
  return m ? norm(m[1]) : norm(word)
}

// stem 聚类（剥常见后缀，stem≥4）
const SUFFIXES = ['ization', 'isation', 'ational', 'fulness', 'ousness', 'iveness', 'ability', 'ibility', 'ation', 'ition', 'ators', 'ators', ' message', 'ments', 'ingly', 'ation', 'ance', 'ence', 'ment', 'ness', 'tion', 'sion', 'able', 'ible', 'ically', 'ical', 'ist', 'ism', 'ity', 'ous', 'ful', 'less', 'ive', 'ize', 'ise', 'ify', 'ate', 'ing', 'ed', 'er', 'est', 'ly', 'al', 'ic', 'es', 's']
function stemOf(word: string): string | null {
  const w = norm(word)
  for (const s of SUFFIXES) { if (w.length > s.length + 3 && w.endsWith(s)) return w.slice(0, w.length - s.length) }
  return null
}

// DSU
class DSU { p: number[]; constructor(n: number) { this.p = Array.from({ length: n }, (_, i) => i) } find(x: number): number { while (this.p[x] !== x) { this.p[x] = this.p[this.p[x]]; x = this.p[x] } return x } union(a: number, b: number) { this.p[this.find(a)] = this.find(b) } }

function starFromFreq(frq: number, t: number[]): number | null {
  if (!frq) return null
  if (frq <= t[0]) return 5
  if (frq <= t[1]) return 4
  if (frq <= t[2]) return 3
  if (frq <= t[3]) return 2
  return 1
}

async function main() {
  console.log('\n=== 词库富化 Pass 1 (ECDICT, dry-run) ===\n')
  const levels = GALAXIES.map(g => ({ g, data: loadWu(g.file) })).filter(x => x.data) as { g: typeof GALAXIES[0]; data: WuData }[]
  const keep = new Set<string>()
  for (const { data } of levels) for (const w of data.words) keep.add(norm(w[0]))

  await ensureEcdict()
  process.stdout.write(`解析 ECDICT（保留 ${keep.size} 词头）… `)
  const ec = loadEcdict(keep)
  console.log(`匹配 ${ec.size}\n`)

  // 全局频率分位阈值（最频在前）
  const frqs: number[] = []
  for (const w of keep) { const e = ec.get(w); if (e && e.frq > 0) frqs.push(e.frq) }
  frqs.sort((a, b) => a - b)
  const q = (p: number) => frqs[Math.min(frqs.length - 1, Math.floor(frqs.length * p))]
  const TH = [q(0.20), q(0.40), q(0.60), q(0.80)]

  fs.mkdirSync(OUT_DIR, { recursive: true })
  const rep: string[] = []
  rep.push('# 词库富化 Pass 1 报告（ECDICT · dry-run）', '', `生成：${new Date().toISOString()}　产物：scripts/.vocab-cache/enriched/`, '')
  rep.push(`全局词频五档阈值(frq rank)：★5≤${TH[0]} · ★4≤${TH[1]} · ★3≤${TH[2]} · ★2≤${TH[3]} · ★1>${TH[3]}`, '')
  rep.push('| 星系 | 词数 | ECDICT匹配 | 真频可定级 | 假星等修正 | 有词形变化 | 补音标 | 补词性 | 孤词率 前→后 |')
  rep.push('|---|--:|--:|--:|--:|--:|--:|--:|--:|')

  for (const { g, data } of levels) {
    const n = data.words.length
    let matched = 0, starFixable = 0, starChanged = 0, withForms = 0, ipaFill = 0, posFill = 0
    const forms: Record<number, Record<string, string>> = {}
    const newWords = data.words.map(w => [...w]) as WuWord[]

    data.words.forEach((w, i) => {
      const e = ec.get(norm(w[0])); if (!e) return
      matched++
      // stars ← 真频
      const st = starFromFreq(e.frq, TH)
      if (st != null) { starFixable++; if (Math.abs((w[4] || 0) - st) >= 2) starChanged++; newWords[i][4] = st }
      // 词形变化
      const f = parseExchange(e.exchange); if (Object.keys(f).length) { withForms++; forms[i] = f }
      // 补音标/词性
      if ((!w[1] || !String(w[1]).trim()) && e.phonetic.trim()) { newWords[i][1] = e.phonetic; ipaFill++ }
      if ((!w[3] || !String(w[3]).trim()) && e.pos.trim()) { newWords[i][3] = e.pos.split(/[\s/]/)[0]; posFill++ }
    })

    // 词族 v2：DSU(现有 ∪ 同 lemma ∪ 同 stem)
    const dsu = new DSU(n)
    for (const fam of data.families) for (let k = 1; k < fam.length; k++) dsu.union(fam[0], fam[k])
    const byLemma = new Map<string, number[]>(), byStem = new Map<string, number[]>()
    data.words.forEach((w, i) => {
      const e = ec.get(norm(w[0]))
      const lem = lemmaOf(e?.exchange || '', w[0]); (byLemma.get(lem) || byLemma.set(lem, []).get(lem)!).push(i)
      const stem = stemOf(w[0]); if (stem) (byStem.get(stem) || byStem.set(stem, []).get(stem)!).push(i)
    })
    for (const arr of [...byLemma.values(), ...byStem.values()]) for (let k = 1; k < arr.length; k++) dsu.union(arr[0], arr[k])
    const comp = new Map<number, number[]>()
    for (let i = 0; i < n; i++) { const r = dsu.find(i); (comp.get(r) || comp.set(r, []).get(r)!).push(i) }
    const familiesV2 = [...comp.values()].filter(c => c.length >= 2)
    const inFam = new Set<number>(); for (const c of familiesV2) for (const i of c) inFam.add(i)
    const orphanAfter = n - inFam.size
    const inFamOld = new Set<number>(); for (const fam of data.families) for (const i of fam) inFamOld.add(i)
    const orphanBefore = n - inFamOld.size

    fs.writeFileSync(path.join(OUT_DIR, `words-${g.id}.json`), JSON.stringify({ list: data.list, words: newWords, edges: data.edges, families: familiesV2, forms, _enriched: 'ecdict-pass1' }))

    const pf = (x: number) => (x / n * 100).toFixed(1) + '%'
    rep.push(`| ${g.zh} | ${n} | ${pf(matched)} | ${pf(starFixable)} | ${pf(starChanged)} | ${pf(withForms)} | ${ipaFill} | ${posFill} | ${pf(orphanBefore)}→${pf(orphanAfter)} |`)
    console.log(`${g.zh.padEnd(4)} 匹配${pf(matched)} 假星等修正${pf(starChanged)} 词形${pf(withForms)} 孤词 ${pf(orphanBefore)}→${pf(orphanAfter)}`)
  }

  rep.push('', '> dry-run：未覆盖 public 线上数据、未写 Supabase。确认后：① 真频stars/词形/词族 → 重生成静态词表；② 词形/词频 → Supabase（需 service role + inflections 列）。')
  rep.push('> 后续 Pass：Tatoeba 例句 · WordNet 同义 · 2ndLA 短语 · AI 近义辨析（待本报告确认）。')
  fs.mkdirSync(path.dirname(REPORT), { recursive: true })
  fs.writeFileSync(REPORT, rep.join('\n'))
  console.log(`\n报告：${path.relative(ROOT, REPORT)}　产物：${path.relative(ROOT, OUT_DIR)}/`)
}
main().catch(e => { console.error(e); process.exit(1) })
