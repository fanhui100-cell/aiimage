/* ============================================================================
   scripts/generate-relations.ts — 词关系生成（P2-3）
   A 规则层（立即跑）：
     derivative        词形家族：常见后缀剥离 stem 归并（stem ≥ 4）
     confusable-form   形近易混：编辑距离 1-2 且相邻档（每词 ≤3 条）
     synonym-candidate 同义候选：同义首释义 + 同词性
   B AI 层（批处理，先四六级档）：--ai --levels 3,4
     调 AI provider 产 themeTags + 精选近反义/易混（结果缓存可断点）

   用法：
     npx tsx scripts/generate-relations.ts --dry-run      # 规则层，只产报告/本地文件
     npx tsx scripts/generate-relations.ts                # 规则层 + upsert word_relations
     npx tsx scripts/generate-relations.ts --ai --levels 3,4   # AI 层（需 AI_PROVIDER 配置）

   依赖：import-vocabulary.ts 已跑过（读取 scripts/.vocab-cache 合并数据集）
   ============================================================================ */

import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const CACHE_DIR = path.join(__dirname, '.vocab-cache')
const RELATIONS_FILE = path.join(CACHE_DIR, 'relations.json')
const AI_CACHE_FILE = path.join(CACHE_DIR, 'relations-ai-cache.json')
const BATCH = 500

interface VocabEntry {
  id: string
  word: string
  levels: number[]
  primaryLevel: number
  translations: { translation: string; type: string }[]
}

interface Relation {
  word_id: string
  related_id: string
  type: string
  note: string | null
  source: 'rule' | 'ai'
}

function loadEnvLocal(): Record<string, string> {
  const file = path.join(__dirname, '..', '.env.local')
  const out: Record<string, string> = {}
  if (!fs.existsSync(file)) return out
  for (const line of fs.readFileSync(file, 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) out[m[1]] = m[2].trim()
  }
  return out
}

/** 复用 import 脚本的合并逻辑产物：直接重新合并（确定性，无需中间文件） */
async function loadMerged(): Promise<VocabEntry[]> {
  const SOURCES: { level: number; files: string[] }[] = [
    { level: 1, files: ['ChuZhong_2.json', 'ChuZhong_3.json'] },
    { level: 2, files: ['GaoZhong_2.json', 'GaoZhong_3.json'] },
    { level: 3, files: ['CET4_1.json', 'CET4_2.json', 'CET4_3.json'] },
    { level: 4, files: ['CET6_1.json', 'CET6_2.json', 'CET6_3.json'] },
    { level: 5, files: ['KaoYan_1.json', 'KaoYan_2.json', 'KaoYan_3.json'] },
    { level: 6, files: ['TOEFL_2.json', 'TOEFL_3.json'] },
    { level: 7, files: ['SAT_2.json', 'SAT_3.json'] },
  ]
  const map = new Map<string, VocabEntry>()
  for (const src of SOURCES) {
    for (const file of src.files) {
      const p = path.join(CACHE_DIR, file)
      if (!fs.existsSync(p)) throw new Error(`缺少缓存 ${file} — 先运行 import-vocabulary.ts`)
      for (const e of JSON.parse(fs.readFileSync(p, 'utf-8'))) {
        if (!e.word || !/^[a-zA-Z][a-zA-Z' -]*$/.test(e.word)) continue
        const id = e.word.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        if (!id) continue
        const ex = map.get(id)
        if (ex) {
          if (!ex.levels.includes(src.level)) ex.levels.push(src.level)
          ex.primaryLevel = Math.min(ex.primaryLevel, src.level)
        } else {
          map.set(id, {
            id,
            word: e.word.trim().toLowerCase(),
            levels: [src.level],
            primaryLevel: src.level,
            translations: (e.translations ?? []).filter((t: { translation?: string }) => t.translation),
          })
        }
      }
    }
  }
  return [...map.values()]
}

// ── 规则 1：词形家族（后缀 stem 归并，stem ≥ 4）─────────────────────────────
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
      // 双写辅音还原（running→run）与词尾 e 略（兼容近似匹配即可）
      if (stem.length > 4 && stem[stem.length - 1] === stem[stem.length - 2]) stem = stem.slice(0, -1)
      return stem
    }
  }
  return word
}

function ruleDerivatives(entries: VocabEntry[]): Relation[] {
  const byStem = new Map<string, VocabEntry[]>()
  for (const e of entries) {
    if (!/^[a-z]+$/.test(e.word)) continue
    const stem = stemOf(e.word)
    if (stem.length < 4) continue
    byStem.get(stem)?.push(e) ?? byStem.set(stem, [e])
  }
  const out: Relation[] = []
  for (const [stem, family] of byStem) {
    if (family.length < 2) continue
    // 家族根 = 最短词
    const root = family.reduce((a, b) => (a.word.length <= b.word.length ? a : b))
    for (const m of family) {
      if (m.id === root.id) continue
      out.push({ word_id: root.id, related_id: m.id, type: 'derivative', note: stem, source: 'rule' })
    }
  }
  return out
}

// ── 规则 2：形近易混（编辑距离 1-2 且相邻档，每词 ≤3）───────────────────────
function editDistanceLe2(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 2) return false
  // 带宽限制 DP
  const m = a.length, n = b.length
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const cur = [i, ...Array(n).fill(99)]
    for (let j = Math.max(1, i - 2); j <= Math.min(n, i + 2); j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
    prev = cur
    if (Math.min(...prev) > 2) return false
  }
  return prev[n] <= 2
}

function ruleConfusables(entries: VocabEntry[]): Relation[] {
  // 桶：首字母 + 长度（比较 长度±2 同首字母）
  const buckets = new Map<string, VocabEntry[]>()
  const eligible = entries.filter(e => /^[a-z]{4,}$/.test(e.word))
  for (const e of eligible) {
    const key = `${e.word[0]}:${e.word.length}`
    buckets.get(key)?.push(e) ?? buckets.set(key, [e])
  }
  const counts = new Map<string, number>()
  const out: Relation[] = []
  const seen = new Set<string>()
  for (const e of eligible) {
    if ((counts.get(e.id) ?? 0) >= 3) continue
    for (let len = e.word.length - 2; len <= e.word.length + 2; len++) {
      for (const c of buckets.get(`${e.word[0]}:${len}`) ?? []) {
        if (c.id <= e.id) continue
        if ((counts.get(e.id) ?? 0) >= 3 || (counts.get(c.id) ?? 0) >= 3) continue
        // 相邻档
        if (Math.abs(e.primaryLevel - c.primaryLevel) > 1) continue
        const pairKey = `${e.id}|${c.id}`
        if (seen.has(pairKey)) continue
        if (stemOf(e.word) === stemOf(c.word)) continue   // 同家族不算易混
        if (editDistanceLe2(e.word, c.word)) {
          seen.add(pairKey)
          out.push({ word_id: e.id, related_id: c.id, type: 'confusable-form', note: null, source: 'rule' })
          counts.set(e.id, (counts.get(e.id) ?? 0) + 1)
          counts.set(c.id, (counts.get(c.id) ?? 0) + 1)
        }
      }
    }
  }
  return out
}

// ── 规则 3：同义候选（同义首释义 + 同词性）─────────────────────────────────
function normalizeZh(t: string): string {
  return t.replace(/[（(].*?[)）]/g, '').split(/[;；,，]/)[0].trim()
}

function ruleSynonymCandidates(entries: VocabEntry[]): Relation[] {
  const byDef = new Map<string, VocabEntry[]>()
  for (const e of entries) {
    const t = e.translations[0]
    if (!t?.translation) continue
    const key = `${t.type ?? ''}:${normalizeZh(t.translation)}`
    if (key.length < 4) continue
    byDef.get(key)?.push(e) ?? byDef.set(key, [e])
  }
  const out: Relation[] = []
  for (const group of byDef.values()) {
    if (group.length < 2 || group.length > 6) continue   // 太大组多为噪声
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        out.push({ word_id: group[i].id, related_id: group[j].id, type: 'synonym-candidate', note: null, source: 'rule' })
      }
    }
  }
  return out
}

// ── B：AI 层（批处理骨架，先四六级档）────────────────────────────────────────
async function aiLayer(entries: VocabEntry[], levels: number[]) {
  const cache: Record<string, unknown> = fs.existsSync(AI_CACHE_FILE)
    ? JSON.parse(fs.readFileSync(AI_CACHE_FILE, 'utf-8')) : {}
  const targets = entries.filter(e => levels.includes(e.primaryLevel) && !cache[e.id])
  console.log(`AI 层：目标 ${targets.length} 词（档 ${levels.join(',')}），批 50`)
  console.log('⚠ AI 层为批处理骨架：需 AI_PROVIDER 已配置（lib/ai 同源 HTTP 接口），')
  console.log('  且消耗 LLM 配额。本脚本默认不自动执行——确认后取消下行注释运行。')
  console.log('  // TODO(P2-3B): 按 50/批调 /api/ai 生成 themeTags + 近反义/易混，写 AI_CACHE_FILE 断点')
  // 占位：不在脚本里直接烧配额。结构（题面/解析/写回 word_relations source=ai）已定义。
}

// ── 主流程 ──────────────────────────────────────────────────────────────────
async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const aiMode = process.argv.includes('--ai')
  const levelsArg = process.argv[process.argv.indexOf('--levels') + 1]
  const aiLevels = aiMode ? (levelsArg ?? '3,4').split(',').map(Number) : []

  console.log('═══ 词关系生成 ═══')
  const entries = await loadMerged()
  console.log(`词条：${entries.length}`)

  if (aiMode) {
    await aiLayer(entries, aiLevels)
    return
  }

  console.time('derivative')
  const derivatives = ruleDerivatives(entries)
  console.timeEnd('derivative')
  console.time('confusable')
  const confusables = ruleConfusables(entries)
  console.timeEnd('confusable')
  console.time('synonym')
  const synonyms = ruleSynonymCandidates(entries)
  console.timeEnd('synonym')

  const all = [...derivatives, ...confusables, ...synonyms]
  const report = {
    generatedAt: new Date().toISOString(),
    words: entries.length,
    derivative: derivatives.length,
    confusableForm: confusables.length,
    synonymCandidate: synonyms.length,
    total: all.length,
  }
  fs.writeFileSync(RELATIONS_FILE, JSON.stringify({ report, relations: all }))
  console.log(JSON.stringify(report, null, 2))

  if (dryRun) {
    console.log('\n--dry-run：关系已写本地 relations.json，不写库。样例：')
    console.log(derivatives.slice(0, 3), confusables.slice(0, 3), synonyms.slice(0, 3))
    return
  }

  const env = { ...loadEnvLocal(), ...process.env } as Record<string, string>
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('✗ 缺少 SUPABASE_SERVICE_ROLE_KEY，无法写 word_relations')
    process.exit(1)
  }
  const db = createClient(url, key, { auth: { persistSession: false } })
  for (let i = 0; i < all.length; i += BATCH) {
    const { error } = await db.from('word_relations')
      .upsert(all.slice(i, i + BATCH), { onConflict: 'word_id,related_id,type' })
    if (error) throw new Error(`batch ${i / BATCH}: ${error.message}`)
    if ((i / BATCH) % 10 === 0) console.log(`批次 ${i / BATCH + 1}/${Math.ceil(all.length / BATCH)} ✓`)
  }
  console.log('═══ 关系导入完成 ═══')
}

main().catch(e => { console.error('✗', e.message ?? e); process.exit(1) })
