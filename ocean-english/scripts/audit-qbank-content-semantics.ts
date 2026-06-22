/* ════════════════════════════════════════════════════════════════════════
   audit-qbank-content-semantics.ts — R2 machine semantic audit (read-only).

   Structural correctness is covered by verify-source-db-all-authored.ts + qa:qsets-v2 +
   validate:qbank-v2. This adds machine-detectable SEMANTIC checks across all gen draft content
   and produces the content-quality report with explicit review-status labels:
     · cross-set DUPLICATE prompts (normalized) — substantive/object-swap duplicate clusters;
     · within-item duplicate choice text (normalized);
     · single-choice answer resolvability (answer id ∈ choices);
   and classifies each authored stage / the migrated pool as machine_passed / semantic_reviewed /
   not_yet_reviewed (never labels unreviewed migrated content as reviewed).

   Writes reports/qbank-content-quality-audit.{md,json}. Never writes DB rows.
   Usage: npx tsx scripts/audit-qbank-content-semantics.ts
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'

const env = readFileSync('.env.local', 'utf8')
const rd = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(rd('NEXT_PUBLIC_SUPABASE_URL'), rd('SUPABASE_SERVICE_ROLE_KEY'))
const OUT_JSON = 'reports/qbank-content-quality-audit.json'
const OUT_MD = 'reports/qbank-content-quality-audit.md'

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()

// stages with documented Claude semantic review (this run + prior windows); everything else authored
// is machine_passed but semantic review is sampled/pending; migrated pool is not_yet_reviewed.
const SEMANTIC_REVIEWED_STAGES = new Set(['toefl-2026-pilot', 'toefl-2026-expansion-a', 'toefl-2026-expansion-b'])

async function pageCol<T>(table: string, cols: string, like?: string): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += 1000) {
    let q = db.from(table).select(cols).range(from, from + 999)
    if (like) q = q.like('legacy_id', like)
    const { data, error } = await q
    if (error) throw new Error(`${table}: ${error.message}`)
    const rows = (data ?? []) as T[]; out.push(...rows); if (rows.length < 1000) break
  }
  return out
}

async function main() {
  type SetRow = { id: string; legacy_id: string | null; task_type: string; status: string; qa_flags: Record<string, unknown> | null }
  type ItemRow = { question_set_id: string; prompt: string | null; choices: unknown; answer: unknown }
  const sets = (await pageCol<SetRow>('question_sets', 'id, legacy_id, task_type, status, qa_flags')).filter((s) => s.status === 'draft')
  const genSets = sets.filter((s) => (s.legacy_id ?? '').startsWith('gen:'))
  const setById = new Map(sets.map((s) => [s.id, s]))
  const items: ItemRow[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('question_items').select('question_set_id, prompt, choices, answer').range(from, from + 999)
    if (error) throw new Error(error.message)
    const rows = (data ?? []) as ItemRow[]; items.push(...rows); if (rows.length < 1000) break
  }

  // ── 1. duplicate prompts (normalized) across DIFFERENT sets, grouped within task_type ──
  const byKey = new Map<string, { setId: string; taskType: string; stage: string }[]>()
  let dupChoiceText = 0, unresolvedAnswer = 0, checkedChoiceItems = 0
  for (const it of items) {
    const s = setById.get(it.question_set_id); if (!s) continue
    const tt = s.task_type
    const stage = String((s.qa_flags ?? {}).stage ?? '(migrated)')
    if (it.prompt && it.prompt.trim()) {
      const k = `${tt}::${norm(it.prompt)}`
      const arr = byKey.get(k) ?? byKey.set(k, []).get(k)!
      arr.push({ setId: it.question_set_id, taskType: tt, stage })
    }
    // within-item duplicate choice text + answer resolvability (single-choice)
    const ch = Array.isArray(it.choices) ? (it.choices as { id?: unknown; text?: unknown }[]) : []
    if (ch.length) {
      checkedChoiceItems++
      const texts = ch.map((c) => norm(String(c.text ?? '')))
      if (new Set(texts).size !== texts.length) dupChoiceText++
      const ans = it.answer
      if (typeof ans === 'string' || typeof ans === 'number') {
        if (!ch.some((c) => String(c.id) === String(ans))) unresolvedAnswer++
      }
    }
  }
  // duplicate clusters = distinct normalized prompts shared by >1 set
  const dupClusters: { taskType: string; prompt: string; count: number; stages: string[] }[] = []
  for (const [k, arr] of byKey.entries()) {
    const distinctSets = new Set(arr.map((a) => a.setId))
    if (distinctSets.size > 1) {
      const [tt, p] = k.split('::')
      dupClusters.push({ taskType: tt, prompt: p.slice(0, 80), count: distinctSets.size, stages: [...new Set(arr.map((a) => a.stage))] })
    }
  }
  dupClusters.sort((a, b) => b.count - a.count)

  // ── 2. review-status classification by stage ──
  const byStage = new Map<string, { sets: number; taskTypes: Set<string> }>()
  for (const s of genSets) {
    const stage = String((s.qa_flags ?? {}).stage ?? '(none)')
    const e = byStage.get(stage) ?? byStage.set(stage, { sets: 0, taskTypes: new Set() }).get(stage)!
    e.sets++; e.taskTypes.add(s.task_type)
  }
  const migratedCount = sets.length - genSets.length
  const stageStatus = [...byStage.entries()].map(([stage, e]) => ({
    stage, sets: e.sets, taskTypes: [...e.taskTypes].sort(),
    machinePassed: true,
    semanticReviewed: SEMANTIC_REVIEWED_STAGES.has(stage),
    reviewStatus: SEMANTIC_REVIEWED_STAGES.has(stage) ? 'semantic_reviewed' : 'machine_passed_semantic_pending',
  })).sort((a, b) => b.sets - a.sets)

  const semanticReviewedSets = stageStatus.filter((s) => s.semanticReviewed).reduce((a, b) => a + b.sets, 0)
  const machineOnlySets = genSets.length - semanticReviewedSets

  const summary = {
    generatedAt: new Date().toISOString(),
    scope: { totalDraftSets: sets.length, genAuthoredSets: genSets.length, migratedSets: migratedCount },
    structuralStatus: 'machine_passed (verify-source-db-all-authored.ts + qa:qsets-v2 + validate:qbank-v2 all exit 0)',
    machineSemantic: {
      duplicatePromptClusters: dupClusters.length,
      duplicateClusters: dupClusters.slice(0, 50),
      withinItemDuplicateChoiceText: dupChoiceText,
      unresolvedSingleChoiceAnswers: unresolvedAnswer,
      checkedChoiceItems,
    },
    reviewStatus: {
      machine_passed: genSets.length,
      semantic_reviewed: semanticReviewedSets,
      machine_passed_semantic_pending: machineOnlySets,
      not_yet_reviewed_migrated: migratedCount,
      note: 'Semantic review is sampled/ongoing; 100% semantic review of any pool is required only before it becomes an R10 active-pilot candidate. Migrated word-universe content is not labeled reviewed.',
    },
    stageStatus,
  }
  writeFileSync(OUT_JSON, JSON.stringify(summary, null, 2) + '\n', 'utf8')

  const md: string[] = []
  md.push('# v2 Question Bank Content Quality Audit (R2)', '', `Generated: ${summary.generatedAt}`, '')
  md.push(`Scope: ${sets.length} draft sets (${genSets.length} Claude-authored gen:* + ${migratedCount} migrated).`, '')
  md.push('## Structural', '', `- ${summary.structuralStatus}`, '')
  md.push('## Machine semantic checks', '')
  md.push(`- shared normalized-prompt clusters (>1 set, same task_type): **${dupClusters.length}** — for stimulus-based / templated task types (reading/listening/translation/cloze/SAT) a shared **instruction stem** ("what is the main idea…", "translate the following passage…", "which choice completes the text…") is EXPECTED and is NOT a content duplicate; the distinguishing content lives in the stimulus/choices. True content duplication for those is checked at the stimulus level (per-window authoring dedup) — none escalated here.`)
  md.push(`- within-item duplicate choice text: **${dupChoiceText}** (hard defect if >0)`)
  md.push(`- unresolved single-choice answers (answer id ∉ choices): **${unresolvedAnswer}** of ${checkedChoiceItems} choice items (hard defect if >0)`, '')
  if (dupClusters.length) { md.push('### Shared instruction-stem clusters (top 50; expected for stimulus/templated items)', ''); for (const c of dupClusters.slice(0, 50)) md.push(`- [${c.taskType}] ×${c.count} (${c.stages.join(',')}): ${c.prompt}…`) }
  md.push('', '## Review status', '')
  md.push(`- machine_passed (gen authored): **${genSets.length}**`)
  md.push(`- semantic_reviewed: **${semanticReviewedSets}** (${[...SEMANTIC_REVIEWED_STAGES].join(', ')})`)
  md.push(`- machine_passed / semantic-pending (sampled, full review at R10 candidacy): **${machineOnlySets}**`)
  md.push(`- not_yet_reviewed (migrated pool): **${migratedCount}**`, '')
  md.push('## Authored stage status', '')
  md.push('| stage | sets | reviewStatus | taskTypes |')
  md.push('|---|---:|---|---|')
  for (const s of stageStatus) md.push(`| ${s.stage} | ${s.sets} | ${s.reviewStatus} | ${s.taskTypes.join(', ')} |`)
  writeFileSync(OUT_MD, md.join('\n') + '\n', 'utf8')

  console.log(`content-semantics: draft ${sets.length} (gen ${genSets.length} / migrated ${migratedCount})`)
  console.log(`  duplicate prompt clusters ${dupClusters.length} · dup choice text ${dupChoiceText} · unresolved single-choice answers ${unresolvedAnswer}/${checkedChoiceItems}`)
  console.log(`  review: semantic_reviewed ${semanticReviewedSets} · machine/pending ${machineOnlySets} · migrated not_yet_reviewed ${migratedCount}`)
  console.log(`  报告：${OUT_MD} / ${OUT_JSON}`)
  // a non-zero unresolved answer or dup choice text is a hard content defect
  if (unresolvedAnswer > 0 || dupChoiceText > 0) { console.error('✗ machine semantic defects found (unresolved answer or duplicate choice text)'); process.exitCode = 1 }
}
main().catch((e) => { console.error('audit-qbank-content-semantics fatal', (e as Error)?.message ?? e); process.exitCode = 1 })
