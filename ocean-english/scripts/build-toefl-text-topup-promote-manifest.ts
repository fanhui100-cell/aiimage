/* ════════════════════════════════════════════════════════════════════════
   build-toefl-text-topup-promote-manifest.ts — F2B 精确晋级清单（只读，不改状态）

   晋级 stage=toefl-text-topup-2026-07-03 的 110 个 draft（全 100% PASS）：
     complete_the_words 30 + email_writing 40 + academic_discussion 40 → active（各达 100）。
   仅取本 stage（qa_flags.stage）、status=draft 的 set，避免误纳其它 draft。
   输出：reports/toefl-text-topup-promote-manifest-2026-07-03.json（含 setIds[]）。
   用法：npx tsx scripts/build-toefl-text-topup-promote-manifest.ts
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const env = existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : ''
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(readEnv('NEXT_PUBLIC_SUPABASE_URL'), readEnv('SUPABASE_SERVICE_ROLE_KEY'))
const STAGE = 'toefl-text-topup-2026-07-03'
const MANIFEST = 'reports/toefl-text-topup-promote-manifest-2026-07-03.json'
const EXPECT: Record<string, number> = { complete_the_words: 30, email_writing: 40, academic_discussion: 40 }

async function main() {
  const rows: { id: string; legacy_id: string | null; task_type: string; qa_flags: Record<string, unknown> | null }[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('question_sets').select('id, legacy_id, task_type, qa_flags').eq('level', 6).eq('status', 'draft').in('task_type', Object.keys(EXPECT)).range(from, from + 999)
    if (error) throw new Error(error.message)
    const page = (data ?? []) as typeof rows
    rows.push(...page); if (page.length < 1000) break
  }
  const mine = rows.filter((s) => (s.qa_flags as { stage?: string } | null)?.stage === STAGE)
  const byTask: Record<string, typeof rows> = {}
  for (const s of mine) (byTask[s.task_type] ??= []).push(s)

  const errs: string[] = []
  for (const [t, n] of Object.entries(EXPECT)) {
    const got = (byTask[t] ?? []).length
    if (got !== n) errs.push(`${t} draft(stage) ${got} ≠ ${n}`)
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    phase: 'F2B-promote',
    stage: STAGE,
    total: mine.length,
    setIds: mine.map((s) => s.id),
    expectedDelta: EXPECT,
    byTask: Object.fromEntries(Object.entries(byTask).map(([t, arr]) => [t, arr.map((s) => ({ id: s.id, legacy_id: s.legacy_id }))])),
  }
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8')
  console.log(`manifest: ${Object.entries(byTask).map(([t, a]) => `${t} ${a.length}`).join(' · ')} · total ${mine.length}`)
  if (errs.length) { console.error('✗ ' + errs.join('; ')); process.exitCode = 1 }
  else console.log(`✓ 清单已写 ${MANIFEST}（110 = 30 + 40 + 40）`)
}
main().catch((e) => { console.error('build-manifest fatal', e?.message ?? e); process.exitCode = 1 })
