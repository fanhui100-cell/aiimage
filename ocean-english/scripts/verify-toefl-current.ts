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
  // （draft→0）。2026-07-05 基线更新：build_a_sentence 已带 accepted_sequence_exact 契约（owner 决策接受，
  // scoring_not_ready 已清），但激活未获批 → 仍锁 draft-only / active=0。以 draft+active 总量锁内容规模。
  const totalOf = (t: string) => draftOf(t) + activeOf(t)
  // Post-F2B + promote (owner-approved 2026-07-04): each text task is now 100 (pilot 10 + earlier
  // expansion + F2B top-up), all active. build_a_sentence: contract-ready but activation NOT approved.
  const checks: [string, number, number][] = [
    ['complete_the_words total(draft+active)', totalOf('complete_the_words'), 100],
    ['email_writing total(draft+active)', totalOf('email_writing'), 100],
    ['academic_discussion total(draft+active)', totalOf('academic_discussion'), 100],
    // build_a_sentence: 10 pilot + 20 C3 (e7e17cf "+20 contract-ready draft rows", import per 51c5e26 dryrun report).
    // All stay draft — contract-ready, activation NOT approved. Scale lock updated 10→30 on 2026-07-05.
    ['build_a_sentence draft', draftOf('build_a_sentence'), 30],
    ['complete_the_words active', activeOf('complete_the_words'), 100],
    ['email_writing active', activeOf('email_writing'), 100],
    ['academic_discussion active', activeOf('academic_discussion'), 100],
    ['build_a_sentence active', activeOf('build_a_sentence'), 0],
  ]
  for (const [label, got, want] of checks) {
    const pass = got === want
    console.log(`  ${pass ? '✓' : '✗'} ${label} = ${got} (expect ${want})`)
    if (!pass) ok = false
  }
  // 阻塞/退役题型必须 0 active。2026-07-04：read_daily_life + choose_a_response 移除
  // （reading 专项 F2 晋级 active、listening pilot 2026-07-02 起 active，均合法）。仍不得 active =
  // build_a_sentence（accepted_sequence_exact 契约就绪但激活未获批，2026-07-05 owner 决策）
  // + 口语两型（speaking_pipeline_not_ready，F5 defer）+ 退役 antonym_choice/cet_cloze。
  const BLOCKED_ACTIVE = new Set(['build_a_sentence', 'listen_and_repeat', 'interview_speaking', 'antonym_choice', 'cet_cloze'])
  const genActive = sets.filter((s) => s.status === 'active').length
  const blockedActive = sets.filter((s) => s.status === 'active' && BLOCKED_ACTIVE.has(s.task_type)).length
  const deprecated = sets.filter((s) => s.task_type === 'antonym_choice' || s.task_type === 'cet_cloze').length
  console.log(`  ${blockedActive === 0 ? '✓' : '✗'} 阻塞/退役题型 active = ${blockedActive} (expect 0；当前 gen active=${genActive})`)
  console.log(`  ${deprecated === 0 ? '✓' : '✗'} antonym_choice + cet_cloze = ${deprecated} (expect 0)`)
  if (blockedActive !== 0 || deprecated !== 0) ok = false
  return ok
}

// 静态断言（只读源码）：组卷器必须持续排除 build_a_sentence / listen_and_repeat / interview_speaking。
// 2026-07-05 加入：build_a_sentence 契约就绪但激活未获批，此排除是 mock 卷的第一道防线，不得静默移除。
function assertPaperGeneratorExclusion(): boolean {
  const src = readFileSync('lib/papers/paper-generator.ts', 'utf8')
  const m = src.match(/PAPER_EXCLUDED_TASK_TYPES\s*=\s*new Set\(\[([^\]]*)\]\)/)
  const inside = m ? m[1] : ''
  let ok = true
  for (const t of ['build_a_sentence', 'listen_and_repeat', 'interview_speaking']) {
    const has = inside.includes(`'${t}'`)
    console.log(`  ${has ? '✓' : '✗'} paper-generator PAPER_EXCLUDED_TASK_TYPES 含 ${t}`)
    if (!has) ok = false
  }
  return ok
}

async function main() {
  console.log('\n=== [verify:toefl-current] aggregate DB count assertion ===')
  let countsOk = false
  try { countsOk = await assertAggregateCounts() } catch (e) { console.error('  ✗ count assertion error:', (e as Error)?.message ?? e); countsOk = false }
  console.log('\n=== [verify:toefl-current] paper-generator exclusion (static) ===')
  let exclusionOk = false
  try { exclusionOk = assertPaperGeneratorExclusion() } catch (e) { console.error('  ✗ exclusion assertion error:', (e as Error)?.message ?? e); exclusionOk = false }
  if (!exclusionOk) countsOk = false

  if (childFailed || !countsOk) {
    console.error('\n✗ verify:toefl-current FAILED')
    process.exitCode = 1
  } else {
    console.log('\n✓ verify:toefl-current PASSED — pilot + both expansions + CW/email/discussion 100/100/100 active (F2B+promote), reading 专项 active, build_a_sentence/口语 0 active (阻塞), 0 deprecated')
  }
}
main().catch((e) => { console.error('verify-toefl-current fatal', (e as Error)?.message ?? e); process.exitCode = 1 })
