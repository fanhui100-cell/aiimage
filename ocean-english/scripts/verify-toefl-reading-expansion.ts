/* ════════════════════════════════════════════════════════════════════════
   verify-toefl-reading-expansion.ts — F1 TOEFL Reading 扩容校验（只读，确定性逐条比对）

   Stage: toefl-reading-expansion-2026-07-03
   Scope: read_daily_life (+90) · reading_comprehension (academic, +90)。均只写 draft，不 promote。

   --source（离线，无需 DB）:
     - 两个源文件均可解析；每套过 shapeToItems（reading_multi）→ ok；
     - read_daily_life 源套数 = 90；reading_comprehension 源套数 = 90；
     - 每题恰 4 选项；answer 命中某选项（shape 归一为 'a'-'d'）；
     - read_daily_life 每套 2-3 题；academic 每套 4 题；
     - 无退役题型（antonym_choice / cet_cloze）；
     - 源内 legacy_id（确定性哈希）互不重复（无套间重复内容）。

   --db（需 Supabase 凭据，phase-aware）:
     - source→DB 前向 1:1：每条源套按确定性 legacy_id 恰对应一个 DB set；
     - DB→source 反向：本 stage（qa_flags.stage===STAGE）的每个 DB set 必属源集合（无 DB-outside-source）；
     - phase 由 --expect 指定（默认 active = 2026-07-04 owner 批准 promote 后的现契约）：
       · --expect=active：本 stage 全部 set/item 为 active；全库 read_daily_life active=100/draft=0，
         reading_comprehension active=98/draft=2（2 个 pilot REVIEW 弱推断 Q4 被排除、保持 draft）；
       · --expect=draft（历史/promote 前重跑）：本 stage 全 draft；全库 draft 各=100、active=0；
     - 每 item 恰 4 choices，answer 命中 choice id，item 状态与 set 一致；无退役题型。

   用法：
     npx tsx scripts/verify-toefl-reading-expansion.ts --source
     npx tsx scripts/verify-toefl-reading-expansion.ts --db [--expect=active|draft]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { isDeprecatedQuestionType } from '@/lib/question-bank/question-type-taxonomy'
import { shapeToItems, type ShapeTemplate, type DraftChoice } from '@/lib/exam-task-templates/shape'

const STAGE = 'toefl-reading-expansion-2026-07-03'
const DIR = `data/generated-question-sets/${STAGE}`
const TPLDIR = 'data/exam-task-templates'
// heldDraftWhenActive：--expect=active 时该 task 全库允许（且必须）保留的 draft 数。
// 2026-07-04 Phase1：2 条 pilot REVIEW 弱推断 Q4（plankton/desert）已重写、复审 PASS 并经 owner 批准
// promote → reading_comprehension 100 active / 0 draft（此前为 98+2 held）。
const PACKS = [
  { template: 'toefl-read-daily-life', taskType: 'read_daily_life', source: 'toefl-read-daily-life-90.json', expectSets: 90, itemsRange: [2, 3] as [number, number], poolTotal: 100, heldDraftWhenActive: 0 },
  { template: 'toefl-academic-reading', taskType: 'reading_comprehension', source: 'toefl-academic-reading-90.json', expectSets: 90, itemsRange: [4, 4] as [number, number], poolTotal: 100, heldDraftWhenActive: 0 },
]

const MODE_SOURCE = process.argv.includes('--source')
const MODE_DB = process.argv.includes('--db')
// phase：默认 active（2026-07-04 owner 批准 promote 后的现契约）；--expect=draft 供历史重现。
const EXPECT: 'active' | 'draft' = (process.argv.find((a) => a.startsWith('--expect='))?.slice(9) === 'draft') ? 'draft' : 'active'

// 复刻 importer 的确定性 hashId（与 import-authored-question-sets-v2.ts 完全一致）
function hashId(s: string): string { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return (h >>> 0).toString(36) }

interface Template { taskType: string; skill: string; itemCount: number; optionCount: number; answerSchema: Record<string, unknown>; stimulusRequirements?: Record<string, unknown>; copyrightPolicy: string }
interface AuthoredFile { template: string; level?: number; sets: Record<string, unknown>[] }

const errors: string[] = []
const err = (m: string) => errors.push(m)

function loadTemplate(name: string): Template { return JSON.parse(readFileSync(`${TPLDIR}/${name}.json`, 'utf8')) as Template }
function toShapeTemplate(t: Template): ShapeTemplate { return { taskType: t.taskType, skill: t.skill, itemCount: t.itemCount, optionCount: t.optionCount, answerSchema: t.answerSchema, stimulusRequirements: t.stimulusRequirements } }

/** 计算某 pack 内每套的确定性 set legacy_id（与 importer 一致）。 */
function sourceLegacyIds(pack: typeof PACKS[number]): { legacyId: string; itemCount: number }[] {
  const t = loadTemplate(pack.template)
  if (t.copyrightPolicy !== 'original_only') err(`${pack.template}: copyrightPolicy 非 original_only`)
  if (isDeprecatedQuestionType(t.taskType)) err(`${pack.template}: 退役题型 ${t.taskType}`)
  const st = toShapeTemplate(t)
  const af = JSON.parse(readFileSync(`${DIR}/${pack.source}`, 'utf8')) as AuthoredFile
  const level = af.level ?? 6
  const out: { legacyId: string; itemCount: number }[] = []
  const seen = new Set<string>()
  if (af.sets.length !== pack.expectSets) err(`${pack.template}: 源套数 ${af.sets.length} ≠ ${pack.expectSets}`)
  let idx = 0
  for (const raw of af.sets) {
    idx++
    const outcome = shapeToItems(st, raw)
    if (!outcome.ok) { err(`${pack.template}#${idx}: shape 失败 ${outcome.reject}`); continue }
    // 每题 4 选项 + answer 命中（shape 已归一，这里做冗余强断言）
    for (const it of outcome.result.items) {
      if (it.inputMode !== 'choice') err(`${pack.template}#${idx}: item input_mode=${it.inputMode}（须 choice）`)
      if (!Array.isArray(it.choices) || it.choices.length !== 4) err(`${pack.template}#${idx}: 选项数 ${(it.choices as unknown[])?.length}（须 4）`)
      const ids = (it.choices as DraftChoice[]).map((c) => String(c.id))
      if (!ids.includes(String(it.answer))) err(`${pack.template}#${idx}: answer ${String(it.answer)} 未命中选项 [${ids.join(',')}]`)
    }
    const n = outcome.result.items.length
    if (n < pack.itemsRange[0] || n > pack.itemsRange[1]) err(`${pack.template}#${idx}: 题数 ${n}（须 ${pack.itemsRange[0]}-${pack.itemsRange[1]}）`)
    const tag = hashId(`${af.template}|${level}|${JSON.stringify(raw)}`)
    const legacyId = `gen:${t.taskType === 'read_daily_life' ? 'toefl-read-daily-life' : 'toefl-academic-reading'}:set:claude:${tag}`
    if (seen.has(legacyId)) err(`${pack.template}#${idx}: 源内重复内容（legacy ${legacyId}）`)
    seen.add(legacyId)
    out.push({ legacyId, itemCount: n })
  }
  return out
}

async function pageSets(db: SupabaseClient): Promise<{ id: string; legacy_id: string | null; task_type: string; status: string; qa_flags: Record<string, unknown> | null }[]> {
  const rows: { id: string; legacy_id: string | null; task_type: string; status: string; qa_flags: Record<string, unknown> | null }[] = []
  for (let from = 0; ; from += 1000) {
    // 必须限定 level=6（TOEFL）：reading_comprehension 是跨考试共用 task_type（cet4/SAT 等有数百 active），
    // 不过滤会把它们混入全库聚合断言（历史上 draft 聚合碰巧只有 TOEFL 有 draft 才没暴露）。
    const { data, error } = await db.from('question_sets').select('id, legacy_id, task_type, status, qa_flags').eq('level', 6).in('task_type', PACKS.map((p) => p.taskType)).range(from, from + 999)
    if (error) throw new Error(error.message)
    const page = (data ?? []) as typeof rows
    rows.push(...page)
    if (page.length < 1000) break
  }
  return rows
}

function verifySource() {
  for (const pack of PACKS) {
    if (!existsSync(`${DIR}/${pack.source}`)) { err(`源文件缺失：${DIR}/${pack.source}`); continue }
    const ids = sourceLegacyIds(pack)
    console.log(`  [source] ${pack.template}: 套数 ${ids.length}/${pack.expectSets} · 题数合计 ${ids.reduce((a, b) => a + b.itemCount, 0)}`)
  }
}

async function verifyDb() {
  const env = existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : ''
  const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
  const url = readEnv('NEXT_PUBLIC_SUPABASE_URL'); const key = readEnv('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) { err('--db 需 Supabase 凭据（.env.local）'); return }
  const db = createClient(url, key)
  const allSets = await pageSets(db)
  const byLegacy = new Map(allSets.filter((s) => s.legacy_id).map((s) => [s.legacy_id as string, s]))

  // DB→source 反向集合：本 stage 的所有 DB set
  const stageSets = allSets.filter((s) => (s.qa_flags as { stage?: string } | null)?.stage === STAGE)

  const expectedLegacy = new Set<string>()
  for (const pack of PACKS) {
    const ids = sourceLegacyIds(pack)
    let okFwd = 0
    for (const { legacyId } of ids) {
      expectedLegacy.add(legacyId)
      const dbSet = byLegacy.get(legacyId)
      if (!dbSet) { err(`${pack.template}: 源套无对应 DB set（legacy ${legacyId}）`); continue }
      // phase-aware：本 stage 90+90 全部在 2026-07-04 promote 清单内 → expect=active 时须 active。
      if (dbSet.status !== EXPECT) err(`${pack.template}: ${legacyId} status=${dbSet.status}（须 ${EXPECT}）`)
      if ((dbSet.qa_flags as { stage?: string } | null)?.stage !== STAGE) err(`${pack.template}: ${legacyId} qa_flags.stage≠${STAGE}`)
      // 每题 4 choices + answer 命中 + item 状态与 set 一致
      const { data: items } = await db.from('question_items').select('input_mode, choices, answer, status').eq('question_set_id', dbSet.id)
      const its = (items ?? []) as { input_mode: string; choices: unknown; answer: unknown; status: string }[]
      const n = pack.itemsRange
      if (its.length < n[0] || its.length > n[1]) err(`${pack.template}: ${legacyId} DB item 数 ${its.length}（须 ${n[0]}-${n[1]}）`)
      for (const it of its) {
        if (it.status !== dbSet.status) err(`${pack.template}: ${legacyId} item status=${it.status}（须与 set 一致 ${dbSet.status}）`)
        const ch = Array.isArray(it.choices) ? (it.choices as DraftChoice[]) : []
        if (ch.length !== 4) err(`${pack.template}: ${legacyId} item 选项数 ${ch.length}（须 4）`)
        const idset = ch.map((c) => String(c.id))
        if (!idset.includes(String(it.answer))) err(`${pack.template}: ${legacyId} answer ${String(it.answer)} 未命中 [${idset.join(',')}]`)
      }
      okFwd++
    }
    // 全库聚合（该 task_type 所有 stage：pilot 10 + 扩容 90 = 100 池）
    const totalDraft = allSets.filter((s) => s.task_type === pack.taskType && s.status === 'draft').length
    const totalActive = allSets.filter((s) => s.task_type === pack.taskType && s.status === 'active').length
    if (totalDraft + totalActive !== pack.poolTotal) err(`${pack.taskType}: 全库 draft+active ${totalDraft + totalActive} ≠ ${pack.poolTotal}`)
    const wantDraft = EXPECT === 'active' ? pack.heldDraftWhenActive : pack.poolTotal
    const wantActive = pack.poolTotal - wantDraft
    if (totalDraft !== wantDraft) err(`${pack.taskType}: 全库 draft ${totalDraft} ≠ ${wantDraft}（expect=${EXPECT}）`)
    if (totalActive !== wantActive) err(`${pack.taskType}: 全库 active ${totalActive} ≠ ${wantActive}（expect=${EXPECT}）`)
    const activeThisStage = stageSets.filter((s) => s.task_type === pack.taskType && s.status === 'active').length
    const wantStageActive = EXPECT === 'active' ? pack.expectSets : 0
    if (activeThisStage !== wantStageActive) err(`${pack.taskType}: 本 stage active=${activeThisStage}（expect=${EXPECT} 须 ${wantStageActive}）`)
    console.log(`  [db] ${pack.template}: source→DB 前向 ${okFwd}/${ids.length} · 全库 active ${totalActive}/${wantActive} · draft ${totalDraft}/${wantDraft}（expect=${EXPECT}）`)
  }

  // DB→source：本 stage 每个 set 必属源集合（无 DB-outside-source）
  let orphan = 0
  for (const s of stageSets) {
    if (!s.legacy_id || !expectedLegacy.has(s.legacy_id)) { orphan++; err(`DB-outside-source：stage set ${s.legacy_id ?? s.id} 不在源集合`) }
    if (isDeprecatedQuestionType(s.task_type)) err(`stage 含退役题型 ${s.task_type}`)
  }
  console.log(`  [db] stage sets 总数 ${stageSets.length} · 期望 ${expectedLegacy.size} · orphan ${orphan}`)
  if (stageSets.length !== expectedLegacy.size) err(`stage DB set 数 ${stageSets.length} ≠ 源期望 ${expectedLegacy.size}`)
}

async function main() {
  if (!MODE_SOURCE && !MODE_DB) { console.error('用法：--source 或 --db'); process.exitCode = 1; return }
  if (MODE_SOURCE) { console.log('verify-toefl-reading-expansion --source'); verifySource() }
  if (MODE_DB) { console.log('verify-toefl-reading-expansion --db'); await verifyDb() }
  if (errors.length) { console.error(`\n✗ 校验失败（${errors.length}）：`); for (const e of errors) console.error(`  ✗ ${e}`); process.exitCode = 1 }
  else console.log('\n✓ verify-toefl-reading-expansion 通过')
}
main().catch((e) => { console.error('verify-toefl-reading-expansion fatal', e?.message ?? e); process.exitCode = 1 })
