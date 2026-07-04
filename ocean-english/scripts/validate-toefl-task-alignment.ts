/*
  validate-toefl-task-alignment.ts

  Read-only TOEFL 2026 task-alignment gate.

  It checks that exam-specs, authored templates, current pilot DB rows, and
  readiness blockers agree with the product contract:
  - TOEFL专项可练, but full/mini mock exams remain paper_not_ready (paperReady=false).
  - Listening 专项 (choose_a_response / listening_comprehension): pilot 20 + F3 180 = 100+100 active with
    reviewed audio (F3 audio owner-delegated sample-review + activation + promote, 2026-07-04).
  - Reading 专项 (read_daily_life / reading_comprehension) promoted active 2026-07-04 (F2, owner-approved);
    2 pilot academic REVIEW sets (weak-inference Q4) are held draft; full/mini papers stay closed.
  - Build/speaking tasks remain blocked by explicit reasons.
*/

import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { getExamSpec } from '@/lib/exam-specs'

const OUT = 'reports/toefl-task-alignment-validation.json'
const LISTENING_STAGE = 'toefl-listening-pilot-2026-07-01'
const READING_STAGE = 'toefl-reading-pilot-2026-07-02'

type ExpectedTask = {
  sectionId: string
  taskType: string
  templateId: string
  shape: string
  itemCount: number
  optionCount: number
  readiness: 'active_ok' | 'draft_ready' | 'audio_missing' | 'scoring_not_ready' | 'speaking_pipeline_not_ready' | 'rubric_active_ok'
}

const EXPECTED: ExpectedTask[] = [
  { sectionId: 'reading', taskType: 'complete_the_words', templateId: 'toefl-complete-the-words', shape: 'complete_words', itemCount: 1, optionCount: 0, readiness: 'active_ok' },
  { sectionId: 'reading', taskType: 'read_daily_life', templateId: 'toefl-read-daily-life', shape: 'reading_multi', itemCount: 3, optionCount: 4, readiness: 'active_ok' },
  { sectionId: 'reading', taskType: 'reading_comprehension', templateId: 'toefl-academic-reading', shape: 'reading_multi', itemCount: 4, optionCount: 4, readiness: 'active_ok' },
  // 2026-07-04: F3 180 条听力经 owner 委托抽查（STT 40/40）+ 音频激活 + promote → 两型各 100 active。
  { sectionId: 'listening', taskType: 'choose_a_response', templateId: 'toefl-choose-a-response', shape: 'listening_multi', itemCount: 1, optionCount: 4, readiness: 'active_ok' },
  { sectionId: 'listening', taskType: 'listening_comprehension', templateId: 'toefl-listening-mcq', shape: 'listening_multi', itemCount: 3, optionCount: 4, readiness: 'active_ok' },
  { sectionId: 'writing', taskType: 'build_a_sentence', templateId: 'toefl-build-a-sentence', shape: 'build_sentence', itemCount: 1, optionCount: 0, readiness: 'scoring_not_ready' },
  { sectionId: 'writing', taskType: 'email_writing', templateId: 'toefl-email-writing', shape: 'free_text_rubric', itemCount: 1, optionCount: 0, readiness: 'rubric_active_ok' },
  { sectionId: 'writing', taskType: 'academic_discussion', templateId: 'toefl-academic-discussion', shape: 'free_text_rubric', itemCount: 1, optionCount: 0, readiness: 'rubric_active_ok' },
  { sectionId: 'speaking', taskType: 'listen_and_repeat', templateId: 'toefl-listen-and-repeat', shape: 'speak_prompt', itemCount: 1, optionCount: 0, readiness: 'speaking_pipeline_not_ready' },
  { sectionId: 'speaking', taskType: 'interview_speaking', templateId: 'toefl-interview-speaking', shape: 'speak_prompt', itemCount: 1, optionCount: 0, readiness: 'speaking_pipeline_not_ready' },
]

const envText = existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : ''
const readEnv = (key: string) => (envText.match(new RegExp(`^${key}=(.*)$`, 'm')) || [])[1]?.trim() ?? ''
const SUPABASE_URL = readEnv('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_ROLE = readEnv('SUPABASE_SERVICE_ROLE_KEY')

const errors: string[] = []
const warnings: string[] = []

function ok(condition: boolean, message: string) {
  if (!condition) errors.push(message)
}

function warn(condition: boolean, message: string) {
  if (!condition) warnings.push(message)
}

function readJson(path: string): any {
  if (!existsSync(path)) {
    errors.push(`missing file: ${path}`)
    return null
  }
  return JSON.parse(readFileSync(path, 'utf8'))
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function choiceKeys(choices: unknown[]): string[] {
  return choices
    .map((choice) => {
      if (choice && typeof choice === 'object' && 'id' in choice) return String((choice as { id?: unknown }).id ?? '')
      return String(choice)
    })
    .filter(Boolean)
}

function writeReport(payload: Record<string, unknown>) {
  writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), ...payload }, null, 2) + '\n', 'utf8')
}

async function tableExists(db: any, table: string): Promise<boolean> {
  const { error } = await db.from(table).select('id').limit(1)
  return !error
}

function validateSpecAndTemplates() {
  const spec = getExamSpec('toefl')
  ok(!!spec, 'exam-specs: missing TOEFL spec')
  if (!spec) return null

  ok(spec.status === 'active', `exam-specs: TOEFL status=${spec.status}, expected active for专项练习`)
  ok(spec.paperReady === false, `exam-specs: TOEFL paperReady=${String(spec.paperReady)}, expected false until full mock is complete`)

  const sectionById = new Map(spec.sections.map((section) => [section.id, section]))
  for (const expected of EXPECTED) {
    const section = sectionById.get(expected.sectionId)
    ok(!!section, `exam-specs: missing TOEFL section ${expected.sectionId}`)
    ok(!!section?.taskTypes.includes(expected.taskType as any), `exam-specs: TOEFL ${expected.sectionId} missing taskType ${expected.taskType}`)

    const templatePath = `data/exam-task-templates/${expected.templateId}.json`
    const template = readJson(templatePath)
    if (!template) continue

    ok(asArray(template.examIds).includes('toefl'), `${expected.templateId}: examIds must include toefl`)
    ok(template.taskType === expected.taskType, `${expected.templateId}: taskType=${template.taskType}, expected ${expected.taskType}`)
    ok(template.answerSchema?.shape === expected.shape, `${expected.templateId}: answerSchema.shape=${template.answerSchema?.shape}, expected ${expected.shape}`)
    ok(Number(template.itemCount) === expected.itemCount, `${expected.templateId}: itemCount=${template.itemCount}, expected ${expected.itemCount}`)
    ok(Number(template.optionCount ?? 0) === expected.optionCount, `${expected.templateId}: optionCount=${template.optionCount ?? 0}, expected ${expected.optionCount}`)
    ok(template.copyrightPolicy === 'original_only', `${expected.templateId}: copyrightPolicy must be original_only`)

    if (expected.readiness === 'scoring_not_ready') {
      ok(template.generation?.scoringNotReady === true, `${expected.templateId}: build_a_sentence must keep generation.scoringNotReady=true`)
    }
    // listening 模板形状检查按 section 归属（2026-07-04 起 readiness 已是 active_ok，不再以 audio_missing 触发）
    if (expected.sectionId === 'listening') {
      ok(template.skill === 'listening', `${expected.templateId}: listening-section templates must be listening skill`)
      ok(template.answerSchema?.shape === 'listening_multi', `${expected.templateId}: listening templates must use listening_multi`)
    }
  }

  return {
    status: spec.status,
    paperReady: spec.paperReady,
    sections: spec.sections.map((section) => ({
      id: section.id,
      taskTypes: section.taskTypes,
      requiresAudio: section.requiresAudio ?? false,
      requiresRubric: section.requiresRubric ?? false,
    })),
  }
}

async function validateDb() {
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    warnings.push('missing Supabase credentials; DB checks skipped')
    return { status: 'skipped', reason: 'missing_supabase_credentials' }
  }

  const db = createClient(SUPABASE_URL, SERVICE_ROLE)
  if (!(await tableExists(db, 'question_sets'))) {
    warnings.push('question_sets table missing; DB checks skipped as not_applied')
    return { status: 'not_applied' }
  }

  const { data: pilotSets, error: pilotError } = await db
    .from('question_sets')
    .select('id, legacy_id, task_type, status, stimulus_id, qa_flags, question_items(id,status,input_mode,choices,answer)')
    .contains('qa_flags', { stage: LISTENING_STAGE })
    .order('task_type', { ascending: true })

  if (pilotError) throw new Error(`question_sets pilot query: ${pilotError.message}`)

  const { data: readingPilotSets, error: readingPilotError } = await db
    .from('question_sets')
    .select('id, legacy_id, task_type, status, qa_flags, question_items(id,status,input_mode,choices,answer)')
    .contains('qa_flags', { stage: READING_STAGE })
    .order('task_type', { ascending: true })

  if (readingPilotError) throw new Error(`question_sets reading pilot query: ${readingPilotError.message}`)

  const sets = (pilotSets ?? []) as any[]
  const chooseSets = sets.filter((set) => set.task_type === 'choose_a_response')
  const listeningSets = sets.filter((set) => set.task_type === 'listening_comprehension')
  const items = sets.flatMap((set) => asArray(set.question_items).map((item) => ({ ...(item as any), set })))
  const stimulusIds = sets.map((set) => set.stimulus_id).filter((x): x is string => typeof x === 'string' && x.length > 0)

  const readingSets = (readingPilotSets ?? []) as any[]
  const dailyLifeSets = readingSets.filter((set) => set.task_type === 'read_daily_life')
  const academicSets = readingSets.filter((set) => set.task_type === 'reading_comprehension')
  const readingItems = readingSets.flatMap((set) => asArray(set.question_items).map((item) => ({ ...(item as any), set })))

  // TOEFL Reading 专项 promoted 2026-07-04 (F2, owner-approved): the 20 pilot sets are now mostly active.
  // read_daily_life pilot: all 10 active. reading_comprehension pilot: 8 active + 2 held-back REVIEW draft
  // (weak-inference Q4 on the plankton/desert academic sets, excluded from the promote manifest). Full/mini
  // mock stays closed (paperReady=false). Item status must match its set status.
  const READING_ACADEMIC_REVIEW_DRAFT = 2 // known pilot REVIEW sets deliberately kept draft
  ok(dailyLifeSets.length === 10, `DB ${READING_STAGE}: read_daily_life sets=${dailyLifeSets.length}, expected 10`)
  ok(academicSets.length === 10, `DB ${READING_STAGE}: reading_comprehension sets=${academicSets.length}, expected 10`)
  ok(readingItems.length === 64, `DB ${READING_STAGE}: items=${readingItems.length}, expected 64`)
  const dailyActive = dailyLifeSets.filter((s) => s.status === 'active').length
  const academicActive = academicSets.filter((s) => s.status === 'active').length
  const academicDraft = academicSets.filter((s) => s.status === 'draft').length
  ok(dailyActive === 10, `DB ${READING_STAGE}: read_daily_life active=${dailyActive}, expected 10 (promoted)`)
  ok(academicActive === 10 - READING_ACADEMIC_REVIEW_DRAFT, `DB ${READING_STAGE}: reading_comprehension active=${academicActive}, expected ${10 - READING_ACADEMIC_REVIEW_DRAFT}`)
  ok(academicDraft === READING_ACADEMIC_REVIEW_DRAFT, `DB ${READING_STAGE}: reading_comprehension draft(held REVIEW)=${academicDraft}, expected ${READING_ACADEMIC_REVIEW_DRAFT}`)
  for (const set of readingSets) {
    ok(set.status === 'active' || set.status === 'draft', `DB ${READING_STAGE}: set ${set.legacy_id ?? set.id} status=${set.status}, expected active or draft`)
    const setItems = asArray(set.question_items)
    const expectedMin = set.task_type === 'read_daily_life' ? 2 : 4
    const expectedMax = set.task_type === 'read_daily_life' ? 3 : 4
    ok(setItems.length >= expectedMin && setItems.length <= expectedMax, `DB ${READING_STAGE}: set ${set.legacy_id ?? set.id} items=${setItems.length}, expected ${expectedMin}-${expectedMax}`)
  }
  for (const row of readingItems) {
    const choices = asArray(row.choices)
    const answer = String(row.answer ?? '').trim()
    ok(row.status === row.set.status, `DB ${READING_STAGE}: item ${row.id} status=${row.status}, expected to match set status ${row.set.status}`)
    ok(row.input_mode === 'choice', `DB ${READING_STAGE}: item ${row.id} input_mode=${row.input_mode}, expected choice`)
    ok(choices.length === 4, `DB ${READING_STAGE}: item ${row.id} choices=${choices.length}, expected 4`)
    ok(choiceKeys(choices).includes(answer), `DB ${READING_STAGE}: item ${row.id} answer does not hit choice ids/text`)
  }

  ok(chooseSets.length === 10, `DB ${LISTENING_STAGE}: choose_a_response sets=${chooseSets.length}, expected 10`)
  ok(listeningSets.length === 10, `DB ${LISTENING_STAGE}: listening_comprehension sets=${listeningSets.length}, expected 10`)
  ok(items.length === 40, `DB ${LISTENING_STAGE}: items=${items.length}, expected 40`)
  ok(stimulusIds.length === 20 && new Set(stimulusIds).size === 20, `DB ${LISTENING_STAGE}: expected 20 linked unique stimuli, got ${stimulusIds.length}/${new Set(stimulusIds).size}`)

  let activeAudioCount = 0
  if (stimulusIds.length > 0) {
    const { data: audio, error: audioError } = await db
      .from('audio_assets')
      .select('id, stimulus_id, qa_status')
      .in('stimulus_id', stimulusIds)

    if (audioError) throw new Error(`audio_assets query: ${audioError.message}`)
    activeAudioCount = (audio ?? []).filter((asset: any) => asset.qa_status === 'active').length
    ok((audio ?? []).length === 20, `DB ${LISTENING_STAGE}: audio rows=${(audio ?? []).length}, expected 20`)
  }

  const expectedRuntimeStatus = activeAudioCount === 20 ? 'active' : 'draft'

  for (const set of sets) {
    ok(set.status === expectedRuntimeStatus, `DB ${LISTENING_STAGE}: set ${set.legacy_id ?? set.id} status=${set.status}, expected ${expectedRuntimeStatus}`)
    ok(!!set.stimulus_id, `DB ${LISTENING_STAGE}: set ${set.legacy_id ?? set.id} missing stimulus_id`)
    const setItems = asArray(set.question_items)
    const expectedItems = set.task_type === 'listening_comprehension' ? 3 : 1
    ok(setItems.length === expectedItems, `DB ${LISTENING_STAGE}: set ${set.legacy_id ?? set.id} has ${setItems.length} items, expected ${expectedItems}`)
  }

  for (const row of items) {
    const choices = asArray(row.choices)
    const answer = String(row.answer ?? '').trim()
    ok(row.status === expectedRuntimeStatus, `DB ${LISTENING_STAGE}: item ${row.id} status=${row.status}, expected ${expectedRuntimeStatus}`)
    ok(row.input_mode === 'listen', `DB ${LISTENING_STAGE}: item ${row.id} input_mode=${row.input_mode}, expected listen`)
    ok(choices.length === 4, `DB ${LISTENING_STAGE}: item ${row.id} choices=${choices.length}, expected 4`)
    ok(answer.length > 0, `DB ${LISTENING_STAGE}: item ${row.id} missing answer`)
    ok(choiceKeys(choices).includes(answer), `DB ${LISTENING_STAGE}: item ${row.id} answer does not hit choice ids/text`)
  }

  const { data: activeListening, error: activeError } = await db
    .from('question_sets')
    .select('id, task_type, status')
    .eq('exam_id', 'toefl')
    .eq('status', 'active')
    .in('task_type', ['choose_a_response', 'listening_comprehension'])

  if (activeError) throw new Error(`active listening query: ${activeError.message}`)
  // 2026-07-04 F3 promote 后：pilot 20 + F3 180 = 200 active（此前仅 pilot 20）。
  ok((activeListening ?? []).length === (expectedRuntimeStatus === 'active' ? 200 : 0), `DB: TOEFL listening active sets=${(activeListening ?? []).length}, expected ${expectedRuntimeStatus === 'active' ? 200 : 0}`)

  return {
    status: 'checked',
    stage: LISTENING_STAGE,
    expectedRuntimeStatus,
    counts: {
      sets: sets.length,
      choose_a_response: chooseSets.length,
      listening_comprehension: listeningSets.length,
      items: items.length,
      stimuli: new Set(stimulusIds).size,
      activeToeflListeningSets: (activeListening ?? []).length,
      activePilotAudioAssets: activeAudioCount,
      readingPilotSets: readingSets.length,
      readingPilotItems: readingItems.length,
    },
  }
}

async function main() {
  const staticSummary = validateSpecAndTemplates()
  const dbSummary = await validateDb()

  const blockerSummary = {
    paperReady: false,
    // Reading 专项 promoted active 2026-07-04 (owner-approved); 2 pilot academic REVIEW sets held draft.
    reviewedActive: ['read_daily_life', 'reading_comprehension', 'complete_the_words', 'email_writing', 'academic_discussion'],
    readingAcademicReviewHeldDraft: 2,
    audioReviewedAndActive: ['choose_a_response', 'listening_comprehension'],
    scoringNotReady: ['build_a_sentence'],
    speakingPipelineNotReady: ['listen_and_repeat', 'interview_speaking'],
  }

  writeReport({
    ok: errors.length === 0,
    errors,
    warnings,
    expectedTasks: EXPECTED,
    staticSummary,
    dbSummary,
    blockerSummary,
  })

  console.log(`validate-toefl-task-alignment: errors=${errors.length} warnings=${warnings.length}`)
  for (const error of errors) console.error(`ERROR ${error}`)
  for (const message of warnings) console.warn(`WARN ${message}`)
  process.exitCode = errors.length > 0 ? 1 : 0
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  errors.push(message)
  writeReport({ ok: false, errors, warnings })
  console.error('validate-toefl-task-alignment fatal:', message)
  process.exitCode = 1
})
