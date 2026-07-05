/* ════════════════════════════════════════════════════════════════════════
   qa-question-bank-v2-migration.ts — v2 迁移数据质量门（Phase 8，只读）

   独立于迁移脚本，直接读 v2 库校验已迁移行的不变量：
   - input_mode=choice 的题 choices ≥ 2，且 answer 命中某个 choice id。
   - spell/free_text/speak/listen 的 answer 非空；multi_blank/matching 的 answer 为非空数组。
   - 分组任务（reading/listening/banked_cloze/...）的 active set 必须有 stimulus。
   - question_target_words.word_id 若存在必须在 dictionary_words 中。
   - 任何 active set/item 不得是退役题型（antonym_choice / cet_cloze）。
   - active 听力 set 必须有 active audio_assets，否则应留 draft。
   - 迁移行（legacy_id 以 qb 开头）必须保留 legacy 溯源，且子题父组溯源链完整。

   v2 表未建 → not_applied，退出 0。有错误退出 1。
   用法：npx tsx scripts/qa-question-bank-v2-migration.ts
   ════════════════════════════════════════════════════════════════════════ */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'
import { QBANK_V2_TABLES } from '@/lib/question-bank-v2/schema'
import { isDeprecatedQuestionType } from '@/lib/question-bank/question-type-taxonomy'

const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const SUPABASE_URL = readEnv('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_ROLE = readEnv('SUPABASE_SERVICE_ROLE_KEY')
const OUT = 'reports/qbank-v2-migration-qa.json'

// 分组型 task_type：active set 必须挂材料
const GROUPED_TASK_TYPES = new Set(['reading_comprehension', 'listening_comprehension', 'banked_cloze', 'seven_select', 'cloze_passage', 'grammar_fill', 'para_match'])

function writeOut(payload: Record<string, unknown>) {
  writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), ...payload }, null, 2) + '\n', 'utf8')
}

async function tableExists(db: SupabaseClient, table: string): Promise<boolean> {
  const { error } = await db.from(table).select('*').limit(1)
  return !error
}
async function pageCol<T>(db: SupabaseClient, table: string, cols: string): Promise<T[]> {
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

type SetRow = { id: string; legacy_id: string | null; task_type: string; stimulus_id: string | null; status: string }
type ItemRow = { id: string; legacy_id: string | null; question_set_id: string; input_mode: string; choices: unknown; answer: unknown; status: string }

function answerNonEmpty(a: unknown): boolean {
  if (a == null) return false
  if (typeof a === 'string') return a.trim() !== ''
  if (Array.isArray(a)) return a.length > 0
  return true
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.log('qa-migration: 缺少 Supabase 凭据，按 not_applied 处理')
    writeOut({ status: 'not_applied', reason: 'missing_supabase_credentials' })
    process.exit(0)
  }
  const db = createClient(SUPABASE_URL, SERVICE_ROLE)

  // 探测建表
  const missing: string[] = []
  for (const t of QBANK_V2_TABLES) if (!(await tableExists(db, t))) missing.push(t)
  if (missing.length === QBANK_V2_TABLES.length) {
    console.log('qa-migration: v2 表尚未应用（not_applied）')
    writeOut({ status: 'not_applied', missingTables: missing })
    process.exit(0)
  }
  if (missing.length > 0) {
    console.error(`qa-migration: schema 半应用（partial_applied）: ${missing.join(', ')}`)
    writeOut({ status: 'partial_applied', missingTables: missing })
    process.exit(1)
  }

  const errors: string[] = []
  const sets = await pageCol<SetRow>(db, 'question_sets', 'id, legacy_id, task_type, stimulus_id, status')
  const items = await pageCol<ItemRow>(db, 'question_items', 'id, legacy_id, question_set_id, input_mode, choices, answer, status')
  const setById = new Map(sets.map((s) => [s.id, s]))

  // 仅审视迁移数据（legacy_id 以 qb 开头）；非迁移行交由 validate:qbank-v2
  const migratedSets = sets.filter((s) => (s.legacy_id ?? '').startsWith('qb'))
  const migratedSetIds = new Set(migratedSets.map((s) => s.id))
  const migratedItems = items.filter((i) => migratedSetIds.has(i.question_set_id))

  // 1) choices 数量（choice 题）
  // 2) answer 与 input_mode 匹配
  for (const i of migratedItems) {
    const choices = Array.isArray(i.choices) ? (i.choices as { id: string }[]) : []
    if (i.input_mode === 'choice') {
      if (choices.length < 2) errors.push(`item ${i.id}（choice）choices < 2`)
      const ans = typeof i.answer === 'string' ? i.answer : ''
      if (!ans || !choices.some((c) => String(c.id) === ans)) errors.push(`item ${i.id}（choice）answer 未命中任何 choice id`)
    } else if (i.input_mode === 'multi_blank' || i.input_mode === 'matching') {
      if (!Array.isArray(i.answer) || i.answer.length === 0) errors.push(`item ${i.id}（${i.input_mode}）answer 应为非空数组`)
    } else {
      // spell / free_text / speak / listen
      if (!answerNonEmpty(i.answer)) errors.push(`item ${i.id}（${i.input_mode}）answer 为空`)
    }
    // 7) 溯源链：迁移子题必须有 legacy_id，且父组也保留 legacy_id
    if (!(i.legacy_id ?? '').startsWith('qb')) errors.push(`migrated item ${i.id} 缺 legacy_id 溯源`)
    const parent = setById.get(i.question_set_id)
    if (parent && !(parent.legacy_id ?? '').startsWith('qb')) errors.push(`migrated item ${i.id} 的父 set ${i.question_set_id} 缺 legacy_id`)
  }

  // 3) 分组任务 active set 必须有 stimulus
  for (const s of migratedSets) {
    if (s.status === 'active' && GROUPED_TASK_TYPES.has(s.task_type) && !s.stimulus_id) {
      errors.push(`active set ${s.id}（${s.task_type}）缺 stimulus_id`)
    }
    // 5) 退役题型不得 active
    if (s.status === 'active' && isDeprecatedQuestionType(s.task_type)) {
      errors.push(`active set ${s.id} 为退役题型 ${s.task_type}`)
    }
  }

  // 4) target word 必须存在于 dictionary_words
  const itemIds = new Set(migratedItems.map((i) => i.id))
  const tw = await pageCol<{ question_item_id: string; word_id: string | null }>(db, 'question_target_words', 'id, question_item_id, word_id')
  const migratedTw = tw.filter((r) => itemIds.has(r.question_item_id))
  const referenced = new Set(migratedTw.map((r) => r.word_id).filter((x): x is string => !!x))
  if (referenced.size > 0) {
    const dictIds = new Set((await pageCol<{ id: string }>(db, 'dictionary_words', 'id')).map((r) => r.id))
    for (const wid of referenced) if (!dictIds.has(wid)) errors.push(`question_target_words.word_id "${wid}" 不存在于 dictionary_words`)
  }

  // 6) active 听力 set 必须有 active audio
  const audio = await pageCol<{ stimulus_id: string | null; qa_status: string }>(db, 'audio_assets', 'id, stimulus_id, qa_status')
  const activeAudioStim = new Set(audio.filter((a) => a.qa_status === 'active' && a.stimulus_id).map((a) => a.stimulus_id as string))
  const listenItemSetIds = new Set(migratedItems.filter((i) => i.input_mode === 'listen').map((i) => i.question_set_id))
  for (const s of migratedSets) {
    const isListen = s.task_type === 'listening_comprehension' || listenItemSetIds.has(s.id)
    if (s.status === 'active' && isListen && (!s.stimulus_id || !activeAudioStim.has(s.stimulus_id))) {
      errors.push(`active listening set ${s.id} 无 active audio_assets（应留 draft）`)
    }
  }

  const summary = {
    status: 'applied' as const,
    counts: {
      migratedSets: migratedSets.length,
      migratedItems: migratedItems.length,
      activeMigratedSets: migratedSets.filter((s) => s.status === 'active').length,
      targetWordRefs: referenced.size,
    },
    errors,
    ok: errors.length === 0,
  }
  writeOut(summary)
  console.log('qa-migration: applied')
  console.log(`  migrated sets ${migratedSets.length} · items ${migratedItems.length} · 错误 ${errors.length}`)
  for (const e of errors.slice(0, 50)) console.error(`ERROR ${e}`)
  process.exit(errors.length > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error('qa-migration fatal', e?.message ?? e)
  writeOut({ status: 'error', message: String(e?.message ?? e) })
  process.exit(1)
})
