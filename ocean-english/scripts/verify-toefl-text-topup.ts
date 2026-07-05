/* ════════════════════════════════════════════════════════════════════════
   verify-toefl-text-topup.ts — F2B TOEFL 文本题型补齐校验（只读，确定性逐条比对）

   Stage: toefl-text-topup-2026-07-03
   Scope: complete_the_words (+30, 客观 importer) · email_writing (+40) · academic_discussion (+40)
   （后两者走 productive importer）。全部只写 draft，不 promote。

   --source（离线）:
     - complete_the_words 30 套过 shapeToItems(complete_words)→ok；targetWord 在 passage 恰现 1 次；
       maskedForm 长度=targetWord 且含缺字母、已显字母一致；词数 15-55；批内 targetWord 互异；
     - email/discussion 各 40 条：prompt 非空、referencePoints 恰 5、wordLimit 存在、批内 prompt 互异；
     - discussion 每条含教授提问 + 两名学生（两处 "\n\n" 分隔）。

   --db（需凭据，phase-aware）:
     - 三型 source→DB 前向 1:1（各自 importer 的确定性 legacy_id）、stage 命中；
     - phase 由 --expect 指定（默认 active = 2026-07-04 owner 批准 promote 后的现契约）：
       · --expect=active：本 stage 30/40/40 全部 active；全库各型 active=100、draft=0；
       · --expect=draft（历史/promote 前重跑）：本 stage 全 draft；全库各型 active=70/60/60、draft=30/40/40；
     - 全库 draft+active 恒 = 100/100/100；
     - email/discussion 每 item：input_mode=free_text、rubric_id 非空、answer.official===false，
       item 状态与 set 一致；本 stage 反向无孤行；无退役题型。

   用法：npx tsx scripts/verify-toefl-text-topup.ts --source | --db [--expect=active|draft]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { shapeToItems, countWords, type ShapeTemplate } from '@/lib/exam-task-templates/shape'

const STAGE = 'toefl-text-topup-2026-07-03'
const DIR = `data/generated-question-sets/${STAGE}`
const TPLDIR = 'data/exam-task-templates'

const MODE_SOURCE = process.argv.includes('--source')
const MODE_DB = process.argv.includes('--db')
// phase：默认 active（2026-07-04 owner 批准 promote 后的现契约）；--expect=draft 供历史重现。
const EXPECT: 'active' | 'draft' = (process.argv.find((a) => a.startsWith('--expect='))?.slice(9) === 'draft') ? 'draft' : 'active'
const errors: string[] = []
const err = (m: string) => errors.push(m)
function hashId(s: string): string { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return (h >>> 0).toString(36) }

interface CwFile { template: string; level: number; sets: Record<string, unknown>[] }
interface ProdFile { examId: string; level: number; skill: string; taskType: string; tasks: { prompt: string; promptZh?: string; referencePoints?: string[]; wordLimit?: string }[] }

function cwSourceLegacyIds(): string[] {
  const tpl = JSON.parse(readFileSync(`${TPLDIR}/toefl-complete-the-words.json`, 'utf8')) as { taskType: string; skill: string; itemCount: number; optionCount: number; answerSchema: Record<string, unknown>; stimulusRequirements?: Record<string, unknown> }
  const st: ShapeTemplate = { taskType: tpl.taskType, skill: tpl.skill, itemCount: tpl.itemCount, optionCount: tpl.optionCount, answerSchema: tpl.answerSchema, stimulusRequirements: tpl.stimulusRequirements }
  const af = JSON.parse(readFileSync(`${DIR}/toefl-complete-the-words-30.json`, 'utf8')) as CwFile
  if (af.sets.length !== 30) err(`complete_the_words: 源套数 ${af.sets.length} ≠ 30`)
  const seen = new Set<string>()
  const ids: string[] = []
  let idx = 0
  for (const raw of af.sets) {
    idx++
    const out = shapeToItems(st, raw)
    if (!out.ok) { err(`complete_the_words#${idx}: shape 失败 ${out.reject}`); continue }
    const w = String((raw as { targetWord?: string }).targetWord ?? '')
    if (seen.has(w.toLowerCase())) err(`complete_the_words#${idx}: targetWord '${w}' 批内重复`)
    seen.add(w.toLowerCase())
    const wc = countWords(String((raw as { passage?: string }).passage ?? ''))
    if (wc < 15 || wc > 55) err(`complete_the_words#${idx}: 词数 ${wc} 出界`)
    ids.push(`gen:toefl-complete-the-words:set:claude:${hashId(`${af.template}|${af.level ?? 6}|${JSON.stringify(raw)}`)}`)
  }
  return ids
}

function prodSourceLegacyIds(file: string, taskType: string, expectCount: number): string[] {
  const pf = JSON.parse(readFileSync(`${DIR}/${file}`, 'utf8')) as ProdFile
  if (pf.taskType !== taskType) err(`${file}: taskType ${pf.taskType} ≠ ${taskType}`)
  if (pf.tasks.length !== expectCount) err(`${taskType}: 源条数 ${pf.tasks.length} ≠ ${expectCount}`)
  const seen = new Set<string>()
  const ids: string[] = []
  let idx = 0
  for (const t of pf.tasks) {
    idx++
    if (!t.prompt || !t.prompt.trim()) err(`${taskType}#${idx}: prompt 空`)
    if (!Array.isArray(t.referencePoints) || t.referencePoints.length !== 5) err(`${taskType}#${idx}: referencePoints ${t.referencePoints?.length}（须5）`)
    if (!t.wordLimit) err(`${taskType}#${idx}: 缺 wordLimit`)
    if (taskType === 'academic_discussion' && (t.prompt.match(/\n\n/g) || []).length < 2) err(`${taskType}#${idx}: 缺教授+两学生结构（<2 个空行分隔）`)
    const key = t.prompt.slice(0, 80).toLowerCase()
    if (seen.has(key)) err(`${taskType}#${idx}: 批内重复 prompt`)
    seen.add(key)
    ids.push(`gen:productive:${taskType}:set:claude:${hashId(`${pf.examId}|${taskType}|${pf.level ?? 6}|${t.prompt}`)}`)
  }
  return ids
}

async function pageSets(db: SupabaseClient) {
  const rows: { id: string; legacy_id: string | null; task_type: string; status: string; qa_flags: Record<string, unknown> | null }[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('question_sets').select('id, legacy_id, task_type, status, qa_flags').eq('level', 6).in('task_type', ['complete_the_words', 'email_writing', 'academic_discussion']).range(from, from + 999)
    if (error) throw new Error(error.message)
    const page = (data ?? []) as typeof rows
    rows.push(...page); if (page.length < 1000) break
  }
  return rows
}

function verifySource() {
  const cw = cwSourceLegacyIds()
  const em = prodSourceLegacyIds('toefl-email-writing-40.productive.json', 'email_writing', 40)
  const di = prodSourceLegacyIds('toefl-discussion-40.productive.json', 'academic_discussion', 40)
  console.log(`  [source] complete_the_words ${cw.length}/30 · email_writing ${em.length}/40 · academic_discussion ${di.length}/40`)
}

async function verifyDb() {
  const env = existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : ''
  const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
  const url = readEnv('NEXT_PUBLIC_SUPABASE_URL'); const key = readEnv('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) { err('--db 需 Supabase 凭据'); return }
  const db = createClient(url, key)
  const all = await pageSets(db)
  const byLegacy = new Map(all.filter((s) => s.legacy_id).map((s) => [s.legacy_id as string, s]))
  const stageSets = all.filter((s) => (s.qa_flags as { stage?: string } | null)?.stage === STAGE)
  const expected = new Set<string>()

  // stageCount：本 stage 新增数；preActive：promote 前已 active 的存量（pilot+早期扩产）。
  const packs = [
    { taskType: 'complete_the_words', ids: cwSourceLegacyIds(), stageCount: 30, preActive: 70, totalAll: 100, productive: false },
    { taskType: 'email_writing', ids: prodSourceLegacyIds('toefl-email-writing-40.productive.json', 'email_writing', 40), stageCount: 40, preActive: 60, totalAll: 100, productive: true },
    { taskType: 'academic_discussion', ids: prodSourceLegacyIds('toefl-discussion-40.productive.json', 'academic_discussion', 40), stageCount: 40, preActive: 60, totalAll: 100, productive: true },
  ]
  for (const p of packs) {
    let okFwd = 0
    for (const legacy of p.ids) {
      expected.add(legacy)
      const s = byLegacy.get(legacy)
      if (!s) { err(`${p.taskType}: 源无对应 DB set（${legacy}）`); continue }
      // phase-aware：本 stage 110 条全部在 2026-07-04 promote 清单内 → expect=active 时须 active。
      if (s.status !== EXPECT) err(`${p.taskType}: ${legacy} status=${s.status}（须 ${EXPECT}）`)
      if ((s.qa_flags as { stage?: string } | null)?.stage !== STAGE) err(`${p.taskType}: ${legacy} stage≠${STAGE}`)
      if (p.productive) {
        const { data: items } = await db.from('question_items').select('input_mode, rubric_id, answer, status').eq('question_set_id', s.id)
        const its = (items ?? []) as { input_mode: string; rubric_id: string | null; answer: unknown; status: string }[]
        if (its.length !== 1) err(`${p.taskType}: ${legacy} item 数 ${its.length}（须1）`)
        for (const it of its) {
          if (it.input_mode !== 'free_text') err(`${p.taskType}: ${legacy} input_mode=${it.input_mode}`)
          if (it.status !== s.status) err(`${p.taskType}: ${legacy} item status=${it.status}（须与 set 一致 ${s.status}）`)
          if (!it.rubric_id) err(`${p.taskType}: ${legacy} rubric_id 空`)
          if ((it.answer as { official?: boolean } | null)?.official !== false) err(`${p.taskType}: ${legacy} answer.official≠false`)
        }
      }
      okFwd++
    }
    const draftN = all.filter((s) => s.task_type === p.taskType && s.status === 'draft').length
    const activeN = all.filter((s) => s.task_type === p.taskType && s.status === 'active').length
    if (draftN + activeN !== p.totalAll) err(`${p.taskType}: 全库 draft+active ${draftN + activeN} ≠ ${p.totalAll}`)
    const wantDraft = EXPECT === 'active' ? 0 : p.stageCount
    const wantActive = EXPECT === 'active' ? p.totalAll : p.preActive
    if (draftN !== wantDraft) err(`${p.taskType}: 全库 draft ${draftN} ≠ ${wantDraft}（expect=${EXPECT}）`)
    if (activeN !== wantActive) err(`${p.taskType}: 全库 active ${activeN} ≠ ${wantActive}（expect=${EXPECT}）`)
    const activeStage = stageSets.filter((s) => s.task_type === p.taskType && s.status === 'active').length
    const wantStageActive = EXPECT === 'active' ? p.stageCount : 0
    if (activeStage !== wantStageActive) err(`${p.taskType}: 本 stage active=${activeStage}（expect=${EXPECT} 须 ${wantStageActive}）`)
    console.log(`  [db] ${p.taskType}: 前向 ${okFwd}/${p.ids.length} · 全库 active ${activeN}/${wantActive} · draft ${draftN}/${wantDraft}（expect=${EXPECT}）`)
  }
  // 反向：本 stage set 必属源集合
  let orphan = 0
  for (const s of stageSets) if (!s.legacy_id || !expected.has(s.legacy_id)) { orphan++; err(`DB-outside-source：${s.legacy_id ?? s.id}`) }
  if (stageSets.length !== expected.size) err(`stage DB set ${stageSets.length} ≠ 源期望 ${expected.size}`)
  console.log(`  [db] stage sets ${stageSets.length} · 期望 ${expected.size} · orphan ${orphan}`)
}

async function main() {
  if (!MODE_SOURCE && !MODE_DB) { console.error('用法：--source 或 --db'); process.exitCode = 1; return }
  if (MODE_SOURCE) { console.log('verify-toefl-text-topup --source'); verifySource() }
  if (MODE_DB) { console.log('verify-toefl-text-topup --db'); await verifyDb() }
  if (errors.length) { console.error(`\n✗ 校验失败（${errors.length}）：`); for (const e of errors) console.error(`  ✗ ${e}`); process.exitCode = 1 }
  else console.log('\n✓ verify-toefl-text-topup 通过')
}
main().catch((e) => { console.error('verify-toefl-text-topup fatal', e?.message ?? e); process.exitCode = 1 })
