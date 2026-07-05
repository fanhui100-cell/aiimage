/* ════════════════════════════════════════════════════════════════════════
   activate-toefl-listening-audio-f3.ts — F3 听力音频批量激活（stage 级，一次性）

   对象：stage=toefl-listening-expansion-2026-07-03 的 180 个 stimulus 对应的
   machine_checked 音频行 → active（与 pilot 2026-07-02 激活同一先例/同一记录形态）。

   听审依据（reviewed_by 记录）：owner 委托抽查制（2026-07-04 指令"你去抽查，通过后就批准"）——
   40 条分层抽样（每型 20，8 voice 全覆盖）Azure STT 反向转写 WER 中位 2.5%/最大 11.1%（阈 15%）、
   ffmpeg 解码完整性 40/40、时长漂移 0、语速 123-236 WPM；另有 24 套语义抽样 0 缺陷。
   记录：reports/toefl-listening-audio-generation-2026-07-04.md + 本次激活报告。

   安全契约：默认 dry-run；--apply 才写；只动本 stage stimuli 的 machine_checked 行；
   必写 reviewed_by/reviewed_at（DB CHECK 强制）；幂等（已 active 的行跳过）。
   用法：npx tsx scripts/activate-toefl-listening-audio-f3.ts [--apply]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const env = existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : ''
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(readEnv('NEXT_PUBLIC_SUPABASE_URL'), readEnv('SUPABASE_SERVICE_ROLE_KEY'))

const APPLY = process.argv.includes('--apply')
const STAGE = 'toefl-listening-expansion-2026-07-03'
const REVIEWER = 'owner-delegated_claude-stt-sample40-wer2.5'
const OUT = 'reports/toefl-listening-audio-activation-2026-07-04.json'
const EXPECTED = 180

async function main() {
  const sets: { stimulus_id: string | null; task_type: string; qa_flags: Record<string, unknown> | null }[] = []
  for (let f = 0; ; f += 1000) {
    const { data, error } = await db.from('question_sets').select('stimulus_id, task_type, qa_flags').eq('level', 6).in('task_type', ['choose_a_response', 'listening_comprehension']).range(f, f + 999)
    if (error) throw new Error(error.message)
    sets.push(...(data as typeof sets)); if (data!.length < 1000) break
  }
  const stimIds = [...new Set(sets.filter((s) => (s.qa_flags as { stage?: string } | null)?.stage === STAGE).map((s) => s.stimulus_id).filter((x): x is string => !!x))]
  if (stimIds.length !== EXPECTED) { console.error(`✗ stage stimuli ${stimIds.length} ≠ ${EXPECTED}`); process.exit(1) }

  const rows: { id: string; stimulus_id: string; qa_status: string }[] = []
  for (let i = 0; i < stimIds.length; i += 100) {
    const { data, error } = await db.from('audio_assets').select('id, stimulus_id, qa_status').in('stimulus_id', stimIds.slice(i, i + 100))
    if (error) throw new Error(error.message)
    rows.push(...(data as typeof rows))
  }
  const before: Record<string, number> = {}
  for (const r of rows) before[r.qa_status] = (before[r.qa_status] ?? 0) + 1
  const pending = rows.filter((r) => r.qa_status === 'machine_checked')
  console.log(`stage stimuli ${stimIds.length} · audio rows ${rows.length} · before=${JSON.stringify(before)} · to-activate ${pending.length}`)
  if (rows.length !== EXPECTED) { console.error(`✗ audio rows ${rows.length} ≠ ${EXPECTED}`); process.exit(1) }

  if (!APPLY) { console.log('[dry-run] 不写库；--apply 执行激活'); return }

  let activated = 0
  const now = new Date().toISOString()
  for (let i = 0; i < pending.length; i += 100) {
    const ids = pending.slice(i, i + 100).map((r) => r.id)
    const { data, error } = await db.from('audio_assets').update({ qa_status: 'active', reviewed_by: REVIEWER, reviewed_at: now }).in('id', ids).eq('qa_status', 'machine_checked').select('id')
    if (error) throw new Error(`activate: ${error.message}`)
    activated += (data ?? []).length
  }
  const after: Record<string, number> = {}
  for (let i = 0; i < stimIds.length; i += 100) {
    const { data } = await db.from('audio_assets').select('qa_status').in('stimulus_id', stimIds.slice(i, i + 100))
    for (const r of (data ?? []) as { qa_status: string }[]) after[r.qa_status] = (after[r.qa_status] ?? 0) + 1
  }
  writeFileSync(OUT, JSON.stringify({ generatedAt: now, stage: STAGE, reviewer: REVIEWER, evidence: 'STT round-trip 40/40 PASS (WER med 2.5% max 11.1%), ffmpeg decode 40/40 clean, duration drift 0, 24-set semantic sample 0 defects; owner delegation 2026-07-04', stimuli: stimIds.length, audioRows: rows.length, before, activated, afterByStatus: after }, null, 2) + '\n', 'utf8')
  console.log(`✓ activated ${activated} · after=${JSON.stringify(after)} · 报告 ${OUT}`)
  if ((after.active ?? 0) !== EXPECTED) { console.error(`✗ after active ${after.active} ≠ ${EXPECTED}`); process.exit(1) }
}
main().catch((e) => { console.error('activate fatal', e?.message ?? e); process.exit(1) })
