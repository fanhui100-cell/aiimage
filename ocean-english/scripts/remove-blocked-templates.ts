/* ════════════════════════════════════════════════════════════════════════
   remove-blocked-templates.ts — 定向删除指定 template 的 draft gen sets

   用途：某题型因官方规格未确认（§3.4）被停止时，从题库移除其 draft 内容。
   只动 legacy_id like 'gen:%' + status='draft' + qa_flags.template ∈ 给定列表。
   顺序 items → sets → stimuli。默认 dry-run，仅 --apply 真删。
   用法：
     npx tsx scripts/remove-blocked-templates.ts --templates=toefl-read-daily-life,toefl-academic-reading
     npx tsx scripts/remove-blocked-templates.ts --templates=... --apply
   ════════════════════════════════════════════════════════════════════════ */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'

const env = existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : ''
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db: SupabaseClient = createClient(readEnv('NEXT_PUBLIC_SUPABASE_URL'), readEnv('SUPABASE_SERVICE_ROLE_KEY'))

const argValue = (n: string) => { const h = process.argv.find((a) => a.startsWith(`${n}=`)); return h ? h.slice(n.length + 1) : null }
const APPLY = process.argv.includes('--apply')
const TEMPLATES = new Set((argValue('--templates') ?? '').split(',').map((s) => s.trim()).filter(Boolean))
// --tasktypes：按 task_type 删（用于 productive set，其 qa_flags 无 template）。仅限 legacy_id gen:productive: 前缀，避免误删共享 task_type。
const TASKTYPES = new Set((argValue('--tasktypes') ?? '').split(',').map((s) => s.trim()).filter(Boolean))

type Row = { id: string; legacy_id: string | null; task_type: string; stimulus_id: string | null; status: string; qa_flags: Record<string, unknown> | null }

async function main() {
  if (!TEMPLATES.size && !TASKTYPES.size) { console.error('需 --templates=a,b 或 --tasktypes=a,b'); process.exit(1) }
  const all: Row[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('question_sets').select('id, legacy_id, task_type, stimulus_id, status, qa_flags').like('legacy_id', 'gen:%').eq('status', 'draft').range(from, from + 999)
    if (error) throw new Error(error.message)
    const rows = (data ?? []) as Row[]
    all.push(...rows)
    if (rows.length < 1000) break
  }
  const target = all.filter((s) =>
    TEMPLATES.has((s.qa_flags as { template?: string } | null)?.template ?? '') ||
    (TASKTYPES.has(s.task_type) && (s.legacy_id ?? '').startsWith('gen:productive:')))
  const setIds = target.map((s) => s.id)
  const stimIds = target.map((s) => s.stimulus_id).filter((x): x is string => !!x)
  console.log(`${APPLY ? 'APPLY' : 'DRY-RUN'} templates=[${[...TEMPLATES].join(', ')}] → sets ${setIds.length} · stimuli ${stimIds.length}`)
  if (!setIds.length) { console.log('无匹配 draft set'); return }
  if (!APPLY) { console.log('(dry-run，未删除)'); return }

  let items = 0
  for (let i = 0; i < setIds.length; i += 100) {
    const { data, error } = await db.from('question_items').delete().in('question_set_id', setIds.slice(i, i + 100)).select('id')
    if (error) throw new Error(`del items: ${error.message}`)
    items += (data ?? []).length
  }
  for (let i = 0; i < setIds.length; i += 100) {
    const { error } = await db.from('question_sets').delete().in('id', setIds.slice(i, i + 100))
    if (error) throw new Error(`del sets: ${error.message}`)
  }
  for (let i = 0; i < stimIds.length; i += 100) {
    const { error } = await db.from('stimuli').delete().in('id', stimIds.slice(i, i + 100))
    if (error) throw new Error(`del stimuli: ${error.message}`)
  }
  console.log(`已删除：items ${items} · sets ${setIds.length} · stimuli ${stimIds.length}`)
}
main().catch((e) => { console.error('remove-blocked fatal', e?.message ?? e); process.exitCode = 1 })
