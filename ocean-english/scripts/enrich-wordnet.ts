/* ============================================================================
   scripts/enrich-wordnet.ts — 词库富化 · Pass 2 (WordNet 3.1, dry-run)

   读 Princeton WordNet 3.1 dict（scripts/.vocab-cache/wn31/dict）：
     ① 派生关系（+ 指针）→ union 词族 v3，直击孤词率（create↔creation↔creative…）
     ② 同义集词表 → 同义边(type 1)，补现有稀疏 syn
   在 Pass-1 产物（scripts/.vocab-cache/enriched/words-<id>.json）上原地增强 families/edges。
   **dry-run：不覆盖 public、不写 Supabase。** 报告 reports/enrich-pass2.md

   前置：Pass 1 已跑（enriched/ 存在）；wn31/dict 已解压。
   用法： npx tsx scripts/enrich-wordnet.ts
   ============================================================================ */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.join(__dirname, '..')
const CACHE = path.join(__dirname, '.vocab-cache')
const ENRICHED = path.join(CACHE, 'enriched')
const WN = path.join(CACHE, 'wn31', 'dict')
const REPORT = path.join(ROOT, 'reports', 'enrich-pass2.md')

const GALAXIES = [
  { id: 'junior', zh: '初中' }, { id: 'senior', zh: '高中' }, { id: 'cet4', zh: '四级' },
  { id: 'cet6', zh: '六级' }, { id: 'kaoyan', zh: '考研' }, { id: 'toefl', zh: '托福' }, { id: 'sat', zh: 'SAT' },
]
const FILES: [string, string][] = [['data.noun', 'n'], ['data.verb', 'v'], ['data.adj', 'a'], ['data.adv', 'r']]
const normPos = (p: string) => (p === 's' ? 'a' : p)
const cleanLemma = (w: string) => w.toLowerCase().replace(/\(.*?\)$/, '').replace(/_/g, ' ')

class DSU { p: number[]; constructor(n: number) { this.p = Array.from({ length: n }, (_, i) => i) } find(x: number): number { while (this.p[x] !== x) { this.p[x] = this.p[this.p[x]]; x = this.p[x] } return x } union(a: number, b: number) { this.p[this.find(a)] = this.find(b) } }

interface Syn { words: string[] }

function buildSynsetMap(): Map<string, Syn> {
  const map = new Map<string, Syn>()
  for (const [file, pos] of FILES) {
    const fp = path.join(WN, file); if (!fs.existsSync(fp)) continue
    for (const line of fs.readFileSync(fp, 'utf-8').split('\n')) {
      if (!/^\d{8} /.test(line)) continue
      const dataPart = line.split(' | ')[0]
      const t = dataPart.split(' ')
      const offset = t[0]; const wcnt = parseInt(t[3], 16)
      const words: string[] = []
      for (let k = 0; k < wcnt; k++) words.push(cleanLemma(t[4 + 2 * k]))
      map.set(pos + offset, { words })
    }
  }
  return map
}

// 解析派生对 + 同义
function parseRelations(synMap: Map<string, Syn>) {
  const derivPairs: [string, string][] = []
  const synonyms = new Map<string, Set<string>>()
  const addSyn = (a: string, b: string) => { if (a === b) return; (synonyms.get(a) || synonyms.set(a, new Set()).get(a)!).add(b) }
  for (const [file] of FILES) {
    const fp = path.join(WN, file); if (!fs.existsSync(fp)) continue
    for (const line of fs.readFileSync(fp, 'utf-8').split('\n')) {
      if (!/^\d{8} /.test(line)) continue
      const t = line.split(' | ')[0].split(' ')
      const wcnt = parseInt(t[3], 16)
      const words: string[] = []
      for (let k = 0; k < wcnt; k++) words.push(cleanLemma(t[4 + 2 * k]))
      // 同义：单词 lemma 两两互为同义
      const singles = words.filter(w => !w.includes(' '))
      for (let i = 0; i < singles.length; i++) for (let j = 0; j < singles.length; j++) if (i !== j) addSyn(singles[i], singles[j])
      // 派生指针
      const pIdx = 4 + 2 * wcnt; const pcnt = parseInt(t[pIdx], 10) || 0
      for (let j = 0; j < pcnt; j++) {
        const base = pIdx + 1 + 4 * j
        if (t[base] !== '+') continue
        const tOff = t[base + 1], tPos = normPos(t[base + 2]), st = t[base + 3] || '0000'
        const srcN = parseInt(st.slice(0, 2), 16), tgtN = parseInt(st.slice(2, 4), 16)
        if (srcN < 1 || tgtN < 1) continue
        const src = words[srcN - 1]; const tgtSyn = synMap.get(tPos + tOff)
        if (!src || !tgtSyn) continue
        const tgt = tgtSyn.words[tgtN - 1]
        if (tgt && !src.includes(' ') && !tgt.includes(' ') && src !== tgt) derivPairs.push([src, tgt])
      }
    }
  }
  return { derivPairs, synonyms }
}

type WuWord = [string, string, string, string, number, unknown, unknown]
interface Enriched { list: string; words: WuWord[]; edges: [number, number, number][]; families: number[][]; forms?: unknown; _enriched?: string }

function main() {
  console.log('\n=== 词库富化 Pass 2 (WordNet, dry-run) ===\n')
  if (!fs.existsSync(WN)) { console.error('缺 WordNet：', WN); process.exit(1) }
  process.stdout.write('解析 WordNet synsets… ')
  const synMap = buildSynsetMap()
  const { derivPairs, synonyms } = parseRelations(synMap)
  console.log(`synsets ${synMap.size} · 派生对 ${derivPairs.length} · 有同义词条 ${synonyms.size}`)

  // 全局派生对索引：lemma → 关联 lemma 列表（用于同级内 union）
  const derivAdj = new Map<string, Set<string>>()
  for (const [a, b] of derivPairs) { (derivAdj.get(a) || derivAdj.set(a, new Set()).get(a)!).add(b); (derivAdj.get(b) || derivAdj.set(b, new Set()).get(b)!).add(a) }

  const rep: string[] = []
  rep.push('# 词库富化 Pass 2 报告（WordNet · dry-run）', '', `生成：${new Date().toISOString()}`, '')
  rep.push(`WordNet：synsets ${synMap.size} · 派生对 ${derivPairs.length}`, '')
  rep.push('| 星系 | 词数 | 孤词率 P1→P2 | 词族数 P1→P2 | 新增同义边 | 总同义边 |')
  rep.push('|---|--:|--:|--:|--:|--:|')

  for (const g of GALAXIES) {
    const fp = path.join(ENRICHED, `words-${g.id}.json`)
    if (!fs.existsSync(fp)) { console.warn('跳过(无 Pass1 产物)', g.id); continue }
    const data = JSON.parse(fs.readFileSync(fp, 'utf-8')) as Enriched
    const n = data.words.length
    const widx = new Map<string, number>()
    data.words.forEach((w, i) => { const k = w[0].toLowerCase(); if (!widx.has(k)) widx.set(k, i) })

    // 词族 v3：P1 families ∪ WordNet 派生对（限本级词）
    const dsu = new DSU(n)
    for (const fam of data.families) for (let k = 1; k < fam.length; k++) dsu.union(fam[0], fam[k])
    let derivUnions = 0
    data.words.forEach((w, i) => {
      const rel = derivAdj.get(w[0].toLowerCase()); if (!rel) return
      for (const r of rel) { const j = widx.get(r); if (j != null && dsu.find(i) !== dsu.find(j)) { dsu.union(i, j); derivUnions++ } }
    })
    const comp = new Map<number, number[]>()
    for (let i = 0; i < n; i++) { const r = dsu.find(i); (comp.get(r) || comp.set(r, []).get(r)!).push(i) }
    const familiesV3 = [...comp.values()].filter(c => c.length >= 2)
    const inFam = new Set<number>(); for (const c of familiesV3) for (const i of c) inFam.add(i)
    const orphanP2 = ((n - inFam.size) / n * 100)
    const inFamP1 = new Set<number>(); for (const f of data.families) for (const i of f) inFamP1.add(i)
    const orphanP1 = ((n - inFamP1.size) / n * 100)

    // 同义边(type 1)：WordNet 同义 ∩ 本级词，去重已有边
    const have = new Set<string>(); for (const e of data.edges) { have.add(e[0] + '-' + e[1]); have.add(e[1] + '-' + e[0]) }
    let added = 0
    const newEdges = data.edges.slice()
    data.words.forEach((w, i) => {
      const syns = synonyms.get(w[0].toLowerCase()); if (!syns) return
      for (const s of syns) { const j = widx.get(s); if (j == null || j === i) continue; const key = i + '-' + j; if (have.has(key)) continue; have.add(key); have.add(j + '-' + i); newEdges.push([i, j, 1]); added++ }
    })
    const totalSyn = newEdges.filter(e => e[2] === 1).length

    fs.writeFileSync(fp, JSON.stringify({ ...data, edges: newEdges, families: familiesV3, _enriched: 'wordnet-pass2' }))
    rep.push(`| ${g.zh} | ${n} | ${orphanP1.toFixed(1)}%→${orphanP2.toFixed(1)}% | ${data.families.length}→${familiesV3.length} | +${added} | ${totalSyn} |`)
    console.log(`${g.zh.padEnd(4)} 孤词 ${orphanP1.toFixed(1)}%→${orphanP2.toFixed(1)}% · 词族 ${data.families.length}→${familiesV3.length} · +同义 ${added} (派生union ${derivUnions})`)
  }

  rep.push('', '> dry-run：仅更新 scripts/.vocab-cache/enriched/。同义边限本词表内成员；派生 union 用 WordNet derivationally-related-forms。')
  rep.push('> 后续：Tatoeba 例句 · 2ndLA 短语 · AI 近义辨析；落地（重生成静态词表 + 写 Supabase）需确认。')
  fs.mkdirSync(path.dirname(REPORT), { recursive: true })
  fs.writeFileSync(REPORT, rep.join('\n'))
  console.log(`\n报告：${path.relative(ROOT, REPORT)}`)
}
main()
