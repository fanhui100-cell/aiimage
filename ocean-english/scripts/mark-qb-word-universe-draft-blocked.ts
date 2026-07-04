/* ════════════════════════════════════════════════════════════════════════
   mark-qb-word-universe-draft-blocked.ts — 旧 qb:(DeepSeek 期) word-universe draft 封存标记
   （2026-07-05 Task 5，幂等、manifest 式）

   背景：word-universe 三型（def_to_word/synonym_choice/confusable_choice）active 已 100% gen:
   Claude 原创；库中仍有 600 条旧 qb: draft。promote 已有来源硬门（word_universe_non_gen_source），
   本脚本再加显式封存标记（防御纵深 + 审计留痕），不删除、不改 status：
     qa_flags.doNotPromote   = true
     qa_flags.blockedReason  = 'legacy_qb_not_for_promotion'

   为何不改 status='rejected'：validate:wu-promote-guards 需要 qb draft 样本来持续验证来源门
   （无样本即报错），故保持 draft + 标记（计划中的备选方案）。

   用法：
     npx tsx scripts/mark-qb-word-universe-draft-blocked.ts --dry-run   # 默认亦为 dry-run
     npx tsx scripts/mark-qb-word-universe-draft-blocked.ts --apply
   幂等：已带两标记的行跳过（dup-skip）；第二次 --apply 应为 0 changes。
   报告：reports/mark-qb-wu-draft-blocked-report.json
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'

const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(readEnv('NEXT_PUBLIC_SUPABASE_URL'), readEnv('SUPABASE_SERVICE_ROLE_KEY'))
const OUT = 'reports/mark-qb-wu-draft-blocked-report.json'

const APPLY = process.argv.includes('--apply')
const TYPES = ['def_to_word', 'synonym_choice', 'confusable_choice']
const BLOCKED_REASON = 'legacy_qb_not_for_promotion'

type Row = { id: string; legacy_id: string | null; task_type: string; status: string; qa_flags: Record<string, unknown> | null }

async function main() {
  // 目标：WU 三型 · legacy_id qb:% · status=draft（分页拉全，避开 PostgREST max-rows 截断）
  const rows: Row[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('question_sets')
      .select('id, legacy_id, task_type, status, qa_flags')
      .in('task_type', TYPES).eq('status', 'draft').like('legacy_id', 'qb:%')
      .order('id', { ascending: true }).range(from, from + 999)
    if (error) throw new Error(error.message)
    const batch = (data ?? []) as Row[]
    rows.push(...batch)
    if (batch.length < 1000) break
  }

  const already = rows.filter((r) => (r.qa_flags ?? {}).doNotPromote === true && (r.qa_flags ?? {}).blockedReason === BLOCKED_REASON)
  const todo = rows.filter((r) => !((r.qa_flags ?? {}).doNotPromote === true && (r.qa_flags ?? {}).blockedReason === BLOCKED_REASON))

  let updated = 0
  const failures: { id: string; error: string }[] = []
  if (APPLY) {
    // 逐行 merge qa_flags（各行 flags 不同，不能整批同值覆盖；绝不丢原有 stage/source 等字段）
    for (const r of todo) {
      const merged = { ...(r.qa_flags ?? {}), doNotPromote: true, blockedReason: BLOCKED_REASON }
      const { error } = await db.from('question_sets').update({ qa_flags: merged }).eq('id', r.id).eq('status', 'draft')
      if (error) failures.push({ id: r.id, error: error.message })
      else updated++
    }
  }

  const byTask: Record<string, number> = {}
  for (const r of rows) byTask[r.task_type] = (byTask[r.task_type] ?? 0) + 1

  const report = {
    generatedAt: new Date().toISOString(),
    apply: APPLY,
    blockedReason: BLOCKED_REASON,
    candidates: rows.length,
    byTask,
    alreadyMarked: already.length,
    toMark: todo.length,
    updated,
    failures,
    sample: todo.slice(0, 5).map((r) => ({ id: r.id, legacy_id: r.legacy_id, task_type: r.task_type })),
  }
  writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n', 'utf8')
  console.log(`mark-qb-wu-draft-blocked ${APPLY ? 'APPLY' : 'DRY-RUN'}`)
  console.log(`  candidates ${rows.length} · already-marked(dup-skip) ${already.length} · to-mark ${todo.length} · updated ${updated} · failures ${failures.length}`)
  console.log(`  报告：${OUT}`)
  if (failures.length) { for (const f of failures.slice(0, 5)) console.error(`ERROR ${f.id}: ${f.error}`); process.exitCode = 1 }
}

main().catch((e) => { console.error('mark-qb-wu-draft-blocked fatal', e?.message ?? e); process.exitCode = 1 })
