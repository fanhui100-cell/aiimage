/* ============================================================================
   scripts/land-enriched.ts — 落地 A：把富化产物写回静态词表（可逆）

   读 scripts/.vocab-cache/enriched/words-<id>.json（Pass1-3 成果），
   ① 每词同义边上限 N=8（互为 top-N 才保留）防噪声
   ② 重写 public/lexiverse-reference-v3/data/words-<file>.js（window.WU_DATA）
   先备份原文件到 scripts/.vocab-cache/orig-static/（git 未跟踪，手动留底以便回退）。
   只写静态词表（星系/词图 iframe 直接读）；不碰 Supabase。
   用法： npx tsx scripts/land-enriched.ts
   ============================================================================ */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.join(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'public', 'lexiverse-reference-v3', 'data')
const ENRICHED = path.join(__dirname, '.vocab-cache', 'enriched')
const BACKUP = path.join(__dirname, '.vocab-cache', 'orig-static')
const REPORT = path.join(ROOT, 'reports', 'enrich-landing.md')
const SYN_CAP = 8

const GALAXIES = [
  { id: 'junior', zh: '初中', file: 'words-junior.js' },
  { id: 'senior', zh: '高中', file: 'words-senior.js' },
  { id: 'cet4', zh: '四级', file: 'words-cet4-full.js' },
  { id: 'cet6', zh: '六级', file: 'words-cet6.js' },
  { id: 'kaoyan', zh: '考研', file: 'words-kaoyan.js' },
  { id: 'toefl', zh: '托福', file: 'words-toefl.js' },
  { id: 'sat', zh: 'SAT', file: 'words-sat.js' },
]
type WuWord = [string, string, string, string, number, unknown, unknown]
interface Enriched { list: string; words: WuWord[]; edges: [number, number, number][]; families: number[][] }

// 同义边上限：每词按"伙伴星等"排序取 top-N，边需互为 top-N 才保留（严格 ≤N/词）
function capSynonyms(words: WuWord[], edges: [number, number, number][], N: number) {
  const synAdj = new Map<number, Set<number>>()
  for (const [a, b, t] of edges) { if (t !== 1) continue; (synAdj.get(a) || synAdj.set(a, new Set()).get(a)!).add(b); (synAdj.get(b) || synAdj.set(b, new Set()).get(b)!).add(a) }
  const stars = (i: number) => (words[i]?.[4] as number) || 1
  const top = new Map<number, Set<number>>()
  for (const [w, nbrs] of synAdj) {
    const sorted = [...nbrs].sort((x, y) => (stars(y) - stars(x)) || (x - y)).slice(0, N)
    top.set(w, new Set(sorted))
  }
  let before = 0, after = 0
  const kept = edges.filter(([a, b, t]) => {
    if (t !== 1) return true
    before++
    const ok = top.get(a)?.has(b) && top.get(b)?.has(a)
    if (ok) after++
    return ok
  })
  return { kept, before, after }
}

function starDist(words: WuWord[]) { const d = [0, 0, 0, 0, 0, 0]; for (const w of words) d[Math.max(0, Math.min(5, Math.round((w[4] as number) || 0)))]++; return d }

function main() {
  fs.mkdirSync(BACKUP, { recursive: true })
  const rep: string[] = []
  rep.push('# 落地 A 报告（富化 → 静态词表 · 可逆）', '', `生成：${new Date().toISOString()}　备份：scripts/.vocab-cache/orig-static/`, '')
  rep.push(`同义边上限：每词 ≤${SYN_CAP}（互为 top-N 保留，按伙伴星等排序）`, '')
  rep.push('| 星系 | 词数 | 同义边 上限前→后 | 派生/同义/形近(后) | 词族 | ★5 占比 | 文件 |')
  rep.push('|---|--:|--:|--|--:|--:|--|')

  for (const g of GALAXIES) {
    const ep = path.join(ENRICHED, `words-${g.id}.json`)
    const dp = path.join(DATA_DIR, g.file)
    if (!fs.existsSync(ep)) { console.warn('跳过(无富化产物)', g.id); continue }
    if (!fs.existsSync(dp)) { console.warn('跳过(无目标文件)', g.file); continue }
    // 备份原文件（仅首次）
    const bak = path.join(BACKUP, g.file)
    if (!fs.existsSync(bak)) fs.copyFileSync(dp, bak)

    const data = JSON.parse(fs.readFileSync(ep, 'utf-8')) as Enriched
    const { kept, before, after } = capSynonyms(data.words, data.edges, SYN_CAP)
    const e0 = kept.filter(e => e[2] === 0).length, e1 = after, e2 = kept.filter(e => e[2] === 2).length
    const sd = starDist(data.words); const n = data.words.length
    const out = { list: data.list, words: data.words, edges: kept, families: data.families }
    fs.writeFileSync(dp, 'window.WU_DATA = ' + JSON.stringify(out) + ';\n')

    rep.push(`| ${g.zh} | ${n} | ${before}→${after} | ${e0}/${e1}/${e2} | ${data.families.length} | ${(sd[5] / n * 100).toFixed(1)}% | ${g.file} |`)
    console.log(`${g.zh.padEnd(4)} 同义 ${before}→${after} · 派生/同义/形近 ${e0}/${e1}/${e2} · 词族 ${data.families.length} · ★5 ${(sd[5] / n * 100).toFixed(1)}%`)
  }

  rep.push('', '> 已写回 public 静态词表（星系/词图 iframe 直接读，刷新即见效）。回退：用 scripts/.vocab-cache/orig-static/ 覆盖回去。')
  rep.push('> 未含：词形变化 forms（留给词卡接入/Supabase）；富字段写 Supabase（落地 B，待确认）。')
  fs.mkdirSync(path.dirname(REPORT), { recursive: true })
  fs.writeFileSync(REPORT, rep.join('\n'))
  console.log(`\n报告：${path.relative(ROOT, REPORT)}　备份：${path.relative(ROOT, BACKUP)}/`)
}
main()
