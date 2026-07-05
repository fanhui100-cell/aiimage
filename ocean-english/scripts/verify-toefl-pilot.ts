/* ════════════════════════════════════════════════════════════════════════
   verify-toefl-pilot.ts — TOEFL 2026 非音频试产专项 DB 校验（只读，确定性逐条比对）

   范围（official_spec_unverified 的 read_daily_life / academic_reading 已按 §3.4 停止删除）：
   客观包：complete_the_words、build_a_sentence；生产性包：email_writing、academic_discussion。

   核心：复刻 importer 的确定性 hashId，对每个 pilot 源记录算出 legacy_id，与 DB **逐条 1:1 比对** payload，
   而非仅比数量。检查项：
   1. source→DB 前向 1:1：每条 pilot 源记录恰对应一个 DB draft set（按确定性 legacy_id）。
   2. 每个 set 恰好 1 个 item（item 缺失会被抓出）。
   3. 客观 item 逐字段比对 expected=shapeToItems(raw)：input_mode / prompt / choices / answer。
      · complete_the_words 断言 input_mode==='spell'；build_a_sentence 断言 'multi_blank' + qa_flags.scoring_not_ready。
   4. 生产性 item：input_mode==='free_text' + rubric_id 非空 + answer.official===false + prompt===源 prompt。
   5. 已停题型 DB 数为 0；全局硬停：gen 意外 active=0（reading/listening 小批晋级除外）；antonym_choice/cet_cloze=0。
   R0 历史范围修订：本校验器只负责 4 个 pilot 包各自的 10 条原始记录。扩产集（相同 template/task_type 的
   +60/+50 套）由 verify-toefl-<stage>-expansion.ts 拥有；聚合计数（70/60/60、0 active）由 verify-toefl-current.ts
   断言。故此处不再断言「每包恰好 10 draft」或「DB 中该包无源外 set」，避免与已集成的扩产冲突。
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
// 2026-07-05 基线同步（owner 决策：接受 accepted-sequence 契约现状，不回滚，不 promote，不激活）：
// build_a_sentence 的 pilot 期望从「scoring_not_ready=true + legacy index answer」更新为
// 「qa_flags.scoringContract=accepted_sequence_exact + 契约对象 answer（canonical 锚定源记录）」，
// 且 status 收紧为必须 draft（旧基线允许 draft|active——这里是收紧而非放宽）。
// 契约来源：data/generated-question-sets/toefl-build-sentence-accepted-sequences-2026-07-05.json（已入库 35cd668）。
const BAS_CONTRACT_FILE = 'data/generated-question-sets/toefl-build-sentence-accepted-sequences-2026-07-05.json'
type ObjectiveSpec = { template: string; source: string; inputMode: string; contract: { file: string; mustStayDraft: true } | null }
const OBJECTIVE: ObjectiveSpec[] = [
  { template: 'toefl-complete-the-words', source: 'toefl-complete-the-words.json', inputMode: 'spell', contract: null },
  { template: 'toefl-build-a-sentence', source: 'toefl-build-a-sentence.json', inputMode: 'multi_blank', contract: { file: BAS_CONTRACT_FILE, mustStayDraft: true } },
]
type ContractEntry = { legacyId: string; canonicalIdx: number[]; acceptedIdx: number[][] }
const PRODUCTIVE = [
  { taskType: 'email_writing', source: 'toefl-email.productive.json' },
  { taskType: 'academic_discussion', source: 'toefl-discussion.productive.json' },
]
// 2026-07-04: TOEFL Reading 专项 promoted active (F2, owner-approved) — no longer "stopped". The pilot
// verifier tracks only the 4 original objective/productive pilot packages; reading is owned by
// verify-toefl-reading-expansion.ts + the coverage audit. Leave empty.
const STOPPED_TEMPLATES: string[] = []

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
    // 契约模板：加载已审定 accepted-sequence 契约（按 legacyId 键控），供 status/qa_flags/answer 断言
    const contractMap = o.contract
      ? new Map((JSON.parse(readFileSync(o.contract.file, 'utf8')) as { entries: ContractEntry[] }).entries.map((e) => [e.legacyId, e]))
      : null
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
      // status：契约模板（build_a_sentence）必须 draft（激活未获批，收紧）；其余 draft|active
      if (o.contract?.mustStayDraft) {
        if (dbSet.status !== 'draft') errors.push(`${o.template}: ${setLegacy} status=${dbSet.status}（契约未获批激活，须 draft）`)
      } else if (dbSet.status !== 'draft' && dbSet.status !== 'active') {
        errors.push(`${o.template}: ${setLegacy} status=${dbSet.status}（须 draft 或 active）`)
      }
      // qa_flags：契约模板要求 scoringContract=accepted_sequence_exact 且 scoring_not_ready 已清除
      if (o.contract) {
        const f = dbSet.qa_flags as { scoringContract?: string; scoring_not_ready?: boolean } | null
        if (f?.scoringContract !== 'accepted_sequence_exact') errors.push(`${o.template}: ${setLegacy} 缺 qa_flags.scoringContract=accepted_sequence_exact`)
        if (f?.scoring_not_ready === true) errors.push(`${o.template}: ${setLegacy} scoring_not_ready 仍为 true（契约模式下应已清除）`)
      }
      const items = await itemsOf(dbSet.id)
      if (items.length !== out.result.items.length) { errors.push(`${o.template}: ${setLegacy} item 数 ${items.length}≠${out.result.items.length}`); continue }
      const exp = out.result.items[0]
      const it = items[0]
      if (it.input_mode !== o.inputMode || it.input_mode !== exp.inputMode) errors.push(`${o.template}: ${setLegacy} input_mode=${it.input_mode}（须 ${o.inputMode}）`)
      if ((it.prompt ?? '') !== exp.prompt) errors.push(`${o.template}: ${setLegacy} prompt 不一致`)
      const dbCh = Array.isArray(it.choices) ? (it.choices as DraftChoice[]) : []
      if (normChoices(dbCh) !== normChoices(exp.choices)) errors.push(`${o.template}: ${setLegacy} choices 不一致`)
      if (o.contract) {
        // answer：契约对象，canonical 必须锚定源记录（exp.answer 的 index 排列映射 chunks 文本），
        // acceptedSequences 必须与已审定契约一致且包含 canonical。防契约/DB 被静默篡改。
        const ce = contractMap!.get(setLegacy)
        if (!ce) { errors.push(`${o.template}: ${setLegacy} 契约文件缺条目`) } else {
          const text = (i: number) => String(exp.choices[i]?.text ?? '')
          const wantCanonical = (exp.answer as number[]).map(text)
          if (JSON.stringify(ce.canonicalIdx.map(text)) !== JSON.stringify(wantCanonical)) errors.push(`${o.template}: ${setLegacy} 契约 canonicalIdx 与源 answer 不一致`)
          const a = it.answer as { scoring?: string; official?: boolean; canonical?: string[]; acceptedSequences?: string[][] } | null
          if (a?.scoring !== 'accepted_sequence_exact') errors.push(`${o.template}: ${setLegacy} answer.scoring≠accepted_sequence_exact`)
          if (a?.official !== false) errors.push(`${o.template}: ${setLegacy} answer.official≠false`)
          if (JSON.stringify(a?.canonical) !== JSON.stringify(wantCanonical)) errors.push(`${o.template}: ${setLegacy} answer.canonical 与源不一致`)
          const wantSeqs = ce.acceptedIdx.map((seq) => seq.map(text))
          const seqKey = (t: string[]) => t.join(' ').toLowerCase()
          if (!wantSeqs.some((s) => seqKey(s) === seqKey(wantCanonical))) wantSeqs.unshift(wantCanonical)
          const gotSeqs = a?.acceptedSequences ?? []
          if (JSON.stringify(gotSeqs) !== JSON.stringify(wantSeqs)) {
            const gk = gotSeqs.map(seqKey).sort().join('|'), wk = wantSeqs.map(seqKey).sort().join('|')
            if (gk !== wk) errors.push(`${o.template}: ${setLegacy} acceptedSequences 与契约不一致`)
          }
        }
      } else if (JSON.stringify(it.answer) !== JSON.stringify(exp.answer)) {
        errors.push(`${o.template}: ${setLegacy} answer 不一致`)
      }
      okCmp++
    }
    // R0 历史范围修订：pilot 校验器只负责这 10 条 pilot 记录的源↔DB 映射（上方前向 1:1 已断言每条为 draft 且 payload 一致）。
    // 扩产集（相同 template）由 verify-toefl-complete-words-expansion.ts 拥有；聚合数（70/60/60、0 active）由 verify-toefl-current.ts 断言。
    // 因此不再断言「总数==10」或「无源外 set」，以免与已集成的扩产冲突。
    console.log(`  ${o.template}: pilot 源↔DB 逐条一致 ${okCmp}/${af.sets.length} · pilot 期望 ${expectedLegacy.size}` + (o.contract ? ' · accepted_sequence_exact 契约（draft-only）' : ''))
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
      if (dbSet.status !== 'draft' && dbSet.status !== 'active') errors.push(`${p.taskType}: ${setLegacy} status=${dbSet.status}（须 draft 或 active）`)
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
    // R0 历史范围修订：同上——pilot 校验器只负责这 10 条 pilot 记录；扩产集（+50）与聚合计数由其它校验器拥有。
    console.log(`  ${p.taskType}(productive): pilot 源↔DB 逐条一致 ${okCmp}/${af.tasks.length} · pilot 期望 ${expectedLegacy.size}`)
  }

  // ── 已停题型断言 ──
  for (const tpl of STOPPED_TEMPLATES) {
    const n = sets.filter((s) => (s.qa_flags as { template?: string } | null)?.template === tpl).length
    console.log(`  [stopped] ${tpl}: ${n}（须 0）`)
    if (n !== 0) errors.push(`已停题型 ${tpl} 仍有 ${n} 个 set`)
  }

  // ── 全局硬停 ── 阻塞/退役题型必须 0 active。2026-07-04：read_daily_life + choose_a_response 移除
  // （reading F2 晋级 active、listening pilot 2026-07-02 起 active，均合法）。
  const BLOCKED_ACTIVE = new Set(['build_a_sentence', 'listen_and_repeat', 'interview_speaking', 'antonym_choice', 'cet_cloze'])
  const genActive = sets.filter((s) => s.status === 'active').length
  const blockedActive = sets.filter((s) => s.status === 'active' && BLOCKED_ACTIVE.has(s.task_type)).length
  const deprecated = sets.filter((s) => s.task_type === 'antonym_choice' || s.task_type === 'cet_cloze').length
  console.log(`全局：gen active=${genActive}（阻塞/退役 active=${blockedActive}） · gen antonym/cet_cloze=${deprecated}`)
  if (blockedActive !== 0) errors.push(`blocked/deprecated gen active=${blockedActive}（须 0）`)
  if (deprecated !== 0) errors.push(`gen antonym/cet_cloze=${deprecated}`)

  if (errors.length) { console.error('\n校验失败：'); for (const e of errors) console.error(`  ✗ ${e}`); process.exitCode = 1 }
  else console.log('\n✓ TOEFL pilot 强校验通过（源↔DB 确定性逐条 1:1 + payload 一致 + 每 set 恰 1 item + 已停题型为 0）')
}
main().catch((e) => { console.error('verify-toefl-pilot fatal', e?.message ?? e); process.exitCode = 1 })
