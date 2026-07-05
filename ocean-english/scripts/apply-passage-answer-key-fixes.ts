import { createClient } from '@supabase/supabase-js'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname } from 'path'

const env = readFileSync('.env.local', 'utf8')
const getEnv = (key: string) => (env.match(new RegExp(`^${key}=(.*)$`, 'm')) || [])[1]?.trim() ?? ''

const db = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'))
const deepseekKey = getEnv('DEEPSEEK_API_KEY')

const REPORT_PATH = 'reports/passage-answer-key-audit.json'
const REPAIR_CACHE_PATH = 'scripts/.passage-answer-key-fix-cache.json'
const FIX_REPORT_PATH = 'reports/passage-answer-key-fix-report.json'
const BACKUP_PATH = 'reports/passage-answer-key-fix-backup.json'
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

type PassageType = 'banked_cloze' | 'seven_select'

interface AuditDecision {
  blank: number
  final: 'confirmed_wrong' | 'ambiguous' | 'false_alarm'
  suggestedIndex?: number | null
  suggestedText?: string
  reason: string
  confidence?: number
}

interface AuditItem {
  id: string
  type: PassageType
  examTags: string[]
  themeTags: string[]
  shapeIssues: string[]
  confirmedWrong: AuditDecision[]
  ambiguous: AuditDecision[]
  passagePreview: string
  bank: string[]
  answers: number[]
}

interface QuestionRow {
  id: string
  type: PassageType
  audio_ref: string | null
  hint: Record<string, unknown> | null
}

interface RepairProposal {
  id: string
  type: PassageType
  mode: 'direct' | 'ai_full'
  bank: string[]
  answers: number[]
  reason: string
}

interface RepairCache {
  version: number
  entries: Record<string, RepairProposal | { error: string }>
}

interface FixResult {
  id: string
  type: PassageType
  mode: 'direct' | 'ai_full' | 'skipped'
  status: 'ready' | 'updated' | 'deactivated' | 'skipped' | 'error'
  reason: string
  before?: { bank: string[]; answers: number[] }
  after?: { bank: string[]; answers: number[] }
}

function argValue(name: string): string | null {
  const prefix = `${name}=`
  const directIndex = process.argv.indexOf(name)
  if (directIndex >= 0) return process.argv[directIndex + 1] ?? ''
  const hit = process.argv.find((arg) => arg.startsWith(prefix))
  return hit ? hit.slice(prefix.length) : null
}

function parseConcurrency(): number {
  const raw = argValue('--concurrency')
  if (!raw) return 1
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? Math.max(1, Math.min(Math.floor(parsed), 8)) : 1
}

function ensureParent(path: string) {
  const dir = dirname(path)
  if (dir && dir !== '.' && !existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function readRepairCache(fresh: boolean): RepairCache {
  if (fresh || !existsSync(REPAIR_CACHE_PATH)) return { version: 1, entries: {} }
  try {
    const parsed = JSON.parse(readFileSync(REPAIR_CACHE_PATH, 'utf8')) as RepairCache
    if (parsed.version === 1 && parsed.entries) return parsed
  } catch {
    // Ignore corrupt caches.
  }
  return { version: 1, entries: {} }
}

function saveRepairCache(cache: RepairCache) {
  ensureParent(REPAIR_CACHE_PATH)
  writeFileSync(REPAIR_CACHE_PATH, JSON.stringify(cache, null, 2))
}

function normalizeHint(hint: unknown): { bank: string[]; answers: number[] } {
  const obj = (hint && typeof hint === 'object' ? hint : {}) as Record<string, unknown>
  const bank = Array.isArray(obj.bank) ? obj.bank.map((item) => String(item ?? '').trim()) : []
  const answers = Array.isArray(obj.answers) ? obj.answers.map((item) => Number(item)) : []
  return { bank, answers }
}

function expectedCounts(type: PassageType) {
  return type === 'banked_cloze' ? { bank: 15, answers: 10 } : { bank: 7, answers: 5 }
}

function validationIssues(type: PassageType, bank: string[], answers: number[]): string[] {
  const expected = expectedCounts(type)
  const issues: string[] = []
  if (bank.length !== expected.bank) issues.push(`bank length ${bank.length}, expected ${expected.bank}`)
  if (answers.length !== expected.answers) issues.push(`answers length ${answers.length}, expected ${expected.answers}`)
  for (const answer of answers) {
    if (!Number.isInteger(answer) || answer < 0 || answer >= bank.length) issues.push(`answer index outside bank: ${answer}`)
  }
  if (new Set(answers).size !== answers.length) issues.push('answers contain duplicate indexes')
  if (new Set(bank.map((item) => item.toLowerCase())).size !== bank.length) issues.push('bank contains duplicate option text')
  if (bank.some((item) => !item.trim())) issues.push('bank contains empty option text')
  return [...new Set(issues)]
}

function applyConfirmedWrong(item: AuditItem): { bank: string[]; answers: number[]; issues: string[] } {
  const bank = [...item.bank]
  const answers = [...item.answers]
  for (const decision of item.confirmedWrong) {
    const pos = decision.blank - 1
    const suggested = Number(decision.suggestedIndex)
    if (!Number.isInteger(pos) || pos < 0 || pos >= answers.length || !Number.isInteger(suggested)) {
      return { bank, answers, issues: ['invalid confirmedWrong blank/suggestedIndex'] }
    }
    answers[pos] = suggested
  }
  return { bank, answers, issues: validationIssues(item.type, bank, answers) }
}

function optionLines(bank: string[]): string {
  return bank.map((text, index) => `${index}: ${LETTERS[index]}. ${text}`).join('\n')
}

function answerLines(bank: string[], answers: number[]): string {
  return answers.map((answer, index) => `${index + 1}: index ${answer}, ${LETTERS[answer] ?? '?'} = "${bank[answer] ?? ''}"`).join('\n')
}

function buildRepairPrompt(item: AuditItem, row: QuestionRow, validationFeedback = ''): string {
  const current = normalizeHint(row.hint)
  const task = item.type === 'banked_cloze'
    ? 'This is a banked cloze. Each blank must be filled by the exact option form without inflection changes. The answer indexes must be unique.'
    : 'This is a seven-select sentence insertion task. Each blank must receive the best sentence based on local coherence, discourse markers, reference, and paragraph flow. The answer indexes must be unique.'

  return `You are repairing an English exam answer key.

${task}

Return JSON only, no markdown:
{
  "bank": ["option 0", "..."],
  "answers": [0, 1],
  "reason": "short explanation"
}

Rules:
- Keep the passage text unchanged.
- Keep the original option text whenever possible.
- If the option bank has duplicate option text, replace only the extra duplicate distractor/option with a plausible non-answer distractor.
- banked_cloze must have exactly 15 unique option strings and exactly 10 unique answer indexes.
- seven_select must have exactly 7 unique option strings and exactly 5 unique answer indexes.
- If confirmed wrong entries are provided, use them as strong evidence, but produce a complete coherent answer array for every blank.
- Do not include ambiguous alternatives in the final answer key.
- Every answer index must appear at most once. This is mandatory even if one option seems usable in two blanks.
- If two blanks seem to need the same option, choose the best unique alternative for one blank.
${validationFeedback ? `\nPrevious repair attempt was rejected by validation: ${validationFeedback}\nReturn a corrected JSON object that fixes this validation error.` : ''}

Question id: ${item.id}
Type: ${item.type}
Exam tags: ${item.examTags.join(', ')}
Theme tags: ${item.themeTags.join(', ')}

Passage:
${row.audio_ref ?? ''}

Current option bank:
${optionLines(current.bank)}

Current answer key:
${answerLines(current.bank, current.answers)}

Confirmed wrong decisions:
${JSON.stringify(item.confirmedWrong, null, 2)}

Shape issues:
${JSON.stringify(item.shapeIssues, null, 2)}`
}

function extractJson(text: string): string {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim()
  const match = cleaned.match(/\{[\s\S]*\}/)
  return match ? match[0] : cleaned
}

async function callDeepSeek(prompt: string): Promise<unknown> {
  let lastError = 'unknown error'
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 90_000)
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${deepseekKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          temperature: 0,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      clearTimeout(timeout)
      if (!response.ok) {
        lastError = `HTTP ${response.status}: ${await response.text()}`
      } else {
        const data = (await response.json()) as { choices?: { message?: { content?: string } }[] }
        return JSON.parse(extractJson(data.choices?.[0]?.message?.content ?? ''))
      }
    } catch (error) {
      clearTimeout(timeout)
      lastError = error instanceof Error ? error.message : String(error)
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 1000))
  }
  throw new Error(lastError)
}

function normalizeAiRepair(item: AuditItem, value: unknown): RepairProposal {
  const obj = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const bank = Array.isArray(obj.bank) ? obj.bank.map((entry) => String(entry ?? '').trim()) : []
  const answers = Array.isArray(obj.answers) ? obj.answers.map((entry) => Number(entry)) : []
  const issues = validationIssues(item.type, bank, answers)
  if (issues.length) throw new Error(issues.join('; '))
  return {
    id: item.id,
    type: item.type,
    mode: 'ai_full',
    bank,
    answers,
    reason: String(obj.reason ?? 'AI full answer-key reconstruction'),
  }
}

async function generateAiRepair(item: AuditItem, row: QuestionRow): Promise<RepairProposal> {
  let validationFeedback = ''
  let lastError = 'AI repair failed'
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return normalizeAiRepair(item, await callDeepSeek(buildRepairPrompt(item, row, validationFeedback)))
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
      validationFeedback = lastError
    }
  }
  throw new Error(lastError)
}

async function fetchRows(ids: string[]): Promise<Map<string, QuestionRow>> {
  const out = new Map<string, QuestionRow>()
  for (let index = 0; index < ids.length; index += 200) {
    const { data, error } = await db
      .from('question_bank')
      .select('id,type,audio_ref,hint')
      .in('id', ids.slice(index, index + 200))
    if (error) throw new Error(error.message)
    for (const row of (data ?? []) as QuestionRow[]) out.set(row.id, row)
  }
  return out
}

async function main() {
  const apply = process.argv.includes('--apply')
  const deactivateUnfixed = process.argv.includes('--deactivate-unfixed')
  const freshRepairs = process.argv.includes('--fresh-repairs')
  const concurrency = parseConcurrency()
  if (!deepseekKey) throw new Error('DEEPSEEK_API_KEY missing')

  const items = (JSON.parse(readFileSync(REPORT_PATH, 'utf8')) as AuditItem[])
    .filter((item) => item.confirmedWrong.length || item.shapeIssues.length)
  const rows = await fetchRows(items.map((item) => item.id))
  const cache = readRepairCache(freshRepairs)
  const results: FixResult[] = []

  console.log(`[fix] candidates=${items.length} apply=${apply ? 'yes' : 'no'} deactivateUnfixed=${deactivateUnfixed ? 'yes' : 'no'} concurrency=${concurrency}`)

  let nextIndex = 0
  let completed = 0
  async function processOne(index: number) {
    const item = items[index]
    const row = rows.get(item.id)
    if (!row) {
      results.push({ id: item.id, type: item.type, mode: 'skipped', status: 'error', reason: 'row not found in question_bank' })
      completed += 1
      return
    }

    const before = normalizeHint(row.hint)
    const direct = applyConfirmedWrong({ ...item, bank: before.bank, answers: before.answers })
    let proposal: RepairProposal | null = null

    if (!item.shapeIssues.length && !direct.issues.length) {
      proposal = {
        id: item.id,
        type: item.type,
        mode: 'direct',
        bank: direct.bank,
        answers: direct.answers,
        reason: 'direct confirmedWrong index replacement',
      }
    } else {
      const cached = cache.entries[item.id]
      if (cached && 'bank' in cached) {
        proposal = cached
      } else if (cached && 'error' in cached && !freshRepairs) {
        if (apply && deactivateUnfixed) {
          const { error } = await db.from('question_bank').update({ status: 'draft', is_reviewed: false }).eq('id', item.id)
          results.push({
            id: item.id,
            type: item.type,
            mode: 'ai_full',
            status: error ? 'error' : 'deactivated',
            reason: error ? error.message : `unfixed AI repair validation error; moved to draft: ${cached.error}`,
            before,
          })
        } else {
          results.push({ id: item.id, type: item.type, mode: 'ai_full', status: 'error', reason: cached.error, before })
        }
        completed += 1
        return
      } else {
        try {
          proposal = await generateAiRepair(item, row)
          cache.entries[item.id] = proposal
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          cache.entries[item.id] = { error: message }
          saveRepairCache(cache)
          if (apply && deactivateUnfixed) {
            const { error: updateError } = await db.from('question_bank').update({ status: 'draft', is_reviewed: false }).eq('id', item.id)
            results.push({
              id: item.id,
              type: item.type,
              mode: 'ai_full',
              status: updateError ? 'error' : 'deactivated',
              reason: updateError ? updateError.message : `unfixed AI repair validation error; moved to draft: ${message}`,
              before,
            })
          } else {
            results.push({ id: item.id, type: item.type, mode: 'ai_full', status: 'error', reason: message, before })
          }
          completed += 1
          return
        }
        saveRepairCache(cache)
      }
    }

    const after = { bank: proposal.bank, answers: proposal.answers }
    const mergedHint = { ...(row.hint ?? {}), bank: proposal.bank, answers: proposal.answers }
    if (apply) {
      const { error } = await db.from('question_bank').update({ hint: mergedHint }).eq('id', item.id)
      if (error) {
        results.push({ id: item.id, type: item.type, mode: proposal.mode, status: 'error', reason: error.message, before, after })
      } else {
        results.push({ id: item.id, type: item.type, mode: proposal.mode, status: 'updated', reason: proposal.reason, before, after })
      }
    } else {
      results.push({ id: item.id, type: item.type, mode: proposal.mode, status: 'ready', reason: proposal.reason, before, after })
    }
    completed += 1
    process.stdout.write(`\r[fix] ${completed}/${items.length} ${proposal.mode} ${item.id}      `)
  }

  async function worker() {
    for (;;) {
      const index = nextIndex
      nextIndex += 1
      if (index >= items.length) return
      await processOne(index)
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()))
  console.log('')

  ensureParent(FIX_REPORT_PATH)
  if (!existsSync(BACKUP_PATH)) {
    const backup = [...rows.values()].map((row) => ({ id: row.id, type: row.type, hint: row.hint }))
    writeFileSync(BACKUP_PATH, JSON.stringify(backup, null, 2))
  }
  writeFileSync(FIX_REPORT_PATH, JSON.stringify(results, null, 2))

  const summary = results.reduce<Record<string, number>>((acc, result) => {
    const key = `${result.status}:${result.mode}`
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
  console.log(JSON.stringify(summary, null, 2))
  console.log(`[fix] wrote ${FIX_REPORT_PATH}`)
  console.log(`[fix] backup ${BACKUP_PATH}`)
}

main().catch((error) => {
  console.error('[fix] fatal', error instanceof Error ? error.message : String(error))
  process.exit(1)
})
