/* ════════════════════════════════════════════════════════════════════════
   verify-toefl-writing-expansion.ts — TOEFL 2026 写作扩产（Window B）专项校验（只读）

   范围：本窗口独占的扩产 stage `toefl-2026-expansion-b`，新增
   email_writing + academic_discussion 各 40，与既有 pilot 10 合计各 50。

   两种模式：
   - 默认（源校验，无 DB）：仅校验源文件 — 结构 / 字段 / 非官方前缀 / 分类矩阵 /
     去重（新 40 内部 + 对 pilot 10），并派生每条预期 legacy_id。可在 apply 前运行。
   - --db（严格 DB 校验）：在 apply 后运行 — 复刻 importer 确定性 hashId，对每条源
     记录 1:1 比对 DB payload（set/item 全字段），反查 stage 内无源外 set，断言每类
     恰 50 draft，且全局 active=0 / antonym_choice=cet_cloze=0。

   绝不写库。任何不一致 / DB 错误 → exit 1，绝不吞异常。
   与 import-authored-productive-tasks-v2.ts 完全一致的 hashId 与 legacy 派生口径。

   用法：
     npx tsx scripts/verify-toefl-writing-expansion.ts          # 源校验（apply 前）
     npx tsx scripts/verify-toefl-writing-expansion.ts --db     # 严格 DB 校验（apply 后）
   ════════════════════════════════════════════════════════════════════════ */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'

const DB_MODE = process.argv.includes('--db')

const STAGE = 'toefl-2026-expansion-b'
const EXPANSION_DIR = `data/generated-question-sets/${STAGE}`
const PILOT_DIR = 'data/generated-question-sets/toefl-2026-pilot'
const LEVEL = 6
const EXAM_ID = 'toefl'
const SKILL = 'writing'
const WORDLIMIT_PREFIX = 'Project guidance (not an official TOEFL requirement):'

// 用户修订：每类新增 50（既有 pilot 10 → 合计各 60）。50 尽量均分到 8 类：前 2 类各 7，其余各 6。
const MATRIX_TARGET = [7, 7, 6, 6, 6, 6, 6, 6] as const
const NEW_TOTAL = MATRIX_TARGET.reduce((a, b) => a + b, 0) // 50
const OWNED_TOTAL = NEW_TOTAL + 10 // pilot 10 → 60

// 8 邮件分类矩阵（§5）与 8 学术讨论领域矩阵（§6），label 为源文件 `category` 取值；每类目标数见 MATRIX_TARGET
const EMAIL_CATEGORIES = [
  'course scheduling, absence, deadline, clarification',
  'instructor, adviser, or teaching-assistant communication',
  'library, laboratory, tutoring, or academic support',
  'group project, presentation, club, or campus event',
  'housing, dining, transportation, or campus facilities',
  'application, recommendation, internship, or research opportunity',
  'registration, records, fees, identification, or student services',
  'complaint, repair, accessibility, safety, or conflict resolution',
]
const DISCUSSION_DOMAINS = [
  'education and learning',
  'technology and society',
  'environment and public policy',
  'economics and work',
  'health and psychology',
  'cities, transport, and community',
  'media, culture, and ethics',
  'science, research, and innovation',
]

interface SrcTask {
  category?: string
  prompt?: string
  promptZh?: string
  referencePoints?: string[]
  wordLimit?: string
  sourceTextEn?: string | null
  sourceTextZh?: string | null
}
interface SrcFile { examId: string; level: number; skill: string; taskType: string; tasks: SrcTask[] }

const TYPES = [
  { taskType: 'email_writing', newFile: 'toefl-email-50.productive.json', pilotFile: 'toefl-email.productive.json', matrix: EMAIL_CATEGORIES, matrixName: 'category' },
  { taskType: 'academic_discussion', newFile: 'toefl-discussion-50.productive.json', pilotFile: 'toefl-discussion.productive.json', matrix: DISCUSSION_DOMAINS, matrixName: 'domain' },
] as const

// 复刻 importer 的确定性 hashId（FNV-1a 32-bit → base36），与 import-authored-* 完全一致
function hashId(s: string): string { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return (h >>> 0).toString(36) }
const normPrompt = (s: string): string => s.toLowerCase().replace(/\s+/g, ' ').trim()

// 复刻 importer 的 tag/legacy 派生：写作类无 sourceText → prompt-only hash
function tagFor(taskType: string, t: SrcTask): string {
  const hasSource = !!(t.sourceTextZh || t.sourceTextEn)
  return hasSource
    ? hashId(`${EXAM_ID}|${taskType}|${LEVEL}|${t.prompt}|${t.sourceTextZh ?? ''}|${t.sourceTextEn ?? ''}`)
    : hashId(`${EXAM_ID}|${taskType}|${LEVEL}|${t.prompt}`)
}
const setLegacyFor = (taskType: string, tag: string) => `gen:productive:${taskType}:set:claude:${tag}`

const errors: string[] = []
const err = (m: string) => errors.push(m)

function loadFile(dir: string, file: string): SrcFile {
  const path = `${dir}/${file}`
  if (!existsSync(path)) { err(`源文件不存在 ${path}`); return { examId: '', level: 0, skill: '', taskType: '', tasks: [] } }
  return JSON.parse(readFileSync(path, 'utf8')) as SrcFile
}

type SetRow = { id: string; legacy_id: string | null; task_type: string; status: string; level: number | null; qa_flags: Record<string, unknown> | null }
type ItemRow = { question_set_id: string; input_mode: string; prompt: string | null; prompt_zh: string | null; choices: unknown; answer: unknown; rubric_id: string | null }

async function main() {
  // 每类的预期新 legacy 集合（apply 前后都派生，DB 反查用）
  const expectedNewLegacyByType = new Map<string, Set<string>>()

  // ── 源校验（两种模式都做）──
  for (const cfg of TYPES) {
    const nf = loadFile(EXPANSION_DIR, cfg.newFile)
    const pf = loadFile(PILOT_DIR, cfg.pilotFile)
    const label = `${cfg.taskType}`

    // 顶层字段
    if (nf.examId !== EXAM_ID) err(`${label}: examId=${nf.examId}（须 ${EXAM_ID}）`)
    if (nf.level !== LEVEL) err(`${label}: level=${nf.level}（须 ${LEVEL}）`)
    if (nf.skill !== SKILL) err(`${label}: skill=${nf.skill}（须 ${SKILL}）`)
    if (nf.taskType !== cfg.taskType) err(`${label}: taskType=${nf.taskType}（须 ${cfg.taskType}）`)

    // 新文件恰 NEW_TOTAL（50）
    if (nf.tasks.length !== NEW_TOTAL) err(`${label}: 新任务数=${nf.tasks.length}（须 ${NEW_TOTAL}）`)

    // 逐条字段 + 矩阵计数
    const matrixCount = new Map<string, number>()
    for (const c of cfg.matrix) matrixCount.set(c, 0)
    let i = 0
    for (const t of nf.tasks) {
      i++
      const where = `${label}#${i}`
      if (!t.prompt || !t.prompt.trim()) err(`${where}: prompt 为空`)
      if (!t.promptZh || !t.promptZh.trim()) err(`${where}: promptZh 为空`)
      if (!Array.isArray(t.referencePoints)) err(`${where}: referencePoints 非数组`)
      else {
        if (t.referencePoints.length < 4 || t.referencePoints.length > 6) err(`${where}: referencePoints 数=${t.referencePoints.length}（须 4-6）`)
        if (t.referencePoints.some((r) => !r || !String(r).trim())) err(`${where}: referencePoints 含空项`)
      }
      if (!t.wordLimit || !t.wordLimit.trim()) err(`${where}: wordLimit 为空`)
      else if (!t.wordLimit.startsWith(WORDLIMIT_PREFIX)) err(`${where}: wordLimit 未以非官方前缀开头`)
      // 分类矩阵
      if (!t.category) err(`${where}: 缺 category（矩阵校验所需）`)
      else if (!matrixCount.has(t.category)) err(`${where}: category 非法「${t.category}」`)
      else matrixCount.set(t.category, (matrixCount.get(t.category) ?? 0) + 1)
    }
    // 矩阵：每类恰 MATRIX_TARGET[idx]、8 类齐全、无越界
    cfg.matrix.forEach((c, idx) => {
      const n = matrixCount.get(c) ?? 0
      const want = MATRIX_TARGET[idx]
      if (n !== want) err(`${label}: ${cfg.matrixName}「${c}」计数=${n}（须 ${want}）`)
    })

    // 去重：规范化 prompt，新增内部 + 对 pilot 10
    const seen = new Map<string, string>()
    for (const t of pf.tasks) if (t.prompt) seen.set(normPrompt(t.prompt), `pilot`)
    let j = 0
    for (const t of nf.tasks) {
      j++
      if (!t.prompt) continue
      const key = normPrompt(t.prompt)
      if (seen.has(key)) err(`${label}#${j}: 规范化 prompt 与 ${seen.get(key)} 重复`)
      else seen.set(key, `new#${j}`)
    }

    // 派生预期新 legacy
    const expected = new Set<string>()
    for (const t of nf.tasks) if (t.prompt && t.prompt.trim()) expected.add(setLegacyFor(cfg.taskType, tagFor(cfg.taskType, t)))
    expectedNewLegacyByType.set(cfg.taskType, expected)
    if (expected.size !== nf.tasks.filter((t) => t.prompt && t.prompt.trim()).length) err(`${label}: 派生 legacy 出现碰撞（重复 prompt 或 hash 冲突）`)

    console.log(`  [源] ${label}: 新任务=${nf.tasks.length}/${NEW_TOTAL} · 矩阵[${MATRIX_TARGET.join(',')}] ✓(若无上方报错) · pilot=${pf.tasks.length} · 预期新 legacy=${expected.size}`)
  }

  // ── DB 严格校验（仅 --db）──
  if (DB_MODE) {
    const env = existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : ''
    const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
    const url = readEnv('NEXT_PUBLIC_SUPABASE_URL'), key = readEnv('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !key) { err('--db 需 Supabase 凭据（.env.local）'); finish(); return }
    const db: SupabaseClient = createClient(url, key)

    // 分页拉取所有 gen:% set
    const sets: SetRow[] = []
    for (let from = 0; ; from += 1000) {
      const { data, error } = await db.from('question_sets').select('id, legacy_id, task_type, status, level, qa_flags').like('legacy_id', 'gen:%').range(from, from + 999)
      if (error) { err(`question_sets 拉取失败: ${error.message}`); finish(); return }
      const rows = (data ?? []) as SetRow[]
      sets.push(...rows)
      if (rows.length < 1000) break
    }
    const byLegacy = new Map<string, SetRow>()
    for (const s of sets) if (s.legacy_id) byLegacy.set(s.legacy_id, s)
    console.log(`gen sets 总数: ${sets.length}`)

    // 预期 rubric（按 examId+skill，与 importer 同口径）
    const { data: rub, error: rubErr } = await db.from('rubrics').select('id').eq('exam_id', EXAM_ID).eq('skill', SKILL).limit(1)
    if (rubErr) { err(`rubrics 拉取失败: ${rubErr.message}`); finish(); return }
    const expectedRubricId = rub && rub.length ? (rub[0] as { id: string }).id : null
    if (!expectedRubricId) err(`找不到预期 rubric (${EXAM_ID}, ${SKILL})`)

    async function itemsOf(setId: string): Promise<ItemRow[]> {
      const { data, error } = await db.from('question_items').select('question_set_id, input_mode, prompt, prompt_zh, choices, answer, rubric_id').eq('question_set_id', setId)
      if (error) { err(`question_items 拉取失败 (${setId}): ${error.message}`); return [] }
      return (data ?? []) as ItemRow[]
    }

    for (const cfg of TYPES) {
      const nf = loadFile(EXPANSION_DIR, cfg.newFile)
      const expectedNew = expectedNewLegacyByType.get(cfg.taskType) ?? new Set<string>()
      let okCmp = 0

      // 每条新源记录 → 恰一个 DB set + 恰一个 item，全字段 1:1
      for (const t of nf.tasks) {
        if (!t.prompt || !t.prompt.trim()) { err(`${cfg.taskType}: 源 task prompt 为空`); continue }
        const legacy = setLegacyFor(cfg.taskType, tagFor(cfg.taskType, t))
        const dbSet = byLegacy.get(legacy)
        if (!dbSet) { err(`${cfg.taskType}: 源 task 无对应 DB set（legacy ${legacy}）`); continue }
        if (dbSet.status !== 'draft' && dbSet.status !== 'active') err(`${cfg.taskType}: ${legacy} status=${dbSet.status}（须 draft 或 active）`)
        if (dbSet.task_type !== cfg.taskType) err(`${cfg.taskType}: ${legacy} task_type=${dbSet.task_type}`)
        if (dbSet.level !== LEVEL) err(`${cfg.taskType}: ${legacy} level=${dbSet.level}（须 ${LEVEL}）`)
        const qf = (dbSet.qa_flags ?? {}) as { wordLimit?: string | null; stage?: string }
        if ((qf.wordLimit ?? null) !== (t.wordLimit ?? null)) err(`${cfg.taskType}: ${legacy} qa_flags.wordLimit 与源不一致`)
        if (qf.stage !== STAGE) err(`${cfg.taskType}: ${legacy} qa_flags.stage=${qf.stage}（须 ${STAGE}）`)

        const items = await itemsOf(dbSet.id)
        if (items.length !== 1) { err(`${cfg.taskType}: ${legacy} item 数 ${items.length}（须 1）`); continue }
        const it = items[0]
        if (it.input_mode !== 'free_text') err(`${cfg.taskType}: ${legacy} input_mode=${it.input_mode}（须 free_text）`)
        if (!it.rubric_id) err(`${cfg.taskType}: ${legacy} rubric_id 为空`)
        else if (expectedRubricId && it.rubric_id !== expectedRubricId) err(`${cfg.taskType}: ${legacy} rubric_id≠预期 (${EXAM_ID},${SKILL})`)
        const ans = (it.answer ?? {}) as { type?: string; official?: boolean; referencePoints?: unknown }
        if (ans.type !== 'rubric_scored') err(`${cfg.taskType}: ${legacy} answer.type=${ans.type}（须 rubric_scored）`)
        if (ans.official !== false) err(`${cfg.taskType}: ${legacy} answer.official≠false`)
        if (JSON.stringify(ans.referencePoints ?? []) !== JSON.stringify(t.referencePoints ?? [])) err(`${cfg.taskType}: ${legacy} referencePoints 与源不一致`)
        if ((it.prompt ?? '') !== t.prompt) err(`${cfg.taskType}: ${legacy} prompt 与源不一致`)
        if ((it.prompt_zh ?? null) !== (t.promptZh ?? null)) err(`${cfg.taskType}: ${legacy} prompt_zh 与源不一致`)
        okCmp++
      }

      // 反查：stage 内该 type 的 set 必须恰为新源映射集合（无源外 set，恰 NEW_TOTAL）
      const stageSets = sets.filter((s) => s.task_type === cfg.taskType && ((s.qa_flags as { stage?: string } | null)?.stage === STAGE))
      for (const s of stageSets) if (s.legacy_id && !expectedNew.has(s.legacy_id)) err(`${cfg.taskType}: stage ${STAGE} 有源外 set ${s.legacy_id}`)
      if (stageSets.length !== NEW_TOTAL) err(`${cfg.taskType}: stage ${STAGE} set 数=${stageSets.length}（须 ${NEW_TOTAL}）`)
      // Post-R10：stage 集已晋 active（line 上方已锁总数=NEW_TOTAL 且无源外 set）。不再强求全 draft。

      // 本 type 全部 gen:productive set 恰 OWNED_TOTAL draft（pilot 10 + 扩产 NEW_TOTAL）
      const owned = sets.filter((s) => s.task_type === cfg.taskType && (s.legacy_id ?? '').startsWith('gen:productive:'))
      const ownedDraft = owned.filter((s) => s.status === 'draft').length
      const ownedActive = owned.filter((s) => s.status === 'active').length
      // Post-R10（授权晋级全部 READY_DRAFT）：email_writing/academic_discussion 已全晋 active（draft→0）。
      // 以 draft+active 总量锁规模（pilot 10 + 扩产 NEW_TOTAL）。
      if (ownedDraft + ownedActive !== OWNED_TOTAL) err(`${cfg.taskType}: gen:productive draft+active=${ownedDraft + ownedActive}（须 ${OWNED_TOTAL}）`)
      console.log(`  [DB] ${cfg.taskType}: 源↔DB 逐条一致 ${okCmp}/${nf.tasks.length} · stage set=${stageSets.length} · owned draft=${ownedDraft} active=${ownedActive}（R10 已晋 active）`)
    }

    // 全局硬停不变量。Post-R10-full：多题型已授权晋级 active，改为「阻塞/退役题型必须 0 active」denylist。
    const BLOCKED_ACTIVE = new Set(['build_a_sentence', 'read_daily_life', 'choose_a_response', 'listen_and_repeat', 'interview_speaking', 'antonym_choice', 'cet_cloze'])
    const genActive = sets.filter((s) => s.status === 'active').length
    const blockedActive = sets.filter((s) => s.status === 'active' && BLOCKED_ACTIVE.has(s.task_type)).length
    const deprecated = sets.filter((s) => s.task_type === 'antonym_choice' || s.task_type === 'cet_cloze').length
    console.log(`全局：gen active=${genActive}（阻塞/退役 active=${blockedActive}） · gen antonym/cet_cloze=${deprecated}`)
    if (blockedActive !== 0) err(`blocked/deprecated gen active=${blockedActive}（须 0）`)
    if (deprecated !== 0) err(`gen antonym/cet_cloze=${deprecated}（须 0）`)
  }

  finish()
}

function finish() {
  if (errors.length) { console.error(`\n校验失败（${DB_MODE ? 'DB' : '源'}模式）：`); for (const e of errors) console.error(`  ✗ ${e}`); process.exitCode = 1 }
  else console.log(`\n✓ TOEFL 写作扩产-B ${DB_MODE ? '严格 DB' : '源'}校验通过`)
}

main().catch((e) => { console.error('verify-toefl-writing-expansion fatal', e?.message ?? e); process.exitCode = 1 })
