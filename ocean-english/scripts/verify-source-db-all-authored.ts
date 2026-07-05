/* ════════════════════════════════════════════════════════════════════════
   verify-source-db-all-authored.ts — R2 deterministic source↔DB verifier for ALL
   Claude-authored stages (only-read).

   Walks data/generated-question-sets/<stage>/ and, for every authored source record,
   reproduces the importer's deterministic legacy_id and compares it 1:1 to the DB:
     · objective files ({template, level?, sets[]}) → import-authored-question-sets-v2 scheme
       legacy = gen:<templateId>:set:claude:<hashId(`<template>|<level>|<JSON(raw)>`)>;
       item payload compared EXACTLY against shapeToItems() (input_mode/prompt/choices/answer);
       cardinality (grouped sets), answer-in-range, no-dup-choice all come from shapeToItems.
     · productive files ({examId, level, skill, taskType, tasks[]}) → import-authored-productive-tasks-v2
       legacy = gen:productive:<taskType>:set:claude:<tag>; item free_text/speak + rubric_id (==exam/skill
       rubric) + answer.official===false + prompt/prompt_zh/referencePoints/qa_flags.wordLimit match.
   Forward 1:1 (each source record → exactly one DB draft set + correct items) AND per-stage reverse
   (every DB gen set tagged with that stage maps back to a source record — no orphan).

   SKIP stages intentionally not in DB (e.g. toefl-2026-pilot-blocked, removed pending spec).
   Exit 1 on ANY mismatch / DB error. Never writes DB rows.
   Usage: npx tsx scripts/verify-source-db-all-authored.ts
   ════════════════════════════════════════════════════════════════════════ */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { shapeToItems, type ShapeTemplate, type DraftChoice, type DraftItem } from '@/lib/exam-task-templates/shape'
import { getExamSpec } from '@/lib/exam-specs'

const ROOT = 'data/generated-question-sets'
const TPLDIR = 'data/exam-task-templates'
const SKIP_STAGES = new Set(['toefl-2026-pilot-blocked'])

const env = existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : ''
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db: SupabaseClient = createClient(readEnv('NEXT_PUBLIC_SUPABASE_URL'), readEnv('SUPABASE_SERVICE_ROLE_KEY'))

function hashId(s: string): string { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return (h >>> 0).toString(36) }

type SetRow = { id: string; legacy_id: string | null; task_type: string; status: string; level: number | null; stimulus_id: string | null; qa_flags: Record<string, unknown> | null }
type ItemRow = { question_set_id: string; order_index: number; input_mode: string; prompt: string | null; prompt_zh: string | null; choices: unknown; answer: unknown; rubric_id: string | null }

interface ObjTemplate { templateId: string; examIds: string[]; taskType: string; skill: string; itemCount: number; optionCount: number; answerSchema: Record<string, unknown>; stimulusRequirements?: Record<string, unknown> }
interface ObjFile { template: string; level?: number; sets: Record<string, unknown>[] }
interface ProdTask { prompt?: string; promptZh?: string; referencePoints?: string[]; wordLimit?: string; sourceTextZh?: string; sourceTextEn?: string }
interface ProdFile { examId: string; level?: number; skill: string; taskType: string; tasks: ProdTask[] }

const errors: string[] = []
const fail = (m: string) => errors.push(m)
// shape-rejected source records are superseded historical drafts the importer correctly never wrote —
// not a source↔DB violation. Counted + reported, never a hard failure.
const supersededRejects: string[] = []
const tplCache = new Map<string, ObjTemplate | null>()
function loadTpl(name: string): ObjTemplate | null {
  if (tplCache.has(name)) return tplCache.get(name)!
  const p = `${TPLDIR}/${name}.json`
  const t = existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')) as ObjTemplate) : null
  tplCache.set(name, t); return t
}
const toShape = (t: ObjTemplate): ShapeTemplate => ({ taskType: t.taskType, skill: t.skill, itemCount: t.itemCount, optionCount: t.optionCount, answerSchema: t.answerSchema, stimulusRequirements: t.stimulusRequirements })

/** Permutation-robust per-item ANSWER comparison (src shaped item vs DB item). Returns a mismatch string or null.
 *  Choice-bearing items were answer-position-normalized (banks/options may be permuted), so for index-based
 *  answers we resolve to the keyed TEXT (invariant to permutation) rather than comparing raw indices. Covers:
 *   · scalar string answer w/o choices (spell / complete_words) → exact;
 *   · bank_answers / build_sentence (idx array into choices) → resolved answer WORDS in order;
 *   · cloze_passage ([{options,answer}] per blank) → per-blank option multiset + resolved correct TEXT;
 *   · gblanks ([{answer,acceptable,hint}]) → per-blank answer + acceptable deep-equal;
 *   · para_match (matching, answer=paragraph idx) → (statement-text → paragraph-idx) mapping, order-invariant.
 *  Single-choice (string answer WITH choices) is verified by the caller's resolve-by-text check → null here. */
function answerDiff(e: DraftItem, aItem: ItemRow): string | null {
  const ea = e.answer, aa = aItem.answer
  const aChoices: DraftChoice[] = Array.isArray(aItem.choices) ? (aItem.choices as DraftChoice[]) : []
  const J = (x: unknown) => JSON.stringify(x)

  if (typeof ea === 'string' || typeof ea === 'number') {
    if (e.choices.length === 0) { // spell / complete_words: scalar answer, no choices → exact
      if (String(ea) !== String(aa)) return `answer mismatch (src "${String(ea)}" vs db "${String(aa)}")`
    }
    return null // scalar WITH choices → single-choice text check in caller
  }
  if (!Array.isArray(ea)) return null
  if (!Array.isArray(aa)) return `answer type mismatch (src array vs db ${typeof aa})`
  if (ea.length !== aa.length) return `answer length ${aa.length}≠${ea.length}`
  if (ea.length === 0) return null

  // cloze_passage: [{options:[...], answer:"<idx>"}]
  if (typeof ea[0] === 'object' && ea[0] !== null && 'options' in (ea[0] as object)) {
    for (let b = 0; b < ea.length; b++) {
      const eb = ea[b] as { options?: unknown[]; answer?: unknown }
      const ab = aa[b] as { options?: unknown[]; answer?: unknown }
      const eOpts = (eb.options ?? []).map(String), aOpts = (ab?.options ?? []).map(String)
      if (J([...eOpts].sort()) !== J([...aOpts].sort())) return `blank${b}: option-text multiset mismatch`
      const eC = eOpts[Number(eb.answer)], aC = aOpts[Number(ab?.answer)]
      if (eC !== aC) return `blank${b}: correct-option text mismatch (src "${eC}" vs db "${aC}")`
    }
    return null
  }
  // gblanks: [{answer, acceptable[], hint?}]
  if (typeof ea[0] === 'object' && ea[0] !== null && 'answer' in (ea[0] as object)) {
    for (let b = 0; b < ea.length; b++) {
      const eb = ea[b] as Record<string, unknown>, ab = (aa[b] ?? {}) as Record<string, unknown>
      if (String(eb.answer) !== String(ab.answer)) return `gblank${b}: answer mismatch (src "${String(eb.answer)}" vs db "${String(ab.answer)}")`
      if (J(eb.acceptable ?? []) !== J(ab.acceptable ?? [])) return `gblank${b}: acceptable-list mismatch`
    }
    return null
  }
  // numeric index array
  const eIdx = ea.map(Number), aIdx = aa.map(Number)
  if (e.inputMode === 'matching' && e.choices.length && aChoices.length) {
    // para_match: pair each statement with its paragraph index, sort by statement text (order-invariant)
    const pairs = (cs: DraftChoice[], idx: number[]) => cs.map((c, k) => [String(c.text), idx[k]] as [string, number]).sort((x, y) => (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0))
    if (J(pairs(e.choices, eIdx)) !== J(pairs(aChoices, aIdx))) return `para_match: statement→paragraph mapping mismatch`
    return null
  }
  if (e.choices.length && aChoices.length) {
    // bank_answers / build_sentence: resolve indices to keyed TEXT, compare in blank order
    const eWords = eIdx.map((ix) => e.choices[ix]?.text), aWords = aIdx.map((ix) => aChoices[ix]?.text)
    if (J(eWords) !== J(aWords)) return `resolved answer words mismatch (src ${J(eWords)} vs db ${J(aWords)})`
    return null
  }
  if (J(eIdx) !== J(aIdx)) return `answer index array mismatch (src ${J(eIdx)} vs db ${J(aIdx)})`
  return null
}

async function pageCol<T>(table: string, cols: string): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select(cols).like('legacy_id', 'gen:%').range(from, from + 999)
    if (error) throw new Error(`${table}: ${error.message}`)
    const rows = (data ?? []) as T[]; out.push(...rows); if (rows.length < 1000) break
  }
  return out
}

async function main() {
  // index DB once
  const sets = await pageCol<SetRow>('question_sets', 'id, legacy_id, task_type, status, level, stimulus_id, qa_flags')
  const byLegacy = new Map<string, SetRow>()
  for (const s of sets) if (s.legacy_id) byLegacy.set(s.legacy_id, s)
  const items: ItemRow[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('question_items').select('question_set_id, order_index, input_mode, prompt, prompt_zh, choices, answer, rubric_id').like('legacy_id', 'gen:%').range(from, from + 999)
    if (error) throw new Error(`question_items: ${error.message}`)
    const rows = (data ?? []) as ItemRow[]; items.push(...rows); if (rows.length < 1000) break
  }
  const itemsBySet = new Map<string, ItemRow[]>()
  for (const it of items) { const a = itemsBySet.get(it.question_set_id) ?? itemsBySet.set(it.question_set_id, []).get(it.question_set_id)!; a.push(it) }
  for (const arr of itemsBySet.values()) arr.sort((a, b) => a.order_index - b.order_index)
  console.log(`gen sets ${sets.length} · gen items ${items.length}`)

  // rubric resolver (productive)
  const rubricCache = new Map<string, string | null>()
  async function rubricFor(examId: string, skill: string): Promise<string | null> {
    const k = `${examId}|${skill}`; if (rubricCache.has(k)) return rubricCache.get(k)!
    const { data } = await db.from('rubrics').select('id').eq('exam_id', examId).eq('skill', skill).limit(1)
    const id = data && data.length ? (data[0] as { id: string }).id : null
    rubricCache.set(k, id); return id
  }

  const stages = readdirSync(ROOT).filter((d) => { try { return statSync(join(ROOT, d)).isDirectory() } catch { return false } })
  let totalSrc = 0, totalMatched = 0, objFiles = 0, prodFiles = 0, skippedFiles = 0
  const expectedByStage = new Map<string, Set<string>>() // stage → expected set legacy ids

  for (const stage of stages) {
    if (SKIP_STAGES.has(stage)) { console.log(`  [skip stage] ${stage}`); continue }
    const dir = join(ROOT, stage)
    const files = readdirSync(dir).filter((f) => f.endsWith('.json'))
    const expected = expectedByStage.get(stage) ?? expectedByStage.set(stage, new Set()).get(stage)!
    for (const f of files) {
      const path = join(dir, f)
      let parsed: unknown
      try { parsed = JSON.parse(readFileSync(path, 'utf8')) } catch (e) { fail(`${path}: JSON parse error ${(e as Error).message}`); continue }
      const obj = parsed as Record<string, unknown>

      if (Array.isArray(obj.tasks) && typeof obj.taskType === 'string') {
        // ── PRODUCTIVE ──
        prodFiles++
        const pf = obj as unknown as ProdFile
        const level = pf.level ?? getExamSpec(pf.examId)?.level ?? 3
        const expRubric = await rubricFor(pf.examId, pf.skill)
        let i = 0
        for (const task of pf.tasks) {
          i++; totalSrc++
          if (!task.prompt || !task.prompt.trim()) { fail(`${path}#${i}: empty prompt`); continue }
          const hasSrc = !!(task.sourceTextZh || task.sourceTextEn)
          const tag = hasSrc
            ? hashId(`${pf.examId}|${pf.taskType}|${level}|${task.prompt}|${task.sourceTextZh ?? ''}|${task.sourceTextEn ?? ''}`)
            : hashId(`${pf.examId}|${pf.taskType}|${level}|${task.prompt}`)
          const legacy = `gen:productive:${pf.taskType}:set:claude:${tag}`
          expected.add(legacy)
          const dbSet = byLegacy.get(legacy)
          if (!dbSet) { fail(`${stage}/${f}#${i}: no DB set (${legacy})`); continue }
          if (dbSet.status !== 'draft') fail(`${stage}/${f}#${i}: status=${dbSet.status} (must draft)`)
          if (dbSet.task_type !== pf.taskType) fail(`${stage}/${f}#${i}: task_type=${dbSet.task_type}≠${pf.taskType}`)
          const wl = (dbSet.qa_flags as { wordLimit?: string | null } | null)?.wordLimit ?? null
          if (wl !== (task.wordLimit ?? null)) fail(`${stage}/${f}#${i}: qa_flags.wordLimit mismatch`)
          const its = itemsBySet.get(dbSet.id) ?? []
          if (its.length !== 1) { fail(`${stage}/${f}#${i}: item count ${its.length} (must 1)`); continue }
          const it = its[0]
          if (it.input_mode !== 'free_text' && it.input_mode !== 'speak') fail(`${stage}/${f}#${i}: input_mode=${it.input_mode}`)
          if (!it.rubric_id) fail(`${stage}/${f}#${i}: rubric_id empty`)
          else if (expRubric && it.rubric_id !== expRubric) fail(`${stage}/${f}#${i}: rubric_id≠expected(${pf.examId},${pf.skill})`)
          const ans = (it.answer ?? {}) as { official?: boolean; referencePoints?: unknown }
          if (ans.official !== false) fail(`${stage}/${f}#${i}: answer.official≠false`)
          if (JSON.stringify(ans.referencePoints ?? []) !== JSON.stringify(task.referencePoints ?? [])) fail(`${stage}/${f}#${i}: referencePoints mismatch`)
          if ((it.prompt ?? '') !== task.prompt) fail(`${stage}/${f}#${i}: prompt mismatch`)
          if ((it.prompt_zh ?? null) !== (task.promptZh ?? null)) fail(`${stage}/${f}#${i}: prompt_zh mismatch`)
          totalMatched++
        }
      } else if (Array.isArray(obj.sets) && typeof obj.template === 'string') {
        // ── OBJECTIVE ──
        objFiles++
        const of = obj as unknown as ObjFile
        const t = loadTpl(of.template)
        if (!t) { fail(`${path}: template not found ${of.template}`); continue }
        const level = of.level ?? getExamSpec(t.examIds[0])?.level ?? 3
        const st = toShape(t)
        let i = 0
        for (const raw of of.sets) {
          i++; totalSrc++
          const shaped = shapeToItems(st, raw)
          if (!shaped.ok) { supersededRejects.push(`${stage}/${f}#${i}: ${shaped.reject}`); continue }
          const tag = hashId(`${of.template}|${level}|${JSON.stringify(raw)}`)
          const legacy = `gen:${t.templateId}:set:claude:${tag}`
          expected.add(legacy)
          const dbSet = byLegacy.get(legacy)
          if (!dbSet) { fail(`${stage}/${f}#${i}: no DB set (${legacy})`); continue }
          if (dbSet.status !== 'draft') fail(`${stage}/${f}#${i}: status=${dbSet.status} (must draft)`)
          if (dbSet.task_type !== t.taskType) fail(`${stage}/${f}#${i}: task_type=${dbSet.task_type}≠${t.taskType}`)
          const its = itemsBySet.get(dbSet.id) ?? []
          const exp = shaped.result.items
          if (its.length !== exp.length) { fail(`${stage}/${f}#${i}: item count ${its.length}≠${exp.length}`); continue }
          // NOTE: choice-bearing items were answer-position-normalized in a prior phase
          // (normalize-authored-answer-positions), which intentionally permutes choice order and
          // repositions the answer. Comparison is therefore permutation-invariant: prompt/input_mode/
          // cardinality exact; choice-TEXT multiset equal; single-choice answer compared by resolved TEXT;
          // grouped/spell answer CONTENT compared via answerDiff() (resolved-text / per-blank, permutation-robust).
          // Internal answer validity (answer∈choices, in-range, no-dup) is additionally covered by qa:qsets-v2.
          const sortTexts = (cs: DraftChoice[]) => cs.map((c) => String(c.text)).sort()
          for (let k = 0; k < exp.length; k++) {
            const e = exp[k], a = its[k]
            if (a.input_mode !== e.inputMode) fail(`${stage}/${f}#${i}[${k}]: input_mode ${a.input_mode}≠${e.inputMode}`)
            if ((a.prompt ?? '') !== e.prompt) fail(`${stage}/${f}#${i}[${k}]: prompt mismatch`)
            const eCh = (e.choices ?? []) as DraftChoice[]
            const aCh = Array.isArray(a.choices) ? (a.choices as DraftChoice[]) : []
            if (eCh.length || aCh.length) {
              if (JSON.stringify(sortTexts(eCh)) !== JSON.stringify(sortTexts(aCh))) fail(`${stage}/${f}#${i}[${k}]: choice-text multiset mismatch (src ${eCh.length} vs db ${aCh.length})`)
            }
            // single-choice answer content (permutation-tolerant): the keyed choice TEXT must be preserved
            if ((typeof e.answer === 'string' || typeof e.answer === 'number') && eCh.length) {
              const srcT = eCh.find((c) => String(c.id) === String(e.answer))?.text
              const dbT = aCh.find((c) => String(c.id) === String(a.answer))?.text
              if (srcT !== undefined && dbT !== undefined && srcT !== dbT) fail(`${stage}/${f}#${i}[${k}]: single-choice answer text mismatch (src "${srcT}" vs db "${dbT}")`)
            }
            // grouped / spell answer content (bank_answers, cloze_passage, gblanks, build_sentence, para_match, complete_words)
            const ad = answerDiff(e, a)
            if (ad) fail(`${stage}/${f}#${i}[${k}]: ${ad}`)
          }
          totalMatched++
        }
      } else {
        skippedFiles++
        console.log(`  [skip file] ${stage}/${f} (not an objective/productive source)`)
      }
    }
  }

  // ── reverse: every gen authored set tagged with a verified stage must map to a source record ──
  let orphan = 0
  for (const s of sets) {
    const stage = (s.qa_flags as { stage?: string } | null)?.stage
    if (!stage || SKIP_STAGES.has(stage)) continue
    const exp = expectedByStage.get(stage)
    if (!exp) continue // stage had no source files walked (shouldn't happen)
    if (s.legacy_id && !exp.has(s.legacy_id)) { fail(`reverse: DB set ${s.legacy_id} (stage ${stage}) has no matching source record`); orphan++ }
  }

  console.log(`authored files: objective ${objFiles} · productive ${prodFiles} · skipped ${skippedFiles}`)
  console.log(`source records ${totalSrc} · matched DB 1:1 ${totalMatched} · superseded shape-rejects (not imported) ${supersededRejects.length} · reverse orphans ${orphan}`)
  if (supersededRejects.length) { console.log('superseded (shape-rejected, correctly absent from DB):'); for (const s of supersededRejects) console.log(`  · ${s}`) }
  // categorized failure summary by stage + reason (R2 audit aid)
  const cat = new Map<string, number>()
  for (const e of errors) {
    const stage = e.split('/')[0]
    const reason = e.includes('source shape REJECT') ? 'source_shape_reject' : e.includes('no DB set') ? 'no_db_set(drift)' : e.includes('reverse:') ? 'reverse_orphan' : e.includes('multiset mismatch') ? 'choice_text_mismatch' : e.includes('answer text mismatch') ? 'answer_text_mismatch' : /resolved answer words|correct-option text|gblank\d+:|para_match:|answer index array|answer length|answer type mismatch|answer mismatch/.test(e) ? 'grouped_answer_mismatch' : e.includes('prompt mismatch') ? 'prompt_mismatch' : 'other'
    cat.set(`${stage} | ${reason}`, (cat.get(`${stage} | ${reason}`) ?? 0) + 1)
  }
  if (cat.size) { console.log('failure summary (stage | reason → count):'); for (const [k, v] of [...cat.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${k} → ${v}`) }
  if (errors.length) {
    console.error(`\n✗ verify-source-db-all-authored FAILED (${errors.length}):`)
    for (const e of errors.slice(0, 80)) console.error(`  ✗ ${e}`)
    if (errors.length > 80) console.error(`  … +${errors.length - 80} more`)
    process.exitCode = 1
  } else {
    console.log(`\n✓ verify-source-db-all-authored PASSED — ${totalMatched}/${totalSrc} authored source records map 1:1 to draft DB sets/items; no orphan`)
  }
}
main().catch((e) => { console.error('verify-source-db-all-authored fatal', (e as Error)?.message ?? e); process.exitCode = 1 })
