import { createClient } from '@supabase/supabase-js'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname } from 'path'

const env = readFileSync('.env.local', 'utf8')
const getEnv = (key: string) => (env.match(new RegExp(`^${key}=(.*)$`, 'm')) || [])[1]?.trim() ?? ''

const db = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'))
const deepseekKey = getEnv('DEEPSEEK_API_KEY')

const CACHE_PATH = 'scripts/.passage-answer-key-audit-cache.json'
const REPORT_JSON_PATH = 'reports/passage-answer-key-audit.json'
const REPORT_MD_PATH = 'reports/passage-answer-key-audit.md'
const CACHE_VERSION = 1
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

type PassageType = 'banked_cloze' | 'seven_select'

interface QuestionRow {
  id: string
  type: PassageType
  normalized_word: string | null
  audio_ref: string | null
  hint: unknown
  exam_tags: string[] | null
  theme_tags: string[] | null
  source_exam: string | null
  status: string | null
}

interface HintShape {
  bank: string[]
  answers: number[]
}

interface RoundIssue {
  blank: number
  currentIndex: number | null
  currentText: string
  verdict: 'wrong' | 'ambiguous' | 'ok'
  suggestedIndex?: number | null
  suggestedText?: string
  reason: string
  confidence?: number
}

interface Round1Result {
  overall: 'ok' | 'has_issues' | 'ambiguous' | 'invalid'
  issues: RoundIssue[]
  notes?: string
  confidence?: number
}

interface Round2Decision {
  blank: number
  final: 'confirmed_wrong' | 'ambiguous' | 'false_alarm'
  suggestedIndex?: number | null
  suggestedText?: string
  reason: string
  confidence?: number
}

interface Round2Result {
  decisions: Round2Decision[]
  notes?: string
}

interface CacheEntry {
  rowId: string
  type: PassageType
  shapeIssues: string[]
  round1?: Round1Result
  round1Error?: string
  round2?: Round2Result
  round2Error?: string
  updatedAt: string
}

interface AuditCache {
  version: number
  entries: Record<string, CacheEntry>
}

interface ReportItem {
  id: string
  type: PassageType
  examTags: string[]
  themeTags: string[]
  shapeIssues: string[]
  confirmedWrong: Round2Decision[]
  ambiguous: Round2Decision[]
  falseAlarm: Round2Decision[]
  round1Error?: string
  round2Error?: string
  passagePreview: string
  bank: string[]
  answers: number[]
}

function argValue(name: string): string | null {
  const prefix = `${name}=`
  const directIndex = process.argv.indexOf(name)
  if (directIndex >= 0) return process.argv[directIndex + 1] ?? ''
  const hit = process.argv.find((arg) => arg.startsWith(prefix))
  return hit ? hit.slice(prefix.length) : null
}

function parseTypes(): PassageType[] {
  const raw = argValue('--types')
  if (!raw) return ['banked_cloze', 'seven_select']
  const allowed = new Set<PassageType>(['banked_cloze', 'seven_select'])
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is PassageType => allowed.has(item as PassageType))
}

function parseLimit(): number | null {
  const raw = argValue('--limit')
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null
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

function readCache(fresh: boolean): AuditCache {
  if (fresh || !existsSync(CACHE_PATH)) return { version: CACHE_VERSION, entries: {} }
  try {
    const parsed = JSON.parse(readFileSync(CACHE_PATH, 'utf8')) as AuditCache
    if (parsed.version === CACHE_VERSION && parsed.entries) return parsed
  } catch {
    // Ignore corrupt caches and start over.
  }
  return { version: CACHE_VERSION, entries: {} }
}

function saveCache(cache: AuditCache) {
  ensureParent(CACHE_PATH)
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2))
}

async function pageAllRows(types: PassageType[]): Promise<QuestionRow[]> {
  const out: QuestionRow[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from('question_bank')
      .select('id,type,normalized_word,audio_ref,hint,exam_tags,theme_tags,source_exam,status')
      .eq('status', 'active')
      .in('type', types)
      .order('id', { ascending: true })
      .range(from, from + 999)
    if (error) throw new Error(error.message)
    const rows = (data ?? []) as QuestionRow[]
    out.push(...rows)
    if (rows.length < 1000) break
  }
  return out
}

function normalizeHint(hint: unknown): HintShape {
  const obj = (hint && typeof hint === 'object' ? hint : {}) as Record<string, unknown>
  const bank = Array.isArray(obj.bank) ? obj.bank.map((item) => String(item ?? '').trim()) : []
  const answers = Array.isArray(obj.answers) ? obj.answers.map((item) => Number(item)) : []
  return { bank, answers }
}

function expectedCounts(type: PassageType) {
  return type === 'banked_cloze'
    ? { bank: 15, answers: 10, label: 'banked cloze' }
    : { bank: 7, answers: 5, label: 'seven select' }
}

function blankCount(passage: string): number {
  const matches = passage.match(/\((\d+)\)/g)
  return matches?.length ?? 0
}

function shapeIssues(row: QuestionRow, hint: HintShape): string[] {
  const issues: string[] = []
  const passage = row.audio_ref ?? ''
  const expected = expectedCounts(row.type)
  if (!passage.trim()) issues.push('missing passage/audio_ref')
  if (hint.bank.length !== expected.bank) issues.push(`bank length ${hint.bank.length}, expected ${expected.bank}`)
  if (hint.answers.length !== expected.answers) issues.push(`answers length ${hint.answers.length}, expected ${expected.answers}`)
  const blanks = blankCount(passage)
  if (blanks !== expected.answers) issues.push(`blank marker count ${blanks}, expected ${expected.answers}`)
  if (new Set(hint.answers).size !== hint.answers.length) issues.push('answers contain duplicate option indexes')
  for (const [index, answer] of hint.answers.entries()) {
    if (!Number.isInteger(answer) || answer < 0 || answer >= hint.bank.length) {
      issues.push(`answer ${index + 1} points outside bank: ${answer}`)
    }
  }
  const normalizedBank = hint.bank.map((item) => item.toLowerCase())
  if (new Set(normalizedBank).size !== normalizedBank.length) issues.push('bank contains duplicate option text')
  return issues
}

function optionLines(bank: string[]): string {
  return bank.map((text, index) => `${index}: ${LETTERS[index]}. ${text}`).join('\n')
}

function answerLines(hint: HintShape): string {
  return hint.answers
    .map((answer, index) => `${index + 1}: index ${answer}, ${LETTERS[answer] ?? '?'} = "${hint.bank[answer] ?? ''}"`)
    .join('\n')
}

function buildRound1Prompt(row: QuestionRow, hint: HintShape): string {
  const task =
    row.type === 'banked_cloze'
      ? 'This is a CET-style banked cloze. Each blank must be filled by the exact option form, without inflection changes. Check grammar, collocation, part of speech, and passage coherence.'
      : 'This is a seven-select sentence insertion task. Each blank must receive the best sentence based on local coherence, discourse markers, reference, and paragraph flow.'

  return `You are an expert English exam answer-key auditor.

${task}

Be conservative:
- Mark "wrong" only when the current answer is clearly unacceptable and another option is clearly better.
- Mark "ambiguous" when the current answer is acceptable but not uniquely best, or when multiple options could reasonably fit.
- Mark "ok" when the current key is acceptable and no stronger alternative exists.

Return JSON only, no markdown:
{
  "overall": "ok" | "has_issues" | "ambiguous" | "invalid",
  "issues": [
    {
      "blank": 1,
      "currentIndex": 0,
      "currentText": "option text",
      "verdict": "wrong" | "ambiguous" | "ok",
      "suggestedIndex": 2,
      "suggestedText": "better option, or empty",
      "reason": "short reason",
      "confidence": 0.0
    }
  ],
  "notes": "",
  "confidence": 0.0
}

Only include blanks in "issues" if they are wrong or ambiguous. Use 1-based blank numbers and 0-based option indexes.

Question id: ${row.id}
Exam tags: ${(row.exam_tags ?? []).join(', ')}
Theme tags: ${(row.theme_tags ?? []).join(', ')}

Passage with blanks:
${row.audio_ref ?? ''}

Option bank:
${optionLines(hint.bank)}

Current answer key:
${answerLines(hint)}`
}

function buildRound2Prompt(row: QuestionRow, hint: HintShape, round1: Round1Result): string {
  return `You are the second-pass adjudicator for an English exam answer-key audit.

Your job is to prevent false positives. Review ONLY the suspected blanks from pass 1.

Final labels:
- "confirmed_wrong": the current key is clearly wrong or ungrammatical, and the suggested option is clearly correct.
- "ambiguous": the current key may be acceptable, or more than one option can fit.
- "false_alarm": pass 1 was too strict; the current key is acceptable and should stay.

Return JSON only, no markdown:
{
  "decisions": [
    {
      "blank": 1,
      "final": "confirmed_wrong" | "ambiguous" | "false_alarm",
      "suggestedIndex": 2,
      "suggestedText": "option text, or empty",
      "reason": "short reason",
      "confidence": 0.0
    }
  ],
  "notes": ""
}

Question id: ${row.id}
Type: ${row.type}

Passage with blanks:
${row.audio_ref ?? ''}

Option bank:
${optionLines(hint.bank)}

Current answer key:
${answerLines(hint)}

Pass 1 suspected issues:
${JSON.stringify(round1.issues, null, 2)}`
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
        const content = data.choices?.[0]?.message?.content ?? ''
        return JSON.parse(extractJson(content))
      }
    } catch (error) {
      clearTimeout(timeout)
      lastError = error instanceof Error ? error.message : String(error)
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
  }
  throw new Error(lastError)
}

function normalizeRound1(value: unknown): Round1Result {
  const obj = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const rawIssues = Array.isArray(obj.issues) ? obj.issues : []
  const issues: RoundIssue[] = rawIssues.map((item) => {
    const issue = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
    const verdict: RoundIssue['verdict'] =
      issue.verdict === 'wrong' || issue.verdict === 'ambiguous' || issue.verdict === 'ok' ? issue.verdict : 'ambiguous'
    return {
      blank: Number(issue.blank),
      currentIndex: issue.currentIndex == null ? null : Number(issue.currentIndex),
      currentText: String(issue.currentText ?? ''),
      verdict,
      suggestedIndex: issue.suggestedIndex == null ? null : Number(issue.suggestedIndex),
      suggestedText: String(issue.suggestedText ?? ''),
      reason: String(issue.reason ?? ''),
      confidence: issue.confidence == null ? undefined : Number(issue.confidence),
    }
  }).filter((issue) => Number.isFinite(issue.blank) && issue.verdict !== 'ok')
  const overall = obj.overall === 'ok' || obj.overall === 'has_issues' || obj.overall === 'ambiguous' || obj.overall === 'invalid'
    ? obj.overall
    : issues.length ? 'has_issues' : 'ok'
  return {
    overall,
    issues,
    notes: String(obj.notes ?? ''),
    confidence: obj.confidence == null ? undefined : Number(obj.confidence),
  }
}

function normalizeRound2(value: unknown): Round2Result {
  const obj = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const rawDecisions = Array.isArray(obj.decisions) ? obj.decisions : []
  const decisions: Round2Decision[] = rawDecisions.map((item) => {
    const decision = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
    const final: Round2Decision['final'] = decision.final === 'confirmed_wrong' || decision.final === 'ambiguous' || decision.final === 'false_alarm'
      ? decision.final
      : 'ambiguous'
    return {
      blank: Number(decision.blank),
      final,
      suggestedIndex: decision.suggestedIndex == null ? null : Number(decision.suggestedIndex),
      suggestedText: String(decision.suggestedText ?? ''),
      reason: String(decision.reason ?? ''),
      confidence: decision.confidence == null ? undefined : Number(decision.confidence),
    }
  }).filter((decision) => Number.isFinite(decision.blank))
  return { decisions, notes: String(obj.notes ?? '') }
}

async function auditRow(row: QuestionRow, cache: AuditCache, fresh: boolean): Promise<CacheEntry> {
  const hint = normalizeHint(row.hint)
  const issues = shapeIssues(row, hint)
  const current = fresh ? undefined : cache.entries[row.id]
  const entry: CacheEntry = current ?? {
    rowId: row.id,
    type: row.type,
    shapeIssues: issues,
    updatedAt: new Date().toISOString(),
  }
  entry.shapeIssues = issues

  if (issues.length || !deepseekKey) {
    entry.updatedAt = new Date().toISOString()
    cache.entries[row.id] = entry
    saveCache(cache)
    return entry
  }

  if (!entry.round1 && !entry.round1Error) {
    try {
      entry.round1 = normalizeRound1(await callDeepSeek(buildRound1Prompt(row, hint)))
    } catch (error) {
      entry.round1Error = error instanceof Error ? error.message : String(error)
    }
    entry.updatedAt = new Date().toISOString()
    cache.entries[row.id] = entry
    saveCache(cache)
  }

  const round1Issues = entry.round1?.issues ?? []
  if (round1Issues.length && !entry.round2 && !entry.round2Error) {
    try {
      entry.round2 = normalizeRound2(await callDeepSeek(buildRound2Prompt(row, hint, entry.round1 as Round1Result)))
    } catch (error) {
      entry.round2Error = error instanceof Error ? error.message : String(error)
    }
    entry.updatedAt = new Date().toISOString()
    cache.entries[row.id] = entry
    saveCache(cache)
  }

  return entry
}

function buildReport(rows: QuestionRow[], cache: AuditCache): { items: ReportItem[]; markdown: string } {
  const items = rows.map((row) => {
    const hint = normalizeHint(row.hint)
    const entry = cache.entries[row.id]
    const decisions = entry?.round2?.decisions ?? []
    return {
      id: row.id,
      type: row.type,
      examTags: row.exam_tags ?? [],
      themeTags: row.theme_tags ?? [],
      shapeIssues: entry?.shapeIssues ?? shapeIssues(row, hint),
      confirmedWrong: decisions.filter((decision) => decision.final === 'confirmed_wrong'),
      ambiguous: decisions.filter((decision) => decision.final === 'ambiguous'),
      falseAlarm: decisions.filter((decision) => decision.final === 'false_alarm'),
      round1Error: entry?.round1Error,
      round2Error: entry?.round2Error,
      passagePreview: (row.audio_ref ?? '').replace(/\s+/g, ' ').slice(0, 180),
      bank: hint.bank,
      answers: hint.answers,
    }
  })

  const byType = new Map<PassageType, ReportItem[]>()
  for (const item of items) {
    byType.set(item.type, [...(byType.get(item.type) ?? []), item])
  }

  const lines: string[] = []
  lines.push('# Passage Answer Key Audit')
  lines.push('')
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push('')
  lines.push('Scope: active `banked_cloze` and `seven_select` rows. This report is read-only; no database rows were changed.')
  lines.push('')
  lines.push('## Summary')
  lines.push('')
  lines.push('| Type | Rows | Shape issue rows | Confirmed wrong rows | Confirmed wrong blanks | Ambiguous rows | AI error rows |')
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: |')
  for (const type of ['banked_cloze', 'seven_select'] as PassageType[]) {
    const group = byType.get(type) ?? []
    const shapeRows = group.filter((item) => item.shapeIssues.length).length
    const wrongRows = group.filter((item) => item.confirmedWrong.length).length
    const wrongBlanks = group.reduce((sum, item) => sum + item.confirmedWrong.length, 0)
    const ambiguousRows = group.filter((item) => item.ambiguous.length).length
    const errorRows = group.filter((item) => item.round1Error || item.round2Error).length
    lines.push(`| ${type} | ${group.length} | ${shapeRows} | ${wrongRows} | ${wrongBlanks} | ${ambiguousRows} | ${errorRows} |`)
  }

  const wrongItems = items.filter((item) => item.confirmedWrong.length)
  const ambiguousItems = items.filter((item) => item.ambiguous.length)
  const shapeItems = items.filter((item) => item.shapeIssues.length)
  const errorItems = items.filter((item) => item.round1Error || item.round2Error)

  lines.push('')
  lines.push('## Confirmed Wrong')
  lines.push('')
  if (!wrongItems.length) {
    lines.push('No confirmed wrong answer keys found by the two-pass audit.')
  } else {
    for (const item of wrongItems) {
      lines.push(`### ${item.id}`)
      lines.push(`- Type: ${item.type}; exam: ${item.examTags.join(', ') || '-'}; level: ${item.themeTags.join(', ') || '-'}`)
      lines.push(`- Passage: ${item.passagePreview}`)
      for (const decision of item.confirmedWrong) {
        const currentIndex = item.answers[decision.blank - 1]
        const currentText = item.bank[currentIndex] ?? ''
        lines.push(`- Blank ${decision.blank}: current \`${currentIndex}:${currentText}\` -> suggested \`${decision.suggestedIndex ?? ''}:${decision.suggestedText ?? ''}\`; confidence ${decision.confidence ?? '-'}; ${decision.reason}`)
      }
      lines.push('')
    }
  }

  lines.push('')
  lines.push('## Ambiguous / Needs Human Review')
  lines.push('')
  if (!ambiguousItems.length) {
    lines.push('No ambiguous answer keys found.')
  } else {
    for (const item of ambiguousItems.slice(0, 120)) {
      lines.push(`### ${item.id}`)
      lines.push(`- Type: ${item.type}; exam: ${item.examTags.join(', ') || '-'}; level: ${item.themeTags.join(', ') || '-'}`)
      for (const decision of item.ambiguous) {
        const currentIndex = item.answers[decision.blank - 1]
        const currentText = item.bank[currentIndex] ?? ''
        lines.push(`- Blank ${decision.blank}: current \`${currentIndex}:${currentText}\`; suggested \`${decision.suggestedIndex ?? ''}:${decision.suggestedText ?? ''}\`; ${decision.reason}`)
      }
      lines.push('')
    }
    if (ambiguousItems.length > 120) lines.push(`Additional ambiguous rows omitted from Markdown: ${ambiguousItems.length - 120}. See JSON report.`)
  }

  lines.push('')
  lines.push('## Shape Issues')
  lines.push('')
  if (!shapeItems.length) {
    lines.push('No structural issues found.')
  } else {
    for (const item of shapeItems) {
      lines.push(`- ${item.id}: ${item.shapeIssues.join('; ')}`)
    }
  }

  lines.push('')
  lines.push('## AI Errors')
  lines.push('')
  if (!errorItems.length) {
    lines.push('No AI/API errors.')
  } else {
    for (const item of errorItems) {
      lines.push(`- ${item.id}: ${item.round1Error ?? item.round2Error}`)
    }
  }

  lines.push('')
  lines.push('## Notes')
  lines.push('')
  lines.push('- Confirmed wrong requires two passes: pass 1 flags a blank, pass 2 confirms it.')
  lines.push('- Ambiguous means the item should be reviewed by a human before changing the answer key.')
  lines.push('- The script intentionally does not modify Supabase.')

  return { items, markdown: `${lines.join('\n')}\n` }
}

async function main() {
  const types = parseTypes()
  const limit = parseLimit()
  const concurrency = parseConcurrency()
  const fresh = process.argv.includes('--fresh')
  const skipAi = process.argv.includes('--skip-ai')
  const rows = (await pageAllRows(types)).slice(0, limit ?? undefined)
  const cache = readCache(fresh)
  if (!deepseekKey && !skipAi) throw new Error('DEEPSEEK_API_KEY missing')

  console.log(`[audit] rows=${rows.length} types=${types.join(',')} fresh=${fresh ? 'yes' : 'no'} skipAi=${skipAi ? 'yes' : 'no'} concurrency=${concurrency}`)
  let nextIndex = 0
  let completed = 0
  async function runOne(index: number) {
    const row = rows[index]
    if (!row) return
    if (skipAi) {
      const hint = normalizeHint(row.hint)
      cache.entries[row.id] = {
        rowId: row.id,
        type: row.type,
        shapeIssues: shapeIssues(row, hint),
        updatedAt: new Date().toISOString(),
      }
      saveCache(cache)
    } else {
      await auditRow(row, cache, fresh)
    }
    const entry = cache.entries[row.id]
    const r1 = entry?.round1?.issues.length ?? 0
    const r2 = entry?.round2?.decisions.filter((decision) => decision.final === 'confirmed_wrong').length ?? 0
    completed += 1
    process.stdout.write(`\r[audit] ${completed}/${rows.length} last=${index + 1} ${row.type} r1=${r1} confirmed=${r2} shape=${entry?.shapeIssues.length ?? 0}      `)
  }

  async function worker() {
    for (;;) {
      const index = nextIndex
      nextIndex += 1
      if (index >= rows.length) return
      await runOne(index)
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()))
  console.log('')

  const report = buildReport(rows, cache)
  ensureParent(REPORT_JSON_PATH)
  ensureParent(REPORT_MD_PATH)
  writeFileSync(REPORT_JSON_PATH, JSON.stringify(report.items, null, 2))
  writeFileSync(REPORT_MD_PATH, report.markdown)
  console.log(`[audit] wrote ${REPORT_MD_PATH}`)
  console.log(`[audit] wrote ${REPORT_JSON_PATH}`)
}

main().catch((error) => {
  console.error('[audit] fatal', error instanceof Error ? error.message : String(error))
  process.exit(1)
})
