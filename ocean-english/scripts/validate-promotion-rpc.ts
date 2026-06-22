/* ════════════════════════════════════════════════════════════════════════
   validate-promotion-rpc.ts — R9 validator for the transactional promotion RPC.

   Modes:
     --expect-not-applied : pre-apply gate. PASS if promote_question_sets_v2 is not yet present.
     (default)            : post-apply. Inserts ISOLATED synthetic DRAFT candidates (legacy prefix
                            __rpc_selftest__) covering EVERY rejection invariant, calls the RPC on
                            all of them, and asserts each is rejected with the expected reason AND
                            that every synthetic set + item remains 'draft' (ZERO state change).
                            It NEVER promotes real content; all synthetic rows are deleted in a
                            finally block (even on failure). No real promotion occurs.

   Covered rejections: scoring_not_ready · grouped_without_stimulus · item_answer_null (JSON "")
     · choice_answer_not_in_choices · multiblank_answer_empty · productive_without_rubric.
   Exit 1 on any mismatch. Usage:
     npx tsx scripts/validate-promotion-rpc.ts --expect-not-applied   # before applying SQL
     npx tsx scripts/validate-promotion-rpc.ts                        # after applying SQL
   ════════════════════════════════════════════════════════════════════════ */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'

const EXPECT_NOT_APPLIED = process.argv.includes('--expect-not-applied')
const env = existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : ''
const rd = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db: SupabaseClient = createClient(rd('NEXT_PUBLIC_SUPABASE_URL'), rd('SUPABASE_SERVICE_ROLE_KEY'))
const PREFIX = '__rpc_selftest__'

function isNotFound(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false
  return err.code === 'PGRST202' || /could not find the function|function .*does not exist|schema cache/i.test(err.message ?? '')
}

interface Case { name: string; expect: string; taskType: string; inputMode: string; answer: unknown; choices?: unknown[]; stimulus?: boolean; rubric?: boolean; qa?: Record<string, unknown> }
const CASES: Case[] = [
  { name: 'scoring_not_ready', expect: 'scoring_not_ready', taskType: 'build_a_sentence', inputMode: 'multi_blank', answer: [1], qa: { scoring_not_ready: true } },
  { name: 'grouped_without_stimulus', expect: 'grouped_without_stimulus', taskType: 'banked_cloze', inputMode: 'multi_blank', answer: [1, 2] },
  { name: 'item_answer_null', expect: 'item_answer_null', taskType: 'complete_the_words', inputMode: 'spell', answer: '' },
  { name: 'choice_answer_not_in_choices', expect: 'choice_answer_not_in_choices', taskType: 'synonym_choice', inputMode: 'choice', answer: 'z', choices: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }] },
  { name: 'multiblank_answer_empty', expect: 'multiblank_answer_empty', taskType: 'build_a_sentence', inputMode: 'multi_blank', answer: [] },
  { name: 'productive_without_rubric', expect: 'productive_without_rubric', taskType: 'essay_writing', inputMode: 'free_text', answer: 'an essay response' },
]

async function cleanup() {
  const { data } = await db.from('question_sets').select('id').like('legacy_id', `${PREFIX}%`)
  for (const s of (data ?? []) as { id: string }[]) await db.from('question_sets').delete().eq('id', s.id) // CASCADE removes items
}

async function main() {
  const probe = await db.rpc('promote_question_sets_v2', { p_set_ids: [] })
  const applied = !isNotFound(probe.error as { code?: string; message?: string } | null)

  if (EXPECT_NOT_APPLIED) {
    if (!applied) console.log('✓ promote_question_sets_v2 NOT applied yet (expected). Apply supabase/sql/p5-question-bank-promotion-rpc.sql, then re-run without --expect-not-applied.')
    else console.log('ℹ promote_question_sets_v2 is ALREADY applied — re-apply the UPDATED SQL, then run the default validation.')
    return
  }
  if (!applied || probe.error) { console.error(`✗ promote_question_sets_v2 not applied / errored: ${probe.error?.message}`); process.exitCode = 1; return }

  await cleanup() // remove any leftovers from a prior aborted run
  const errs: string[] = []
  try {
    // insert one synthetic draft set+item per rejection case
    const ids: { id: string; expect: string; name: string }[] = []
    for (const c of CASES) {
      const { data: set, error: e1 } = await db.from('question_sets').insert({ legacy_id: `${PREFIX}${c.name}`, task_type: c.taskType, level: 3, status: 'draft', stimulus_id: null, qa_flags: c.qa ?? {} }).select('id').single()
      if (e1 || !set) { errs.push(`insert set ${c.name}: ${e1?.message}`); continue }
      const sid = (set as { id: string }).id
      const { error: e2 } = await db.from('question_items').insert({ legacy_id: `${PREFIX}${c.name}:0`, question_set_id: sid, order_index: 0, input_mode: c.inputMode, prompt: '__selftest__', choices: c.choices ?? [], answer: c.answer, status: 'draft', rubric_id: null })
      if (e2) { errs.push(`insert item ${c.name}: ${e2.message}`); continue }
      ids.push({ id: sid, expect: c.expect, name: c.name })
    }
    if (errs.length) { for (const e of errs) console.error(`  ✗ ${e}`); process.exitCode = 1; return }

    // one RPC call over ALL synthetic candidates
    const { data: res, error: rErr } = await db.rpc('promote_question_sets_v2', { p_set_ids: ids.map((x) => x.id) })
    if (rErr) { console.error(`✗ RPC call failed: ${rErr.message}`); process.exitCode = 1; return }
    const byId = new Map(((res ?? []) as { set_id: string; result: string; reason: string }[]).map((r) => [r.set_id, r]))

    for (const x of ids) {
      const row = byId.get(x.id)
      if (!row) { errs.push(`${x.name}: RPC returned no row`); continue }
      if (row.result !== 'rejected') errs.push(`${x.name}: result=${row.result} (expected rejected)`)
      else if (row.reason !== x.expect) errs.push(`${x.name}: reason=${row.reason} (expected ${x.expect})`)
      // zero state change
      const { data: after } = await db.from('question_sets').select('status').eq('id', x.id).single()
      const { data: its } = await db.from('question_items').select('status').eq('question_set_id', x.id)
      if ((after as { status: string } | null)?.status !== 'draft') errs.push(`${x.name}: set no longer draft (STATE CHANGED)`)
      if (!((its ?? []) as { status: string }[]).every((i) => i.status === 'draft')) errs.push(`${x.name}: items no longer draft (STATE CHANGED)`)
      if (!errs.some((e) => e.startsWith(x.name))) console.log(`  ✓ ${x.name} → rejected(${row.reason}), zero state change`)
    }
  } finally {
    await cleanup()
  }

  if (errs.length) { console.error(`\n✗ validate-promotion-rpc FAILED:`); for (const e of errs) console.error(`  ✗ ${e}`); process.exitCode = 1; return }
  console.log(`\n✓ validate-promotion-rpc PASSED — all ${CASES.length} rejection invariants enforced (synthetic candidates rejected with correct reason + zero state change); no real promotion; synthetic rows cleaned up.`)
}
main().catch(async (e) => { try { await cleanup() } catch { /* ignore */ } console.error('validate-promotion-rpc fatal', (e as Error)?.message ?? e); process.exitCode = 1 })
