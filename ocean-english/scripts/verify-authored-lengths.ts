/* ════════════════════════════════════════════════════════════════════════
   verify-authored-lengths.ts — 只读校验 Claude-authored 源 JSON 的篇幅与结构

   补充 qa:qsets-v2（查 DB）的不足：在 --replace 重导**之前**，直接校验
   data/generated-question-sets/<pack>/*.json 源文件，确保
   - stimulus 词数落在该 pack 的目标区间（与对应模板 minWords/maxWords 一致）
   - reading：每题恰好 4 选项、answer 为 A-D/a-d
   - para_match：statements 数 = answers 数、answers 互不重复且落在 [0,paras)
   只读，绝不写库、绝不改文件。退出码：有问题 1，否则 0。

   用法：npx tsx scripts/verify-authored-lengths.ts
   ════════════════════════════════════════════════════════════════════════ */
import { readFileSync, readdirSync, existsSync } from 'node:fs'

const ROOT = 'data/generated-question-sets'
const countWords = (t: string): number => (t.match(/[A-Za-z][A-Za-z'’-]*/g) || []).length

// pack → [minWords, maxWords]（与各自模板 stimulusRequirements 一致）
const RANGE: Record<string, [number, number]> = {
  packA: [450, 650], // kaoyan-reading-b (para_match)
  packB: [200, 280], // gaokao-cloze-passage
  packC: [120, 400], // reading-comprehension-mcq (zhongkao)
  packD: [200, 280], // gaokao-reading-mcq (gaokao lv2)
  packE: [280, 360], // cet6-reading-mcq
  packF: [320, 430], // kaoyan-reading-mcq
  packG: [90, 140],  // zhongkao-grammar-fill
  'sat-sec': [25, 150],   // sat-standard-english-conventions
  'sat-info': [25, 150],  // sat-information-and-ideas
  'sat-craft': [25, 150], // sat-craft-and-structure
  'sat-expr': [25, 150],  // sat-expression-of-ideas
  'gaokao-7': [250, 340], // gaokao-seven-select
}

interface Q { options?: unknown[]; answer?: unknown }
interface RawSet { passage?: string; questions?: Q[]; statements?: unknown[]; answers?: unknown[]; paras?: number }

const problems: string[] = []
let checkedSets = 0

for (const [pack, [lo, hi]] of Object.entries(RANGE)) {
  const dir = `${ROOT}/${pack}`
  if (!existsSync(dir)) continue
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    let parsed: { sets?: RawSet[] }
    try { parsed = JSON.parse(readFileSync(`${dir}/${file}`, 'utf8')) } catch (e) { problems.push(`${pack}/${file}: JSON parse error ${(e as Error).message}`); continue }
    for (const [i, s] of (parsed.sets ?? []).entries()) {
      checkedSets++
      const where = `${pack}/${file}#${i}`
      const w = countWords(String(s.passage ?? ''))
      if (w < lo || w > hi) problems.push(`${where}: length ${w} outside [${lo},${hi}]`)
      // reading MCQ
      if (Array.isArray(s.questions)) {
        for (const [qi, q] of s.questions.entries()) {
          if (!Array.isArray(q.options) || q.options.length !== 4) problems.push(`${where} q${qi}: options != 4`)
          if (!/^[A-Da-d]$/.test(String(q.answer))) problems.push(`${where} q${qi}: bad answer "${String(q.answer)}"`)
        }
      }
      // para_match
      if (Array.isArray(s.statements) && Array.isArray(s.answers)) {
        const ans = s.answers.map((x) => Number(x))
        const paras = Number(s.paras)
        if (s.statements.length !== s.answers.length) problems.push(`${where}: statements(${s.statements.length}) != answers(${s.answers.length})`)
        if (!Number.isInteger(paras) || paras < s.statements.length) problems.push(`${where}: paras invalid (${s.paras})`)
        if (new Set(ans).size !== ans.length) problems.push(`${where}: answers not distinct`)
        if (ans.some((a) => !Number.isInteger(a) || a < 0 || a >= paras)) problems.push(`${where}: answer out of [0,${paras})`)
      }
    }
  }
}

console.log(`verify-authored-lengths: checked ${checkedSets} sets across ${Object.keys(RANGE).length} packs`)
if (problems.length) {
  console.error(`PROBLEMS: ${problems.length}`)
  for (const p of problems.slice(0, 50)) console.error('  ✗ ' + p)
  process.exitCode = 1
} else {
  console.log('ALL CLEAN ✓ — every authored stimulus within template length range, all answers/structure valid')
  process.exitCode = 0
}
