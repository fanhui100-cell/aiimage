/* ════════════════════════════════════════════════════════════════════════
   build-toefl-reading-q4fix-promote-manifest.ts — 2 条已修 Q4 的精确晋级清单（只读）

   仅处理 reading_comprehension 全库剩余的 2 个 draft（上轮 e880378 重写 Q4、独立复审 PASS 的
   plankton/desert 学术阅读）。前置断言：恰 2 个 draft，且每个都有 4 个 choice item、answer 命中、
   input_mode='choice'、无退役型；否则不写文件退 1（防止误纳其它 draft / 覆盖历史清单）。
   输出：reports/toefl-reading-q4fix-promote-manifest-2026-07-04.json（setIds[]）。
   用法：npx tsx scripts/build-toefl-reading-q4fix-promote-manifest.ts
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const env = existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : ''
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(readEnv('NEXT_PUBLIC_SUPABASE_URL'), readEnv('SUPABASE_SERVICE_ROLE_KEY'))
const MANIFEST = 'reports/toefl-reading-q4fix-promote-manifest-2026-07-04.json'
const EXPECT_DRAFT = 2

async function main() {
  const rows: { id: string; legacy_id: string | null; status: string; stimulus_id: string | null }[] = []
  for (let f = 0; ; f += 1000) {
    const { data, error } = await db.from('question_sets').select('id, legacy_id, status, stimulus_id').eq('level', 6).eq('task_type', 'reading_comprehension').range(f, f + 999)
    if (error) throw new Error(error.message)
    rows.push(...(data as typeof rows)); if (data!.length < 1000) break
  }
  const active = rows.filter((r) => r.status === 'active').length
  const drafts = rows.filter((r) => r.status === 'draft')
  const errs: string[] = []
  if (active !== 98) errs.push(`reading_comprehension active ${active} ≠ 98（promote 前应为 98）`)
  if (drafts.length !== EXPECT_DRAFT) errs.push(`draft ${drafts.length} ≠ ${EXPECT_DRAFT}`)

  // 逐条内容门：4 choice item + answer 命中 + input_mode=choice（避免误纳残缺/异常 draft）
  for (const d of drafts) {
    const { data: items, error } = await db.from('question_items').select('input_mode, choices, answer, status').eq('question_set_id', d.id)
    if (error) throw new Error(error.message)
    const its = (items ?? []) as { input_mode: string; choices: unknown; answer: unknown; status: string }[]
    if (its.length !== 4) errs.push(`${d.legacy_id}: item 数 ${its.length} ≠ 4`)
    for (const it of its) {
      if (it.input_mode !== 'choice') errs.push(`${d.legacy_id}: input_mode=${it.input_mode}`)
      if (it.status !== 'draft') errs.push(`${d.legacy_id}: item 非 draft`)
      const ch = Array.isArray(it.choices) ? (it.choices as { id: string }[]) : []
      if (ch.length !== 4) errs.push(`${d.legacy_id}: 选项数 ${ch.length} ≠ 4`)
      if (!ch.map((c) => String(c.id)).includes(String(it.answer))) errs.push(`${d.legacy_id}: answer 未命中`)
    }
    if (!d.stimulus_id) errs.push(`${d.legacy_id}: 缺 stimulus`)
  }

  console.log(`reading_comprehension active=${active} draft=${drafts.length}`)
  for (const d of drafts) console.log(`  draft: ${d.legacy_id}`)
  if (errs.length) { console.error('✗ ' + errs.join('; ')); process.exitCode = 1; return }

  const manifest = {
    generatedAt: new Date().toISOString(),
    phase: 'reading-q4fix-promote',
    approval: 'owner 2026-07-04 Phase1: promote 修好的 2 条 academic reading Q4 draft',
    note: '上轮 e880378 重写 Q4(plankton/desert)、独立对抗复审 PASS(unique+realInference)',
    total: drafts.length,
    setIds: drafts.map((d) => d.id),
    expectedActiveAfter: { reading_comprehension: 100 },
    sets: drafts.map((d) => ({ id: d.id, legacy_id: d.legacy_id })),
  }
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8')
  console.log(`✓ 清单已写 ${MANIFEST}（2 条）`)
}
main().catch((e) => { console.error('build-manifest fatal', e?.message ?? e); process.exitCode = 1 })
