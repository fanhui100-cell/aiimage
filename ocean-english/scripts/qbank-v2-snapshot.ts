/* ════════════════════════════════════════════════════════════════════════
   qbank-v2-snapshot.ts — v2 题库只读快照（Pre-Write Snapshot 支撑）

   只读。按 master prompt「Pre-Write Snapshot」要求，输出：
   - question_sets 按 status 计数
   - question_sets 按 task_type 计数（可选 --task=<t> 聚焦）
   - 目标 task 的 active 计数
   - 退役题型 antonym_choice / cet_cloze 计数
   绝不写库。供每个 --apply 前后对比 delta。

   用法：npx tsx scripts/qbank-v2-snapshot.ts [--task=banked_cloze] [--level=3]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const SUPABASE_URL = readEnv('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_ROLE = readEnv('SUPABASE_SERVICE_ROLE_KEY')

const argValue = (name: string): string | null => {
  const hit = process.argv.find((a) => a.startsWith(`${name}=`))
  return hit ? hit.slice(name.length + 1) : null
}
const TASK = argValue('--task')
const LEVEL = argValue('--level')

const db = createClient(SUPABASE_URL, SERVICE_ROLE)

async function pageCol<T>(table: string, cols: string): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select(cols).order('id', { ascending: true }).range(from, from + 999)
    if (error) throw new Error(`${table}: ${error.message}`)
    const rows = (data ?? []) as T[]
    out.push(...rows)
    if (rows.length < 1000) break
  }
  return out
}

async function main() {
  type SetRow = { task_type: string; status: string; level: number | null }
  const sets = await pageCol<SetRow>('question_sets', 'task_type, status, level')

  const byStatus: Record<string, number> = {}
  const byTask: Record<string, number> = {}
  const byTaskStatus: Record<string, Record<string, number>> = {}
  for (const s of sets) {
    byStatus[s.status] = (byStatus[s.status] ?? 0) + 1
    byTask[s.task_type] = (byTask[s.task_type] ?? 0) + 1
    ;(byTaskStatus[s.task_type] ??= {})[s.status] = (byTaskStatus[s.task_type]?.[s.status] ?? 0) + 1
  }

  const deprecated = {
    antonym_choice: byTask['antonym_choice'] ?? 0,
    cet_cloze: byTask['cet_cloze'] ?? 0,
  }

  let focus: Record<string, unknown> | null = null
  if (TASK) {
    const subset = sets.filter((s) => s.task_type === TASK && (LEVEL ? String(s.level) === LEVEL : true))
    const fs: Record<string, number> = {}
    for (const s of subset) fs[s.status] = (fs[s.status] ?? 0) + 1
    focus = { task: TASK, level: LEVEL ?? 'all', byStatus: fs, active: fs['active'] ?? 0, total: subset.length }
  }

  const out = {
    generatedAt: new Date().toISOString(),
    totalSets: sets.length,
    byStatus,
    activeTotal: byStatus['active'] ?? 0,
    deprecated,
    byTaskStatus,
    focus,
  }
  console.log(JSON.stringify(out, null, 2))
}

main().catch((e) => {
  console.error('snapshot fatal', e?.message ?? e)
  process.exit(1)
})
