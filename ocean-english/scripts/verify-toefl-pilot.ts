/* ════════════════════════════════════════════════════════════════════════
   verify-toefl-pilot.ts — TOEFL 2026 非音频试产专项 DB 校验（只读，确定性逐条比对）

   范围（official_spec_unverified 的 read_daily_life / academic_reading 已按 §3.4 停止删除）：
   客观包：complete_the_words、build_a_sentence；生产性包：email_writing、academic_discussion。

   核心：复刻 importer 的确定性 hashId，对每个源记录算出 legacy_id，与 DB **逐条 1:1 比对** payload，
   而非仅比数量。检查项：
   1. source→DB 双向 1:1：每源记录恰对应一个 DB set（按确定性 legacy_id）；DB 中该包不得有源外的 set。
   2. 每个 set 恰好 1 个 item（item 缺失会被抓出）。
   3. 客观 item 逐字段比对 expected=shapeToItems(raw)：input_mode / prompt / choices / answer。
      · complete_the_words 断言 input_mode==='spell'；build_a_sentence 断言 'multi_blank' + qa_flags.scoring_not_ready。
   4. 生产性 item：input_mode==='free_text' + rubric_id 非空 + answer.official===false + prompt===源 prompt。
   5. 每包恰好 10 draft / 0 active；已停题型 DB 数为 0。
   6. 全局硬停：gen active=0；antonym_choice/cet_cloze=0。
   用法：npx tsx scripts/verify-toefl-pilot.ts
   ════════════════════════════════════════════════════════════════════════ */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { shapeToItems, type ShapeTemplate, type DraftChoice } from '@/lib/exam-task-templates/shape'

const env = existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : ''
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db: SupabaseClient = createClient(readEnv('NEXT_PUBLIC_SUPABASE_URL'), readEnv('SUPABASE_SERVICE_ROLE_KEY'))

const DIR = 'data/generated-question-sets/toefl-2026-pilot'
const TPLDIR = 'data/exam-task-templates'
const OBJECTIVE = [
  { template: 'toefl-complete-the-words', source: 'toefl-complete-the-words.json', inputMode: 'spell', scoringNotReady: false },
  { template: 'toefl-build-a-sentence', source: 'toefl-build-a-sentence.json', inputMode: 'multi_blank', scoringNotReady: true },
]
const PRODUCTIVE = [
  { taskType: 'email_writing', source: 'toefl-email.productive.json' },
  { taskType: 'academic_discussion', source: 'toefl-discussion.productive.json' },
]
const STOPPED_TEMPLATES = ['toefl-read-daily-life', 'toefl-academic-reading']

// 复刻 importer 的确定性 hashId（与 import-authored-*.ts 完全一致）
function hashId(s: string): string { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return (h >>> 0).toString(36) }
const normChoices = (cs: DraftChoice[]) => JSON.stringify(cs.map((c) => [String(c.id), String(c.text)]))

type SetRow = { id: string; legacy_id: string | null; task_type: string; status: string; qa_flags: Record<string, unknown> | null }
type ItemRow = { question_set_id: string; input_mode: string; prompt: string | null; prompt_zh: string | null; choices: unknown; answer: unknown; rubric_id: string | null }

const errors: string[] = []

async function main() {
  const sets: SetRow[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('question_sets').select('id, legacy_id, task_type, status, qa_flags').like('legacy_id', 'gen:%').range(from, from + 999)
    if (error) throw new Error(error.message)
    const rows = (data ?? []) as SetRow[]
    sets.push(...rows)
    if (rows.length < 1000) break
  }
  const byLegacy = new Map<string, SetRow>()
  for (const s of sets) if (s.legacy_id) byLegacy.set(s.legacy_id, s)
  console.log(`gen sets 总数: ${sets.length}`)

  async function itemsOf(setId: string): Promise<ItemRow[]> {
    const { data } = await db.from('question_items').select('question_set_id, input_mode, prompt, prompt_zh, choices, answer, rubric_id').eq('question_set_id', setId)
    return (data ?? []) as ItemRow[]
  }

  // ── 客观包：确定性逐条比对 ──
  for (const o of OBJECTIVE) {
    const tpl = JSON.parse(readFileSync(`${TPLDIR}/${o.template}.json`, 'utf8')) as { taskType: string; skill: string; itemCount: number; optionCount: number; answerSchema: Record<string, unknown>; stimulusRequirements?: Record<string, unknown> }
    const st: ShapeTemplate = { taskType: tpl.taskType, skill: tpl.skill, itemCount: tpl.itemCount, optionCount: tpl.optionCount, answerSchema: tpl.answerSchema, stimulusRequirements: tpl.stimulusRequirements }
    const af = JSON.parse(readFileSync(`${DIR}/${o.source}`, 'utf8')) as { template: string; level: number; sets: Record<string, unknown>[] }
    const expectedLegacy = new Set<string>()
    let okCmp = 0
    for (const raw of af.sets) {
      const out = shapeToItems(st, raw)
      if (!out.ok) { errors.push(`${o.template}: 源记录 shape 失败 ${out.reject}`); continue }
      const tag = hashId(`${af.template}|${af.level}|${JSON.stringify(raw)}`)
      const setLegacy = `gen:${o.template}:set:claude:${tag}`
      expectedLegacy.add(setLegacy)
      const dbSet = byLegacy.get(setLegacy)
      if (!dbSet) { errors.push(`${o.template}: 源记录无对应 DB set（legacy ${setLegacy}）`); continue }
      if (dbSet.status !== 'draft') errors.push(`${o.template}: ${setLegacy} status=${dbSet.status}（须 draft）`)
      if (o.scoringNotReady && (dbSet.qa_flags as { scoring_not_ready?: boolean } | null)?.scoring_not_ready !== true) errors.push(`${o.template}: ${setLegacy} 缺 scoring_not_ready`)
      const items = await itemsOf(dbSet.id)
      if (items.length !== out.result.items.length) { errors.push(`${o.template}: ${setLegacy} item 数 ${items.length}≠${out.result.items.length}`); continue }
      const exp = out.result.items[0]
      const it = items[0]
      if (it.input_mode !== o.inputMode || it.input_mode !== exp.inputMode) errors.push(`${o.template}: ${setLegacy} input_mode=${it.input_mode}（须 ${o.inputMode}）`)
      if ((it.prompt ?? '') !== exp.prompt) errors.push(`${o.template}: ${setLegacy} prompt 不一致`)
      const dbCh = Array.isArray(it.choices) ? (it.choices as DraftChoice[]) : []
      if (normChoices(dbCh) !== normChoices(exp.choices)) errors.push(`${o.template}: ${setLegacy} choices 不一致`)
      if (JSON.stringify(it.answer) !== JSON.stringify(exp.answer)) errors.push(`${o.template}: ${setLegacy} answer 不一致`)
      okCmp++
    }
    // 双向：DB 中该 template 的 set 必须恰为源映射集合
    const dbSetsOfTpl = sets.filter((s) => (s.qa_flags as { template?: string } | null)?.template === o.template)
    const draft = dbSetsOfTpl.filter((s) => s.status === 'draft').length
    const active = dbSetsOfTpl.filter((s) => s.status === 'active').length
    for (const s of dbSetsOfTpl) if (s.legacy_id && !expectedLegacy.has(s.legacy_id)) errors.push(`${o.template}: DB 有源外 set ${s.legacy_id}`)
    if (draft !== 10) errors.push(`${o.template}: draft=${draft}（须 10）`)
    if (active !== 0) errors.push(`${o.template}: active=${active}（须 0）`)
    console.log(`  ${o.template}: 源↔DB 逐条一致 ${okCmp}/${af.sets.length} · draft=${draft} active=${active}` + (o.scoringNotReady ? ' · scoring_not_ready' : ''))
  }

  // ── 生产性包：确定性逐条比对 ──
  for (const p of PRODUCTIVE) {
    const af = JSON.parse(readFileSync(`${DIR}/${p.source}`, 'utf8')) as { examId: string; level: number; skill: string; taskType: string; tasks: { prompt?: string; promptZh?: string; referencePoints?: string[]; wordLimit?: string; sourceTextZh?: string; sourceTextEn?: string }[] }
    // 预期 rubric ID：按 (examId, skill) 解析（与 importer rubricIdFor 同口径）。每 item rubric_id 须等于它。
    const { data: rub } = await db.from('rubrics').select('id').eq('exam_id', af.examId).eq('skill', af.skill).limit(1)
    const expectedRubricId = rub && rub.length ? (rub[0] as { id: string }).id : null
    if (!expectedRubricId) errors.push(`${p.taskType}: 找不到预期 rubric (${af.examId}, ${af.skill})`)
    const expectedLegacy = new Set<string>()
    let okCmp = 0
    for (const task of af.tasks) {
      if (!task.prompt || !task.prompt.trim()) { errors.push(`${p.taskType}: 源 task prompt 为空`); continue }
      const hasSource = !!(task.sourceTextZh || task.sourceTextEn)
      const tag = hasSource
        ? hashId(`${af.examId}|${af.taskType}|${af.level}|${task.prompt}|${task.sourceTextZh ?? ''}|${task.sourceTextEn ?? ''}`)
        : hashId(`${af.examId}|${af.taskType}|${af.level}|${task.prompt}`)
      const setLegacy = `gen:productive:${p.taskType}:set:claude:${tag}`
      expectedLegacy.add(setLegacy)
      const dbSet = byLegacy.get(setLegacy)
      if (!dbSet) { errors.push(`${p.taskType}: 源 task 无对应 DB set（legacy ${setLegacy}）`); continue }
      if (dbSet.status !== 'draft') errors.push(`${p.taskType}: ${setLegacy} status=${dbSet.status}（须 draft）`)
      // set 级 payload：qa_flags.wordLimit 须与源一致
      const dbWordLimit = (dbSet.qa_flags as { wordLimit?: string | null } | null)?.wordLimit ?? null
      if (dbWordLimit !== (task.wordLimit ?? null)) errors.push(`${p.taskType}: ${setLegacy} qa_flags.wordLimit 与源不一致`)
      const items = await itemsOf(dbSet.id)
      if (items.length !== 1) { errors.push(`${p.taskType}: ${setLegacy} item 数 ${items.length}（须 1）`); continue }
      const it = items[0]
      if (it.input_mode !== 'free_text') errors.push(`${p.taskType}: ${setLegacy} input_mode=${it.input_mode}（须 free_text）`)
      if (!it.rubric_id) errors.push(`${p.taskType}: ${setLegacy} rubric_id 为空`)
      else if (expectedRubricId && it.rubric_id !== expectedRubricId) errors.push(`${p.taskType}: ${setLegacy} rubric_id≠预期 (${af.examId},${af.skill})`)
      const ans = (it.answer ?? {}) as { official?: boolean; referencePoints?: unknown }
      if (ans.official !== false) errors.push(`${p.taskType}: ${setLegacy} answer.official≠false`)
      if (JSON.stringify(ans.referencePoints ?? []) !== JSON.stringify(task.referencePoints ?? [])) errors.push(`${p.taskType}: ${setLegacy} referencePoints 与源不一致`)
      if ((it.prompt ?? '') !== task.prompt) errors.push(`${p.taskType}: ${setLegacy} prompt 与源不一致`)
      if ((it.prompt_zh ?? null) !== (task.promptZh ?? null)) errors.push(`${p.taskType}: ${setLegacy} prompt_zh 与源不一致`)
      okCmp++
    }
    const dbSetsOfTt = sets.filter((s) => s.task_type === p.taskType && (s.legacy_id ?? '').startsWith('gen:productive:'))
    const draft = dbSetsOfTt.filter((s) => s.status === 'draft').length
    const active = dbSetsOfTt.filter((s) => s.status === 'active').length
    for (const s of dbSetsOfTt) if (s.legacy_id && !expectedLegacy.has(s.legacy_id)) errors.push(`${p.taskType}: DB 有源外 set ${s.legacy_id}`)
    if (draft !== 10) errors.push(`${p.taskType}: draft=${draft}（须 10）`)
    if (active !== 0) errors.push(`${p.taskType}: active=${active}（须 0）`)
    console.log(`  ${p.taskType}(productive): 源↔DB 逐条一致 ${okCmp}/${af.tasks.length} · draft=${draft} active=${active}`)
  }

  // ── 已停题型断言 ──
  for (const tpl of STOPPED_TEMPLATES) {
    const n = sets.filter((s) => (s.qa_flags as { template?: string } | null)?.template === tpl).length
    console.log(`  [stopped] ${tpl}: ${n}（须 0）`)
    if (n !== 0) errors.push(`已停题型 ${tpl} 仍有 ${n} 个 set`)
  }

  // ── 全局硬停 ──
  const genActive = sets.filter((s) => s.status === 'active').length
  const deprecated = sets.filter((s) => s.task_type === 'antonym_choice' || s.task_type === 'cet_cloze').length
  console.log(`全局：gen active=${genActive} · gen antonym/cet_cloze=${deprecated}`)
  if (genActive !== 0) errors.push(`gen active=${genActive}`)
  if (deprecated !== 0) errors.push(`gen antonym/cet_cloze=${deprecated}`)

  if (errors.length) { console.error('\n校验失败：'); for (const e of errors) console.error(`  ✗ ${e}`); process.exitCode = 1 }
  else console.log('\n✓ TOEFL pilot 强校验通过（源↔DB 确定性逐条 1:1 + payload 一致 + 每 set 恰 1 item + 已停题型为 0）')
}
main().catch((e) => { console.error('verify-toefl-pilot fatal', e?.message ?? e); process.exitCode = 1 })
