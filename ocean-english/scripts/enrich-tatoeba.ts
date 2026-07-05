/* ============================================================================
   scripts/enrich-tatoeba.ts — 词库富化 · Pass 3 (Tatoeba 英中例句, dry-run)

   Tatoeba(CC-BY) 英中句对（per-language exports）→ 给"缺例句"的词补一条英中例句。
     源：scripts/.vocab-cache/tatoeba/{cmn_sentences,eng_sentences,cmn-eng_links}.tsv
   只补 sent 为空的词（不替换现有 KyleBing 例句）；选含词头、长度适中、最短者。
   在 Pass-2 产物上原地更新 sent。**dry-run：不覆盖 public、不写 Supabase。**
   报告 reports/enrich-pass3.md
   ============================================================================ */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.join(__dirname, '..')
const CACHE = path.join(__dirname, '.vocab-cache')
const ENRICHED = path.join(CACHE, 'enriched')
const TAT = path.join(CACHE, 'tatoeba')
const REPORT = path.join(ROOT, 'reports', 'enrich-pass3.md')
const GALAXIES = [
  { id: 'junior', zh: '初中' }, { id: 'senior', zh: '高中' }, { id: 'cet4', zh: '四级' },
  { id: 'cet6', zh: '六级' }, { id: 'kaoyan', zh: '考研' }, { id: 'toefl', zh: '托福' }, { id: 'sat', zh: 'SAT' },
]
type WuWord = [string, string, string, string, number, unknown, [string, string] | null]
interface Enriched { list: string; words: WuWord[]; edges: unknown; families: unknown; forms?: unknown; _enriched?: string }

const tok = (s: string) => (s.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || [])

function main() {
  console.log('\n=== 词库富化 Pass 3 (Tatoeba 例句, dry-run) ===\n')
  for (const f of ['cmn_sentences.tsv', 'eng_sentences.tsv', 'cmn-eng_links.tsv']) {
    if (!fs.existsSync(path.join(TAT, f))) { console.error('缺', f); process.exit(1) }
  }

  // 目标词头（7 级并集）
  const targets = new Set<string>()
  const levels = GALAXIES.map(g => {
    const fp = path.join(ENRICHED, `words-${g.id}.json`)
    const data = fs.existsSync(fp) ? JSON.parse(fs.readFileSync(fp, 'utf-8')) as Enriched : null
    if (data) for (const w of data.words) targets.add(w[0].toLowerCase())
    return { g, fp, data }
  })

  // links → 需要的 eng id + (cmnId,engId) 对
  process.stdout.write('读 links… ')
  const links: [string, string][] = []
  const needEng = new Set<string>(), needCmn = new Set<string>()
  for (const line of fs.readFileSync(path.join(TAT, 'cmn-eng_links.tsv'), 'utf-8').split('\n')) {
    const i = line.indexOf('\t'); if (i < 0) continue
    const cmnId = line.slice(0, i), engId = line.slice(i + 1).trim()
    if (!engId) continue
    links.push([cmnId, engId]); needCmn.add(cmnId); needEng.add(engId)
  }
  console.log(`${links.length} 对`)

  // cmn id → zh
  const cmn = new Map<string, string>()
  for (const line of fs.readFileSync(path.join(TAT, 'cmn_sentences.tsv'), 'utf-8').split('\n')) {
    const a = line.indexOf('\t'); if (a < 0) continue; const b = line.indexOf('\t', a + 1)
    const id = line.slice(0, a); if (!needCmn.has(id)) continue
    cmn.set(id, line.slice(b + 1))
  }
  // eng id → en（只留需要的）
  process.stdout.write('读 eng_sentences（2M 行，过滤）… ')
  const eng = new Map<string, string>()
  for (const line of fs.readFileSync(path.join(TAT, 'eng_sentences.tsv'), 'utf-8').split('\n')) {
    const a = line.indexOf('\t'); if (a < 0) continue; const id = line.slice(0, a)
    if (!needEng.has(id)) continue; const b = line.indexOf('\t', a + 1); eng.set(id, line.slice(b + 1))
  }
  console.log(`保留 ${eng.size} 句`)

  // word → 最佳例句 [en, zh]（含词头、4–20 词、最短）
  const best = new Map<string, [string, string]>()
  const bestLen = new Map<string, number>()
  for (const [cmnId, engId] of links) {
    const en = eng.get(engId), zh = cmn.get(cmnId)
    if (!en || !zh) continue
    const ts = tok(en); if (ts.length < 4 || ts.length > 20) continue
    const uniq = new Set(ts)
    for (const w of uniq) {
      if (!targets.has(w)) continue
      const cur = bestLen.get(w)
      if (cur == null || ts.length < cur) { best.set(w, [en, zh]); bestLen.set(w, ts.length) }
    }
  }
  console.log(`可供例句的词头：${best.size}\n`)

  const rep: string[] = []
  rep.push('# 词库富化 Pass 3 报告（Tatoeba 例句 · dry-run）', '', `生成：${new Date().toISOString()}`, '')
  rep.push(`Tatoeba 英中句对 ${links.length} · 命中目标词头 ${best.size}（仅补空缺，不替换现有例句）`, '')
  rep.push('| 星系 | 词数 | 缺例句 前 | Tatoeba 可补 | 实补 | 缺例句 后 |')
  rep.push('|---|--:|--:|--:|--:|--:|')

  for (const { g, fp, data } of levels) {
    if (!data) continue
    const n = data.words.length
    let missBefore = 0, filled = 0, fillable = 0
    data.words.forEach(w => {
      const has = w[6] && (w[6] as [string, string])[0] && String((w[6] as [string, string])[0]).trim()
      if (has) return
      missBefore++
      const ex = best.get(w[0].toLowerCase())
      if (ex) { fillable++; w[6] = ex; filled++ }
    })
    const missAfter = missBefore - filled
    fs.writeFileSync(fp, JSON.stringify({ ...data, _enriched: 'tatoeba-pass3' }))
    const pf = (x: number) => (x / n * 100).toFixed(1) + '%'
    rep.push(`| ${g.zh} | ${n} | ${missBefore} (${pf(missBefore)}) | ${fillable} | ${filled} | ${missAfter} (${pf(missAfter)}) |`)
    console.log(`${g.zh.padEnd(4)} 缺例句 ${missBefore}→${missAfter}（Tatoeba 补 ${filled}）`)
  }

  rep.push('', '> dry-run：仅更新 scripts/.vocab-cache/enriched/。只补空缺、不替换现有例句；例句取含词头、4–20 词、最短者。')
  rep.push('> 注：Tatoeba 对生僻词（部分托福/SAT）覆盖有限，补不满属正常；剩余缺口可后续 AI 生成。')
  fs.mkdirSync(path.dirname(REPORT), { recursive: true })
  fs.writeFileSync(REPORT, rep.join('\n'))
  console.log(`\n报告：${path.relative(ROOT, REPORT)}`)
}
main()
