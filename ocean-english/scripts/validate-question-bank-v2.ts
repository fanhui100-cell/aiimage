/* ════════════════════════════════════════════════════════════════════════
   validate-question-bank-v2.ts — v2 题库完整性校验（Phase 3，只读）

   - v2 表未建：报告 not_applied，退出 0（schema 尚未应用属正常）。
   - v2 表已建：校验 active 数据完整性，写 reports/question-bank-v2-validation.json，
     有完整性错误退出 1，否则退出 0。

   用法：npm run validate:qbank-v2
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'
import { QBANK_V2_TABLES } from '@/lib/question-bank-v2/schema'

const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const SUPABASE_URL = readEnv('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_ROLE = readEnv('SUPABASE_SERVICE_ROLE_KEY')

const OUT = 'reports/question-bank-v2-validation.json'

function writeOut(payload: Record<string, unknown>) {
  writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), ...payload }, null, 2) + '\n', 'utf8')
}

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.log('validate-question-bank-v2: 缺少 Supabase 凭据，按 not_applied 处理')
  writeOut({ status: 'not_applied', reason: 'missing_supabase_credentials' })
  process.exit(0)
}

const db = createClient(SUPABASE_URL, SERVICE_ROLE)

async function tableExists(table: string): Promise<boolean> {
  // 用真实 GET（非 HEAD）探测：缺表时 PostgREST 才会回带可解析的错误体。
  const { error } = await db.from(table).select('*').limit(1)
  return !error
}

async function pageCol<T>(table: string, cols: string, orderBy: string): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select(cols).order(orderBy, { ascending: true }).range(from, from + 999)
    if (error) throw new Error(`${table}: ${error.message}`)
    const rows = (data ?? []) as T[]
    out.push(...rows)
    if (rows.length < 1000) break
  }
  return out
}

type SetRow = { id: string; task_template_id: string | null; stimulus_id: string | null; task_type: string; status: string }
type ItemRow = { id: string; question_set_id: string; input_mode: string; choices: unknown; answer: unknown; status: string }
type TemplateRow = { id: string; group_mode: string; input_mode: string }

async function main() {
  // 1) 探测建表情况
  const missing: string[] = []
  for (const t of QBANK_V2_TABLES) {
    if (!(await tableExists(t))) missing.push(t)
  }
  if (missing.length === QBANK_V2_TABLES.length) {
    // 全缺失 = schema 尚未应用，属正常
    console.log('validate-question-bank-v2: v2 表尚未应用（not_applied）')
    writeOut({ status: 'not_applied', missingTables: missing })
    process.exit(0)
  }
  if (missing.length > 0) {
    // 部分建表 = schema 半应用（很可能 SQL 执行到一半失败：FK/RLS 报错）。
    // 必须判失败，避免「建了一半的表」让 CI 误绿。
    const present = QBANK_V2_TABLES.filter((t) => !missing.includes(t))
    console.error(`validate-question-bank-v2: schema 半应用（partial_applied）。present ${present.length} / missing ${missing.length}: ${missing.join(', ')}`)
    writeOut({ status: 'partial_applied', presentTables: present, missingTables: missing })
    process.exit(1)
  }

  // 2) 已建表 → active 完整性校验
  const errors: string[] = []

  const sets = await pageCol<SetRow>('question_sets', 'id, task_template_id, stimulus_id, task_type, status', 'id')
  const items = await pageCol<ItemRow>('question_items', 'id, question_set_id, input_mode, choices, answer, status', 'id')
  const templates = await pageCol<TemplateRow>('task_templates', 'id, group_mode, input_mode', 'id')
  const templateById = new Map(templates.map((t) => [t.id, t]))

  const activeSets = sets.filter((s) => s.status === 'active')
  const activeItems = items.filter((i) => i.status === 'active')
  const activeItemSetIds = new Set(activeItems.map((i) => i.question_set_id))

  // 2.1 active set 必须至少有 1 个 active item
  for (const s of activeSets) {
    if (!activeItemSetIds.has(s.id)) errors.push(`active question_set ${s.id} 无 active question_item`)
  }

  // 2.2 group_mode=set 的任务必须有 stimulus
  for (const s of activeSets) {
    const tpl = s.task_template_id ? templateById.get(s.task_template_id) : undefined
    if (tpl?.group_mode === 'set' && !s.stimulus_id) {
      errors.push(`active question_set ${s.id}（template ${tpl.id} group_mode=set）缺 stimulus_id`)
    }
  }

  // 2.3 active listening set 必须有 active audio
  const audio = await pageCol<{ stimulus_id: string | null; qa_status: string }>('audio_assets', 'stimulus_id, qa_status', 'id')
  const activeAudioStimuli = new Set(audio.filter((a) => a.qa_status === 'active' && a.stimulus_id).map((a) => a.stimulus_id as string))
  const isListening = (s: SetRow) => {
    if (s.task_type === 'listening_comprehension') return true
    const tpl = s.task_template_id ? templateById.get(s.task_template_id) : undefined
    return tpl?.input_mode === 'listen'
  }
  for (const s of activeSets.filter(isListening)) {
    if (!s.stimulus_id || !activeAudioStimuli.has(s.stimulus_id)) {
      errors.push(`active listening question_set ${s.id} 无 active audio_assets`)
    }
  }

  // 2.4 choices/answer 形状与 input_mode 匹配（active item）
  for (const i of activeItems) {
    const choices = Array.isArray(i.choices) ? i.choices : []
    const answerEmpty = i.answer == null || (typeof i.answer === 'string' && i.answer.trim() === '')
    if (i.input_mode === 'choice') {
      if (choices.length < 2) errors.push(`active question_item ${i.id}（choice）choices < 2`)
      if (answerEmpty) errors.push(`active question_item ${i.id}（choice）answer 缺失`)
    } else if (i.input_mode === 'multi_blank' || i.input_mode === 'matching') {
      if (!Array.isArray(i.answer)) errors.push(`active question_item ${i.id}（${i.input_mode}）answer 应为数组`)
    } else {
      // spell / free_text / speak / listen
      if (answerEmpty) errors.push(`active question_item ${i.id}（${i.input_mode}）answer 缺失`)
    }
  }

  // 2.5 question_target_words.word_id 若存在必须在 dictionary_words 中
  const qtw = await pageCol<{ word_id: string | null }>('question_target_words', 'word_id', 'id')
  const referencedWordIds = new Set(qtw.map((r) => r.word_id).filter((x): x is string => !!x))
  if (referencedWordIds.size > 0) {
    const dictIds = new Set((await pageCol<{ id: string }>('dictionary_words', 'id', 'id')).map((r) => r.id))
    for (const wid of referencedWordIds) {
      if (!dictIds.has(wid)) errors.push(`question_target_words.word_id "${wid}" 不存在于 dictionary_words`)
    }
  }

  const summary = {
    status: 'applied' as const,
    counts: {
      questionSets: sets.length,
      activeSets: activeSets.length,
      questionItems: items.length,
      activeItems: activeItems.length,
      taskTemplates: templates.length,
      targetWordRefs: referencedWordIds.size,
    },
    errors,
    ok: errors.length === 0,
  }
  writeOut(summary)

  console.log('validate-question-bank-v2: applied')
  console.log(`  active sets ${activeSets.length} · active items ${activeItems.length} · 错误 ${errors.length}`)
  for (const e of errors.slice(0, 50)) console.error(`ERROR ${e}`)
  process.exit(errors.length > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error('fatal', e?.message ?? e)
  writeOut({ status: 'error', message: String(e?.message ?? e) })
  process.exit(1)
})
