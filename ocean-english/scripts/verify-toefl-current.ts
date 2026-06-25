/* ════════════════════════════════════════════════════════════════════════
   verify-toefl-current.ts — central TOEFL validation orchestrator (R0, read-only)

   Single entry point for the integrated TOEFL state. Runs, in order:
     1. scripts/verify-toefl-pilot.ts                       (4 original pilot packages, pilot-scoped)
     2. scripts/verify-toefl-complete-words-expansion.ts --db   (Window A +60, owns CW aggregate)
     3. scripts/verify-toefl-writing-expansion.ts --db          (Window B +50/+50, owns writing aggregate)
   then a final aggregate DB count assertion:
     complete_the_words draft = 70, email_writing draft = 60, academic_discussion draft = 60,
     all three active = 0; post-R10 gen 意外 active = 0 (reading/listening 小批晋级除外) and
     antonym_choice/cet_cloze = 0.

   This orchestrator NEVER writes DB rows. Any child non-zero exit OR any failed count
   assertion makes this process exit non-zero.

   Usage: npx tsx scripts/verify-toefl-current.ts
   ════════════════════════════════════════════════════════════════════════ */
import { spawnSync } from 'node:child_process'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'

interface Step { name: string; args: string[] }
const STEPS: Step[] = [
  { name: 'pilot (4 original packages)', args: ['tsx', 'scripts/verify-toefl-pilot.ts'] },
  { name: 'complete-words expansion (--db)', args: ['tsx', 'scripts/verify-toefl-complete-words-expansion.ts', '--db'] },
  { name: 'writing expansion (--db)', args: ['tsx', 'scripts/verify-toefl-writing-expansion.ts', '--db'] },
]

let childFailed = false
for (const s of STEPS) {
  console.log(`\n=== [verify:toefl-current] ${s.name} ===`)
  const r = spawnSync('npx', s.args, { stdio: 'inherit', shell: true })
  // r.status is the exit code on normal exit; null means signal-kill or spawn error — both are FAILURES, never pass.
  const code = r.status == null ? 1 : r.status
  if (code !== 0) { console.error(`  ✗ child "${s.name}" failed (code ${code}${r.signal ? `, signal ${r.signal}` : ''}${r.error ? `, ${r.error.message}` : ''})`); childFailed = true }
}

type SetRow = { task_type: string; status: string; legacy_id: string | null }

async function assertAggregateCounts(): Promise<boolean> {
  const env = existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : ''
  const readEnv = (k: string): string => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
  const url = readEnv('NEXT_PUBLIC_SUPABASE_URL'), key = readEnv('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) { console.error('  ✗ missing Supabase credentials (.env.local)'); return false }
  const db: SupabaseClient = createClient(url, key)

  const sets: SetRow[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('question_sets').select('task_type, status, legacy_id').like('legacy_id', 'gen:%').range(from, from + 999)
    if (error) { console.error(`  ✗ DB select question_sets: ${error.message}`); return false }
    const rows = (data ?? []) as SetRow[]
    sets.push(...rows)
    if (rows.length < 1000) break
  }
  const draftOf = (t: string) => sets.filter((s) => s.task_type === t && s.status === 'draft').length
  const activeOf = (t: string) => sets.filter((s) => s.task_type === t && s.status === 'active').length

  let ok = true
  // Post-R10（用户授权"将剩余全部完成"）：complete_the_words/email_writing/academic_discussion 已晋 active
  // （draft→0）；build_a_sentence 仍阻塞（scoring_not_ready，draft 10/active 0）。以 draft+active 总量锁内容规模。
  const totalOf = (t: string) => draftOf(t) + activeOf(t)
  const checks: [string, number, number][] = [
    ['complete_the_words total(draft+active)', totalOf('complete_the_words'), 70],
    ['email_writing total(draft+active)', totalOf('email_writing'), 60],
    ['academic_discussion total(draft+active)', totalOf('academic_discussion'), 60],
    // build_a_sentence has NO expansion verifier; it stays at the 10 pilot drafts, still blocked (0 active).
    ['build_a_sentence draft', draftOf('build_a_sentence'), 10],
    ['complete_the_words active', activeOf('complete_the_words'), 70],
    ['email_writing active', activeOf('email_writing'), 60],
    ['academic_discussion active', activeOf('academic_discussion'), 60],
    ['build_a_sentence active', activeOf('build_a_sentence'), 0],
  ]
  for (const [label, got, want] of checks) {
    const pass = got === want
    console.log(`  ${pass ? '✓' : '✗'} ${label} = ${got} (expect ${want})`)
    if (!pass) ok = false
  }
  // Post-R10-full：大量题型已按授权晋级 active，白名单不再适用。改为「阻塞/退役题型必须 0 active」denylist
  // 守卫（每次 R10 不必改）。阻塞型 = TOEFL build_a_sentence（scoring_not_ready）/阅读·听力（spec 未验或缺内容）
  // /口语（音频缺）+ 退役 antonym_choice/cet_cloze。
  const BLOCKED_ACTIVE = new Set(['build_a_sentence', 'read_daily_life', 'choose_a_response', 'listen_and_repeat', 'interview_speaking', 'antonym_choice', 'cet_cloze'])
  const genActive = sets.filter((s) => s.status === 'active').length
  const blockedActive = sets.filter((s) => s.status === 'active' && BLOCKED_ACTIVE.has(s.task_type)).length
  const deprecated = sets.filter((s) => s.task_type === 'antonym_choice' || s.task_type === 'cet_cloze').length
  console.log(`  ${blockedActive === 0 ? '✓' : '✗'} 阻塞/退役题型 active = ${blockedActive} (expect 0；当前 gen active=${genActive})`)
  console.log(`  ${deprecated === 0 ? '✓' : '✗'} antonym_choice + cet_cloze = ${deprecated} (expect 0)`)
  if (blockedActive !== 0 || deprecated !== 0) ok = false
  return ok
}

async function main() {
  console.log('\n=== [verify:toefl-current] aggregate DB count assertion ===')
  let countsOk = false
  try { countsOk = await assertAggregateCounts() } catch (e) { console.error('  ✗ count assertion error:', (e as Error)?.message ?? e); countsOk = false }

  if (childFailed || !countsOk) {
    console.error('\n✗ verify:toefl-current FAILED')
    process.exitCode = 1
  } else {
    console.log('\n✓ verify:toefl-current PASSED — pilot + both expansions + CW/email/discussion 70/60/60 active (R10), build_a_sentence/阅读/听力/口语 0 active (阻塞), 0 deprecated')
  }
}
main().catch((e) => { console.error('verify-toefl-current fatal', (e as Error)?.message ?? e); process.exitCode = 1 })
