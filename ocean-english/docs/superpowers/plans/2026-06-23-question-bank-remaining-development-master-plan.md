# Ocean English Question Bank Remaining Development Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan one phase at a time. Every checklist item must be tracked. Stop after each phase and hand the result to the user/Codex for review; never continue automatically.

**Goal:** Complete the remaining Ocean English v2 question-bank work from the current draft-only state to a verified, small-batch active release covering seven exam levels, word-universe practice, mock papers, audio, scoring, and the learning loop.

**Architecture:** Treat canonical exam specifications, v2 content tables, runtime renderers, and learning-loop records as separate layers. Content is authored and validated as `draft`; only a dedicated transactional promotion phase may create `active` rows. Every user-facing flow must consume the same canonical specifications and v2 APIs, with no unrelated fallback questions.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase/PostgreSQL/RLS, Playwright, ESLint, `tsx` validation scripts, static JSON authored content.

---

## 0. How Claude Code Must Execute This Document

This is the controlling document for all remaining work. Earlier phase reports are historical evidence, not permission to skip the checks below.

### 0.1 Mandatory execution rules

1. Work only in the repository and branch explicitly named by the user.
2. Read this entire document before editing anything.
3. Execute exactly one phase (`R0`, then `R1`, etc.) per user instruction.
4. At the end of each phase:
   - run the phase self-review;
   - run every required command and record the real exit code;
   - commit only the phase-owned files;
   - stop and return the required handoff report.
5. Do not start the next phase until the user/Codex explicitly approves the previous one.
6. Never call DeepSeek or another paid generation API unless the user explicitly approves that provider and cost in the same turn. The default content-authoring mode is Claude-authored original content.
7. Never copy or lightly paraphrase copyrighted real exam questions. Official sources may define format and constraints only. All authored questions must be original.
8. All newly authored or migrated content starts as `draft`.
9. Do not write `active` outside `R10`, and do not enter `R10` without explicit user approval.
10. Never create or activate `antonym_choice` or `cet_cloze`.
11. Never use an unrelated word question to fill an empty exam-task pool.
12. Never perform broad deletion by `task_type`, `level`, or stage alone. Content replacement must identify exact `legacy_id` values, assert status/type/stage first, then delete child rows before parent rows.
13. Preserve unrelated dirty worktree changes. Do not use `git reset --hard`, `git clean -fd`, or blanket checkout/restore commands.
14. Validator-generated shared reports must be committed only by the central integration phase. Feature branches must restore those shared snapshots before committing.
15. If visible frontend behavior is required, output a `FRONTEND_CHANGE_NOTICE` and stop before editing UI unless the user explicitly authorizes Claude Code to follow the existing visual system.

### 0.2 Hard-stop conditions

Stop immediately and report the exact command, error, affected rows, and recovery state when any of these occurs:

- a write operation produces unexpected row counts;
- any generated row becomes `active` outside `R10`;
- a deprecated type appears in v2;
- source-to-DB deterministic verification fails;
- a replacement cannot prove that the old row is draft and belongs to the expected stage/type;
- QA detects an incorrect or ambiguous answer that cannot be safely repaired;
- official format cannot be established from an authoritative source;
- an audio upload has no checksum, transcript match, or provider provenance;
- a migration or promotion leaves parent/item states inconsistent;
- a frontend phase lacks the required user/design approval;
- schema changes are needed but have not been reviewed and explicitly applied.

### 0.3 Issue ledger behavior

Record every skipped or blocked item in:

- `reports/qbank-production-issue-ledger.md`
- `reports/qbank-production-issue-ledger.json` if the JSON ledger exists in the integrated branch.

Each entry must contain:

```json
{
  "id": "stable-phase-issue-id",
  "phase": "R4",
  "severity": "blocking|major|minor|info",
  "category": "spec_unverified|content_quality|audio_missing|schema_needed|frontend_needed|write_error|qa_failed",
  "scope": "exam/level/task/stage",
  "evidence": "exact command, row id, source URL, or file path",
  "state": "open|fixed|accepted|blocked",
  "nextAction": "one concrete recovery action"
}
```

### 0.4 Required phase handoff format

Every phase report to the user/Codex must include:

1. Commit hash and branch.
2. Changed files.
3. Database writes by table, row count, and status.
4. Frontend-visible changes or `none`.
5. Commands with actual exit codes.
6. Before/after coverage or behavior.
7. Rejected, skipped, downgraded, or replaced rows and exact reasons.
8. Confirmation of `active`, `antonym_choice`, and `cet_cloze` counts.
9. Open risks.
10. Exact recommendation for the next phase.

---

## 1. Current Verified Starting Point

The central branch is `iter5-f1` at checkpoint `d30f049`. Two reviewed parallel branches are ready to integrate:

- Window A: `qbank/toefl-complete-words`, commit `da44ab5`
- Window B: `qbank/toefl-writing`, commits `bc9a3c3` and `a1b92a4`

The shared Supabase database already contains the corresponding draft rows:

- TOEFL `complete_the_words`: 70 draft total (10 pilot + 60 expansion)
- TOEFL `email_writing`: 60 draft total (10 pilot + 50 expansion)
- TOEFL `academic_discussion`: 60 draft total (10 pilot + 50 expansion)
- all generated content remains draft;
- generated active count is 0;
- `antonym_choice` count is 0;
- `cet_cloze` count is 0.

Known unfinished runtime/infrastructure work:

- `MultiBlankRenderer.tsx` and `MatchingRenderer.tsx` are controlled placeholders, not functional renderers;
- `build_a_sentence` has canonical/reference order only and remains `scoring_not_ready`;
- the central TOEFL pilot verifier still expects only the original 10-record packages;
- TOEFL `read_daily_life` and `academic_reading` are blocked pending authoritative format confirmation;
- `generate-audio-assets.ts --apply` is deliberately disabled because no real synthesis/upload implementation exists;
- promotion uses best-effort client-side rollback rather than a PostgreSQL transaction;
- no v2 sets are active, so papers and the real learning loop have not been validated against user-facing active content;
- the latest central coverage reports predate the two parallel expansions and must not be treated as current.

---

## 2. Definition of Done

The project is not complete merely because draft rows exist. Completion requires all of the following:

1. Central source, DB, validators, reports, and coverage counts agree.
2. Every canonical seven-level exam section is either:
   - `READY`: at least 50 reviewed draft sets/prompts with all dependencies; or
   - `BLOCKED`: explicitly documented with authoritative reason and no user-facing exposure.
3. The 13 word-universe types retain valid draft coverage and have a reviewed active pilot where appropriate.
4. Every active objective item has a deterministic correct answer.
5. Every active productive item has the correct rubric and displays estimated/non-official scoring honestly.
6. Every active listening item has an active, playable, checksum-verified audio asset.
7. PracticeRunner can render and submit every active input mode.
8. Mock papers assemble from canonical specs and active v2 pools without irrelevant fallbacks.
9. Attempts update word mastery, skill state, error classification, daily plan, and diagnostics.
10. Deprecated types remain absent.
11. Full API, browser, mobile, security, and data-quality gates pass.

---

## 3. Phase Dependency Order

Execute in this order:

```text
R0 Central integration
 -> R1 Fresh coverage baseline
 -> R2 Existing-content quality audit and repair
 -> R3 Runtime renderer/scoring completion
 -> R4 Official format revalidation
 -> R5 Non-audio content expansion
 -> R6 Audio pipeline
 -> R7 Listening/speaking content and assets
 -> R8 Vocabulary coverage repair
 -> R9 Transactional promotion infrastructure
 -> R10 Approved active pilots
 -> R11 Mock-paper v2 completion
 -> R12 Learning-loop and UI completion
 -> R13 Full route/browser/backend audit
 -> R14 Release audit and cleanup
```

Do not reorder `R0-R5`. `R8` may be developed after `R2`, but must finish before release. `R10-R14` are strictly sequential.

---

# R0: Central Integration and Canonical Baseline

## Goal

Integrate the two reviewed TOEFL branches into `iter5-f1`, create one central TOEFL validation entry point, regenerate canonical reports, and establish a clean checkpoint.

## Files

- Integrate commits: `da44ab5`, `bc9a3c3`, `a1b92a4`
- Create: `scripts/verify-toefl-current.ts`
- Modify: `package.json`
- Modify only if needed for clear historical scope: `scripts/verify-toefl-pilot.ts`
- Regenerate centrally:
  - `reports/question-bank-v2-validation.json`
  - `reports/question-sets-v2-qa.json`
  - `reports/rubrics-validation.json`
  - `reports/qbank-v2-coverage-audit.md`
  - `reports/qbank-v2-coverage-audit.json`
  - `reports/qbank-production-final-summary.md`
  - `reports/qbank-production-issue-ledger.md`

## Steps

- [ ] Record `git status --short`, current branch, and `git worktree list`.
- [ ] Confirm current branch is `iter5-f1`.
- [ ] Do not discard unrelated dirty changes.
- [ ] Cherry-pick A, then the two B commits:

```powershell
git cherry-pick da44ab5
git cherry-pick bc9a3c3
git cherry-pick a1b92a4
```

- [ ] Resolve conflicts only in files touched by these commits. Stop if a conflict involves unrelated user work.
- [ ] Create `scripts/verify-toefl-current.ts` as a read-only orchestrator that runs:
  - `scripts/verify-toefl-pilot.ts` for the four original pilot packages;
  - `scripts/verify-toefl-complete-words-expansion.ts --db`;
  - `scripts/verify-toefl-writing-expansion.ts --db`;
  - a final DB count assertion: complete words 70 draft, email 60 draft, discussion 60 draft, all three active 0.
- [ ] The orchestrator must propagate a child process non-zero exit code and must never write DB rows.
- [ ] Add:

```json
"verify:toefl-current": "npx tsx scripts/verify-toefl-current.ts"
```

- [ ] Keep the pilot verifier scoped to pilot data; do not fake its count from 10 to 70. The new central verifier owns aggregate counts.
- [ ] Run the required verification suite.
- [ ] Regenerate central reports only after all validators pass.
- [ ] Update final summary and ledger with actual integrated counts and commit hashes.
- [ ] Commit the integration checkpoint.

## Required commands

```powershell
npm run verify:toefl-current
npm run qa:qsets-v2
npm run validate:qbank-v2
npm run validate:practice-session
npm run validate:papers
npm run validate:rubrics
npm run validate:question-types
npm run audit:qbank-v2-coverage
npm run lint
npx tsc --noEmit
```

## Acceptance criteria

- all commands exit 0;
- central verifier reports `70/60/60` draft and `0/0/0` active;
- no unexpected source-outside-DB or DB-outside-source rows;
- central worktree contains both A and B authored sources and verifiers;
- deprecated counts remain 0;
- a new checkpoint commit exists;
- stop for Codex review.

---

# R1: Fresh Canonical Coverage Matrix

## Goal

Replace stale coverage assumptions with a deterministic matrix derived from `EXAM_SPECS` and current DB rows.

## Files

- Modify: `scripts/audit-question-bank-v2-coverage.ts`
- Create: `scripts/validate-coverage-audit.ts`
- Modify: `package.json`
- Regenerate: `reports/qbank-v2-coverage-audit.md`
- Regenerate: `reports/qbank-v2-coverage-audit.json`
- Update: `reports/qbank-production-issue-ledger.md`

## Required matrix fields

Every canonical row must include:

- exam id and level;
- section id;
- task type;
- SAT domain when applicable;
- required input mode;
- required audio/rubric flags;
- draft, reviewed, active, rejected, and retired set counts;
- item and stimulus counts;
- active-audio count;
- rubric-covered item count;
- source family/stage count when available;
- state: `MISSING`, `THIN`, `READY_DRAFT`, `READY_ACTIVE`, or `BLOCKED`;
- blocking reason codes.

Thresholds:

- objective exam cells: `READY_DRAFT` at 50 valid sets;
- productive cells: `READY_DRAFT` at 50 valid prompts;
- SAT: 50 sets per official domain;
- word-universe migration cells: report counts but do not mix them into exam-section readiness;
- audio cells cannot become `READY_ACTIVE` without active audio for every active set.

## Steps

- [ ] Add a failing validator fixture proving a canonical cell with zero DB rows appears as `MISSING`.
- [ ] Add a fixture proving SAT is counted per domain rather than as one combined reading pool.
- [ ] Add a fixture proving a listening pool with draft content but no active audio is `BLOCKED`, not `READY_ACTIVE`.
- [ ] Implement the matrix fields and state calculation.
- [ ] Run the audit twice and verify stable row counts and stable states apart from timestamp.
- [ ] Replace historical missing/thin numbers in the ledger with the new baseline while retaining old entries as historical records.

## Required commands

```powershell
npm run audit:qbank-v2-coverage
npx tsx scripts/validate-coverage-audit.ts
npm run validate:exam-specs
npm run validate:qbank-v2
npm run lint
npx tsc --noEmit
```

## Acceptance criteria

- every task in `EXAM_SPECS` has exactly one expected matrix row, except SAT reading rows which are split by domain;
- stopped TOEFL tasks are visible as `BLOCKED`, not silently omitted;
- report totals match direct DB counts;
- all draft expansions from R0 appear;
- stop and hand the exact `MISSING/THIN/BLOCKED` list to Codex.

---

# R2: Existing Draft Content Quality Audit and Repair

## Goal

Audit all current draft content before generating more or promoting anything. Separate structural correctness from semantic correctness.

## Files

- Extend: `scripts/qbank-v2-spotcheck.ts`
- Extend: `scripts/spotcheck-authored.ts`
- Create: `scripts/audit-qbank-content-semantics.ts`
- Create: `scripts/verify-source-db-all-authored.ts`
- Create reports:
  - `reports/qbank-content-quality-audit.md`
  - `reports/qbank-content-quality-audit.json`
  - `reports/qbank-content-repair-log.md`
- Update: `reports/qbank-production-issue-ledger.md`

## Audit scope

### Structural checks for every row

- deterministic source-to-DB `legacy_id` mapping;
- exact prompt, choices, answer, explanation, rubric, word limit, and QA metadata match;
- one-item and grouped-set cardinality;
- answer exists in choices;
- no duplicate choice text after normalization;
- grouped answers are in range and correctly sized;
- `banked_cloze` is 15 options/10 blanks;
- `seven_select` is 7 options/5 blanks;
- `para_match` statement/answer/paragraph counts agree;
- `grammar_fill` blank counts and accepted variants agree;
- no answer or transcript leakage in practice payloads;
- all authored stimuli meet their template length.

### Semantic checks

- factual correctness;
- exactly one defensible answer for objective questions;
- distractors are plausible but clearly wrong;
- grammar, tense, collocation, word form, synonym, and context are correct;
- passage and questions actually correspond;
- no substantive duplicate or object-swap duplicate within a package or against pilot content;
- difficulty and language match the target exam level;
- productive prompts are distinct, actionable, rubric-covered, and do not claim an official model answer;
- explanations justify the answer rather than merely repeat it.

## Sampling policy

Machine checks cover 100% of rows. Human/Claude semantic review must cover:

- 100% of newly Claude-authored objective sets;
- 100% of sets intended for the first active pilot;
- at least 20% of migrated word-universe rows per type, stratified by level;
- at least 20% of migrated exam sets per type;
- 100% of previously repaired or flagged rows.

Do not label unreviewed migrated content as reviewed.

## Repair protocol

- [ ] Record the old source record and deterministic legacy id.
- [ ] Write the corrected source record.
- [ ] Derive the new legacy id.
- [ ] Query the old DB set and assert expected stage, type, level, and `draft` status.
- [ ] Delete exact child target rows/items, then exact set, then orphan stimulus only when no remaining set references it.
- [ ] Re-import the corrected record.
- [ ] First apply must write exactly 1 replacement; second apply must write 0 and duplicate-skip the full source package.
- [ ] Run source-to-DB verification and update the repair log.

## Required commands

```powershell
npx tsx scripts/verify-source-db-all-authored.ts
npx tsx scripts/audit-qbank-content-semantics.ts
npm run qa:qsets-v2
npm run validate:qbank-v2
npm run validate:practice-session
npm run validate:papers
npm run validate:data-quality
npm run lint
npx tsc --noEmit
```

## Acceptance criteria

- no unresolved blocking answer/factual/duplicate issue in any candidate pool;
- every repaired record has old/new legacy evidence and idempotency evidence;
- report distinguishes `machine_passed`, `semantic_reviewed`, and `not_yet_reviewed`;
- no rows are promoted;
- stop for Codex review.

---

# R3: Complete Runtime Renderers and Scoring Contracts

## Frontend gate

Before editing `components/**`, output `FRONTEND_CHANGE_NOTICE` covering `/quiz`, active input modes, answer/review states, accessibility, and mobile behavior. Stop until the user supplies Claude Design notes or explicitly authorizes following the existing `.pr-v2` design.

## Goal

Make every input mode that may become active genuinely playable and recordable.

## Files

- Modify: `components/practice/renderers/MultiBlankRenderer.tsx`
- Modify: `components/practice/renderers/MatchingRenderer.tsx`
- Create: `components/practice/renderers/BuildSentenceRenderer.tsx`
- Modify: `components/practice/PracticeRunner.tsx`
- Modify: `components/practice/practice-types.ts`
- Modify: `lib/practice/session-types.ts`
- Modify: `lib/practice/session-builder.ts`
- Modify: `lib/papers/scoring.ts`
- Modify: `components/quiz/practice-session.css` only as required by approved design
- Create: `scripts/smoke-practice-renderers.ts`
- Create: `scripts/validate-practice-answer-contracts.ts`

## Behavior requirements

### Multi blank

- render passage and ordered blanks;
- support text answers and option-bank answers;
- preserve blank order and stable layout;
- normalize whitespace and case only when the answer contract allows it;
- calculate per-blank and total correctness;
- reveal answers only after submit.

### Matching

- accessible source and target lists;
- mouse, touch, and keyboard operation;
- prevent duplicate target use when the template requires one-to-one matching;
- submit the complete mapping;
- support partial scoring without leaking answer keys.

### Build a sentence

- do not claim a single canonical sequence is the only legal English sentence;
- load an explicit `acceptedSequences`/equivalence contract or keep the task blocked;
- canonical sequence may be shown only as a reference after submission;
- remain `scoring_not_ready` until at least one tested equivalence strategy exists;
- promotion guard must continue rejecting it until the validator clears the flag.

### Free text

- submit text without local right/wrong fabrication;
- optionally call the existing scoring API after user submission;
- display `isEstimate:true`, provider, disclaimer, dimensions, and retry/fallback state.

## Tests

- unit fixtures for exact, partial, invalid, empty, and alternative-valid answers;
- Playwright desktop and mobile tests for each renderer;
- IME input and keyboard navigation;
- answer keys absent from pre-submit client payload;
- attempt API receives the correct structured answer.

## Required commands

```powershell
npx tsx scripts/validate-practice-answer-contracts.ts
npx tsx scripts/smoke-practice-renderers.ts
npm run validate:practice-session
npm run validate:papers
npm run lint
npx tsc --noEmit
```

## Acceptance criteria

- no placeholder renderer remains for an active-capable input mode;
- build-sentence remains blocked unless alternative-valid scoring is implemented and tested;
- all input modes work on desktop/mobile with no page errors;
- no active or DB content writes;
- stop for Codex review.

---

# R4: Official Exam Format Revalidation

## Goal

Revalidate the canonical seven-level format before authoring blocked or missing task types. This is a research/specification phase with no content writes.

## Files

- Update only when official evidence requires it:
  - `lib/exam-specs/specs.ts`
  - `lib/exam-specs/types.ts`
  - `data/exam-task-templates/*.json`
- Create: `reports/exam-spec-revalidation-2026-06-23.md`
- Update: `reports/qbank-production-issue-ledger.md`

## Source policy

Use official examination authority sources first:

- Chinese Ministry/provincial examination authorities for middle/high school formats;
- CET official authority for CET-4/CET-6;
- official postgraduate examination syllabus for Kaoyan;
- ETS official TOEFL materials;
- College Board official SAT materials.

For every claim, record title, direct URL, publication/update date, access date, and exact supported constraint. Third-party preparation sites cannot establish a hard schema constraint.

## TOEFL blocked questions to resolve

1. `read_daily_life`: official item grouping, number of items, response mode, and whether option count is fixed.
2. `academic_reading`: material grouping, number of items per passage, response modes, and option count rules.
3. `build_a_sentence`: actual interaction, whether multiple arrangements are accepted, and scoring behavior.
4. Audio/speaking tasks: task sequence, timing, replay rules, and response form.

## Decision rules

- If an official source confirms a fixed constraint, encode it in template/validator fixtures.
- If an official source describes a range, encode the range rather than one invented fixed value.
- If a constraint remains unverified, keep `official_spec_unverified=true`, leave content blocked, and document the exact missing fact.
- Do not infer official behavior from the existing UI or from common test-prep conventions.

## Required commands

```powershell
npm run validate:exam-specs
npm run validate:question-types
npm run qa:qsets-v2
npm run lint
npx tsc --noEmit
```

## Acceptance criteria

- every changed constraint has an authoritative citation;
- no blocked TOEFL type is unblocked by assumption;
- no DB writes;
- report lists confirmed, ranged, and unverified constraints separately;
- stop for Codex review.

---

# R5: Non-Audio Draft Pool Expansion

## Goal

Fill every confirmed non-audio canonical cell to at least 50 reviewed draft sets/prompts without lowering quality.

## Inputs

- R1 current coverage matrix;
- R2 content-quality report;
- R4 confirmed format/template constraints.

## Files

- Add source packages under `data/generated-question-sets/<stage>/`.
- Add or update one verifier per stage under `scripts/verify-<stage>.ts`.
- Reuse `scripts/import-authored-question-sets-v2.ts` and `scripts/import-authored-productive-tasks-v2.ts`.
- Add stage reports under `reports/`.
- Update the final summary and issue ledger only after each stage passes.

## Expansion order

1. Confirmed objective `MISSING` cells.
2. Confirmed objective `THIN` cells.
3. Confirmed productive `MISSING/THIN` cells.
4. TOEFL non-audio blocked cells only after R4 confirms their format.
5. `build_a_sentence` only after R3 and R4 clear scoring/spec flags.

Existing TOEFL pools must not be reduced for symmetry:

- complete words remains at least 70;
- email writing remains at least 60;
- academic discussion remains at least 60.

## Batch protocol

- author batches of 10;
- validate source before any write;
- run dry-run;
- manually/semantically review all 10;
- apply as draft;
- rerun apply to prove duplicate-skip/idempotency;
- run source-to-DB exact comparison;
- after five accepted batches, the cell reaches 50;
- normalize answer positions only for option-based objective items, then prove a second dry-run has identical before/after buckets.

## Content requirements

- original content only;
- exact target exam/task shape;
- level-appropriate vocabulary, passage length, syntax, and reasoning;
- unique and defensible answer;
- plausible distractors covering distinct misconception types;
- balanced topics and answer positions;
- no template-like repeated sentence skeletons;
- no arbitrary word-count inflation;
- no unofficial word-limit claim presented as official;
- source metadata must record domain, level/difficulty intent, stage, and provenance policy.

## Required commands per batch

```powershell
npm run import:authored-qsets-v2 -- --file=<SOURCE> --status=draft
npm run import:authored-qsets-v2 -- --file=<SOURCE> --status=draft --apply
npm run import:authored-qsets-v2 -- --file=<SOURCE> --status=draft --apply
npx tsx scripts/verify-<stage>.ts --db
npm run qa:qsets-v2
npm run validate:qbank-v2
npm run validate:practice-session
npm run validate:papers
```

Use `import:authored-productive-v2` for productive packages.

## Acceptance criteria

- every targeted confirmed cell has at least 50 valid draft sets/prompts;
- every new authored record is semantically reviewed;
- no blocked/unverified task was generated;
- active and deprecated counts remain 0;
- stop after each cell, not after the whole universe, for Codex review.

---

# R6: Real Audio Asset Pipeline

## External prerequisite gate

Before coding, obtain explicit user decisions for:

- TTS/audio provider;
- provider credentials and allowed usage;
- Supabase Storage bucket name and access policy;
- required accents/voices;
- cost ceiling and batch size;
- human review responsibility.

If any prerequisite is missing, record `audio_missing` and stop R6. Do not substitute an unapproved provider.

## Goal

Implement synthesis, upload, metadata, checksum, QA-state transitions, and safe playback without transcript leakage.

## Files

- Modify: `scripts/generate-audio-assets.ts`
- Modify: `scripts/validate-audio-assets.ts`
- Create: `lib/audio/providers/<approved-provider>.ts`
- Create: `scripts/review-audio-assets.ts`
- Update only if required: `lib/audio/audio-asset-client.ts`
- SQL changes, if required, must be isolated in a new reviewed migration file; do not edit an already-applied migration in place.

## Pipeline contract

1. Determine stable synthesis input from the stimulus review transcript.
2. Hash normalized input + voice + provider settings.
3. Skip if an asset with the checksum already exists.
4. Synthesize audio.
5. Validate non-empty playable output, MIME type, duration bounds, and checksum.
6. Upload to a deterministic Storage path.
7. Insert/update `audio_assets` with `qa_status='machine_checked'`, never active.
8. Human review promotes audio asset status separately.
9. Failed uploads must not leave active or dangling DB rows.
10. Practice session payload may include URL/asset id but never pre-answer transcript.

## Required commands

```powershell
npm run generate:audio-assets -- --limit=5
npm run generate:audio-assets -- --limit=5 --apply
npm run generate:audio-assets -- --limit=5 --apply
npm run validate:audio-assets
npx tsx scripts/review-audio-assets.ts --dry-run
npm run lint
npx tsc --noEmit
```

## Acceptance criteria

- first approved batch writes exactly the planned assets;
- idempotent rerun writes/uploads 0;
- every asset has provider, checksum, duration, URL, stimulus link, and QA status;
- no audio asset becomes active automatically;
- transcript remains absent from practice payload;
- stop for human listening review and Codex review.

---

# R7: Listening and Speaking Content Completion

## Goal

Create original scripts, questions, answers/rubrics, and reviewed audio for all confirmed listening/speaking canonical cells.

## Scope

Use R1/R4 to determine exact cells. Expected families include:

- middle-school listening comprehension;
- high-school listening comprehension;
- CET-4/CET-6 listening sections required by canonical specs;
- TOEFL `choose_a_response`;
- TOEFL listening comprehension;
- TOEFL `listen_and_repeat`;
- TOEFL `interview_speaking`.

## Rules

- scripts/transcripts are original;
- questions match audio exactly;
- transcript is review-only before submission;
- listening objective answers are deterministic;
- speaking prompts have rubric linkage and no fabricated official model answer;
- accent, speed, turn-taking, replay limit, and timing follow R4 confirmed specs;
- every active candidate must reference an active audio asset;
- author 10-set pilots before expanding a cell to 50;
- no speaking response audio is stored unless a separate privacy/security design is approved.

## Required validation

```powershell
npm run validate:audio-assets
npm run qa:qsets-v2
npm run validate:qbank-v2
npm run validate:practice-session
npm run validate:rubrics
npx tsx scripts/smoke-listening-phase9.ts
npm run audit:qbank-v2-coverage
npm run lint
npx tsc --noEmit
```

## Acceptance criteria

- every confirmed audio cell has at least 50 reviewed draft sets and matching audio assets;
- no transcript leakage;
- audio assets remain machine-checked/reviewed until explicitly approved;
- no content promotion;
- stop for Codex and human listening review.

---

# R8: Vocabulary-Level and Lexical-Data Repair

## Goal

Resolve legal vocabulary coverage gaps and strengthen lexical data required by word questions.

## Files

- Use: `scripts/audit-vocabulary-levels.ts`
- Use: `data/vocabulary-targets/README.md`
- Create one provenance file per imported target list under `data/vocabulary-targets/`.
- Create: `scripts/validate-vocabulary-target-source.ts`
- Update reports generated by `audit:vocab-levels` and `validate:data-quality`.

## Rules

- do not scrape or import copyrighted commercial word lists without a compatible license;
- each source file must state source name, URL, license note, exam id, level, and canonical/curated status;
- TOEFL/SAT lists remain curated, never “official complete”;
- add levels without overwriting valid existing levels;
- preserve `primary_level in levels` invariant;
- repair the unlevelled word;
- prioritize missing CET-6 direct coverage and high-level collocation/word-form/example gaps;
- do not fabricate antonyms or collocations merely to improve percentages.

## Required commands

```powershell
npx tsx scripts/validate-vocabulary-target-source.ts
npm run audit:vocab-levels
npm run validate:dictionary
npm run validate:data-quality
npm run analyze:lexigraph
npm run lint
npx tsc --noEmit
```

## Acceptance criteria

- every imported label has provenance and license evidence;
- illegal/duplicate/empty levels remain 0;
- CET-6 target coverage reaches the documented legal target or remains explicitly blocked by missing licensed source;
- no fabricated lexical relations;
- stop for Codex review.

---

# R9: Transactional Promotion Infrastructure

## Goal

Replace best-effort client rollback with one PostgreSQL transaction that validates and promotes a set and all items atomically.

## Files

- Create: `supabase/sql/p5-question-bank-promotion-rpc.sql`
- Modify: `scripts/promote-question-sets-v2.ts`
- Create: `scripts/validate-promotion-rpc.ts`
- Update: `reports/qbank-production-issue-ledger.md`

## RPC requirements

- callable only by service role/admin-controlled server execution;
- accepts explicit set UUIDs, never a broad type/level predicate;
- locks candidate sets/items;
- confirms every set is draft;
- rejects deprecated types;
- rejects `scoring_not_ready` and `official_spec_unverified`;
- confirms all items are draft and structurally valid;
- confirms productive rubric coverage;
- confirms active audio for listening sets;
- confirms answer invariants and target/stimulus foreign keys;
- updates items and sets to active in the same transaction;
- returns per-id result/reason;
- rolls back all changes on any unexpected database error;
- remains idempotent for already-active approved rows without altering unrelated rows.

## Apply gate

Do not apply SQL automatically. Deliver the SQL and validator first. The user applies the reviewed SQL in Supabase, then Claude Code runs the validator.

## Required commands

```powershell
npx tsx scripts/validate-promotion-rpc.ts --expect-not-applied
# User applies reviewed SQL here.
npx tsx scripts/validate-promotion-rpc.ts
npm run promote:qsets-v2 -- --exam=cet4 --task=en_to_zh --limit=1
npm run validate:qbank-v2
npm run lint
npx tsc --noEmit
```

The promote command above is dry-run only.

## Acceptance criteria

- partial item/set active states are impossible inside the RPC;
- validator tests a deliberately invalid candidate and confirms zero state change;
- no real promotion occurs;
- stop for Codex review.

---

# R10: Explicitly Approved Active Pilot Batches

## Approval gate

This phase requires a separate explicit user instruction naming each exam, level, task type, and maximum row count. Without that instruction, only prepare candidate manifests and stop.

## Goal

Promote small, semantically reviewed pools and verify that active v2 content reaches users safely.

## Steps

- [ ] Generate a manifest containing exact set ids, legacy ids, source files, semantic-review status, dependencies, and invariant results.
- [ ] Codex reviews the manifest.
- [ ] User approves one manifest.
- [ ] Take pre-write counts and row snapshots.
- [ ] Promote through the R9 RPC, 20-50 sets maximum.
- [ ] Verify exact active delta and zero unrelated changes.
- [ ] Exercise practice API and UI for the promoted task.
- [ ] If any defect appears, demote the exact manifest through a reviewed transactional operation and record the incident.

Suggested order:

1. stable word-universe choice/spell tasks;
2. reviewed reading/grammar objective tasks;
3. grouped cloze/matching after R3;
4. productive tasks after scoring UI approval;
5. listening only after active audio and human review.

## Required commands

```powershell
npm run promote:qsets-v2 -- --exam=<EXAM> --task=<TYPE> --limit=<N>
npm run promote:qsets-v2 -- --manifest=<REVIEWED_MANIFEST> --apply
npm run validate:qbank-v2
npm run validate:practice-session
npm run validate:papers
npm run audit:qbank-v2-coverage
npm run smoke:papers
```

## Acceptance criteria

- active delta exactly matches approved manifest;
- no deprecated, blocked, unreviewed, rubric-less, or audio-less row becomes active;
- practice serves the requested task, not fallback content;
- stop after every active batch for Codex review.

---

# R11: v2 Mock Paper Assembly, Submission, and Scoring

## Frontend gate

Output a `FRONTEND_CHANGE_NOTICE` for the mock-paper selection, timer, section navigation, submit confirmation, objective results, and pending subjective-score states. Stop until approved.

## Goal

Complete the server and frontend path from canonical paper generation through answer submission and persistent attempts.

## Files

- Modify: `lib/papers/paper-generator.ts`
- Modify: `lib/papers/scoring.ts`
- Modify: `lib/papers/paper-types.ts`
- Modify: `app/api/papers/route.ts`
- Modify: `app/api/papers/[id]/route.ts`
- Create: `app/api/papers/[id]/submit/route.ts`
- Modify the approved mock-paper frontend components only after design approval.
- Create: `scripts/smoke-paper-e2e.ts`

## Server requirements

- persist normalized `paper_instances` and `paper_sections` for authenticated users;
- keep answer keys server-side;
- client paper contains only playable prompts/options/material/audio URL;
- listening client payload excludes transcript;
- submit endpoint validates ownership and paper state;
- score objective items server-side;
- persist `paper_attempts` and per-item `question_attempts`;
- mark productive items pending or estimated, never silently correct/incorrect;
- prevent duplicate final submission;
- preserve deterministic seed behavior;
- return controlled `insufficient_pool` section state without unrelated fallback.

## Required commands

```powershell
npm run validate:papers
npx tsx scripts/smoke-paper-e2e.ts
npm run smoke:papers
npm run validate:learning-loop
npm run lint
npx tsc --noEmit
```

## Acceptance criteria

- all seven canonical exams can generate a controlled result;
- sections with sufficient active pools contain correct task types and counts;
- submission creates one paper attempt and the expected question attempts;
- objective score is reproducible server-side;
- subjective state is honest and explicit;
- desktop/mobile browser tests pass;
- stop for Codex review.

---

# R12: Learning Loop and User-Facing Diagnostics

## Frontend gate

Output `FRONTEND_CHANGE_NOTICE` for Today, ReviewHub, diagnostics/report confidence labels, and weak-skill navigation. Stop until approved.

## Goal

Connect real active v2 attempts to word mastery, skill state, daily plans, review queues, and diagnostics.

## Files

- Modify: `lib/practice/attempt-recorder.ts`
- Modify: `lib/learning-loop/error-classifier.ts`
- Modify: `lib/learning-loop/word-mastery.ts`
- Modify: `lib/learning-loop/skill-state-updater.ts`
- Modify: `lib/daily-plan/daily-plan-engine.ts`
- Modify: `app/api/daily-plan/route.ts`
- Modify: `app/api/diagnostics/route.ts`
- Modify approved Today/Review/Report components after design approval.
- Create: `scripts/smoke-learning-loop-e2e.ts`

## Invariants

- every incorrect objective attempt produces at least one review signal;
- correct attempts do not create an error type;
- listening inference errors classify as `listening_inference`;
- EMA aggregation processes attempts oldest-to-newest within the selected recent window;
- confidence reflects sample size and is labelled as an estimate when not high;
- productive attempts do not fabricate correctness before scoring;
- daily-plan cards have a reason and estimated duration;
- retries do not create duplicate finalized attempts;
- unauthenticated requests remain controlled and do not write server state.

## Required commands

```powershell
npm run validate:learning-loop
npx tsx scripts/smoke-learning-loop-e2e.ts
npm run validate:practice-session
npm run validate:qbank-v2
npm run lint
npx tsc --noEmit
```

## Acceptance criteria

- a real promoted question can be answered and observed in attempts, diagnostics, daily plan, and review UI;
- weak-skill and word-review updates are explainable;
- estimates are labelled;
- browser tests cover correct, wrong, subjective, empty, unauthenticated, and retry flows;
- stop for Codex review.

---

# R13: Full Route, API, Security, and Responsive Audit

## Goal

Verify all product entry points and links after v2 activation without redesigning unrelated pages.

## Routes

- `/today`
- `/review`
- `/reading`
- `/vocabulary`
- `/lexiverse`
- `/lexiverse/word/[id]`
- `/lexigraph`
- `/knowledge`
- `/drill`
- `/quiz`
- `/exam`
- `/groups`
- paper/practice/daily-plan/diagnostics/scoring APIs.

## Checks

- route exists and returns the intended status;
- visible navigation and CTA destination is correct;
- back/exit/return flow is correct;
- no retired type appears;
- no unrelated fallback content;
- loading, empty, error, unauthenticated, and private states are distinct;
- no console/page error;
- no answer key or transcript leak;
- no XSS sink from DB/AI/user strings;
- RLS prevents cross-user attempts, papers, plans, and diagnostics;
- desktop and mobile layouts have no overlap or clipped controls;
- keyboard and basic screen-reader semantics work;
- all links in repeated items resolve or render as non-links when the destination is not a dictionary word.

## Files

- Create: `scripts/smoke-full-product-routes.ts`
- Create: `reports/full-product-route-audit-2026-06-23.md`
- Modify product files only for verified defects, with focused regression tests.

## Required commands

```powershell
npx tsx scripts/smoke-full-product-routes.ts
npm run lint
npx tsc --noEmit
npm run build
```

## Acceptance criteria

- all listed routes and critical links pass desktop/mobile Playwright coverage;
- no P0/P1 security, crash, wrong-route, answer-leak, or content-fallback issue remains;
- any lower-priority issue is recorded with route and reproduction steps;
- stop for Codex review.

---

# R14: Final Release Audit, Reports, and Worktree Cleanup

## Goal

Run a complete release gate, accurately classify readiness, preserve evidence, and clean parallel development artifacts.

## Final command suite

```powershell
npm run validate:dictionary
npm run validate:questions
npm run validate:question-types
npm run validate:exam-specs
npm run validate:qbank-v2
npm run validate:practice-session
npm run validate:audio-assets
npm run validate:papers
npm run validate:rubrics
npm run validate:learning-loop
npm run validate:data-quality
npm run audit:vocab-levels
npm run audit:qbank-v2-coverage
npm run analyze:lexigraph
npm run verify:toefl-current
npm run smoke:papers
npx tsx scripts/smoke-full-product-routes.ts
npm run lint
npx tsc --noEmit
npm run build
```

## Final reports

Update or create:

- `reports/qbank-production-final-summary.md`
- `reports/qbank-production-issue-ledger.md`
- `reports/qbank-v2-coverage-audit.md/.json`
- `reports/qbank-content-quality-audit.md/.json`
- `reports/full-product-route-audit-2026-06-23.md`
- `reports/release-readiness-2026-06-23.md`

The release-readiness report must classify every exam/section as:

- `ACTIVE_READY`
- `DRAFT_READY_NOT_PROMOTED`
- `BLOCKED_AUDIO`
- `BLOCKED_SPEC`
- `BLOCKED_RUNTIME`
- `INSUFFICIENT_CONTENT`

It must not call the project complete while any required section is blocked.

## Worktree cleanup

Only after both branch commits are integrated and no uncommitted work remains:

```powershell
git worktree remove D:\ai-worktrees\ocean-toefl-a
git worktree remove D:\ai-worktrees\ocean-toefl-b
git branch -d qbank/toefl-complete-words
git branch -d qbank/toefl-writing
git worktree prune
```

Never use force deletion if Git reports uncommitted files.

## Acceptance criteria

- every command has a recorded exit code;
- central branch is clean except explicitly documented unrelated user work;
- reports match live DB counts;
- active pools have passed runtime and learning-loop tests;
- remaining blocks are explicit, not hidden;
- create a final checkpoint/release commit and stop for Codex final review.

---

## 4. Phase Self-Review Checklist

Claude Code must answer every item before reporting a phase complete:

- [ ] Did I execute only the requested phase?
- [ ] Did I avoid unrelated refactoring?
- [ ] Did I preserve unrelated dirty work?
- [ ] Did I use exact source and DB identifiers for writes/deletes?
- [ ] Did every new row remain draft unless this was an explicitly approved R10 batch?
- [ ] Are active/deprecated counts explicitly verified?
- [ ] Did source-to-DB deterministic verification pass?
- [ ] Did I inspect semantic content rather than rely only on shape validators?
- [ ] Did I record skipped/blocked work in the ledger?
- [ ] Did I obey the frontend/design gate?
- [ ] Did I avoid unapproved paid APIs and copyrighted question text?
- [ ] Did I run all required commands and read their real exit codes?
- [ ] Did I restore feature-branch shared generated reports before committing?
- [ ] Does the commit contain only phase-owned files?
- [ ] Did I stop rather than automatically begin the next phase?

---

## 5. First Instruction to Give Claude Code

Send Claude Code this exact instruction first:

```text
Read docs/superpowers/plans/2026-06-23-question-bank-remaining-development-master-plan.md completely.

Execute R0 only: Central Integration and Canonical Baseline.
Do not start R1. Do not modify frontend, schema, content, or active statuses in this phase.
Preserve unrelated dirty work. Cherry-pick only the reviewed A/B commits named in R0, create the central TOEFL verifier, run every R0 validation command, regenerate central reports only after validation passes, commit the R0-owned changes, then stop and return the required phase handoff report.

If any cherry-pick conflict touches unrelated user changes, or any live DB count differs from the documented 70/60/60 draft and 0 active baseline, stop immediately and report the exact evidence instead of forcing the integration.
```

