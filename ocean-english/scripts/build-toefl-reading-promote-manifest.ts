/* ════════════════════════════════════════════════════════════════════════
   build-toefl-reading-promote-manifest.ts — F2 精确晋级清单构造（只读，不改状态）

   目标：晋级 198 个已审 PASS 的 TOEFL Reading draft：
     - read_daily_life 全部 100（F2 审计 100% PASS）；
     - reading_comprehension 100 中排除 2 个 pilot REVIEW（academic 第 7=plankton / 第 9=desert）
       → 98 PASS。
   2 个 REVIEW 的 legacy_id 由 pilot 源文件确定性哈希复算（与 importer 同口径），杜绝手抄 UUID。

   输出（唯一持久产物）：
     - reports/toefl-reading-promote-manifest-2026-07-03.json（setIds[] 供 promote --manifest 消费，
       + 198 个 set 的 id/legacy/task + 2 个排除项）
   时效：本脚本是 promote 前的点位工具——前置条件是两型各 100 draft。promote（2026-07-04）后重跑
   会因 draft 计数前置断言失败而退出 1（by design，防止覆盖历史清单）；已提交的 manifest JSON 即审计记录。
   用法：npx tsx scripts/build-toefl-reading-promote-manifest.ts
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const env = existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : ''
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(readEnv('NEXT_PUBLIC_SUPABASE_URL'), readEnv('SUPABASE_SERVICE_ROLE_KEY'))

const MANIFEST = 'reports/toefl-reading-promote-manifest-2026-07-03.json'
const PILOT = 'data/generated-question-sets/toefl-reading-pilot-2026-07-02/toefl-academic-reading.json'

function hashId(s: string): string { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return (h >>> 0).toString(36) }

async function pageDraft(taskType: string): Promise<{ id: string; legacy_id: string | null; qa_flags: Record<string, unknown> | null }[]> {
  const rows: { id: string; legacy_id: string | null; qa_flags: Record<string, unknown> | null }[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('question_sets').select('id, legacy_id, qa_flags').eq('level', 6).eq('task_type', taskType).eq('status', 'draft').range(from, from + 999)
    if (error) throw new Error(error.message)
    const page = (data ?? []) as typeof rows
    rows.push(...page); if (page.length < 1000) break
  }
  return rows
}

async function main() {
  // 2 个 REVIEW pilot 的确定性 legacy_id（academic 源 index 6=plankton / 8=desert；importer: hashId(`${template}|${level}|${JSON.stringify(raw)}`)）
  const pilot = JSON.parse(readFileSync(PILOT, 'utf8')) as { template: string; level?: number; sets: Record<string, unknown>[] }
  const lvl = pilot.level ?? 6
  const excludeLegacy = new Set<string>()
  for (const idx of [6, 8]) {
    const raw = pilot.sets[idx]
    const tag = hashId(`${pilot.template}|${lvl}|${JSON.stringify(raw)}`)
    excludeLegacy.add(`gen:toefl-academic-reading:set:claude:${tag}`)
  }

  const rdl = await pageDraft('read_daily_life')
  const rcAll = await pageDraft('reading_comprehension')
  const rc = rcAll.filter((s) => !(s.legacy_id && excludeLegacy.has(s.legacy_id)))
  const excluded = rcAll.filter((s) => s.legacy_id && excludeLegacy.has(s.legacy_id))

  const errs: string[] = []
  if (rdl.length !== 100) errs.push(`read_daily_life draft ${rdl.length} ≠ 100`)
  if (rcAll.length !== 100) errs.push(`reading_comprehension draft ${rcAll.length} ≠ 100`)
  if (excluded.length !== 2) errs.push(`排除的 REVIEW 命中 ${excluded.length} ≠ 2（legacy 复算或 pilot 顺序不符）`)
  if (rc.length !== 98) errs.push(`reading_comprehension 合格 ${rc.length} ≠ 98`)

  console.log(`manifest: read_daily_life ${rdl.length} · reading_comprehension ${rc.length} (excluded ${excluded.length}) · total ${rdl.length + rc.length}`)
  for (const e of excluded) console.log(`  excluded REVIEW: ${e.legacy_id}`)
  // 前置断言不满足（如 promote 后 draft 已排空）→ 不写文件直接退出，绝不覆盖已提交的历史清单。
  if (errs.length) { console.error('✗ ' + errs.join('; ')); process.exitCode = 1; return }

  const manifest = {
    generatedAt: new Date().toISOString(),
    phase: 'F2-promote',
    total: rdl.length + rc.length,
    // flat id list consumed by promote-question-sets-v2.ts --manifest（精确、可审、避免超长命令行 --ids）
    setIds: [...rdl.map((s) => s.id), ...rc.map((s) => s.id)],
    expectedDelta: { read_daily_life: rdl.length, reading_comprehension: rc.length },
    excludedReviewPilot: excluded.map((s) => ({ id: s.id, legacy_id: s.legacy_id, reason: 'pilot_review_weak_inference_Q4' })),
    read_daily_life: rdl.map((s) => ({ id: s.id, legacy_id: s.legacy_id, task_type: 'read_daily_life' })),
    reading_comprehension: rc.map((s) => ({ id: s.id, legacy_id: s.legacy_id, task_type: 'reading_comprehension' })),
  }
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8')
  console.log(`✓ 清单已写 ${MANIFEST}（198 = 100 rdl + 98 rc）`)
}
main().catch((e) => { console.error('build-manifest fatal', e?.message ?? e); process.exitCode = 1 })
