/* ════════════════════════════════════════════════════════════════════════
   validate-word-universe-promote-guards.ts — 反误 promote qb 门控验证（只读）

   验证：
   1) active word-universe 中 qb = 0。
   2) 取一条 qb: word-universe draft，promote dry-run → rejected: word_universe_non_gen_source。
   3) 取一条 gen: word-universe draft，promote dry-run → eligible（若被其它原因拒，说明原因）。
   4) 退役题型门控仍在（isDeprecatedQuestionType 对 antonym_choice/cet_cloze 为真；库中若无退役 set 则说明）。

   仅 dry-run，绝不 apply。报告 reports/word-universe-promote-guards-validation.json。
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { isDeprecatedQuestionType } from '@/lib/question-bank/question-type-taxonomy'

const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(readEnv('NEXT_PUBLIC_SUPABASE_URL'), readEnv('SUPABASE_SERVICE_ROLE_KEY'))
const TYPES = ['def_to_word', 'synonym_choice', 'confusable_choice']

const errors: string[] = []
const checks: Record<string, unknown> = {}

// dry-run promote for one explicit set id，返回其 promote 报告（含 eligible / rejected[]）。
function promoteDryRun(setId: string): { eligible: number; rejected: { id: string; reason: string }[]; reasonCounts: Record<string, number> } {
  execSync(`npx tsx scripts/promote-question-sets-v2.ts --ids=${setId}`, { encoding: 'utf8', stdio: 'pipe' })
  const rep = JSON.parse(readFileSync('reports/promote-qsets-v2-report.json', 'utf8')) as { eligible: number; rejected: { id: string; reason: string }[]; reasonCounts: Record<string, number> }
  return rep
}

async function main() {
  // 1) active qb = 0
  const { count: qbActive } = await db.from('question_sets').select('id', { count: 'exact', head: true })
    .in('task_type', TYPES).eq('status', 'active').like('legacy_id', 'qb:%')
  checks.activeQbCount = qbActive ?? 0
  if ((qbActive ?? 0) !== 0) errors.push(`active word-universe qb = ${qbActive}（应为 0）`)

  // 2) 一条 qb draft → 应 rejected word_universe_non_gen_source
  const { data: qbRow } = await db.from('question_sets').select('id, legacy_id, task_type')
    .in('task_type', TYPES).eq('status', 'draft').like('legacy_id', 'qb:%').limit(1)
  if (qbRow && qbRow.length) {
    const id = (qbRow[0] as { id: string }).id
    const rep = promoteDryRun(id)
    const rej = rep.rejected.find((r) => r.id === id)
    checks.qbDraftSample = { id, legacy_id: (qbRow[0] as { legacy_id: string }).legacy_id, result: rej ? `rejected:${rej.reason}` : `eligible(${rep.eligible})` }
    if (!rej || rej.reason !== 'word_universe_non_gen_source') errors.push(`qb draft 未被 word_universe_non_gen_source 拒（实际 ${rej ? rej.reason : 'eligible'}）`)
  } else { checks.qbDraftSample = 'none'; errors.push('无 qb draft 样本可验证') }

  // 3) 一条 gen draft → 应 eligible（来源层通过）
  const { data: genRow } = await db.from('question_sets').select('id, legacy_id, task_type')
    .in('task_type', TYPES).eq('status', 'draft').like('legacy_id', 'gen:%').limit(1)
  if (genRow && genRow.length) {
    const id = (genRow[0] as { id: string }).id
    const rep = promoteDryRun(id)
    const rej = rep.rejected.find((r) => r.id === id)
    checks.genDraftSample = { id, legacy_id: (genRow[0] as { legacy_id: string }).legacy_id, result: rej ? `rejected:${rej.reason}` : `eligible(${rep.eligible})` }
    if (rej) errors.push(`gen draft 被拒（${rej.reason}）——来源门控不应误伤 gen`)
    else if (rep.eligible < 1) errors.push('gen draft 未 eligible')
  } else { checks.genDraftSample = 'none（gen draft 已全部 promote 或仅剩非样本）' }

  // 4) 退役题型门控（现有）：库中若无退役 set，用逻辑断言说明
  const depLogic = isDeprecatedQuestionType('antonym_choice') && isDeprecatedQuestionType('cet_cloze')
  const { count: depSets } = await db.from('question_sets').select('id', { count: 'exact', head: true }).in('task_type', ['antonym_choice', 'cet_cloze'])
  checks.deprecatedGuard = { logicRejectsDeprecated: depLogic, deprecatedSetsInDb: depSets ?? 0, note: (depSets ?? 0) === 0 ? '库中无退役 set；promote 对退役 task_type 返回 deprecated_type（逻辑已验证）' : '库中存在退役 set' }
  if (!depLogic) errors.push('isDeprecatedQuestionType 未识别 antonym_choice/cet_cloze')

  const report = { generatedAt: new Date().toISOString(), ok: errors.length === 0, checks, errors }
  writeFileSync('reports/word-universe-promote-guards-validation.json', JSON.stringify(report, null, 2) + '\n', 'utf8')
  console.log(`wu-promote-guards: ${errors.length === 0 ? 'PASS' : 'FAIL'} · 错误 ${errors.length}`)
  console.log(`  active qb=${checks.activeQbCount} · qb draft→${JSON.stringify((checks.qbDraftSample as { result?: string })?.result ?? checks.qbDraftSample)} · gen draft→${JSON.stringify((checks.genDraftSample as { result?: string })?.result ?? checks.genDraftSample)}`)
  for (const e of errors) console.error(`ERROR ${e}`)
  process.exit(errors.length ? 1 : 0)
}
main().catch((e) => { console.error('wu-promote-guards fatal', e?.message ?? e); process.exit(1) })
