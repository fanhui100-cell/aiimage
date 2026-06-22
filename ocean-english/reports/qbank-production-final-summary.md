# Ocean English Question Bank — Full Production Run Final Summary

Date: 2026-06-21 · Branch: `iter5-f1`
Driver: `docs/superpowers/plans/2026-06-21-question-bank-full-production-master-prompts.md`
**Generation provider: Claude-authored JSON, DeepSeek not used.** (User override of doc G3/G4/G5.)

This run executed G1B → G12 in skip-forward mode with per-stage self-review. All content is `draft`;
**nothing was promoted to active** (user decision at G8). No deprecated types written or activated.

---

## 1. Stage outcomes

| Stage | Outcome |
|---|---|
| G1B | Already complete (verified): 2600 word-universe draft sets/items. Not rerun. |
| G1C | Migrated 7 exam-objective v1 types → +1134 draft sets / +1400 items. QA+validators EXIT 0. PASS |
| G1D | Seeded metadata: exam_specs 7 / exam_sections 38 / task_templates 6 / rubrics 10. PASS |
| G2 | 6 template dry-runs EXIT 0 (original_only; TOEFL manual_seed). No writes, no DeepSeek. PASS |
| G3 | Claude-authored importer + 6 pilot draft sets (banked_cloze/seven_select/grammar_fill). PASS |
| G4 | Claude-authored SAT seed 8 draft sets (4 domains). Bulk pools already from migration. SKIP-FORWARD (gaps) |
| G5 | Productive importer + 6 draft prompts (writing/translation, rubric-linked). SKIP-FORWARD (TOEFL gap) |
| G6 | Audio creds missing → pipeline not built; listening/speaking stay draft. SKIP-FORWARD (audio_missing) |
| G7 | Built `audit:qbank-v2-coverage`; ran (108 rows). PASS |
| G8 | Built `promote:qsets-v2` (dry-run verified). **User chose keep-draft → no promotion.** STOPPED (by choice) |
| G9 | Built `smoke:papers`; 7 exams × {mini,full} controlled insufficient_pool, 0 errors. PASS |
| G10 | `validate:learning-loop` EXIT 0; active-answer e2e deferred (no active pool). PASS |
| G11 | Vocab audit + data-quality gate EXIT 0. CET-6 gap recorded (needs licensed source). PASS |
| G12 | Full validator sweep + lint + tsc EXIT 0; XSS toast hardening applied. PASS |

---

## 2. Final DB counts

**Metadata:** exam_specs 7 · exam_sections 38 · task_templates 6 · rubrics 10
**Content:** question_sets 3754 · question_items 4020 · stimuli 1151 · question_target_words 2600 · audio_assets 0

**By status:** draft **3754** · active **0** · (reviewed/retired/rejected 0)
**Deprecated:** antonym_choice **0** · cet_cloze **0**

**By provenance:** migrated (`qb*`) **3734** · Claude-authored objective **14** (G3 6 + G4 SAT 8) · Claude-authored productive **6** = 3754 total.

**Coverage by level/task:** see `reports/qbank-v2-coverage-audit.{md,json}` (108 level×task rows). All draft;
108 `insufficient_active_pool` warnings = direct consequence of active 0 (nothing promoted).

---

## 3. New tooling (all read-only or draft-only, dry-run default)

| Script | Package | Purpose |
|---|---|---|
| `qbank-v2-snapshot.ts` | — | Pre/post-write status+task_type snapshots |
| `qbank-v2-spotcheck.ts` | — | Per-type structural spot-check |
| `seed-question-bank-v2-metadata.ts` | `seed:qbank-v2-metadata` | Seed specs/sections/templates/rubrics (idempotent) |
| `import-authored-question-sets-v2.ts` | `import:authored-qsets-v2` | Claude-authored objective JSON → draft (shapeToItems-validated) |
| `import-authored-productive-tasks-v2.ts` | `import:authored-productive-v2` | Claude-authored productive prompts → draft (rubric-linked) |
| `audit-question-bank-v2-coverage.ts` | `audit:qbank-v2-coverage` | Coverage audit report |
| `promote-question-sets-v2.ts` | `promote:qsets-v2` | draft→active w/ active invariants (dry-run; NOT applied) |
| `check-paper-api-smoke.ts` | `smoke:papers` | 7-exam paper readiness smoke |

Frontend: `DictionaryVaultScreen.tsx` toast `dangerouslySetInnerHTML` → plain React text (XSS hardening).

---

## 4. Final command log (key, real exit codes)

```
G1C migrate (7 types, --apply) ............ all 0 rejected/0 deprecated
qa:qbank-v2-migration ..................... 0  (sets 3734 / items 4000)
validate:qbank-v2 ......................... 0  (active 0)
validate:practice-session ................. 0
validate:papers ........................... 0
seed:qbank-v2-metadata --apply ............ 0  (7/38/6/10; idempotent)
validate:exam-specs / validate:rubrics .... 0 / 0
import:authored-qsets-v2 --stage=g3 ....... 0  (wrote 6; idempotent dup-skip 6)
import:authored-qsets-v2 --stage=g4 ....... 0  (wrote 8 SAT)
import:authored-productive-v2 --stage=g5 .. 0  (wrote 6; rubric-linked)
qa:qsets-v2 ............................... 0  (gen draft sets verified)
audit:qbank-v2-coverage ................... 0
promote:qsets-v2 (dry-run) ................ 0  (listening 10/10 blocked no-audio) — NOT applied
smoke:papers .............................. 0  (7 exams controlled insufficient_pool)
validate:learning-loop .................... 0
audit:vocab-levels / validate:data-quality. 0 / 0  (CET-6 gap noted)
validate:question-types ................... 0
validate:audio-assets ..................... 0  (467 listen sets, active 0)
lint ...................................... 0
tsc --noEmit .............................. 0
```

---

## 5. Samples

**Migrated (qb*)**: `qbgrp:reading_comprehension:rp-cet4-1049nzp` (lv3) · `qb:set:banked_cloze-bp-cet4-10asoyz` (lv3, 15-bank/10-ans) · `qb:set:grammar_fill-gp-高考-103ab5l` (lv2, 10 blanks) · `qb:set:para_match-mp-cet4-107ozey` (lv3).
**Claude-authored objective**: `gen:cet-banked-cloze:set:claude:q4btp5` · `gen:gaokao-seven-select:set:claude:1d0m7ud` · `gen:sat-rw-domains:set:claude:*` (8, domain-tagged).
**Claude-authored productive**: `gen:productive:essay_writing:set:claude:igy5tf` · `gen:productive:translation_zh_en:set:claude:*` (rubric-linked, no official answer).

---

## 6. Known limitations (open, none blocking)

- **No active pool** — user kept everything draft (G8). User-facing papers correctly return `insufficient_pool`; drafts do NOT leak (generator pulls `status=active` only).
- **Audio missing** — no TTS/bucket creds; listening/speaking can't go active.
- **CET-6 vocab** ~1257 words short — needs a licensed wordlist (no fabrication).
- **TOEFL special objective types** (complete_the_words/read_daily_life/choose_a_response) need new templates+shape validators.
- **Multi-level reading** thin outside cet4 — needs a multi-item reading authored shape + ongoing authoring.
- **TOEFL productive** writing deferred; speaking blocked by audio.
- **Authored volume is a deliberate pilot** — quality-first small batches; importers make scaling trivial.
- **/api/mock-exam** perf eval deferred; v1 routes untouched.
- Dirty worktree **not committed**; temp reports **not deleted** (no user request).

---

## 7. For Codex final review — what to verify

1. **No active / no deprecated**: `npx tsx scripts/qbank-v2-snapshot.ts` → expect draft 3754, active 0, antonym_choice 0, cet_cloze 0.
2. **Migration integrity**: `npm run qa:qbank-v2-migration` (0), `npm run validate:qbank-v2` (0).
3. **Authored content shape**: `npm run qa:qsets-v2` (0); inspect `data/generated-question-sets/**` vs `lib/exam-task-templates/shape.ts`; re-check banked_cloze answer indices unique/in-range, seven_select 7/5, grammar_fill 10 non-empty, SAT options match answer, productive answer = non-official placeholder + rubric_id set.
4. **Importers safe**: confirm dry-run default, `--apply` draft-only, idempotent (re-run → dup-skip), `gen:…:claude:` provenance.
5. **Papers don't leak draft**: `npm run smoke:papers` (0) — all controlled insufficient_pool with active 0.
6. **Promote guardrails**: review `scripts/promote-question-sets-v2.ts` invariants (listening blocked w/o audio, productive needs rubric, deprecated hard-reject) — NOT applied.
7. **Sweep**: `npm run lint`, `npx tsc --noEmit`, all `validate:*`/`qa:*` → 0.
8. **Reports to read**: this file, `qbank-production-issue-ledger.{md,json}`, `qbank-v2-coverage-audit.{md,json}`, stage summaries `g1c/g1d/g2-g3/g4-g5`.

---

**Run status: COMPLETE (G1B–G12 attempted). No blocking issues. Awaiting human/Codex review before any active promotion.**

---

## 8. Codex review round 1 — fixes + gap-fill (2026-06-21)

**Tooling fixes (all done, verified):**
- **Coverage audit** now builds an EXPECTED matrix from EXAM_SPECS → surfaces canonical cells with
  draft 0. Baseline: **MISSING 25 · THIN 10** (SAT split by 4 domains). See `qbank-v2-coverage-audit.md` §A.
- **promote:qsets-v2** made rollback-safe (items→active first, then set; rolls items back on set failure).
- **spotcheck** strengthened (banked 15/10, seven 7/5, para_match paras-range + statements=answers).
- **import reports** per-stage named (no overwrite).
- New finding `R1-paramatch-paras` (open): migrated para_match lacks `qa_flags.paras` → backfill before promotion.

**Gap-fill batch 1 (draft-only, Claude-authored):**
- Built a multi-item reading shape (`reading_multi`) + `reading-comprehension-mcq` template.
- Authored 8 reading sets (4 MCQ each) for zhongkao/gaokao/cet6/kaoyan + 2 grammar_fill (zhongkao lv1).
- Result: **MISSING 25→20 · THIN 10→15** (5 cells cleared). qa:qsets-v2 + validators + lint + tsc EXIT 0.
- Total v2 sets now **3764** (draft, active 0, deprecated 0). task_templates re-seeded to 7.

**Remaining gap-fill (iterative, draft-only):** expand the 5 newly-thin reading/grammar pools to ≥20;
fill remaining MISSING objective cells (gaokao cloze_passage needs a cloze_passage shape; kaoyan para_match);
writing/translation MISSING/THIN (productive importer ready); SAT → ≥50/domain; TOEFL special types
(need template+shape first); listening/speaking stay draft until audio creds. Run full QA per batch + re-review.

---

## 9. Round 2 — large-batch authoring to ≥50/cell + answer-position normalization (2026-06-21)

**Directive:** fill 7 target type/level cells to **≥50 draft sets each**, strictly to real-exam
format/difficulty/length/topic-coverage, Claude-authored (no DeepSeek, no real-exam copying),
unique answers + plausible distractors; per-batch dry-run → `--apply` (draft) → full QA + spot-check;
autonomous continuous run; final sweep + Codex handoff. **All 7 reached 50/50.**

| Pack | Exam / level | Type | Result | Notes |
|---|---|---|---|---|
| A | kaoyan lv5 | para_match | **50/50** | 7-para articles, 5 statements, distinct answers, `qa_flags.paras=7` |
| B | gaokao lv2 | cloze_passage | **50/50** | new `cloze_passage` shape; 15 blanks × 4 opts, unique per-blank by logic |
| C | zhongkao lv1 | reading_comprehension | **50/50** | short simple passages, 4 MCQ each |
| D | gaokao lv2 | reading_comprehension | **50/50** | 220–280w passages, 4 MCQ (detail/inference/main-idea/attitude/vocab) |
| E | cet6 lv4 | reading_comprehension | **50/50** | 280–340w academic/social passages, incl. vocab-in-context |
| F | kaoyan lv5 | reading_comprehension | **50/50** | 300–360w abstract argumentative (English-I), attitude/argument/inference; 50 distinct topics |
| G | zhongkao lv1 | grammar_fill | **50/50** | 10-blank passages; tense/prep/article/pronoun/comparative/word-form/connector/SV-agreement/non-finite |

**Answer-position normalization (ledger `R2-answer-position-bias`, FIXED).** Authored MCQ/cloze correct-option
positions were skewed (choice 96% 'B'; cloze only positions 0–1). Built `scripts/normalize-authored-answer-positions.ts`
(`normalize:answer-positions`-style; dry-run default). It re-orders **options only** (never the passage, option
text, or the correct answer itself) via canonical text-sort + `legacy_id`-seeded Fisher-Yates → **idempotent**
(re-run BEFORE==AFTER), set ids unchanged → import idempotency intact. Applied: **858 items** updated.
Result: choice letters **a/b/c/d ≈ 25% each**; cloze index **0/1/2/3 ≈ 25% each**. Skips items with duplicate
options (none found). Does NOT touch grammar_fill (multi_blank) / para_match / bank_answers.

**Final DB counts (R2):** question_sets **4104** · **draft 4104 · active 0** · antonym_choice **0** · cet_cloze **0**
(+340 vs §2 baseline = the 7 packs). All content Claude-authored JSON; **DeepSeek not used**.

**R2 verification (real exit codes):**
```
import:authored-qsets-v2 --stage=pack{A..G} --apply ... wrote to 50/50 each, idempotent dup-skip on re-import
qa:qsets-v2 / validate:qbank-v2 / validate:practice-session / validate:papers ... 0 (each batch)
qbank-v2-spotcheck (reading / grammar_fill) ........................... 0 issues
normalize-authored-answer-positions.ts --apply ....................... 858 items; idempotent re-run BEFORE==AFTER
qa:qsets-v2 / validate:qbank-v2 / validate:practice-session / validate:papers (post-normalize) ... 0
lint / tsc --noEmit ................................................... 0 / 0
validate:data-quality / audit:qbank-v2-coverage / smoke:papers ....... 0 / 0 / 0
qbank-v2-snapshot (final) ............................................ draft 4104, active 0, deprecated 0
```

**For Codex (R2 additions to §7):**
9. **≥50/cell pools**: `qbank-v2-snapshot --task=<t> --level=<l>` for the 7 cells → expect total 50, active 0.
   Inspect `data/generated-question-sets/pack{A..G}/*.json` vs `lib/exam-task-templates/shape.ts` (reading_multi,
   cloze_passage). Confirm answers unique, distractors plausible, no real-exam copying, dialogue single-quoted.
10. **Answer-position fairness**: re-run `scripts/normalize-authored-answer-positions.ts` (dry-run) → AFTER ≈25% per
    position and BEFORE==AFTER (idempotent, already applied). Verify it edits options only, set ids unchanged.
11. **Still draft-only**: nothing promoted; papers still return controlled `insufficient_pool` (`smoke:papers` 0).

**Run status (R2): COMPLETE.** 7/7 packs at 50/50, answer positions balanced, full sweep green, active 0,
deprecated 0. Worktree dirty / not committed (no user request). Awaiting human/Codex review before any promotion.

---

## 10. Round 3 — stimulus-length enforcement + content rework (2026-06-21)

**Directive:** first fix QA/metadata to enforce per-template stimulus length, then rework content to meet it.

**Infra:** `shape.ts` `countWords`+`checkPassageWords` → `shapeToItems` rejects out-of-range stimuli at import;
`qa:qsets-v2` gained a DB-layer length check (per `qa_flags.template`). Importer writes `stimuli.word_count`
(+`backfill:stimuli-words` backfilled 1500 NULLs) and gained `--replace` (delete a stage's drafts, re-import).
New per-level templates: `cet6-reading-mcq`(280–360), `kaoyan-reading-mcq`(320–430), `zhongkao-grammar-fill`(90–140).
New read-only utility `scripts/verify-authored-lengths.ts` checks **source files** before re-import.

**Content reworked to template length (verified by DB audit + disk reads, not stdout):**
A para_match 50 @ 451–539 · B cloze 50 @ 200–249 · E cet6-reading 48 @ 281–330 · F kaoyan-reading 48 @ 320–385 ·
G grammar 48(+2 gapfill) @ 93–120. Reading reworks only appended closing sentences; the 4 MCQs were never changed.
para_match statements re-paraphrased without changing the answer→paragraph map.

**Pilot cleanup:** 2 gapfill 中考 grammar switched to `zhongkao-grammar-fill` (kept); 8 rough early pilots
(banked_cloze 2 / seven_select 2 / sat 2 / gaokao-grammar lv2 2 — non-production, severely short, SAT source
malformed) deleted from DB. active stayed 0.

**⚠️ Correction (important for review):** Pack F's first `--replace` and several file/ledger edits **silently
false-succeeded** in this environment (Edit/Write intermittently reported success without persisting; bash-subprocess
`writeFileSync` never persisted). This briefly produced a *false* "complete" — the DB still held old short packF under
the lenient `reading-comprehension-mcq` (min 120), so `qa` passed misleadingly. The new `verify-authored-lengths.ts`
(source-side) caught it. Pack F was then genuinely re-lengthened (append-edits, each Grep/`cw`-verified on disk) and
re-imported; **DB audit confirms** `kaoyan-reading-mcq` = 48 @ 320–385. All write-steps in R3 were verified against
disk/DB, never trusting display output.

**R3 verification (real exit codes):**
```
verify-authored-lengths.ts ................. 0   (340/340 source sets within template range)
DB audit ................................... kaoyan-reading-mcq 48@320-385, cet6-reading-mcq 48@281-330, active 0
qa:qsets-v2 ................................ 0   (no passage_too_short/long; packF now checked vs 320 floor)
validate:qbank-v2 / practice-session / papers 0 / 0 / 0
audit:qbank-v2-coverage .................... 0
lint / tsc --noEmit ........................ 0 / 0
snapshot .................................. active 0, antonym_choice 0, cet_cloze 0
```

**Run status (R3): COMPLETE & VERIFIED.** All five reworked packs within template length; qa exit 0 (meaningful —
packF under strict template); full sweep green; active 0, deprecated 0. Worktree dirty / not committed. Awaiting Codex review.

---

## 11. Round 4 — gaokao-reading template + answer-position re-balance + coverage (2026-06-22)

**Directive:** (1) re-run answer-position normalization and prove idempotence; (2) give gaokao lv2 reading its own
length-enforced template and lengthen the two short gapfill passages; (3) update coverage / SAT status honestly.

**New template `gaokao-reading-mcq`** (examIds `gaokao`, `reading_comprehension`, minWords **200** / maxWords **280**,
4 MCQs). All **50** gaokao lv2 reading sets now hang on it: packD **48** (214–258 w; template-swapped via
`--replace --stage=packD`, 48 deleted → 48 re-imported) + gapfill **2** (lengthened 156/165 → **230/248 w**, only
passage sentences added — the 4 MCQs/options/answers unchanged; old sets deleted by `legacy_id`, re-imported under the
new template via `--file`). **DB audit:** `gaokao-reading-mcq` lv2 = 50 (packD 214–258, gapfill 230–248), active 0.
`verify-authored-lengths.ts` packD range tightened [120,400] → **[200,280]**; lv2 now has **no**
`reading-comprehension-mcq` sets.

**Answer-position re-balance (supersedes R2's claim).** R3 content rework + this R4 reading migration re-introduced
positional skew (authored MCQ correct option was again **~79% 'B'**). Re-ran
`normalize-authored-answer-positions.ts --apply` (**856 items** updated): choice 'B' 79%→**26%** (a23 / b26 / c27 / d25 %),
cloze index '1' 69%→~25% across 0–3. **Idempotence proven:** an immediate dry-run shows **BEFORE == AFTER**
bucket-for-bucket (choice a183 / b207 / c218 / d198; cloze 191 / 190 / 188 / 181) → the bank is converged. Per the
review rule, "answer positions balanced" is asserted **only** because this dry-run proof holds.

**Coverage status (`audit:qbank-v2-coverage`, this run): MISSING 20 · THIN 8.**
- **SAT Standard English Conventions = 0 → OPEN GAP (MISSING).** No SEC items exist; the other 3 SAT domains
  (Information and Ideas / Craft and Structure / Expression of Ideas) hold only **2 each (THIN)**. SAT is the largest
  remaining content gap and is **not** addressed by this run.
- Other MISSING (19): listening for zhongkao/gaokao/cet6; gaokao `seven_select` + `applied_writing`; cet6
  `essay_writing` + `translation_zh_en`; kaoyan small/large writing; all 10 TOEFL special task types.
- THIN (7 besides SAT-SEC's siblings): scattered writing/translation singletons (zhongkao applied_writing 2,
  gaokao continuation 1, cet4 essay 1 / translation 1, kaoyan translation 1) + the 3 SAT domains @2.

**R4 verification (real exit codes):**
```
verify-authored-lengths .... 0   (340/340; packD now checked vs [200,280])
qa:qsets-v2 ................ 0   (template 12 incl gaokao-reading-mcq; 354 gen sets length-checked)
validate:qbank-v2 / practice-session / papers  0 / 0 / 0
audit:qbank-v2-coverage .... 0   (MISSING 20 · THIN 8)
lint / tsc --noEmit ........ 0 / 0
snapshot .................. active 0, antonym_choice 0, cet_cloze 0
normalize dry-run ......... BEFORE == AFTER (converged)
```

**Run status (R4): COMPLETE & VERIFIED.** gaokao lv2 reading on its own 200–280 template (50 sets); answer positions
balanced **with idempotence proof**; coverage MISSING 20 / THIN 8 with **SAT SEC=0 flagged as an open gap**; full
sweep green; active 0, deprecated 0. Worktree dirty / not committed. Awaiting Codex review.

---

## 12. Round 5 — SAT four domains + Gaokao seven-select content production (2026-06-22)

**Directive:** produce, strictly draft-only, the four SAT Digital R&W domains (each to ≥50) and Gaokao `seven_select`
(to ≥50). Template + shape validator first, then per-pack dry-run → apply → QA → spot-check.

**Infrastructure added:**
- 4 per-domain SAT templates (`sat-information-and-ideas`, `sat-craft-and-structure`, `sat-expression-of-ideas`,
  `sat-standard-english-conventions`): examIds sat / level 7 / reading_comprehension / single_choice / minWords 25 /
  maxWords 150, with `answerSchema.domain` set to the exact spec `labelEn` (e.g. "Standard English Conventions").
- `shape.ts` single_choice now enforces non-empty prompt + `raw.domain` ∈ the four SAT domains AND == the template's
  declared domain (`domain_missing` / `domain_invalid` / `domain_mismatch`). bank_answers (seven_select) gained
  `requireSentenceOptions`: the 7 options must be distinct full sentences (capitalized, terminal punctuation, ≥4 words)
  — `options_not_distinct` / `option_not_sentence` / `option_not_full_sentence`.
- qa templateQa SAT rule changed from "every SAT template covers 4 domains" to "each declares ≥1 domain AND the SAT
  template set collectively covers all four".
- **qa items-query bug fixed:** data-QA `.in(set_ids)` passed thousands of ids in one call and silently returned empty
  once the URL grew too long, so item-level QA was being skipped (items 0 = false green). Now batched (100 ids/call);
  items rose from a truncated 960 to a real 1204, still 0 errors.

**Content produced (all Claude-authored, no DeepSeek, draft only; verified by DB audit + spot-check):**

| pack | domain / type | before | added | final | word_count | sample legacy_ids (tag) |
|---|---|--:|--:|--:|---|---|
| SAT | Standard English Conventions | 0 | 50 | 50 | 26–37 | zt7yw4, 52bxlm, 1zt7b8, 1ynaw8v, 11xzxxs |
| SAT | Information and Ideas | 2 | 48 | 50 | 39–69 | zenp5e, 1qge3up, 1h7ae63, 13x0r9e, 1x8plfn |
| SAT | Craft and Structure | 2 | 48 | 50 | 25–65 | mxeicu, eecmi6, 1vh8m74, aoerh3, lw8r98 |
| SAT | Expression of Ideas | 2 | 48 | 50 | 29–56 | 17kjedm, 199uvl8, 19slewh, 1aztt75, add74z |
| Gaokao | seven_select (lv2) | 0 | 50 | 50 | 274–324 | 1xl5urm, t1g4qt, bsymn0 |

legacy_id form: `gen:<template>:set:claude:<tag>`. New SAT sets = 194; seven_select = 50; **total +244 → 4338 sets**.

**Rejects / fixes during production (all resolved before apply):**
- SEC first used snake_case domain (`standard_english_conventions`); the coverage audit keys on the spec's `labelEn`
  ("Standard English Conventions"), so the 50 sets weren't being counted. Corrected the shape whitelist + 4 templates
  + source files to labelEn and re-imported via `--replace`. (This is why qa_flags.domain is Title Case.)
- Craft: 2 passages were 22 / 24 words (< 25) — caught by `passage_too_short`, lengthened.
- seven_select: the 3 reference passages were 246 / 214 / 203 words (< 250) — lengthened to ~280; subagent drafts that
  came in short or near-ordered were corrected before passing dry-run.

**Generation method:** SAT items — especially the precise SEC grammar items, where "exactly one correct option" is
fragile — were authored directly by the main agent. The 47 longer seven_select passages were drafted by Claude
subagents under a strict spec (passage 270–335, exactly 5 numbered blanks, 7 full-sentence options, 5 unique scrambled
answers, 2 plausible distractors); **every batch was structurally dry-run-validated and ≥9 passages were hand-checked
for unique-answer logic** (blanks map correctly; each distractor fits no blank). All passed.

**Spot-check (per pack, ≥5 sets):** difficulty on target; single correct answer; distractors plausible but excludable;
no real-exam copying; word_count in range; qa_flags.domain correct (SAT, Title Case) / seven_select 7-options-5-answers.

**Coverage delta (`audit:qbank-v2-coverage`): MISSING 20 → 18, THIN 8 → 5.** Cleared to ok: SAT Standard English
Conventions and Gaokao seven_select (both were MISSING); SAT Information / Craft / Expression (were THIN @2) → ok @50.

**Remaining OPEN GAPS (out of scope this run, per directive — no TOEFL / writing / translation / listening):**
- MISSING (18): listening for zhongkao / gaokao / cet6; gaokao applied_writing; cet6 essay_writing + translation_zh_en;
  kaoyan small + large writing; all 10 TOEFL special task types.
- THIN (5): zhongkao applied_writing (2), gaokao continuation_writing (1), cet4 essay_writing (1) + translation_zh_en
  (1), kaoyan translation_en_zh (1).

**R5 verification (real exit codes):**
```
verify-authored-lengths ........ 0   (584/584 across 12 packs incl sat-*, gaokao-7)
normalize --apply / dry-run ..... 1000 choice items balanced; dry-run BEFORE==AFTER (converged; choice 'a' 38%→23%)
qa:qsets-v2 .................... 0   (template 16; 598 length-checked; 1204 items, batched)
validate:qbank-v2 / practice-session / papers   0 / 0 / 0
audit:qbank-v2-coverage ........ 0   (MISSING 18 · THIN 5)
validate:question-types / data-quality   0 / 0
lint / tsc --noEmit ............ 0 / 0
snapshot ...................... totalSets 4338, active 0, antonym_choice 0, cet_cloze 0
```

**Run status (R5): COMPLETE & VERIFIED.** SAT four domains each at 50, Gaokao seven_select at 50 (+244 draft sets);
answer positions balanced with idempotence proof; full sweep green; active 0, antonym_choice 0, cet_cloze 0; nothing
promoted or committed. Awaiting Codex review.

---

## 13. Round 6 — productive task pools (writing / translation / continuation) (2026-06-22)

**Directive:** fill the MISSING/THIN productive cells (writing / translation / continuation) to ≥50 each, strictly
draft-only, every item rubric-scored with **NO official answer**.

**Infrastructure:** the existing `import-authored-productive-tasks-v2.ts` already supported every needed task type,
`free_text` input_mode, rubric resolution by (examId, skill), and a non-official `rubric_scored` answer placeholder.
All 8 required (examId, skill) rubrics already existed (`validate:rubrics` 0) — no rubric seeding needed. **One importer
fix:** the idempotency `hashId` keyed only on `prompt`; translation/continuation prompts are generic ("Translate the
following…"), so distinct items collided → false dup-skip (E lost 8). Extended the tag to also include
`sourceTextZh`/`sourceTextEn` (draft-only behavior unchanged). Re-imported E cleanly (50/50).

**Content produced (all Claude-authored, no DeepSeek, draft only, free_text; every item carries rubric_id + a
non-official rubric-scored placeholder; verified by DB stats + spot-check):**

| cell | exam / task / level | before | added | final | rubric | sample legacy_ids (tag) |
|---|---|--:|--:|--:|---|---|
| A | zhongkao applied_writing lv1 | 2 | 50 | 50 | 50/50 | 15afwh9, c07ecp, q74plw, 4w6l0r, 1ar69o7 |
| B | gaokao applied_writing lv2 | 0 | 50 | 50 | 50/50 | 187d0xz, ivkjm3, 1vww4i, 14rbgui, 1y12xvf |
| C | gaokao continuation_writing lv2 | 1 | 50 | 51 | 51/51 | 1pa7497, re48lq, 1molnjd, 2pf4k2, 1j9ml9c |
| D | cet4 essay_writing lv3 | 1 | 50 | 51 | 51/51 | t9nn46, 1d1g1y5, 17l3lpr, ogfp42, 16v6ed2 |
| E | cet4 translation_zh_en lv3 | 1 | 50 | 50 | 50/50 | 10wrolf, 9rj36e, 4ivayt, 13o189x, 1mtbzgq |
| F | cet6 essay_writing lv4 | 0 | 50 | 50 | 50/50 | jr7tz8, 4fbc9d, z8g9ko, erlm7x, 16gbzw1 |
| G | cet6 translation_zh_en lv4 | 0 | 50 | 50 | 50/50 | 1l0x11r, 44kzp2, 8c8x51, 6sh5x3, jxts4s |
| H | kaoyan translation_en_zh lv5 | 1 | 50 | 51 | 51/51 | 1idqmaw, 1ddep50, 1w9m1k4, fhh532, 32fewx |
| I | kaoyan applied_writing lv5 | 0 | 50 | 50 | 50/50 | fsmpy2, 52f7jx, 8qnzkt, 1hqh5m7, 1hkedvj |
| J | kaoyan essay_writing lv5 | 0 | 50 | 50 | 50/50 | xl7wmm, 1ux6d5q, spy39t, 199taba, l662bu |

**Total productive sets = 503; rubric coverage 503/503 (100%).** Each answer is
`{type:'rubric_scored', official:false, note:'Reference points only…', referencePoints:[…]}` — never an official answer.

**Field encoding (no schema change):** writing tasks put audience/purpose/keyPoints in `prompt`(+`promptZh`) and the
scoring focus in `referencePoints`; translation tasks put the source in `sourceTextZh`/`sourceTextEn` and
key-terms/required-meanings/grammarFocus/possible-expressions in `referencePoints`; continuation puts the 250–350-word
opening in `sourceTextEn` and the two paragraph-starters + characters/conflict/arc/resolution hints in `prompt`.

**Generation method:** A's first 5 + all importer/management work were done by the main agent; the bulk (≈490 items
across 9 cells + A's 45) were drafted by Claude subagents under strict per-cell specs + a worked example, then every
cell was dry-run-validated (prompt non-empty, rubric resolved) and ≥1 cell per task-family hand-checked. (Two subagents
hit a transient session limit and were re-dispatched successfully.)

**Spot-check (representative across families — zhongkao applied, gaokao continuation, cet4 translation, cet6 essay,
kaoyan translation):** genre authentic; difficulty matches the level (kaoyan/CET-6 clearly harder than zhongkao/CET-4);
rubric_id present; **no official answer / model essay / unique translation**; referencePoints aid scoring without
fixing a single answer; instructions state what to write, to whom, and why; topics diverse (no template clones).

**Coverage delta (`audit:qbank-v2-coverage`): MISSING 18 → 13, THIN 5 → 0.** Cleared to ok @≥50: gaokao
applied_writing, cet6 essay_writing, cet6 translation_zh_en, kaoyan applied_writing, kaoyan essay_writing (were
MISSING); zhongkao applied_writing, gaokao continuation_writing, cet4 essay_writing, cet4 translation_zh_en, kaoyan
translation_en_zh (were THIN).

**Remaining OPEN GAPS (out of scope per directive — no TOEFL / listening / speaking):**
MISSING (13): `listening_comprehension` for zhongkao / gaokao / cet6 (3); all 10 TOEFL special task types (reading
complete_the_words / read_daily_life / reading_comprehension; listening choose_a_response / listening_comprehension;
writing build_a_sentence / email_writing / academic_discussion; speaking listen_and_repeat / interview_speaking).

**R6 verification (real exit codes):**
```
verify-authored-lengths ........ 0   (584/584 length-modeled packs; productive cells are rubric-scored, no length gate)
qa:qsets-v2 .................... 0   (template 16; 1000 gen draft sets; 1600 items, batched)
validate:qbank-v2 / practice-session / papers   0 / 0 / 0
audit:qbank-v2-coverage ........ 0   (MISSING 13 · THIN 0)
validate:rubrics .............. 0
validate:question-types / data-quality   0 / 0
lint / tsc --noEmit ............ 0 / 0
snapshot ...................... totalSets 4835, active 0, antonym_choice 0, cet_cloze 0
```

**Run status (R6): COMPLETE & VERIFIED.** 10 productive cells each ≥50 (503 sets, rubric 100%, every answer a
non-official rubric-scored placeholder); MISSING 18→13, THIN 5→0; full sweep green; active 0, antonym_choice 0,
cet_cloze 0; nothing promoted or committed. Remaining gaps are listening + TOEFL only. Awaiting Codex review.

### R6 review fix (2026-06-22)

A review flagged the round; before re-submitting I fixed:
1. **importer hash backward-compatibility** — the tag uses the new (prompt+sourceText) hash only when sourceText
   exists; writing tasks keep the old prompt-only hash, and the dup check covers BOTH old and new legacy_ids.
   **Proof:** re-running all 10 prod-* dirs `--apply` gives `wrote 0 / dup all`, totalSets delta = 0 — no directory
   re-run ever creates a duplicate.
2. **source→DB consistency** — deleted the 6 obsolete G5 pilot productive sources + their 3 DB residue sets (stage=g5);
   `verify-productive-tasks.ts` now asserts **source 506 = DB 506** (every valid source task maps to exactly one DB
   set; the earlier 506-vs-503 discrepancy is resolved).
3. **new `scripts/verify-productive-tasks.ts`** — checks source length per cell (CET4 100–150 / CET6 140–205 / kaoyan
   120–180 words / gaokao continuation 250–350 words + two paragraph-starters), wordLimit/referencePoints presence, and
   DB-side rubric_id / official:false / free_text. It caught 52 short items.
4. **52 short items fixed** — G5 pilots deleted; CET4/CET6 translations re-authored by the main agent to spec (cet4
   55 @ 115–145 chars, cet6 51 @ 140–205 chars) and re-imported. (CET6 upper bound set to 205: the official CET-6
   passage is ~180 chars, so 180 as a hard cap mis-flags standard-length items — 205 leaves reasonable tolerance.)
5. **stimulus metadata** — importer now writes `stimuli.word_count` (from text_en) and `qa_flags.sourceCharCount`
   (Chinese chars from text_zh); existing productive stimuli back-filled (100 word_counts).

Final productive total = **506 sets** (cet4 trans 55, cet6 trans 51, the other 8 cells 50 each); rubric 100%; all
draft. **R6-fix verification (real exit codes):** verify-productive (506, incl. consistency) / verify-authored / qa /
validate×3 / audit / rubrics / question-types / data-quality / lint / tsc — all 0; totalSets 4838; active 0,
antonym_choice 0, cet_cloze 0. Productive items are NOT answer-position-normalized (not multiple-choice). Awaiting Codex re-review.
