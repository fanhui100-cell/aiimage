/* ════════════════════════════════════════════════════════════════════════
   migrate-question-bank-v1-to-v2.ts — v1 question_bank → v2 题库迁移（Phase 8）

   安全契约：
   - 默认 dry-run：只读 v1 + 算迁移计划/报告，绝不写库。
   - 仅 --apply 才写 v2（stimuli / audio_assets / question_sets / question_items /
     question_target_words）。绝不删除或改动 v1 question_bank。
   - v2 表未建：dry-run 报 not_applied，退出 0；--apply 拒绝并报错，退出 1。
   - 默认 --status=draft；--status=active 必须逐行过 QA，未过的降级为 draft（绝不上 active）。
   - 退役题型（antonym_choice / cet_cloze）只入报告，永不迁为 active。
   - legacy_id 溯源；按 legacy_id 去重，已迁移的不重复写（可重复执行）。
   - 不复制真题：仅搬运 question_bank 已有 LexiOcean 原创内容，结构不变。

   用法：
     npx tsx scripts/migrate-question-bank-v1-to-v2.ts [--apply] [--limit=N] \
       [--types=en_to_zh,reading_comprehension] [--status=draft|reviewed|active]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'
import { normalizeQuestionTypeForClient } from '@/lib/question-bank/question-api-utils'
import { isDeprecatedQuestionType } from '@/lib/question-bank/question-type-taxonomy'

// ── 环境 ───────────────────────────────────────────────────────────────────
const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const SUPABASE_URL = readEnv('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_ROLE = readEnv('SUPABASE_SERVICE_ROLE_KEY')

const REPORT_JSON = 'reports/qbank-v2-migration-report.json'
const REPORT_MD = 'reports/qbank-v2-migration-report.md'

// 迁移写入的目标表（探测是否已建）
const WRITE_TABLES = ['stimuli', 'audio_assets', 'question_sets', 'question_items', 'question_target_words'] as const

type V2Status = 'draft' | 'reviewed' | 'active'

// ── CLI ────────────────────────────────────────────────────────────────────
function argValue(name: string): string | null {
  const prefix = `${name}=`
  const hit = process.argv.find((a) => a.startsWith(prefix))
  return hit ? hit.slice(prefix.length) : null
}
const APPLY = process.argv.includes('--apply')
const LIMIT = (() => { const n = Number(argValue('--limit')); return Number.isFinite(n) && n > 0 ? Math.floor(n) : null })()
const TYPES_FILTER = (argValue('--types') || '').split(',').map((s) => s.trim()).filter(Boolean)
const STATUS_ARG = (argValue('--status') || 'draft').trim()

// ── v1 行契约 ──────────────────────────────────────────────────────────────
const V1_SELECT = [
  'id', 'type', 'input_mode', 'word_id', 'normalized_word', 'prompt', 'prompt_zh',
  'choices', 'answer', 'answer_text', 'hint', 'audio_ref', 'explanation_zh',
  'exam_tags', 'theme_tags', 'difficulty_level', 'question_difficulty', 'status', 'is_reviewed',
].join(',')

interface V1Row {
  id: string
  type: string
  input_mode: string | null
  word_id: string | null
  normalized_word: string | null
  prompt: string | null
  prompt_zh: string | null
  choices: { id: string; text: string }[] | null
  answer: string | null
  answer_text: string | null
  hint: unknown
  audio_ref: string | null
  explanation_zh: string | null
  exam_tags: string[] | null
  theme_tags: string[] | null
  difficulty_level: number | null
  question_difficulty: number | null
  status: string | null
  is_reviewed: boolean | null
}

interface V2Choice { id: string; text: string }

// ── 题型分类 ────────────────────────────────────────────────────────────────
const CHOICE_TYPES = new Set(['en_to_zh', 'zh_to_en', 'def_to_word', 'synonym_choice', 'synonym_substitute', 'confusable_choice', 'collocation_choice', 'cloze_choice'])
const SPELL_TYPES = new Set(['zh_to_word_spell', 'cloze_spell', 'word_form'])
const LISTEN_WORD_TYPES = new Set(['listen_to_meaning', 'listen_to_word', 'dictation_spell'])
const GROUP_PASSAGE_TYPES = new Set(['reading_comprehension', 'listening_comprehension'])
const MULTI_BLANK_TYPES = new Set(['banked_cloze', 'seven_select', 'cloze_passage', 'grammar_fill'])
const MATCHING_TYPES = new Set(['para_match'])

type V2InputMode = 'choice' | 'spell' | 'listen' | 'multi_blank' | 'matching'

interface MappedItem {
  legacyId: string            // = qb:<rowId>
  inputMode: V2InputMode
  prompt: string
  promptZh: string | null
  choices: V2Choice[]
  answer: string | unknown[]  // choice id | answer text | number[] | 每空结构（jsonb 保真）
  explanationZh: string | null
  targetWord: { wordId: string | null; surface: string | null } | null
  needsAudio: boolean
}

interface MappedSet {
  rowIds: string[]
  oldType: string
  taskType: string            // v2 task_type（= 归一化后的 v1 type）
  legacyId: string            // set 级 legacy：qb:set:<rowId> 或 qbgrp:<passageKey>
  groupMode: 'single' | 'set'
  level: number | null
  difficultyBand: number | null
  topicTags: string[]
  stimulus: { legacyId: string; kind: string; textEn: string } | null
  needsAudio: boolean
  items: MappedItem[]
}

function canonicalType(t: string): string {
  return normalizeQuestionTypeForClient(t)
}

function levelFromTags(tags: string[] | null): number | null {
  for (const tag of tags ?? []) {
    const m = /^lv(\d+)$/.exec(tag)
    if (m) { const n = Number(m[1]); if (n >= 1 && n <= 7) return n }
  }
  return null
}
function difficultyBand(row: V1Row): number | null {
  const raw = row.question_difficulty ?? row.difficulty_level
  if (raw == null) return null
  return Math.max(1, Math.min(5, Math.floor(raw)))
}
function topicTags(tags: string[] | null): string[] {
  return (tags ?? []).filter((t) => !/^lv\d+$/.test(t))
}

function asChoices(raw: V1Row['choices']): V2Choice[] {
  return Array.isArray(raw) ? raw.filter((c) => c && c.id && c.text).map((c) => ({ id: String(c.id), text: String(c.text) })) : []
}

function hintObj(hint: unknown): Record<string, unknown> {
  return (hint && typeof hint === 'object' ? hint : {}) as Record<string, unknown>
}

/** 整篇多空/匹配题：按 v1 题型各自的 hint 形状抽 choices + answer（保真，不丢数据）。 */
function buildSetAnswer(row: V1Row, type: string): { choices: V2Choice[]; answer: unknown[] } | { reject: string } {
  const h = hintObj(row.hint)
  if (type === 'banked_cloze' || type === 'seven_select') {
    // hint = { bank: string[], answers: number[] }
    const bank = Array.isArray(h.bank) ? h.bank.map((x) => String(x ?? '').trim()) : []
    const answers = Array.isArray(h.answers) ? h.answers.map((x) => Number(x)).filter((n) => Number.isInteger(n)) : []
    if (!bank.length || !answers.length) return { reject: 'set_hint_missing' }
    if (new Set(answers).size !== answers.length) return { reject: 'set_answers_duplicate' }
    if (answers.some((a) => a < 0 || a >= bank.length)) return { reject: 'set_answer_out_of_range' }
    return { choices: bank.map((t, i) => ({ id: String(i), text: t })), answer: answers }
  }
  if (type === 'para_match') {
    // hint = { statements: string[], answers: number[], paras: number }
    const statements = Array.isArray(h.statements) ? h.statements.map((x) => String(x ?? '').trim()) : []
    const answers = Array.isArray(h.answers) ? h.answers.map((x) => Number(x)).filter((n) => Number.isInteger(n)) : []
    if (!statements.length || !answers.length) return { reject: 'set_hint_missing' }
    return { choices: statements.map((t, i) => ({ id: String(i), text: t })), answer: answers }
  }
  if (type === 'grammar_fill') {
    // hint = { gblanks: [{ answer: string, hint? }] } —— 自由填空：每空标准答案
    const gblanks = Array.isArray(h.gblanks) ? h.gblanks : []
    const answers = gblanks.map((b) => String(hintObj(b).answer ?? '').trim()).filter(Boolean)
    if (!answers.length) return { reject: 'set_hint_missing' }
    return { choices: [], answer: answers }
  }
  if (type === 'cloze_passage') {
    // hint = { blanks: [{ options: string[], answer: string }] } —— 每空各自 4 选项，全量保真
    const blanks = Array.isArray(h.blanks) ? h.blanks : []
    if (!blanks.length) return { reject: 'set_hint_missing' }
    const norm = blanks.map((b) => { const o = hintObj(b); return { options: Array.isArray(o.options) ? o.options.map((x) => String(x ?? '')) : [], answer: String(o.answer ?? '').trim() } })
    if (norm.some((b) => !b.answer)) return { reject: 'set_answer_missing' }
    return { choices: [], answer: norm }
  }
  return { reject: 'unsupported_set_type' }
}

// 把单行映射成一个 MappedItem；不可作答 → 返回 reject 原因
function buildItem(row: V1Row, inputMode: V2InputMode, type: string): { item: MappedItem | null; reject: string | null } {
  const legacyId = `qb:${row.id}`
  const prompt = String(row.prompt ?? '').trim()
  const promptZh = row.prompt_zh?.trim() || null
  const explanationZh = row.explanation_zh?.trim() || null
  const targetWord = row.word_id ? { wordId: row.word_id, surface: row.normalized_word ?? null } : null
  const needsAudio = inputMode === 'listen'

  if (inputMode === 'choice' || (inputMode === 'listen' && Array.isArray(row.choices) && row.choices.length > 0)) {
    const choices = asChoices(row.choices)
    const answer = String(row.answer ?? '').trim()
    if (choices.length < 2) return { item: null, reject: 'choice_lt_2' }
    if (!answer || !choices.some((c) => c.id === answer)) return { item: null, reject: 'answer_not_in_choices' }
    return { item: { legacyId, inputMode, prompt, promptZh, choices, answer, explanationZh, targetWord, needsAudio }, reject: null }
  }

  if (inputMode === 'spell' || (inputMode === 'listen' && !(Array.isArray(row.choices) && row.choices.length))) {
    const answerText = String(row.answer_text ?? '').trim()
    if (!answerText) return { item: null, reject: 'spell_answer_missing' }
    return { item: { legacyId, inputMode, prompt, promptZh, choices: [], answer: answerText, explanationZh, targetWord, needsAudio }, reject: null }
  }

  if (inputMode === 'multi_blank' || inputMode === 'matching') {
    const built = buildSetAnswer(row, type)
    if ('reject' in built) return { item: null, reject: built.reject }
    return { item: { legacyId, inputMode, prompt, promptZh, choices: built.choices, answer: built.answer, explanationZh, targetWord, needsAudio }, reject: null }
  }

  return { item: null, reject: 'unsupported_input_mode' }
}

function inputModeForType(type: string): V2InputMode | null {
  if (CHOICE_TYPES.has(type) || type === 'reading_comprehension') return 'choice'
  if (SPELL_TYPES.has(type)) return 'spell'
  if (LISTEN_WORD_TYPES.has(type) || type === 'listening_comprehension') return 'listen'
  if (MULTI_BLANK_TYPES.has(type)) return 'multi_blank'
  if (MATCHING_TYPES.has(type)) return 'matching'
  return null
}

// ── 报告累加器 ──────────────────────────────────────────────────────────────
interface Acc {
  countsByOldType: Record<string, number>
  countsByNewTaskType: Record<string, number>
  statusCounts: Record<string, number>        // draft / reviewed / active / rejected
  rejectionReasons: Record<string, number>
  downgradeReasons: Record<string, number>    // active 被降级为 draft 的原因
  deprecated: Record<string, number>          // 退役题型仅报告
  samples: { setLegacyId: string; oldType: string; taskType: string; groupMode: string; status: string; items: number }[]
}
const bump = (m: Record<string, number>, k: string, n = 1) => { m[k] = (m[k] ?? 0) + n }

// active 不变量预检（与 qa-question-bank-v2-migration 同一套规则，写入前先跑）：
// 分组题必须有 stimulus · 不得退役题型 · 听力 active 需稳定音频（v1 无→拒）· item 形状合法 ·
// 溯源链完整 · 目标词 FK 必须存在于 dictionary_words。返回所有失败原因（空=可上 active）。
function activeInvariantFailures(set: MappedSet, v1ActiveReviewed: boolean, dictWordIds: Set<string>): string[] {
  const f: string[] = []
  if (set.needsAudio) f.push('no_stable_audio')                                   // 听力：v1 无稳定音频 URL
  if (!v1ActiveReviewed) f.push('v1_not_active_reviewed')                         // v1 源行未上架/未审
  if (isDeprecatedQuestionType(set.taskType)) f.push('deprecated_type')           // 兜底（退役题型本就已跳过）
  if (set.groupMode === 'set' && !set.stimulus) f.push('grouped_no_stimulus')     // 分组题缺材料
  if (!set.legacyId || set.items.some((it) => !it.legacyId)) f.push('no_legacy_traceability')
  let shapeBad = false
  let wordMissing = false
  for (const it of set.items) {
    if (it.inputMode === 'choice') {
      const ok = it.choices.length >= 2 && typeof it.answer === 'string' && it.choices.some((c) => c.id === it.answer)
      if (!ok) shapeBad = true
    } else if (it.inputMode === 'multi_blank' || it.inputMode === 'matching') {
      if (!Array.isArray(it.answer) || it.answer.length === 0) shapeBad = true
    } else {
      const ok = typeof it.answer === 'string' ? it.answer.trim() !== '' : Array.isArray(it.answer) ? it.answer.length > 0 : it.answer != null
      if (!ok) shapeBad = true
    }
    if (it.targetWord?.wordId && !dictWordIds.has(it.targetWord.wordId)) wordMissing = true
  }
  if (shapeBad) f.push('item_shape_invalid')
  if (wordMissing) f.push('target_word_missing')
  return f
}

// 决定 set 的最终状态：非 active 直接用请求态；active 必须过全部不变量，任一失败→降级 draft。
function finalizeStatus(set: MappedSet, requested: V2Status, v1ActiveReviewed: boolean, dictWordIds: Set<string>): { status: V2Status; downgrades: string[] } {
  if (requested !== 'active') return { status: requested, downgrades: [] }
  const fails = activeInvariantFailures(set, v1ActiveReviewed, dictWordIds)
  return fails.length ? { status: 'draft', downgrades: fails } : { status: 'active', downgrades: [] }
}

// 当 --status=active 时一次性载入 dictionary_words.id 集合，供 target word FK 预检（keyset 翻页）。
async function loadDictWordIds(db: SupabaseClient): Promise<Set<string>> {
  const ids = new Set<string>()
  let cursor: string | null = null
  for (;;) {
    let q = db.from('dictionary_words').select('id').order('id', { ascending: true }).limit(1000)
    if (cursor) q = q.gt('id', cursor)
    const { data, error } = await q
    if (error) throw new Error(`dictionary_words read: ${error.message}`)
    const rows = (data ?? []) as { id: string }[]
    if (!rows.length) break
    for (const r of rows) ids.add(r.id)
    cursor = rows[rows.length - 1].id
    if (rows.length < 1000) break
  }
  return ids
}

// ── 表存在性探测 ─────────────────────────────────────────────────────────────
async function tableExists(db: SupabaseClient, table: string): Promise<boolean> {
  const { error } = await db.from(table).select('*').limit(1)
  return !error
}

// ── v1 读取（分页 + --types/--limit）────────────────────────────────────────
async function readV1(db: SupabaseClient): Promise<V1Row[]> {
  const out: V1Row[] = []
  // 页大小受 --limit 约束；keyset 翻页（id > cursor）走 PK 索引，避免深 OFFSET 语句超时
  const page = LIMIT ? Math.min(1000, LIMIT) : 1000
  let cursor: string | null = null
  for (;;) {
    let q = db.from('question_bank').select(V1_SELECT).order('id', { ascending: true }).limit(page)
    if (cursor) q = q.gt('id', cursor)
    if (TYPES_FILTER.length) q = q.in('type', TYPES_FILTER)
    const { data, error } = await q
    if (error) throw new Error(`question_bank read: ${error.message}`)
    const rows = (data ?? []) as unknown as V1Row[]
    if (!rows.length) break
    out.push(...rows)
    cursor = rows[rows.length - 1].id
    if (rows.length < page) break
    if (LIMIT && out.length >= LIMIT) break
  }
  return LIMIT ? out.slice(0, LIMIT) : out
}

// ── 分类：v1 行 → MappedSet[]（单题型逐行成组；阅读/听力按 passage 聚合）──────
function classify(rows: V1Row[], acc: Acc): { sets: MappedSet[]; v1ActiveReviewed: Map<string, boolean> } {
  const sets: MappedSet[] = []
  const v1ActiveReviewed = new Map<string, boolean>()
  const passageGroups = new Map<string, MappedSet>()    // key = taskType + '::' + passageKey

  for (const row of rows) {
    bump(acc.countsByOldType, row.type)
    const type = canonicalType(row.type)
    const isAR = row.status === 'active' && row.is_reviewed === true

    if (isDeprecatedQuestionType(type)) { bump(acc.deprecated, type); continue }   // 退役题型仅报告，不迁

    const inputMode = inputModeForType(type)
    if (!inputMode) { bump(acc.rejectionReasons, 'unsupported_type'); bump(acc.statusCounts, 'rejected'); continue }

    const { item, reject } = buildItem(row, inputMode, type)
    if (!item || reject) { bump(acc.rejectionReasons, reject ?? 'unbuildable'); bump(acc.statusCounts, 'rejected'); continue }

    // 阅读/听力：多行共享同一 passage（normalized_word=passage id，audio_ref=正文）→ 聚合成一个 set
    if (GROUP_PASSAGE_TYPES.has(type)) {
      const passageKey = String(row.normalized_word ?? row.id)
      const groupKey = `${type}::${passageKey}`
      let set = passageGroups.get(groupKey)
      if (!set) {
        const textEn = String(row.audio_ref ?? '').trim()
        set = {
          rowIds: [], oldType: row.type, taskType: type, legacyId: `qbgrp:${type}:${passageKey}`,
          groupMode: 'set', level: levelFromTags(row.theme_tags), difficultyBand: difficultyBand(row),
          topicTags: topicTags(row.theme_tags),
          stimulus: textEn ? { legacyId: `qbpsg:${type}:${passageKey}`, kind: type === 'reading_comprehension' ? 'passage' : 'lecture', textEn } : null,
          needsAudio: type === 'listening_comprehension', items: [],
        }
        passageGroups.set(groupKey, set)
        sets.push(set)
      }
      set.rowIds.push(row.id)
      set.items.push(item)
      v1ActiveReviewed.set(set.legacyId, (v1ActiveReviewed.get(set.legacyId) ?? true) && isAR)
      continue
    }

    // 单行成组：单词宇宙单题 + 整篇多空题（banked_cloze/seven_select/cloze_passage/grammar_fill/para_match）
    const grouped = MULTI_BLANK_TYPES.has(type) || MATCHING_TYPES.has(type)
    const stimText = grouped ? String(row.audio_ref ?? '').trim() : ''
    const set: MappedSet = {
      rowIds: [row.id], oldType: row.type, taskType: type, legacyId: `qb:set:${row.id}`,
      groupMode: grouped ? 'set' : 'single', level: levelFromTags(row.theme_tags), difficultyBand: difficultyBand(row),
      topicTags: topicTags(row.theme_tags),
      stimulus: grouped && stimText ? { legacyId: `qbpsg:${row.id}`, kind: 'passage', textEn: stimText } : null,
      needsAudio: item.needsAudio, items: [item],
    }
    sets.push(set)
    v1ActiveReviewed.set(set.legacyId, isAR)
  }
  return { sets, v1ActiveReviewed }
}

// ── 写入一个 set（apply 模式，幂等且可恢复）───────────────────────────────────
// 每一层都用 upsert(onConflict='legacy_id')：依赖 stimuli/question_sets/question_items 的
// legacy_id 唯一索引（见 p4-question-bank-v2.sql）。即使上次在「写完 stimulus、未写 set」处
// 中断，本次重跑也会按 legacy_id 复用同一行而非重复插入；target_words 用「先删后插」保持幂等。
async function writeSet(db: SupabaseClient, set: MappedSet, status: V2Status): Promise<void> {
  let stimulusId: string | null = null
  if (set.stimulus) {
    const stimQa = status === 'active' ? 'active' : 'draft'
    const { data, error } = await db.from('stimuli').upsert({
      legacy_id: set.stimulus.legacyId, kind: set.stimulus.kind, text_en: set.stimulus.textEn,
      level: set.level, source_type: 'migrated_v1', source_note: `v1 question_bank ${set.oldType}`, qa_status: stimQa,
    }, { onConflict: 'legacy_id' }).select('id').single()
    if (error) throw new Error(`stimuli upsert: ${error.message}`)
    stimulusId = (data as { id: string }).id
  }

  const { data: setData, error: setErr } = await db.from('question_sets').upsert({
    legacy_id: set.legacyId, stimulus_id: stimulusId, level: set.level, task_type: set.taskType,
    difficulty_band: set.difficultyBand, topic_tags: set.topicTags, status,
    qa_flags: status === 'active' ? { migrated: true, qa: 'passed' } : { migrated: true },
  }, { onConflict: 'legacy_id' }).select('id').single()
  if (setErr) throw new Error(`question_sets upsert: ${setErr.message}`)
  const setId = (setData as { id: string }).id

  let orderIndex = 0
  for (const item of set.items) {
    const { data: itemData, error: itemErr } = await db.from('question_items').upsert({
      legacy_id: item.legacyId, question_set_id: setId, order_index: orderIndex++,
      input_mode: item.inputMode, prompt: item.prompt, prompt_zh: item.promptZh,
      choices: item.choices, answer: item.answer, explanation_zh: item.explanationZh,
      difficulty_band: set.difficultyBand, status,
    }, { onConflict: 'legacy_id' }).select('id').single()
    if (itemErr) throw new Error(`question_items upsert: ${itemErr.message}`)
    const itemId = (itemData as { id: string }).id
    // 目标词无天然 legacy 键：先按 item 清空再插，重跑不累积重复
    const { error: delErr } = await db.from('question_target_words').delete().eq('question_item_id', itemId)
    if (delErr) throw new Error(`question_target_words delete: ${delErr.message}`)
    if (item.targetWord) {
      const { error: twErr } = await db.from('question_target_words').insert({
        question_item_id: itemId, word_id: item.targetWord.wordId, surface: item.targetWord.surface, role: 'tested_answer',
      })
      if (twErr) throw new Error(`question_target_words insert: ${twErr.message}`)
    }
  }
}

// ── 报告输出 ────────────────────────────────────────────────────────────────
function writeReports(payload: Record<string, unknown>) {
  writeFileSync(REPORT_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), ...payload }, null, 2) + '\n', 'utf8')
  const p = payload as {
    schema: string; apply: boolean; requestedStatus: string; v1Rows: number; setsPlanned: number; itemsPlanned: number
    countsByOldType: Record<string, number>; countsByNewTaskType: Record<string, number>
    statusCounts: Record<string, number>; rejectionReasons: Record<string, number>
    downgradeReasons: Record<string, number>; deprecated: Record<string, number>
    samples: { setLegacyId: string; oldType: string; taskType: string; groupMode: string; status: string; items: number }[]
    note?: string
  }
  const L: string[] = []
  L.push('# v1 → v2 Question Bank Migration Report', '')
  L.push(`Generated: ${new Date().toISOString()}`, '')
  L.push(`- Mode: **${p.apply ? 'APPLY (wrote to v2)' : 'DRY RUN (no writes)'}**`)
  L.push(`- Requested target status: \`${p.requestedStatus}\``)
  L.push(`- v2 schema: **${p.schema}**`)
  L.push(`- v1 rows scanned: ${p.v1Rows}`)
  L.push(`- Sets planned: ${p.setsPlanned} · items planned: ${p.itemsPlanned}`)
  if (p.note) L.push('', `> ${p.note}`)
  L.push('', '## Status counts', '', '| Status | Count |', '| --- | ---: |')
  for (const k of ['active', 'reviewed', 'draft', 'rejected']) L.push(`| ${k} | ${p.statusCounts[k] ?? 0} |`)
  L.push('', '## Counts by old v1 type', '', '| v1 type | Rows |', '| --- | ---: |')
  for (const [k, v] of Object.entries(p.countsByOldType).sort((a, b) => b[1] - a[1])) L.push(`| ${k} | ${v} |`)
  L.push('', '## Counts by new v2 task_type (sets)', '', '| v2 task_type | Sets |', '| --- | ---: |')
  for (const [k, v] of Object.entries(p.countsByNewTaskType).sort((a, b) => b[1] - a[1])) L.push(`| ${k} | ${v} |`)
  L.push('', '## Rejection reasons', '')
  if (!Object.keys(p.rejectionReasons).length) L.push('None.')
  else for (const [k, v] of Object.entries(p.rejectionReasons).sort((a, b) => b[1] - a[1])) L.push(`- \`${k}\`: ${v}`)
  L.push('', '## Active → draft downgrades', '')
  if (!Object.keys(p.downgradeReasons).length) L.push('None (or status != active).')
  else for (const [k, v] of Object.entries(p.downgradeReasons).sort((a, b) => b[1] - a[1])) L.push(`- \`${k}\`: ${v}`)
  L.push('', '## Deprecated (report only, never migrated)', '')
  if (!Object.keys(p.deprecated).length) L.push('None found in scope.')
  else for (const [k, v] of Object.entries(p.deprecated)) L.push(`- \`${k}\`: ${v} (skipped)`)
  L.push('', '## Sample migrated sets', '', '| set legacy_id | old type | v2 task_type | group | status | items |', '| --- | --- | --- | --- | --- | ---: |')
  for (const s of p.samples) L.push(`| ${s.setLegacyId} | ${s.oldType} | ${s.taskType} | ${s.groupMode} | ${s.status} | ${s.items} |`)
  L.push('')
  writeFileSync(REPORT_MD, L.join('\n'), 'utf8')
}

// ── main ────────────────────────────────────────────────────────────────────
async function main() {
  if (!['draft', 'reviewed', 'active'].includes(STATUS_ARG)) {
    console.error(`migrate: 非法 --status="${STATUS_ARG}"（仅 draft|reviewed|active）`)
    process.exit(1)
  }
  const requested = STATUS_ARG as V2Status

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.log('migrate: 缺少 Supabase 凭据，按 not_applied 处理')
    writeReports({ schema: 'not_applied', apply: false, requestedStatus: requested, v1Rows: 0, setsPlanned: 0, itemsPlanned: 0, countsByOldType: {}, countsByNewTaskType: {}, statusCounts: {}, rejectionReasons: {}, downgradeReasons: {}, deprecated: {}, samples: [], note: 'missing_supabase_credentials' })
    process.exit(0)
  }
  const db = createClient(SUPABASE_URL, SERVICE_ROLE)

  // 1) 探测 v2 写入表
  const present: string[] = []
  const missing: string[] = []
  for (const t of WRITE_TABLES) (await tableExists(db, t) ? present : missing).push(t)
  const schema = missing.length === 0 ? 'applied' : present.length === 0 ? 'not_applied' : 'partial_applied'

  if (APPLY && schema !== 'applied') {
    console.error(`migrate: --apply 被拒绝 —— v2 表未完整建立（${schema}）。missing: ${missing.join(', ') || 'none'}`)
    console.error('请先在 Supabase SQL Editor 执行 supabase/sql/p4-question-bank-v2.sql，再重试 --apply。')
    process.exit(1)
  }

  // 2) 读 v1 + 分类（dry-run 与 apply 共用，仅写入步骤受 --apply 门控）
  const acc: Acc = { countsByOldType: {}, countsByNewTaskType: {}, statusCounts: {}, rejectionReasons: {}, downgradeReasons: {}, deprecated: {}, samples: [] }
  const rows = await readV1(db)
  const { sets, v1ActiveReviewed } = classify(rows, acc)

  // 3) 已迁移 legacy_id（apply 完整性去重用）：set + item 都预载，
  //    只有「set 已存在且其全部 item 都已写」才整组跳过；否则交给可恢复的 upsert writeSet。
  const existingSetLegacy = new Set<string>()
  const existingItemLegacy = new Set<string>()
  if (schema === 'applied') {
    const loadLegacy = async (table: string, sink: Set<string>) => {
      let cursor: string | null = null
      for (;;) {
        let q = db.from(table).select('legacy_id').not('legacy_id', 'is', null).order('legacy_id', { ascending: true }).limit(1000)
        if (cursor) q = q.gt('legacy_id', cursor)
        const { data } = await q
        const arr = (data ?? []) as { legacy_id: string }[]
        if (!arr.length) break
        for (const r of arr) sink.add(r.legacy_id)
        cursor = arr[arr.length - 1].legacy_id
        if (arr.length < 1000) break
      }
    }
    await loadLegacy('question_sets', existingSetLegacy)
    await loadLegacy('question_items', existingItemLegacy)
  }

  // active 预检需要 dictionary_words.id 全集（target word FK）。dictionary_words 与 v2 无关，始终可读。
  const dictWordIds = requested === 'active' && sets.length ? await loadDictWordIds(db) : new Set<string>()

  // 4) 逐 set 定状态 + （apply）写入
  let setsPlanned = 0, itemsPlanned = 0, skippedDup = 0
  for (const set of sets) {
    const fullyMigrated = existingSetLegacy.has(set.legacyId) && set.items.every((it) => existingItemLegacy.has(it.legacyId))
    if (fullyMigrated) { skippedDup++; continue }   // 幂等：整组已写完才跳过（部分写入仍会被 upsert 补齐）
    const { status, downgrades } = finalizeStatus(set, requested, v1ActiveReviewed.get(set.legacyId) ?? false, dictWordIds)
    for (const d of downgrades) bump(acc.downgradeReasons, d)
    bump(acc.statusCounts, status)
    bump(acc.countsByNewTaskType, set.taskType)
    setsPlanned++
    itemsPlanned += set.items.length
    if (acc.samples.length < 20) acc.samples.push({ setLegacyId: set.legacyId, oldType: set.oldType, taskType: set.taskType, groupMode: set.groupMode, status, items: set.items.length })

    if (APPLY) {
      try {
        await writeSet(db, set, status)
      } catch (e) {
        bump(acc.rejectionReasons, 'write_error')
        console.error(`migrate: 写入失败 ${set.legacyId}: ${(e as Error).message}`)
      }
    }
  }

  const note = schema === 'not_applied'
    ? 'v2 表尚未应用：以上为「投影计划」，未写任何数据。应用 schema 后再用 --apply 实际迁移。'
    : schema === 'partial_applied'
      ? 'v2 schema 半应用：dry-run 仅给计划，--apply 已被拒绝。'
      : APPLY ? `已写入 v2（跳过 ${skippedDup} 个已迁移 set）。` : `dry-run：未写库（${skippedDup} 个 set 已存在会被跳过）。`

  writeReports({
    schema, apply: APPLY, requestedStatus: requested, v1Rows: rows.length, setsPlanned, itemsPlanned,
    countsByOldType: acc.countsByOldType, countsByNewTaskType: acc.countsByNewTaskType,
    statusCounts: acc.statusCounts, rejectionReasons: acc.rejectionReasons, downgradeReasons: acc.downgradeReasons,
    deprecated: acc.deprecated, samples: acc.samples, note,
  })

  console.log(`migrate: schema=${schema} apply=${APPLY} status=${requested}`)
  console.log(`  v1 rows ${rows.length} → sets ${setsPlanned} / items ${itemsPlanned}（rejected ${acc.statusCounts.rejected ?? 0} · dup-skip ${skippedDup}）`)
  console.log(`  deprecated skipped: ${Object.entries(acc.deprecated).map(([k, v]) => `${k}=${v}`).join(', ') || 'none'}`)
  console.log(`  报告：${REPORT_MD} / ${REPORT_JSON}`)
  if (!APPLY) console.log('  dry-run：未写库。确认计划后加 --apply（v2 需先应用 schema）。')
  process.exit(0)
}

main().catch((e) => {
  console.error('migrate fatal', e?.message ?? e)
  process.exit(1)
})
