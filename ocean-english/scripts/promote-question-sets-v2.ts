/* ════════════════════════════════════════════════════════════════════════
   promote-question-sets-v2.ts — draft → active 小批晋级（G8，需单独审批）

   安全契约：
   - 默认 dry-run：只列候选 + 跑 active 不变量，绝不改状态。
   - 仅 --apply 才把 set + 其 items 置 active。
   - active 不变量（任一不满足即拒绝该 set，绝不晋级）：
       · 退役题型（antonym_choice / cet_cloze）硬拒。
       · 分组题型（reading/listening/banked_cloze/seven_select/cloze_passage/grammar_fill/para_match）
         必须有 stimulus。
       · 听力（task_type=listening_comprehension 或 item.input_mode=listen）必须有 active audio。
       · 生产性题型（free_text/speak item）必须有 rubric_id。
       · choice item answer 必须命中某 choice id；multi_blank/matching answer 必须为非空数组。
   - 过滤：--exam --level --task --limit。每次只小批。

   用法：
     npx tsx scripts/promote-question-sets-v2.ts --level=3 --task=banked_cloze --limit=20
     npx tsx scripts/promote-question-sets-v2.ts --level=3 --task=banked_cloze --limit=20 --apply
   ════════════════════════════════════════════════════════════════════════ */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'
import { isDeprecatedQuestionType } from '@/lib/question-bank/question-type-taxonomy'
import { EXAM_SPECS } from '@/lib/exam-specs'

const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(readEnv('NEXT_PUBLIC_SUPABASE_URL'), readEnv('SUPABASE_SERVICE_ROLE_KEY'))
const OUT = 'reports/promote-qsets-v2-report.json'

const argValue = (n: string) => { const h = process.argv.find((a) => a.startsWith(`${n}=`)); return h ? h.slice(n.length + 1) : null }
const APPLY = process.argv.includes('--apply')
const EXAM = argValue('--exam')
const LEVEL = argValue('--level')
const TASK = argValue('--task')
const LIMIT = Number(argValue('--limit') || '20')
const GEN = process.argv.includes('--gen')   // 仅晋级 Claude 原创（legacy_id gen:%），排除 qb:%（DeepSeek 期）混居 draft

const GROUPED = new Set(['reading_comprehension', 'listening_comprehension', 'banked_cloze', 'seven_select', 'cloze_passage', 'grammar_fill', 'para_match'])
const examToLevel = new Map<string, number>(EXAM_SPECS.map((s) => [s.id, s.level]))

interface SetRow { id: string; legacy_id: string | null; task_type: string; level: number | null; status: string; stimulus_id: string | null; qa_flags: Record<string, unknown> | null }
interface ItemRow { id: string; input_mode: string; choices: unknown; answer: unknown; rubric_id: string | null; status: string }

async function main() {
  let level = LEVEL ? Number(LEVEL) : (EXAM ? examToLevel.get(EXAM) ?? null : null)

  let q = db.from('question_sets').select('id, legacy_id, task_type, level, status, stimulus_id, qa_flags').eq('status', 'draft')
  if (TASK) q = q.eq('task_type', TASK)
  if (level != null) q = q.eq('level', level)
  if (GEN) q = q.like('legacy_id', 'gen:%')
  const { data: setsData, error } = await q.limit(LIMIT)
  if (error) throw new Error(error.message)
  const sets = (setsData ?? []) as SetRow[]

  // 预取 active audio stimulus
  const { data: audio } = await db.from('audio_assets').select('stimulus_id, qa_status')
  const activeAudioStim = new Set((audio ?? []).filter((a) => (a as { qa_status: string }).qa_status === 'active' && (a as { stimulus_id: string | null }).stimulus_id).map((a) => (a as { stimulus_id: string }).stimulus_id))

  const eligible: SetRow[] = []
  const rejected: { id: string; legacy_id: string | null; reason: string }[] = []

  for (const s of sets) {
    const { data: itemsData } = await db.from('question_items').select('id, input_mode, choices, answer, rubric_id, status').eq('question_set_id', s.id)
    const items = (itemsData ?? []) as ItemRow[]
    let reason: string | null = null

    const flags = (s.qa_flags ?? {}) as { scoring_not_ready?: boolean; official_spec_unverified?: boolean }
    if (isDeprecatedQuestionType(s.task_type)) reason = 'deprecated_type'
    else if (flags.scoring_not_ready === true) reason = 'scoring_not_ready'
    else if (flags.official_spec_unverified === true) reason = 'official_spec_unverified'
    else if (!items.length) reason = 'no_items'
    else if (GROUPED.has(s.task_type) && !s.stimulus_id) reason = 'grouped_without_stimulus'
    else {
      const isListening = s.task_type === 'listening_comprehension' || items.some((i) => i.input_mode === 'listen')
      if (isListening && (!s.stimulus_id || !activeAudioStim.has(s.stimulus_id))) reason = 'listening_without_active_audio'
      for (const it of items) {
        if (reason) break
        if (it.input_mode === 'free_text' || it.input_mode === 'speak') {
          if (!it.rubric_id) reason = 'productive_without_rubric'
        } else if (it.input_mode === 'choice') {
          const ch = Array.isArray(it.choices) ? (it.choices as { id: string }[]) : []
          if (typeof it.answer !== 'string' || !ch.some((c) => String(c.id) === it.answer)) reason = 'choice_answer_not_in_choices'
        } else if (it.input_mode === 'multi_blank' || it.input_mode === 'matching') {
          if (!Array.isArray(it.answer) || it.answer.length === 0) reason = 'multiblank_answer_empty'
        }
      }
    }

    if (reason) rejected.push({ id: s.id, legacy_id: s.legacy_id, reason })
    else eligible.push(s)
  }

  let promoted = 0
  let rpcResults: { set_id: string; result: string; reason: string }[] = []
  if (APPLY) {
    // R9: atomic server-side promotion via the PostgreSQL RPC `promote_question_sets_v2`
    // (supabase/sql/p5-question-bank-promotion-rpc.sql), replacing the old best-effort client rollback.
    // The RPC re-validates EVERY set authoritatively (draft / deprecated / scoring_not_ready /
    // official_spec_unverified / items-draft / answer / productive-rubric / listening-active-audio /
    // stimulus-FK) and flips set + items to active in ONE transaction; any unexpected DB error rolls
    // back ALL changes (no partial active state possible). We pass ONLY explicit set UUIDs.
    const ids = eligible.map((s) => s.id)
    if (ids.length) {
      const { data, error: rpcErr } = await db.rpc('promote_question_sets_v2', { p_set_ids: ids })
      if (rpcErr) throw new Error(`promotion RPC failed (is supabase/sql/p5-question-bank-promotion-rpc.sql applied?): ${rpcErr.message}`)
      rpcResults = (data ?? []) as { set_id: string; result: string; reason: string }[]
      const byId = new Map(eligible.map((s) => [s.id, s.legacy_id]))
      for (const r of rpcResults) {
        if (r.result === 'promoted' || r.result === 'already_active') promoted++
        else rejected.push({ id: r.set_id, legacy_id: byId.get(r.set_id) ?? null, reason: `rpc_${r.result}:${r.reason}` })
      }
    }
  }

  const reasonCounts: Record<string, number> = {}
  for (const r of rejected) reasonCounts[r.reason] = (reasonCounts[r.reason] ?? 0) + 1
  writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), apply: APPLY, filters: { exam: EXAM, level, task: TASK, limit: LIMIT }, candidates: sets.length, eligible: eligible.length, promoted, rejected: rejected.slice(0, 50), reasonCounts, rpcResults: rpcResults.slice(0, 50) }, null, 2) + '\n', 'utf8')
  console.log(`promote ${APPLY ? 'APPLY' : 'DRY-RUN'} [exam=${EXAM ?? '-'} level=${level ?? '-'} task=${TASK ?? '-'} limit=${LIMIT}]`)
  console.log(`  candidates ${sets.length} · eligible ${eligible.length} · rejected ${rejected.length}` + (APPLY ? ` · promoted ${promoted}` : ''))
  if (Object.keys(reasonCounts).length) console.log(`  reject reasons: ${JSON.stringify(reasonCounts)}`)
  for (const s of eligible.slice(0, 5)) console.log(`  eligible: ${s.legacy_id} lv${s.level} ${s.task_type}`)
  console.log(`  报告：${OUT}`)
}
main().catch((e) => { console.error('promote fatal', e?.message ?? e); process.exit(1) })
