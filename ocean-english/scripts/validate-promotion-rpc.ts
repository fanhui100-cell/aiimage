/* ════════════════════════════════════════════════════════════════════════
   validate-promotion-rpc.ts — R9 validator for the transactional promotion RPC (read-only effect).

   Modes:
     --expect-not-applied : pre-apply gate. PASS if the RPC is not yet present in the DB
                            (i.e. supabase/sql/p5-question-bank-promotion-rpc.sql has not been applied).
     (default)            : post-apply. Confirms the RPC exists, then calls it on a DELIBERATELY
                            INVALID candidate (a scoring_not_ready draft, e.g. build_a_sentence) and
                            asserts result='rejected'(scoring_not_ready) AND that the set + its items
                            remain 'draft' — i.e. ZERO state change. It NEVER promotes a valid set
                            (no real promotion occurs).

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

function isNotFound(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false
  return err.code === 'PGRST202' || /could not find the function|function .*does not exist|schema cache/i.test(err.message ?? '')
}

async function main() {
  // probe with an empty array — exists → returns [] with no error; absent → not-found error
  const probe = await db.rpc('promote_question_sets_v2', { p_set_ids: [] })
  const applied = !isNotFound(probe.error as { code?: string; message?: string } | null)

  if (EXPECT_NOT_APPLIED) {
    if (!applied) { console.log('✓ promote_question_sets_v2 NOT applied yet (expected). Apply supabase/sql/p5-question-bank-promotion-rpc.sql, then re-run without --expect-not-applied.'); return }
    console.log('ℹ promote_question_sets_v2 is ALREADY applied — skip the apply step and run the default validation.')
    return
  }

  if (!applied) { console.error(`✗ promote_question_sets_v2 is NOT applied. Apply supabase/sql/p5-question-bank-promotion-rpc.sql first. (probe error: ${probe.error?.message})`); process.exitCode = 1; return }
  if (probe.error) { console.error(`✗ unexpected RPC error on empty probe: ${probe.error.message}`); process.exitCode = 1; return }

  // pick a deliberately invalid candidate: a scoring_not_ready draft set (build_a_sentence)
  const { data: cand, error: cErr } = await db.from('question_sets')
    .select('id, task_type, status, qa_flags').eq('status', 'draft').eq('task_type', 'build_a_sentence').limit(1)
  if (cErr) { console.error(`✗ candidate query failed: ${cErr.message}`); process.exitCode = 1; return }
  if (!cand || !cand.length) { console.error('✗ no scoring_not_ready draft candidate (build_a_sentence) found to test rejection'); process.exitCode = 1; return }
  const sid = (cand[0] as { id: string }).id

  // snapshot before
  const beforeSet = (cand[0] as { status: string }).status
  const { data: itBefore } = await db.from('question_items').select('id, status').eq('question_set_id', sid)
  const itemsDraftBefore = (itBefore ?? []).every((i) => (i as { status: string }).status === 'draft')

  // call RPC on the invalid candidate
  const { data: res, error: rErr } = await db.rpc('promote_question_sets_v2', { p_set_ids: [sid] })
  if (rErr) { console.error(`✗ RPC call failed: ${rErr.message}`); process.exitCode = 1; return }
  const row = ((res ?? []) as { set_id: string; result: string; reason: string }[]).find((r) => r.set_id === sid)

  // verify after: zero state change
  const { data: afterSet } = await db.from('question_sets').select('status').eq('id', sid).single()
  const { data: itAfter } = await db.from('question_items').select('status').eq('question_set_id', sid)
  const setStillDraft = (afterSet as { status: string } | null)?.status === 'draft'
  const itemsStillDraft = (itAfter ?? []).every((i) => (i as { status: string }).status === 'draft')

  const errs: string[] = []
  if (!row) errs.push('RPC returned no row for the candidate')
  else if (row.result !== 'rejected') errs.push(`expected result=rejected, got ${row.result}`)
  else if (row.reason !== 'scoring_not_ready') errs.push(`expected reason=scoring_not_ready, got ${row.reason}`)
  if (beforeSet !== 'draft') errs.push('precondition: candidate set was not draft')
  if (!itemsDraftBefore) errs.push('precondition: candidate items were not all draft')
  if (!setStillDraft) errs.push('STATE CHANGED: set is no longer draft after rejection')
  if (!itemsStillDraft) errs.push('STATE CHANGED: items no longer draft after rejection')

  if (errs.length) { console.error('✗ validate-promotion-rpc FAILED:'); for (const e of errs) console.error(`  ✗ ${e}`); process.exitCode = 1; return }
  console.log(`✓ validate-promotion-rpc PASSED — invalid candidate ${sid} rejected (${row?.reason}) with ZERO state change (set+items remain draft); no real promotion.`)
}
main().catch((e) => { console.error('validate-promotion-rpc fatal', (e as Error)?.message ?? e); process.exitCode = 1 })
