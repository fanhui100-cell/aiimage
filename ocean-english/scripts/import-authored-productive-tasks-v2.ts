/* ════════════════════════════════════════════════════════════════════════
   import-authored-productive-tasks-v2.ts — Claude-authored 生产性任务 → v2 draft

   写作/翻译/口语等生产性任务：只写 prompt（+可选 sourceText / referencePoints），
   绝不写「唯一官方答案」。每个 item 链接对应 rubric（按 examId+skill 解析），
   评分为估分（free_text/speak → needs_manual_or_ai_scoring）。

   安全契约：
   - 默认 dry-run；仅 --apply 写 **draft**（绝不 active）。
   - taskType 必须 ∈ PRODUCTIVE_TASK_TYPES。
   - 依赖门：对应 (examId, skill) 必须已有 rubric（G1D seed），否则记 rubric_missing 跳过。
   - answer 存「非官方参考」占位（满足 NOT NULL），评分引擎对 free_text/speak 一律待评分。
   - 幂等：legacy_id 由内容哈希派生。不调用 DeepSeek。不改前端。

   输入：data/generated-question-sets/<stage>/<file>.productive.json
     { examId, level, skill, taskType, tasks:[ { prompt, promptZh?, sourceTextEn?, sourceTextZh?,
       referencePoints?[], wordLimit? } ] }

   用法：
     npx tsx scripts/import-authored-productive-tasks-v2.ts --stage=g5            # dry-run
     npx tsx scripts/import-authored-productive-tasks-v2.ts --stage=g5 --apply    # 写 draft
   ════════════════════════════════════════════════════════════════════════ */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, existsSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { PRODUCTIVE_TASK_TYPES, getExamSpec } from '@/lib/exam-specs'
import { countWords } from '@/lib/exam-task-templates/shape'

const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const SUPABASE_URL = readEnv('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_ROLE = readEnv('SUPABASE_SERVICE_ROLE_KEY')

const AUTHORED_ROOT = 'data/generated-question-sets'
const PRODUCTIVE = new Set<string>(PRODUCTIVE_TASK_TYPES)
const SPEAK_TASKS = new Set(['listen_and_repeat', 'interview_speaking'])

const argValue = (n: string) => { const h = process.argv.find((a) => a.startsWith(`${n}=`)); return h ? h.slice(n.length + 1) : null }
const APPLY = process.argv.includes('--apply')
const STAGE = argValue('--stage')

function hashId(s: string): string { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return (h >>> 0).toString(36) }
const zhCharCount = (s: string): number => (s.match(/[一-鿿]/g) || []).length

interface Task { prompt: string; promptZh?: string; sourceTextEn?: string | null; sourceTextZh?: string | null; referencePoints?: string[]; wordLimit?: string }
interface ProductiveFile { examId: string; level?: number; skill: string; taskType: string; tasks: Task[] }

async function tableExists(db: SupabaseClient, t: string): Promise<boolean> { const { error } = await db.from(t).select('*').limit(1); return !error }
async function rubricIdFor(db: SupabaseClient, examId: string, skill: string): Promise<string | null> {
  const { data } = await db.from('rubrics').select('id').eq('exam_id', examId).eq('skill', skill).limit(1)
  return data && data.length ? (data[0] as { id: string }).id : null
}
async function setExists(db: SupabaseClient, legacyId: string): Promise<boolean> {
  const { data } = await db.from('question_sets').select('id').eq('legacy_id', legacyId).limit(1)
  return !!(data && data.length)
}

function collectFiles(): string[] {
  if (!STAGE) { console.error('productive-import: 需 --stage=<dir>'); process.exit(1) }
  const dir = join(AUTHORED_ROOT, STAGE)
  if (!existsSync(dir)) { console.error(`productive-import: 目录不存在 ${dir}`); process.exit(1) }
  return readdirSync(dir).filter((f) => f.endsWith('.productive.json')).map((f) => join(dir, f))
}

async function main() {
  const files = collectFiles()
  let totalTasks = 0, wrote = 0, dup = 0, skipped = 0
  const report: Record<string, unknown>[] = []

  let db: SupabaseClient | null = null
  if (APPLY) {
    if (!SUPABASE_URL || !SERVICE_ROLE) { console.error('productive-import: --apply 需 Supabase 凭据'); process.exit(1) }
    db = createClient(SUPABASE_URL, SERVICE_ROLE)
    for (const tbl of ['stimuli', 'question_sets', 'question_items', 'rubrics']) {
      if (!(await tableExists(db, tbl))) { console.error(`productive-import: --apply 拒绝 — v2 表 ${tbl} 未应用`); process.exit(1) }
    }
  }

  for (const path of files) {
    const pf = JSON.parse(readFileSync(path, 'utf8')) as ProductiveFile
    if (!PRODUCTIVE.has(pf.taskType)) { console.error(`✗ ${path}: taskType ${pf.taskType} 非生产性任务`); continue }
    if (!getExamSpec(pf.examId)) { console.error(`✗ ${path}: 未知 examId ${pf.examId}`); continue }
    const level = pf.level ?? getExamSpec(pf.examId)?.level ?? 3
    const inputMode = SPEAK_TASKS.has(pf.taskType) ? 'speak' : 'free_text'
    const subjectiveSkill = pf.skill === 'writing' || pf.skill === 'translation' || pf.skill === 'speaking'

    let rubricId: string | null = null
    if (APPLY && db) {
      if (subjectiveSkill) {
        rubricId = await rubricIdFor(db, pf.examId, pf.skill)
        if (!rubricId) { console.error(`✗ ${path}: 缺 rubric (${pf.examId}:${pf.skill}) → 跳过（rubric_missing）`); skipped += pf.tasks.length; continue }
      }
    }

    let fileWrote = 0, fileDup = 0
    let idx = 0
    for (const task of pf.tasks) {
      idx++; totalTasks++
      if (!task.prompt || !task.prompt.trim()) { console.error(`  ✗ ${pf.taskType}#${idx} prompt 为空`); skipped++; continue }
      // 向后兼容的幂等 tag：
      //   有 sourceText（翻译/续写）→ 新 hash（纳入源文，区分 prompt 通用但内容不同的题）
      //   无 sourceText（写作）→ 旧 prompt-only hash（与历史导入一致，重跑不新增重复）
      const hasSource = !!(task.sourceTextZh || task.sourceTextEn)
      const oldTag = hashId(`${pf.examId}|${pf.taskType}|${level}|${task.prompt}`)
      const newTag = hashId(`${pf.examId}|${pf.taskType}|${level}|${task.prompt}|${task.sourceTextZh ?? ''}|${task.sourceTextEn ?? ''}`)
      const tag = hasSource ? newTag : oldTag
      const legacyId = `gen:productive:${pf.taskType}:set:claude:${tag}`
      if (!APPLY || !db) { fileWrote++; continue }
      // dup 检查同时覆盖旧/新两种 legacy_id：无论库内是历史 prompt-only 还是新 sourceText hash，重跑都不重复
      const oldLegacy = `gen:productive:${pf.taskType}:set:claude:${oldTag}`
      const newLegacy = `gen:productive:${pf.taskType}:set:claude:${newTag}`
      if ((await setExists(db, oldLegacy)) || (await setExists(db, newLegacy))) { fileDup++; dup++; continue }

      // 可选材料 → stimulus（翻译源文 / 续写材料）
      let stimulusId: string | null = null
      const srcEn = task.sourceTextEn ?? null
      const srcZh = task.sourceTextZh ?? null
      if (srcEn || srcZh) {
        const { data, error } = await db.from('stimuli').insert({
          legacy_id: `gen:productive:${pf.taskType}:stim:claude:${tag}`, kind: 'passage', text_en: srcEn, text_zh: srcZh, level,
          word_count: srcEn ? countWords(srcEn) : null,
          source_type: 'original_authored', source_note: `Claude-authored ${STAGE} ${pf.taskType} source`, qa_status: 'draft',
        }).select('id').single()
        if (error) { console.error(`  stimulus insert: ${error.message}`); skipped++; continue }
        stimulusId = (data as { id: string }).id
      }

      const sourceCharCount = srcZh ? zhCharCount(srcZh) : null
      const qaFlags = { generated: true, authored: 'claude', provider: 'claude-authored', stage: STAGE, productive: true, skill: pf.skill, wordLimit: task.wordLimit ?? null, sourceCharCount }
      const { data: setData, error: setErr } = await db.from('question_sets').insert({
        legacy_id: legacyId, exam_id: pf.examId, stimulus_id: stimulusId, level, task_type: pf.taskType,
        topic_tags: [pf.skill, pf.taskType], status: 'draft', qa_flags: qaFlags,
      }).select('id').single()
      if (setErr) { console.error(`  set insert: ${setErr.message}`); skipped++; continue }
      const setId = (setData as { id: string }).id

      // answer：非官方参考占位（满足 NOT NULL；评分引擎对 free_text/speak 一律待评分）
      const answerPlaceholder = { type: 'rubric_scored', official: false, note: 'Reference points only; score is an estimate, never official.', referencePoints: task.referencePoints ?? [] }
      const { error: itemErr } = await db.from('question_items').insert({
        legacy_id: `gen:productive:${pf.taskType}:item:claude:${tag}:0`, question_set_id: setId, order_index: 0,
        input_mode: inputMode, prompt: task.prompt, prompt_zh: task.promptZh ?? null, choices: [], answer: answerPlaceholder,
        rubric_id: rubricId, subskills: [pf.skill], status: 'draft',
      })
      if (itemErr) { console.error(`  item insert: ${itemErr.message}`); skipped++; continue }
      fileWrote++; wrote++
    }
    console.log(`${APPLY ? '[APPLY]' : '[DRY-RUN]'} ${pf.examId}/${pf.taskType} lv${level} (${inputMode}): tasks ${pf.tasks.length}` + (APPLY ? ` · wrote ${fileWrote} · dup ${fileDup}` : ''))
    report.push({ file: path, examId: pf.examId, taskType: pf.taskType, level, skill: pf.skill, tasks: pf.tasks.length, wrote: fileWrote, dup: fileDup })
  }

  const report_path = `reports/authored-productive-${STAGE ?? 'adhoc'}-${APPLY ? 'apply' : 'dryrun'}-report.json`
  writeFileSync(report_path, JSON.stringify({ generatedAt: new Date().toISOString(), apply: APPLY, stage: STAGE, provider: 'claude-authored', totals: { tasks: totalTasks, wrote, dup, skipped }, files: report }, null, 2) + '\n', 'utf8')
  console.log(`productive-import ${APPLY ? 'APPLY' : 'DRY-RUN'}: tasks ${totalTasks}` + (APPLY ? ` · wrote ${wrote} · dup ${dup} · skipped ${skipped}` : '') + ` · 报告 ${report_path}`)
  process.exitCode = 0
}

main().catch((e) => { console.error('productive-import fatal', e?.message ?? e); process.exitCode = 1 })
