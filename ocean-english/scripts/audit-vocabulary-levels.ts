/* ════════════════════════════════════════════════════════════════════════
   audit-vocabulary-levels.ts — 词库等级覆盖 audit（Phase 2，只读）

   连 Supabase（.env.local 的 SERVICE_ROLE）只读统计：每档 primary_level 计数、
   levels-includes 计数、各词典资料字段覆盖；重点核查 CET-6 直接覆盖缺口与考研
   primary_level vs levels。不导入词表、不写任何 DB 行。

   产出：
   - reports/vocabulary-level-audit-2026-06-20.json
   - reports/vocabulary-level-audit-2026-06-20.md

   用法：npm run audit:vocab-levels
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'
import { LEVEL_TO_EXAM_ID, examIdToDisplayName, type ExamLevel } from '@/lib/exam-specs'

const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const SUPABASE_URL = readEnv('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_ROLE = readEnv('SUPABASE_SERVICE_ROLE_KEY')
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('缺少 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY（.env.local）')
  process.exit(1)
}
const db = createClient(SUPABASE_URL, SERVICE_ROLE)

const LEVELS: ExamLevel[] = [1, 2, 3, 4, 5, 6, 7, 8]

// 目标词量口径（Phase 2 prompt）。toefl/sat/ielts 无固定官方词表 → size=null。
const TARGET: Record<number, { size: number | null; note: string }> = {
  1: { size: 1900, note: '义务教育课标 2022 约 1600，扩展至约 1900' },
  2: { size: 3500, note: '高中课标 2017/2020 约 3000-3500' },
  3: { size: 4500, note: 'CET-4 常见口径约 4500' },
  4: { size: 5500, note: 'CET-6 常见口径约 5500（直接覆盖缺口重点核查）' },
  5: { size: 5500, note: '考研大纲约 5500；须按 levels includes 5，不能只看 primary_level' },
  6: { size: null, note: 'TOEFL 无固定官方完整词表；按 curated 学术/任务词覆盖评估' },
  7: { size: null, note: 'SAT 无固定官方完整词表；按 curated high-utility RW 词覆盖评估' },
  8: { size: null, note: '雅思（IELTS）无固定官方完整词表；按 ECDICT ielts tag + 学术高频覆盖评估' },
}

const RELATIONS = [
  'dictionary_definitions',
  'dictionary_examples',
  'word_mnemonics',
  'dictionary_etymology',
  'dictionary_collocations',
  'dictionary_synonyms',
  'dictionary_antonyms',
] as const

type WordRow = {
  id: string
  primary_level: number | null
  levels: number[] | null
  inflections: Record<string, unknown> | null
}

// 稳定排序分页：显式 order 避免表变动/查询计划变化时分页漂移（Codex Phase 2 建议）。
async function pageCol<T>(table: string, cols: string, orderBy: string): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select(cols).order(orderBy, { ascending: true }).range(from, from + 999)
    if (error) throw new Error(`${table}: ${error.message}`)
    const rows = (data ?? []) as T[]
    out.push(...rows)
    if (rows.length < 1000) break
  }
  return out
}

async function distinctWordIds(table: string): Promise<Set<string>> {
  const set = new Set<string>()
  for (const r of await pageCol<{ word_id: string }>(table, 'word_id', 'word_id')) {
    if (r.word_id) set.add(r.word_id)
  }
  return set
}

const hasInflections = (w: WordRow) =>
  !!w.inflections && typeof w.inflections === 'object' && Object.keys(w.inflections).length > 0

interface LevelAudit {
  level: number
  examId: string
  label: string
  targetSize: number | null
  currentPrimaryLevelCount: number
  currentLevelsIncludesCount: number
  wordsWithDefinitions: number
  wordsWithExamples: number
  wordsWithMnemonics: number
  wordsWithInflections: number
  wordsWithEtymology: number
  wordsWithCollocations: number
  wordsWithSynonyms: number
  wordsWithAntonyms: number
  recommendation: string
}

function buildRecommendation(
  level: number,
  target: { size: number | null; note: string },
  primaryCount: number,
  levelsIncludesCount: number,
  defPct: number,
): string {
  const parts: string[] = []
  if (target.size == null) {
    parts.push('无固定官方完整词表，按 curated 高频/学术词覆盖评估，勿按大词表盲目扩量')
  } else {
    const gap = target.size - levelsIncludesCount
    if (gap > 200) parts.push(`levels includes ${level} 覆盖 ${levelsIncludesCount} < 目标约 ${target.size}，缺口约 ${gap}，建议合法补标 levels（只增不覆盖）`)
    else if (gap < -200) parts.push(`levels includes ${level} 覆盖 ${levelsIncludesCount} 已超目标约 ${target.size}，核查是否过宽`)
    else parts.push(`levels includes ${level} 覆盖 ${levelsIncludesCount}，接近目标约 ${target.size}`)
  }
  if (levelsIncludesCount - primaryCount > 500) {
    parts.push(`primary_level=${level} 仅 ${primaryCount}，远少于 levels includes ${levelsIncludesCount}：训练务必按 levels includes，不能只看 primary_level`)
  }
  if (levelsIncludesCount > 0 && defPct < 98) {
    parts.push(`释义覆盖 ${defPct.toFixed(1)}%，存在缺释义词，补料优先补释义`)
  }
  return parts.join('；')
}

async function main() {
  const t0 = Date.now()
  console.log('audit-vocabulary-levels: 连接 Supabase（只读）…')
  const words = await pageCol<WordRow>('dictionary_words', 'id, primary_level, levels, inflections', 'id')
  console.log(`  dictionary_words: ${words.length}`)

  const relSets: Record<string, Set<string>> = {}
  for (const table of RELATIONS) {
    relSets[table] = await distinctWordIds(table)
    console.log(`  ${table}: ${relSets[table].size} 词有数据`)
  }

  // ── 数据完整性检测 ──
  let invalidLevelTag = 0
  let duplicateLevelTag = 0
  let primaryNotInLevels = 0
  let noLevelAtAll = 0
  for (const w of words) {
    const lv = Array.isArray(w.levels) ? w.levels : []
    if (lv.some((n) => n < 1 || n > 8)) invalidLevelTag += 1
    if (new Set(lv).size !== lv.length) duplicateLevelTag += 1
    if (w.primary_level != null && !lv.includes(w.primary_level)) primaryNotInLevels += 1
    if (w.primary_level == null && lv.length === 0) noLevelAtAll += 1
  }

  // ── 逐档统计 ──
  const perLevel: LevelAudit[] = LEVELS.map((level) => {
    const examId = LEVEL_TO_EXAM_ID[level]
    const label = examIdToDisplayName(examId)
    const target = TARGET[level]
    const primaryCount = words.filter((w) => w.primary_level === level).length
    const levelSet = words.filter((w) => Array.isArray(w.levels) && w.levels.includes(level))
    const levelsIncludesCount = levelSet.length
    const levelIds = new Set(levelSet.map((w) => w.id))
    const cov = (table: string) => {
      let n = 0
      for (const id of levelIds) if (relSets[table].has(id)) n += 1
      return n
    }
    const wordsWithDefinitions = cov('dictionary_definitions')
    const defPct = levelsIncludesCount > 0 ? (wordsWithDefinitions / levelsIncludesCount) * 100 : 0
    return {
      level,
      examId,
      label,
      targetSize: target.size,
      currentPrimaryLevelCount: primaryCount,
      currentLevelsIncludesCount: levelsIncludesCount,
      wordsWithDefinitions,
      wordsWithExamples: cov('dictionary_examples'),
      wordsWithMnemonics: cov('word_mnemonics'),
      wordsWithInflections: levelSet.filter(hasInflections).length,
      wordsWithEtymology: cov('dictionary_etymology'),
      wordsWithCollocations: cov('dictionary_collocations'),
      wordsWithSynonyms: cov('dictionary_synonyms'),
      wordsWithAntonyms: cov('dictionary_antonyms'),
      recommendation: buildRecommendation(level, target, primaryCount, levelsIncludesCount, defPct),
    }
  })

  const integrity = { invalidLevelTag, duplicateLevelTag, primaryNotInLevels, noLevelAtAll }
  const generatedAt = new Date().toISOString()
  const result = {
    generatedAt,
    source: 'dictionary_words + dictionary_* relation tables (read-only, service role)',
    dbWrites: 'none',
    totalWords: words.length,
    integrity,
    levels: perLevel,
  }

  writeFileSync('reports/vocabulary-level-audit-2026-06-20.json', JSON.stringify(result, null, 2) + '\n', 'utf8')
  writeFileSync('reports/vocabulary-level-audit-2026-06-20.md', renderMarkdown(result), 'utf8')

  // ── 控制台摘要 ──
  console.log('\n词库等级覆盖 audit（只读，未写库）')
  for (const r of perLevel) {
    const t = r.targetSize == null ? 'curated' : `~${r.targetSize}`
    console.log(`  lv${r.level} ${r.label}: primary ${r.currentPrimaryLevelCount} · levels-incl ${r.currentLevelsIncludesCount} / 目标 ${t} · 释义 ${r.wordsWithDefinitions}`)
  }
  console.log(`  完整性: 非法等级标 ${invalidLevelTag} · 重复等级标 ${duplicateLevelTag} · primary∉levels ${primaryNotInLevels} · 完全无等级 ${noLevelAtAll}`)
  console.log(`\n报告已生成：reports/vocabulary-level-audit-2026-06-20.{json,md}（耗时 ${((Date.now() - t0) / 1000).toFixed(0)}s）`)
}

function pct(n: number, d: number): string {
  return d > 0 ? `${((n / d) * 100).toFixed(0)}%` : '—'
}

function renderMarkdown(r: {
  generatedAt: string
  totalWords: number
  integrity: { invalidLevelTag: number; duplicateLevelTag: number; primaryNotInLevels: number; noLevelAtAll: number }
  levels: LevelAudit[]
}): string {
  const lines: string[] = []
  lines.push('# Vocabulary Level Audit — 2026-06-20')
  lines.push('')
  lines.push(`> Generated: ${r.generatedAt}`)
  lines.push(`> Source: dictionary_words + dictionary_* relation tables (read-only, service role).`)
  lines.push('> **No DB writes were performed.**')
  lines.push('')
  lines.push(`Total words in \`dictionary_words\`: **${r.totalWords}**`)
  lines.push('')

  lines.push('## 1. Coverage summary')
  lines.push('')
  lines.push('`levels-incl` = words where the level ∈ `levels` (syllabus coverage; the training denominator). `primary` = words whose `primary_level` equals the level. 覆盖率分母 = `levels-incl`。')
  lines.push('')
  lines.push('| lv | exam | label | target | primary | levels-incl | def | ex | mnem | infl | ety | collo | syn | ant |')
  lines.push('|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|')
  for (const x of r.levels) {
    const d = x.currentLevelsIncludesCount
    const t = x.targetSize == null ? 'curated' : `~${x.targetSize}`
    lines.push(`| ${x.level} | ${x.examId} | ${x.label} | ${t} | ${x.currentPrimaryLevelCount} | ${d} | ${pct(x.wordsWithDefinitions, d)} | ${pct(x.wordsWithExamples, d)} | ${pct(x.wordsWithMnemonics, d)} | ${pct(x.wordsWithInflections, d)} | ${pct(x.wordsWithEtymology, d)} | ${pct(x.wordsWithCollocations, d)} | ${pct(x.wordsWithSynonyms, d)} | ${pct(x.wordsWithAntonyms, d)} |`)
  }
  lines.push('')

  lines.push('## 2. Per-level recommendations')
  lines.push('')
  for (const x of r.levels) {
    lines.push(`- **lv${x.level} ${x.label} (${x.examId})** — ${x.recommendation}`)
  }
  lines.push('')

  const cet6 = r.levels.find((x) => x.level === 4)!
  const kaoyan = r.levels.find((x) => x.level === 5)!
  lines.push('## 3. Key findings')
  lines.push('')
  lines.push(`- **CET-6 direct coverage gap:** \`levels includes 4\` = ${cet6.currentLevelsIncludesCount} vs target ~${cet6.targetSize}. ${cet6.targetSize != null && cet6.targetSize - cet6.currentLevelsIncludesCount > 200 ? `Gap ≈ ${cet6.targetSize - cet6.currentLevelsIncludesCount}; backfill \`levels\` to ~${cet6.targetSize}.` : 'Within range.'}`)
  lines.push(`- **Postgraduate (考研) logic:** \`primary_level=5\` = ${kaoyan.currentPrimaryLevelCount} (looks small) but \`levels includes 5\` = ${kaoyan.currentLevelsIncludesCount}. Training/recommendation must use \`levels includes 5\`, not \`primary_level=5\`.`)
  lines.push(`- **\`primary_level\` vs \`levels includes\` mismatch:** ${r.levels.filter((x) => x.currentLevelsIncludesCount - x.currentPrimaryLevelCount > 500).map((x) => `lv${x.level}(${x.currentPrimaryLevelCount}→${x.currentLevelsIncludesCount})`).join(', ') || '无显著差异'}.`)
  lines.push('')
  lines.push('### Data integrity')
  lines.push('')
  lines.push(`- Invalid level tags (outside 1-8): ${r.integrity.invalidLevelTag}`)
  lines.push(`- Duplicate level tags within a word: ${r.integrity.duplicateLevelTag}`)
  lines.push(`- \`primary_level\` not present in \`levels\`: ${r.integrity.primaryNotInLevels}`)
  lines.push(`- Words with no level at all (primary null & levels empty): ${r.integrity.noLevelAtAll}`)
  lines.push('')

  lines.push('## 4. Recommended import/backfill actions')
  lines.push('')
  lines.push('- Backfill `dictionary_words.levels` (add-only) from canonical syllabus lists for any level whose `levels-incl` is below target — priority CET-6.')
  lines.push('- Keep `primary_level` as the lowest level; fix words where `primary_level` is not contained in `levels`.')
  lines.push('- Backfill missing essential materials (definitions first, then examples/inflections/collocations) for already-tagged words before adding new words.')
  lines.push('- Store every target list under `data/vocabulary-targets/` with `source_name/source_url/license_note/exam_id/level/kind` (see that README).')
  lines.push('- (follow-up, later backfill phase) Export a `missing_by_field` sample — concrete `word_id`s missing examples / collocations / antonyms etc. — so backfill can target exact words instead of aggregate percentages.')
  lines.push('')

  lines.push('## 5. What must NOT be imported blindly')
  lines.push('')
  lines.push('- Do **not** treat TOEFL/SAT/IELTS as having a fixed official complete word list — use curated academic / high-utility coverage only.')
  lines.push('- Do **not** overwrite existing definitions, examples, mnemonics, synonyms, antonyms, etymology, or collocations — backfill is add-only.')
  lines.push('- Do **not** expand a level just to hit a number; respect syllabus boundaries (avoid over-wide `levels`).')
  lines.push('- Do **not** auto-generate synonyms/antonyms to fill coverage — missing is better than wrong relations.')
  lines.push('- Do **not** import any list without a real `license_note`.')
  lines.push('')
  return lines.join('\n')
}

main().catch((e) => {
  console.error('fatal', e?.message ?? e)
  process.exit(1)
})
