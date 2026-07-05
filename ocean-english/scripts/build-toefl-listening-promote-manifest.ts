/* ════════════════════════════════════════════════════════════════════════
   build-toefl-listening-promote-manifest.ts — F3 听力精确晋级清单（只读，不改状态）

   晋级 stage=toefl-listening-expansion-2026-07-03 的 180 个 draft（owner 批准语 2026-07-04，
   前置=owner 委托抽查通过：STT 反向转写 40/40 PASS + 24 套语义抽样 0 缺陷 + 音频已激活 active）：
     choose_a_response 90 + listening_comprehension 90 → active（各达 100）。

   前置断言（不满足则不写文件、退 1，绝不覆盖历史清单）：
     - stage set 恰 90+90 且全 draft；
     - 每个 set 的 stimulus 都有 active 音频（promote RPC 的硬条件，提前验证）。
   输出：reports/toefl-listening-promote-manifest-2026-07-04.json（setIds[] 供 promote --manifest）。
   用法：npx tsx scripts/build-toefl-listening-promote-manifest.ts
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const env = existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : ''
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(readEnv('NEXT_PUBLIC_SUPABASE_URL'), readEnv('SUPABASE_SERVICE_ROLE_KEY'))
const STAGE = 'toefl-listening-expansion-2026-07-03'
const MANIFEST = 'reports/toefl-listening-promote-manifest-2026-07-04.json'
const EXPECT: Record<string, number> = { choose_a_response: 90, listening_comprehension: 90 }

async function main() {
  const rows: { id: string; legacy_id: string | null; task_type: string; status: string; stimulus_id: string | null; qa_flags: Record<string, unknown> | null }[] = []
  for (let f = 0; ; f += 1000) {
    const { data, error } = await db.from('question_sets').select('id, legacy_id, task_type, status, stimulus_id, qa_flags').eq('level', 6).in('task_type', Object.keys(EXPECT)).range(f, f + 999)
    if (error) throw new Error(error.message)
    rows.push(...(data as typeof rows)); if (data!.length < 1000) break
  }
  const mine = rows.filter((s) => (s.qa_flags as { stage?: string } | null)?.stage === STAGE)
  const errs: string[] = []
  const byTask: Record<string, typeof rows> = {}
  for (const s of mine) (byTask[s.task_type] ??= []).push(s)
  for (const [t, n] of Object.entries(EXPECT)) {
    const arr = byTask[t] ?? []
    if (arr.length !== n) errs.push(`${t} stage set ${arr.length} ≠ ${n}`)
    const nonDraft = arr.filter((s) => s.status !== 'draft').length
    if (nonDraft) errs.push(`${t} 有 ${nonDraft} 个非 draft stage set`)
  }
  // 每个 stimulus 必有 active 音频
  const stimIds = [...new Set(mine.map((s) => s.stimulus_id).filter((x): x is string => !!x))]
  const activeAudio = new Set<string>()
  for (let i = 0; i < stimIds.length; i += 100) {
    const { data, error } = await db.from('audio_assets').select('stimulus_id').in('stimulus_id', stimIds.slice(i, i + 100)).eq('qa_status', 'active')
    if (error) throw new Error(error.message)
    for (const a of (data ?? []) as { stimulus_id: string | null }[]) if (a.stimulus_id) activeAudio.add(a.stimulus_id)
  }
  const noAudio = mine.filter((s) => !s.stimulus_id || !activeAudio.has(s.stimulus_id)).length
  if (noAudio) errs.push(`${noAudio} 个 stage set 无 active 音频`)

  console.log(`manifest: ${Object.entries(byTask).map(([t, a]) => `${t} ${a.length}`).join(' · ')} · total ${mine.length} · active音频覆盖 ${stimIds.length - (noAudio ? noAudio : 0)}/${stimIds.length}`)
  if (errs.length) { console.error('✗ ' + errs.join('; ')); process.exitCode = 1; return }

  const manifest = {
    generatedAt: new Date().toISOString(),
    phase: 'F3-promote',
    stage: STAGE,
    approval: 'owner 2026-07-04: 抽查通过即批准（STT 40/40 PASS + 语义抽样 24/24 + 音频 180 active）',
    total: mine.length,
    setIds: mine.map((s) => s.id),
    expectedDelta: EXPECT,
    byTask: Object.fromEntries(Object.entries(byTask).map(([t, arr]) => [t, arr.map((s) => ({ id: s.id, legacy_id: s.legacy_id }))])),
  }
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8')
  console.log(`✓ 清单已写 ${MANIFEST}（180 = 90 + 90）`)
}
main().catch((e) => { console.error('build-manifest fatal', e?.message ?? e); process.exitCode = 1 })
