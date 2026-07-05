/* ════════════════════════════════════════════════════════════════════════
   verify-productive-tasks.ts — 生产性任务源 + DB 双层校验（只读）

   源校验（递归遍历 data/generated-question-sets 下所有 .productive.json）：
   - 通用：prompt 非空；wordLimit 字段存在；referencePoints 为非空数组
   - cet4 translation_zh_en：sourceTextZh 中文 100-150 字
   - cet6 translation_zh_en：sourceTextZh 中文 140-205 字（CET-6 段落翻译官方标准长度约 180 汉字，
     把 180 当硬上限会误判标准长度题为超长，故放宽至 205 留合理容差；下限 140 高于 CET-4 的梯度）
   - kaoyan translation_en_zh：sourceTextEn 英文 120-180 词
   - gaokao continuation_writing：sourceTextEn 250-350 词 + prompt 含两个段落首句标记
   DB 校验（gen:productive items）：
   - rubric_id 非空、answer.official===false、input_mode==='free_text'

   用法：npx tsx scripts/verify-productive-tasks.ts [--skip-db] [--skip-g5]
   退出码：有问题 1，否则 0。
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = 'data/generated-question-sets'
const SKIP_DB = process.argv.includes('--skip-db')
const SKIP_G5 = process.argv.includes('--skip-g5')

const zhChars = (s: string): number => (s.match(/[一-鿿]/g) || []).length
const enWords = (s: string): number => (s.match(/[A-Za-z][A-Za-z'’-]*/g) || []).length

// 各格源文长度规则
const SRC_RULES: Record<string, { src: 'zh' | 'en'; min: number; max: number; starters?: boolean }> = {
  'cet4|translation_zh_en': { src: 'zh', min: 100, max: 150 },
  'cet6|translation_zh_en': { src: 'zh', min: 140, max: 205 },
  'kaoyan|translation_en_zh': { src: 'en', min: 120, max: 180 },
  'gaokao|continuation_writing': { src: 'en', min: 250, max: 350, starters: true },
}

function walk(dir: string): string[] {
  const out: string[] = []
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else if (f.endsWith('.productive.json')) out.push(p)
  }
  return out
}

const problems: string[] = []
let checked = 0

function verifySources() {
  for (const file of walk(ROOT)) {
    if (SKIP_G5 && /[\\/]g5[\\/]/.test(file)) continue
    let j: any
    try { j = JSON.parse(readFileSync(file, 'utf8')) } catch (e) { problems.push(`${file}: JSON parse ${(e as Error).message}`); continue }
    const key = `${j.examId}|${j.taskType}`
    const rule = SRC_RULES[key]
    for (const [i, t] of (j.tasks ?? []).entries()) {
      checked++
      const where = `${file}#${i}`
      if (!t.prompt || !String(t.prompt).trim()) problems.push(`${where}: prompt 为空`)
      if (!('wordLimit' in t)) problems.push(`${where}: 缺 wordLimit 字段`)
      if (!Array.isArray(t.referencePoints) || t.referencePoints.length === 0) problems.push(`${where}: referencePoints 应为非空数组`)
      if (rule) {
        const src = rule.src === 'zh' ? String(t.sourceTextZh ?? '') : String(t.sourceTextEn ?? '')
        const n = rule.src === 'zh' ? zhChars(src) : enWords(src)
        if (n < rule.min || n > rule.max) problems.push(`${where}: ${key} 源文${rule.src === 'zh' ? '汉字' : '词'}数 ${n} 不在 [${rule.min},${rule.max}]`)
        if (rule.starters) {
          const p = String(t.prompt)
          if (!/Paragraph 1/i.test(p) || !/Paragraph 2/i.test(p)) problems.push(`${where}: continuation 缺两个段落首句标记 (Paragraph 1 / Paragraph 2)`)
        }
      }
    }
  }
}

async function verifyDb() {
  const env = existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : ''
  const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
  const db = createClient(readEnv('NEXT_PUBLIC_SUPABASE_URL'), readEnv('SUPABASE_SERVICE_ROLE_KEY'))
  const setIds: string[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('question_sets').select('id, legacy_id').like('legacy_id', 'gen:productive:%').order('id', { ascending: true }).range(from, from + 999)
    if (error) throw new Error(error.message)
    const rows = (data ?? []) as { id: string; legacy_id: string }[]
    setIds.push(...rows.map((r) => r.id))
    if (rows.length < 1000) break
  }
  let dbChecked = 0
  for (let i = 0; i < setIds.length; i += 100) {
    const { data } = await db.from('question_items').select('legacy_id, input_mode, rubric_id, answer').in('question_set_id', setIds.slice(i, i + 100))
    for (const it of (data ?? []) as any[]) {
      dbChecked++
      if (!it.rubric_id) problems.push(`DB item ${it.legacy_id}: 缺 rubric_id`)
      if (it.input_mode !== 'free_text') problems.push(`DB item ${it.legacy_id}: input_mode=${it.input_mode} 应为 free_text`)
      const off = it.answer && typeof it.answer === 'object' ? (it.answer as any).official : undefined
      if (off !== false) problems.push(`DB item ${it.legacy_id}: answer.official=${JSON.stringify(off)} 应为 false`)
    }
  }
  console.log(`DB productive items 校验：${dbChecked}`)
  // source→DB 一致性：每个有效源 task 恰好对应一个 DB productive set（数量必须相等，无无解释差值）
  console.log(`source→DB 一致性：源 task ${checked} · DB productive sets ${setIds.length}`)
  if (setIds.length !== checked) problems.push(`source→DB 不一致：源 ${checked} ≠ DB ${setIds.length}（存在无解释差值）`)
}

async function main() {
  verifySources()
  console.log(`源 task 校验：${checked}`)
  if (!SKIP_DB) await verifyDb()
  if (problems.length) {
    console.error(`\nPROBLEMS: ${problems.length}`)
    for (const p of problems.slice(0, 80)) console.error('  ✗ ' + p)
    if (problems.length > 80) console.error(`  …（其余 ${problems.length - 80} 条省略）`)
    process.exitCode = 1
  } else {
    console.log('ALL CLEAN ✓ — 生产性任务源与 DB 全部达标')
    process.exitCode = 0
  }
}
main().catch((e) => { console.error('fatal', e?.message ?? e); process.exitCode = 1 })
