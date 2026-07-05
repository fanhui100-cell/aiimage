# Mock Paper Generator — Phase 10 Report

Date: 2026-06-20
Phase: 10 — reproducible mock paper generator from canonical ExamSpec + v2 active pools
Branch: iter5-f1
Frontend: **none** (no visible UI change; old `/api/mock-exam` + `MockExam.tsx` untouched).

## 1. Changed files

| File | Type | Purpose |
|---|---|---|
| `lib/papers/paper-types.ts` | created | Paper/scoring contracts: `GeneratedPaper`, `PaperSection`, `PaperItem` (with server-only `answerKey`), `PaperScore` |
| `lib/papers/paper-generator.ts` | created | `generatePaper(db, {examId,mode,sectionId?,seed?})`; iterates `ExamSpec` sections; grouped + single draws; dedup stimuli; target-word cap; deterministic seed; no deprecated; listening-needs-audio; subjective→placeholder; `toClientPaper` (strips answers) |
| `lib/papers/scoring.ts` | created | `scoreItem/scoreSection/scorePaper`: objective exact, multi_blank/matching partial, subjective → `needs_manual_or_ai_scoring`, section+total summaries |
| `app/api/papers/route.ts` | created | `POST /api/papers` → `{ok, paperInstanceId?, paper, warnings}`; controlled not_applied/insufficient; best-effort persist |
| `app/api/papers/[id]/route.ts` | created | `GET /api/papers/[id]` → controlled JSON (snapshot), never 500 |
| `scripts/validate-paper-generator.ts` | created | Scoring unit tests + DB generation checks (graceful not_applied) |
| `reports/mock-paper-generator-phase10.md` | created | This report |
| `package.json` | modified | Added `validate:papers` |

**Not touched:** `app/api/mock-exam/route.ts`, `lib/mock-exam/paper-specs.ts`,
`components/screens/drill/MockExam.tsx`, `lib/practice/session-builder.ts`, DeepSeek route. No DB
writes (v2 `not_applied`; `--apply`-style persistence is best-effort and gated by auth + tables).

## 2. API examples tested (current `not_applied` environment)

| Request | Response |
|---|---|
| `POST /api/papers {examId:cet4, mode:full}` | `{ok:true, paper:null, warnings:["v2_not_applied"]}` · HTTP 200 |
| `POST /api/papers {examId:cet4, mode:mini}` | `{ok:true, paper:null, warnings:["v2_not_applied"]}` · HTTP 200 |
| `POST /api/papers {examId:cet4, mode:section}` (no sectionId) | `{ok:true, paper:null, warnings:["missing_section"]}` · HTTP 200 |
| `POST /api/papers {examId:ielts, mode:full}` | `{ok:true, paper:null, warnings:["unknown_exam"]}` · HTTP 200 (IELTS correctly rejected) |
| `POST /api/papers {examId:cet4, mode:xyz}` | `{ok:true, paper:null, warnings:["invalid_mode"]}` · HTTP 200 |
| `GET /api/papers/<uuid>` | `{ok:true, paper:null, warnings:["v2_not_applied"]}` · HTTP 200 (not 500) |

Once v2 is applied with active pools, the same calls return a full `paper` with sections/items
(answers stripped) and a `paperInstanceId` when authenticated.

## 3. Pool insufficiency behavior

- **No unrelated substitution.** Each objective section tries its `ExamSpec.taskTypes` in order;
  if none has an active pool, the section is returned with `items: []` and
  `warnings: ['insufficient_pool']`, and the paper carries `insufficient_pool` — it **never**
  back-fills with unrelated word drills.
- **Deprecated never drawn.** `antonym_choice` / `cet_cloze` are filtered at the query (`NOT IN`)
  and re-checked in code.
- **Listening audio gate.** Listening sets without an `active` `audio_assets` row are skipped, not
  substituted (so an active listening section without audio comes back short, not faked).
- **Subjective sections** (writing/translation/speaking, or any `requiresRubric`) emit a
  `placeholder` with `reason: 'needs_manual_or_ai_scoring'` — never fake objective questions.

### Listening transcript discipline (Codex P1 — fixed)

Extends the Phase 9 rule to papers: a listening set's `stimulus` carries **only `audioUrl`** (from
`audio_assets.url`) — **never the transcript text**. Three layers:
1. `fetchActiveAudioUrls` returns `Map<stimulus_id, url>`, used both as the audio gate **and** to
   populate `PaperStimulus.audioUrl` (so listening papers now actually have a playable URL).
2. In `drawTask`, listening sets build `{ kind, title, audioUrl }` (no `textEn`); reading/cloze keep
   `textEn` (that passage is the exam material, not a transcript).
3. `toClientPaper` belt-and-suspenders: for any `requiresAudio` / `listening_comprehension` section
   it strips `stimulus.textEn`. Verified with Codex's exact repro — the client listening stimulus is
   `{kind, title, audioUrl}` with **no transcript**. `validate-paper-generator` asserts this
   (client listening stimulus has no `textEn` and keeps `audioUrl`; reading keeps its passage).

## 4. Verification results (exit codes)

| Command | Result |
|---|---|
| `npx tsc --noEmit` | ✅ exit 0 |
| `npm run lint` | ✅ exit 0 |
| `npm run validate:papers` | ✅ exit 0 (`not_applied`; **scoring unit tests pass**: choice exact, multi_blank/matching partial, `{answer}[]` shape, free_text→needs_manual, total objective 10/20 + needsManualOrAi) |
| `npm run validate:exam-specs` | ✅ exit 0 |
| `npm run validate:qbank-v2` | ✅ exit 0 (`not_applied`) |
| `POST /api/papers` smoke (not_applied) | ✅ controlled JSON, HTTP 200, no crash |
| `GET /api/papers/[id]` smoke | ✅ controlled JSON, HTTP 200, no 500 |

### Determinism

`generatePaper` uses a seeded RNG (`mulberry32(hash(seed))`) and fetches candidate sets ordered by
`id` before the seeded shuffle, so the same `seed` + same pool yields the same paper. Verified
structurally; in `not_applied` both calls return identical `v2_not_applied` results (deep-equal
asserted). With pools applied, the validator asserts `JSON.stringify(d1)===JSON.stringify(d2)` for a
fixed seed.

## 5. Old `/api/mock-exam`

**Still active and unchanged.** Verified live: `GET /api/mock-exam?exam=cet4&seed=1` →
`ok:true, 4 sections, 39 questions`. The new `/api/papers` runs alongside it; `MockExam.tsx` still
consumes the old route. The old route should be removed only after `/api/papers` is verified
against applied v2 data and the UI is migrated (a later phase).

## 6. Frontend changes

**None.** No component was modified; `MockExam.tsx` was read for context only.

## 7. Notes / deferred

- **Mode semantics:** `full` = all sections (objective drawn, subjective placeholder); `section` =
  the one `sectionId`; `mini` = objective sections only, each capped to ≤5 items.
- **Persistence** stores a client-paper **snapshot** in `paper_instances.score.snapshot` (exam_id /
  section_id left null to avoid FK against unseeded `exam_specs`/`exam_sections`); `GET` returns it.
  A normalized `paper_sections`-based persistence + a submit/score endpoint are future work.
- **Exam linkage:** draws by `task_type + level` (Phase 8 migrated sets have `exam_id=null`),
  consistent with `session-builder`. When `exam_specs`/`question_sets.exam_id` are seeded, the
  generator can tighten to exam-scoped pools.
