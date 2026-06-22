/* R2 targeted repair (read-only unless --apply): re-sync 3 drifted productive stages to the
   (canonical) disk source. Rule-12 compliant — enumerates EXACT stale legacy_ids, asserts
   status=draft + qa_flags.stage + task_type per row, deletes items→set→orphan stimulus.
   Does NOT prune by stage. After this runs, re-import the 3 stages with the productive importer.
   Usage: npx tsx scripts/repair-prod-drift-r2.ts [--apply] */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { getExamSpec } from '@/lib/exam-specs'

const APPLY = process.argv.includes('--apply')
const ROOT = 'data/generated-question-sets'
const STAGES = [
  { stage: 'prod-ky-aw', taskType: 'applied_writing' },
  { stage: 'prod-ky-essay', taskType: 'essay_writing' },
  { stage: 'prod-zk-aw', taskType: 'applied_writing' },
]
const env = readFileSync('.env.local', 'utf8')
const rd = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db: SupabaseClient = createClient(rd('NEXT_PUBLIC_SUPABASE_URL'), rd('SUPABASE_SERVICE_ROLE_KEY'))
function hashId(s: string): string { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return (h >>> 0).toString(36) }

interface ProdTask { prompt: string; sourceTextZh?: string; sourceTextEn?: string }
interface ProdFile { examId: string; level?: number; taskType: string; tasks: ProdTask[] }

function newExpectedFor(stage: string): Set<string> {
  const dir = join(ROOT, stage)
  const exp = new Set<string>()
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.productive.json'))) {
    const pf = JSON.parse(readFileSync(join(dir, f), 'utf8')) as ProdFile
    const level = pf.level ?? getExamSpec(pf.examId)?.level ?? 3
    for (const t of pf.tasks) {
      if (!t.prompt) continue
      const hasSrc = !!(t.sourceTextZh || t.sourceTextEn)
      const tag = hasSrc ? hashId(`${pf.examId}|${pf.taskType}|${level}|${t.prompt}|${t.sourceTextZh ?? ''}|${t.sourceTextEn ?? ''}`) : hashId(`${pf.examId}|${pf.taskType}|${level}|${t.prompt}`)
      exp.add(`gen:productive:${pf.taskType}:set:claude:${tag}`)
    }
  }
  return exp
}

async function main() {
  type SetRow = { id: string; legacy_id: string | null; task_type: string; status: string; stimulus_id: string | null; qa_flags: Record<string, unknown> | null }
  // page all gen:productive sets once
  const all: SetRow[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('question_sets').select('id, legacy_id, task_type, status, stimulus_id, qa_flags').like('legacy_id', 'gen:productive:%').range(from, from + 999)
    if (error) throw new Error(error.message)
    const rows = (data ?? []) as SetRow[]; all.push(...rows); if (rows.length < 1000) break
  }
  let totalStale = 0, deletedSets = 0, deletedStims = 0, abort = 0
  const stimToCheck: string[] = []

  for (const { stage, taskType } of STAGES) {
    const expected = newExpectedFor(stage)
    const stageSets = all.filter((s) => (s.qa_flags as { stage?: string } | null)?.stage === stage)
    const stale = stageSets.filter((s) => s.legacy_id && !expected.has(s.legacy_id))
    console.log(`\n[${stage}] disk-expected ${expected.size} · DB stage sets ${stageSets.length} · stale (not matching disk) ${stale.length}`)
    totalStale += stale.length
    for (const s of stale) {
      // hard per-row assertions before any delete
      if (s.status !== 'draft') { console.error(`  ABORT ${s.legacy_id}: status=${s.status} (must draft)`); abort++; continue }
      if ((s.qa_flags as { stage?: string } | null)?.stage !== stage) { console.error(`  ABORT ${s.legacy_id}: stage mismatch`); abort++; continue }
      if (s.task_type !== taskType) { console.error(`  ABORT ${s.legacy_id}: task_type=${s.task_type}≠${taskType}`); abort++; continue }
      if (!APPLY) continue
      const di = await db.from('question_items').delete().eq('question_set_id', s.id)
      if (di.error) { console.error(`  item delete failed ${s.legacy_id}: ${di.error.message}`); abort++; continue }
      const ds = await db.from('question_sets').delete().eq('id', s.id)
      if (ds.error) { console.error(`  set delete failed ${s.legacy_id}: ${ds.error.message}`); abort++; continue }
      deletedSets++
      if (s.stimulus_id) stimToCheck.push(s.stimulus_id)
    }
  }

  // orphan stimulus cleanup: delete only stimuli no remaining set references
  if (APPLY) {
    for (const sid of [...new Set(stimToCheck)]) {
      const { data: refs } = await db.from('question_sets').select('id').eq('stimulus_id', sid).limit(1)
      if (refs && refs.length) continue // still referenced
      const dst = await db.from('stimuli').delete().eq('id', sid)
      if (dst.error) console.error(`  stimulus delete failed ${sid}: ${dst.error.message}`); else deletedStims++
    }
  }

  console.log(`\n${APPLY ? '[APPLY]' : '[DRY-RUN]'} stale total ${totalStale} · deleted sets ${deletedSets} · deleted orphan stimuli ${deletedStims} · aborts ${abort}`)
  if (abort) { console.error('aborted rows present — investigate before re-import'); process.exitCode = 1 }
  else if (!APPLY) console.log('dry-run only — re-run with --apply to delete, then re-import the 3 stages.')
}
main().catch((e) => { console.error('repair fatal', (e as Error)?.message ?? e); process.exitCode = 1 })
