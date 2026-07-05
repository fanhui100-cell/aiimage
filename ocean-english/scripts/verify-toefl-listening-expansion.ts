/* ════════════════════════════════════════════════════════════════════════
   verify-toefl-listening-expansion.ts — F3 TOEFL Listening 扩容校验（只读，确定性逐条比对）

   Stage: toefl-listening-expansion-2026-07-03
   Scope: choose_a_response (+90, 1 题/套) · listening_comprehension (+90, 3 题/套)。
   均只写 draft（音频与 promote 为独立门控步骤，不在本校验器写入范围）。

   --source（离线）:
     - 两个源文件均解析；每套过 shapeToItems(listening_multi)→ok；
     - choose_a_response 源套数 = 90、每套 1 题；listening_comprehension 源套数 = 90、每套 3 题；
     - 每题恰 4 选项、answer 命中；transcript(passage) 词数在模板界内
       （choose_a_response 25-90；listening_comprehension 110-220）；
     - item input_mode 归一为 'listen'；批内无重复内容；无退役题型。

   --db（需凭据，phase-aware）:
     - source→DB 前向 1:1（确定性 legacy_id）、stage 命中、每 item input_mode='listen'；
     - phase 由 --expect 指定（默认 active = 2026-07-04 owner 委托抽查通过后 promote 的现契约）：
       · --expect=active：本 stage 90+90 全 active；全库两型各 active=100/draft=0；
         本 stage 每 set 的 stimulus 均有 active 音频（90+90 硬断言）；
       · --expect=draft（历史/promote 前重跑）：本 stage 全 draft、全库 draft 各=90；
         active 音频计数仅报告不 fail；
     - 反向本 stage 无孤行；无退役题型；item 状态与 set 一致。

   用法：npx tsx scripts/verify-toefl-listening-expansion.ts --source | --db [--expect=active|draft]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { isDeprecatedQuestionType } from '@/lib/question-bank/question-type-taxonomy'
import { shapeToItems, countWords, type ShapeTemplate, type DraftChoice } from '@/lib/exam-task-templates/shape'

const STAGE = 'toefl-listening-expansion-2026-07-03'
const DIR = `data/generated-question-sets/${STAGE}`
const TPLDIR = 'data/exam-task-templates'
const PACKS = [
  { template: 'toefl-choose-a-response', taskType: 'choose_a_response', source: 'toefl-choose-a-response-90.json', expectSets: 90, items: [1, 1] as [number, number], words: [25, 90] as [number, number], poolTotal: 100 },
  { template: 'toefl-listening-mcq', taskType: 'listening_comprehension', source: 'toefl-listening-mcq-90.json', expectSets: 90, items: [3, 3] as [number, number], words: [110, 220] as [number, number], poolTotal: 100 },
]

const MODE_SOURCE = process.argv.includes('--source')
const MODE_DB = process.argv.includes('--db')
// phase：默认 active（2026-07-04 owner 委托抽查通过后 promote 的现契约）；--expect=draft 供历史重现。
const EXPECT: 'active' | 'draft' = (process.argv.find((a) => a.startsWith('--expect='))?.slice(9) === 'draft') ? 'draft' : 'active'
const errors: string[] = []
const err = (m: string) => errors.push(m)
function hashId(s: string): string { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return (h >>> 0).toString(36) }

interface Template { taskType: string; skill: string; itemCount: number; optionCount: number; answerSchema: Record<string, unknown>; stimulusRequirements?: Record<string, unknown>; copyrightPolicy: string }
interface AuthoredFile { template: string; level?: number; sets: Record<string, unknown>[] }

function loadTpl(name: string): Template { return JSON.parse(readFileSync(`${TPLDIR}/${name}.json`, 'utf8')) as Template }

function sourceLegacyIds(pack: typeof PACKS[number]): string[] {
  const t = loadTpl(pack.template)
  if (t.copyrightPolicy !== 'original_only') err(`${pack.template}: copyrightPolicy 非 original_only`)
  if (isDeprecatedQuestionType(t.taskType)) err(`${pack.template}: 退役题型`)
  const st: ShapeTemplate = { taskType: t.taskType, skill: t.skill, itemCount: t.itemCount, optionCount: t.optionCount, answerSchema: t.answerSchema, stimulusRequirements: t.stimulusRequirements }
  const af = JSON.parse(readFileSync(`${DIR}/${pack.source}`, 'utf8')) as AuthoredFile
  const level = af.level ?? 6
  if (af.sets.length !== pack.expectSets) err(`${pack.template}: 源套数 ${af.sets.length} ≠ ${pack.expectSets}`)
  const seen = new Set<string>()
  const ids: string[] = []
  let idx = 0
  for (const raw of af.sets) {
    idx++
    const out = shapeToItems(st, raw)
    if (!out.ok) { err(`${pack.template}#${idx}: shape 失败 ${out.reject}`); continue }
    if (out.result.items.length < pack.items[0] || out.result.items.length > pack.items[1]) err(`${pack.template}#${idx}: 题数 ${out.result.items.length}`)
    for (const it of out.result.items) {
      if (it.inputMode !== 'listen') err(`${pack.template}#${idx}: input_mode=${it.inputMode}（须 listen）`)
      const ch = it.choices as DraftChoice[]
      if (!Array.isArray(ch) || ch.length !== 4) err(`${pack.template}#${idx}: 选项数 ${ch?.length}`)
      if (!ch.map((c) => String(c.id)).includes(String(it.answer))) err(`${pack.template}#${idx}: answer 未命中`)
    }
    const wc = countWords(String((raw as { passage?: string }).passage ?? ''))
    if (wc < pack.words[0] || wc > pack.words[1]) err(`${pack.template}#${idx}: transcript 词数 ${wc} 出界 ${pack.words[0]}-${pack.words[1]}`)
    const tag = hashId(`${af.template}|${level}|${JSON.stringify(raw)}`)
    const legacy = `gen:${pack.template}:set:claude:${tag}`
    if (seen.has(legacy)) err(`${pack.template}#${idx}: 批内重复内容`)
    seen.add(legacy)
    ids.push(legacy)
  }
  return ids
}

async function pageSets(db: SupabaseClient) {
  const rows: { id: string; legacy_id: string | null; task_type: string; status: string; stimulus_id: string | null; qa_flags: Record<string, unknown> | null }[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('question_sets').select('id, legacy_id, task_type, status, stimulus_id, qa_flags').eq('level', 6).in('task_type', PACKS.map((p) => p.taskType)).range(from, from + 999)
    if (error) throw new Error(error.message)
    const page = (data ?? []) as typeof rows
    rows.push(...page); if (page.length < 1000) break
  }
  return rows
}

function verifySource() {
  for (const pack of PACKS) {
    if (!existsSync(`${DIR}/${pack.source}`)) { err(`源缺失 ${DIR}/${pack.source}`); continue }
    const ids = sourceLegacyIds(pack)
    console.log(`  [source] ${pack.template}: 套数 ${ids.length}/${pack.expectSets}`)
  }
}

async function verifyDb() {
  const env = existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : ''
  const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
  const url = readEnv('NEXT_PUBLIC_SUPABASE_URL'); const key = readEnv('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) { err('--db 需 Supabase 凭据'); return }
  const db = createClient(url, key)
  const all = await pageSets(db)
  const byLegacy = new Map(all.filter((s) => s.legacy_id).map((s) => [s.legacy_id as string, s]))
  const stageSets = all.filter((s) => (s.qa_flags as { stage?: string } | null)?.stage === STAGE)
  // active audio for stage stimuli (informational)
  const stageStim = [...new Set(stageSets.map((s) => s.stimulus_id).filter((x): x is string => !!x))]
  const activeAudio = new Set<string>()
  for (let i = 0; i < stageStim.length; i += 200) {
    const chunk = stageStim.slice(i, i + 200); if (!chunk.length) break
    const { data } = await db.from('audio_assets').select('stimulus_id, qa_status').in('stimulus_id', chunk).eq('qa_status', 'active')
    for (const a of (data ?? []) as { stimulus_id: string | null }[]) if (a.stimulus_id) activeAudio.add(a.stimulus_id)
  }

  const expected = new Set<string>()
  for (const pack of PACKS) {
    const ids = sourceLegacyIds(pack)
    let okFwd = 0
    for (const legacy of ids) {
      expected.add(legacy)
      const s = byLegacy.get(legacy)
      if (!s) { err(`${pack.template}: 源无对应 DB set（${legacy}）`); continue }
      // phase-aware：本 stage 90+90 全部在 2026-07-04 promote 清单内 → expect=active 时须 active。
      if (s.status !== EXPECT) err(`${pack.template}: ${legacy} status=${s.status}（须 ${EXPECT}）`)
      if ((s.qa_flags as { stage?: string } | null)?.stage !== STAGE) err(`${pack.template}: ${legacy} stage≠${STAGE}`)
      const { data: items } = await db.from('question_items').select('input_mode, choices, answer, status').eq('question_set_id', s.id)
      const its = (items ?? []) as { input_mode: string; choices: unknown; answer: unknown; status: string }[]
      if (its.length < pack.items[0] || its.length > pack.items[1]) err(`${pack.template}: ${legacy} item 数 ${its.length}`)
      for (const it of its) {
        if (it.input_mode !== 'listen') err(`${pack.template}: ${legacy} input_mode=${it.input_mode}`)
        if (it.status !== s.status) err(`${pack.template}: ${legacy} item status=${it.status}（须与 set 一致 ${s.status}）`)
        const ch = Array.isArray(it.choices) ? (it.choices as DraftChoice[]) : []
        if (ch.length !== 4) err(`${pack.template}: ${legacy} 选项数 ${ch.length}`)
        if (!ch.map((c) => String(c.id)).includes(String(it.answer))) err(`${pack.template}: ${legacy} answer 未命中`)
      }
      okFwd++
    }
    const draftN = all.filter((s) => s.task_type === pack.taskType && s.status === 'draft').length
    const activeN = all.filter((s) => s.task_type === pack.taskType && s.status === 'active').length
    if (draftN + activeN !== pack.poolTotal) err(`${pack.taskType}: 全库 draft+active ${draftN + activeN} ≠ ${pack.poolTotal}`)
    const wantDraft = EXPECT === 'active' ? 0 : pack.expectSets
    const wantActive = pack.poolTotal - wantDraft
    if (draftN !== wantDraft) err(`${pack.taskType}: 全库 draft ${draftN} ≠ ${wantDraft}（expect=${EXPECT}）`)
    if (activeN !== wantActive) err(`${pack.taskType}: 全库 active ${activeN} ≠ ${wantActive}（expect=${EXPECT}）`)
    const activeStage = stageSets.filter((s) => s.task_type === pack.taskType && s.status === 'active').length
    const wantStageActive = EXPECT === 'active' ? pack.expectSets : 0
    if (activeStage !== wantStageActive) err(`${pack.taskType}: 本 stage active=${activeStage}（expect=${EXPECT} 须 ${wantStageActive}）`)
    const audioN = stageSets.filter((s) => s.task_type === pack.taskType && s.stimulus_id && activeAudio.has(s.stimulus_id)).length
    // expect=active 时音频为硬条件（promote 已依赖）；expect=draft 时仅报告
    if (EXPECT === 'active' && audioN !== pack.expectSets) err(`${pack.taskType}: 本 stage active 音频 ${audioN} ≠ ${pack.expectSets}`)
    console.log(`  [db] ${pack.template}: 前向 ${okFwd}/${ids.length} · 全库 active ${activeN}/${wantActive} · draft ${draftN}/${wantDraft} · 本stage active音频 ${audioN}（expect=${EXPECT}）`)
  }
  let orphan = 0
  for (const s of stageSets) { if (!s.legacy_id || !expected.has(s.legacy_id)) { orphan++; err(`DB-outside-source：${s.legacy_id ?? s.id}`) } if (isDeprecatedQuestionType(s.task_type)) err(`stage 含退役题型 ${s.task_type}`) }
  if (stageSets.length !== expected.size) err(`stage DB set ${stageSets.length} ≠ 源期望 ${expected.size}`)
  console.log(`  [db] stage sets ${stageSets.length} · 期望 ${expected.size} · orphan ${orphan}`)
}

async function main() {
  if (!MODE_SOURCE && !MODE_DB) { console.error('用法：--source 或 --db'); process.exitCode = 1; return }
  if (MODE_SOURCE) { console.log('verify-toefl-listening-expansion --source'); verifySource() }
  if (MODE_DB) { console.log('verify-toefl-listening-expansion --db'); await verifyDb() }
  if (errors.length) { console.error(`\n✗ 校验失败（${errors.length}）：`); for (const e of errors) console.error(`  ✗ ${e}`); process.exitCode = 1 }
  else console.log('\n✓ verify-toefl-listening-expansion 通过')
}
main().catch((e) => { console.error('verify-toefl-listening-expansion fatal', e?.message ?? e); process.exitCode = 1 })
