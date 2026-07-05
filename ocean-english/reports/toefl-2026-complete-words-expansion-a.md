# TOEFL 2026 Expansion — Window A · Complete the Words

**Status: COMPLETE (incl. Codex remediation) — all gates green, all records draft, no activation.**

## Scope note (target changed mid-run + Codex remediation)

The plan specified exactly **40** new sets (DB target 50). Mid-run the user changed the production
target to **60 new sets** (DB target **70**). The first 40 were authored/applied/verified, then a
**20-set delta** was authored and the source consolidated into a single 60-set file. Editorial
distribution was scaled to per-domain **8/8/8/8/7/7/7/7** with difficulty intent **18 B1 / 24 B2 / 18 C1**.

A subsequent **Codex review** required a one-record scientific fix (record 20, `vibration`). The final
count remains **`complete_the_words` = 70** — the record was *replaced in place*, not deleted for symmetry.

## Codex remediation (record 20 — vibration)

- **Problem:** "…the speed of each vibration decides how high the note sounds" — scientifically wrong;
  pitch depends on vibration **frequency/rate**, not speed.
- **Fix:** passage rewritten to "…how high the note sounds depends not on how far the string moves but on
  **how many times per second it completes a vibration; more cycles each second produce a higher note.**"
  `targetWord=vibration` and `maskedForm="vibr_____"` kept; the word is still uniquely recoverable; `explain_zh`
  updated to cite frequency/cycles (not speed) plus the visible-letter pattern.
- **Legacy-ID handling:** changing the record changes its deterministic hash, so the **old** draft was removed
  by **precise IDs** before re-apply:
  - old set legacy_id `gen:toefl-complete-the-words:set:claude:1v3y5gy` → new `…:1lcao6o`
  - pre-delete assertions: `task_type='complete_the_words'`, `status='draft'`, `qa_flags.template='toefl-complete-the-words'`,
    `qa_flags.stage='adhoc'`, exactly 1 item (`spell`, draft), stimulus legacy_id matched.
  - deleted by id: item (by `question_set_id`) → set (by `id`) → stimulus (by `id`). **No broad `task_type` delete.**
  - re-apply: **wrote 1 · dup-skip 59**; idempotency rerun **wrote 0 · dup-skip 60**.
- **Verifier comments:** all stale `40` references updated to `60` (one provenance line documenting the 40→60
  scaling is intentionally kept). Domain/difficulty are now explicitly labelled **companion metadata / difficulty
  intent — NOT a machine verification of real text difficulty.**

## 1. Starting point

- Starting commit `d30f049caac1c0dceb5c66bde5000da5fb7f0f2e` (tag `qbank-v2-pre-parallel-20260622`),
  branch `qbank/toefl-complete-words` @ `D:/ai-worktrees/ocean-toefl-a` (`ocean-english` subdir).
- Starting `git status --short`: clean.
- Baseline (snapshot + `verify-toefl-pilot.ts` exit 0): totalSets **4878**, active **0**, antonym_choice **0**,
  cet_cloze **0**, complete_the_words draft **10** — all matched expected.

## 2. Changed files

**Committed (A-owned only):**
- `data/generated-question-sets/toefl-2026-expansion-a/toefl-complete-the-words-60.json`
- `scripts/verify-toefl-complete-words-expansion.ts`
- `reports/toefl-2026-complete-words-expansion-a.md` / `.json`

**Reverted (NOT committed) — shared auto-generated reports:**
`reports/authored-import-adhoc-{dryrun,apply}-report.json`, `reports/question-bank-v2-validation.json`,
`reports/question-sets-v2-qa.json`.

**Excluded from commit:** `.superpowers/sdd/` (controller run artifact, removed before commit).
**Created then retired earlier:** `…/toefl-complete-the-words-40.json` (consolidated into `-60.json`).

## 3. Source counts

Source records **60** · parsed_ok **60** · rejected **0**. Each set has exactly the 4 allowed keys.

## 4. Domain & difficulty (companion metadata / intent — not machine-verified)

| Domain | Sets | Domain | Sets |
|---|---:|---|---:|
| biology and ecology | 8 | history and archaeology | 7 |
| earth and environmental science | 8 | economics and social science | 7 |
| physics and technology | 8 | psychology and education | 7 |
| medicine and health | 8 | arts and humanities | 7 |

Difficulty intent: **18 B1 · 24 B2 · 18 C1** (= 60).

## 5. Passage word count

`countWords()`: **min 29 · avg 33.8 · max 48** (all within 15–55; the fixed vibration passage is 48 words).

## 6. Target-word & mask statistics

- **60 unique** target words, 0 overlap with pilot 10, all ordinary lowercase lexical words.
- Target length: min 7 · avg 9.42 · max 13. Hidden letters: min 4 · avg 5.5 · max 8. Revealed: min 2 · avg 3.92 · max 6.
- Hidden ratio: min **0.45** · avg **0.59** · max **0.71** (all ≥ 30%, ≥ 2 letters, never all hidden; shown letters case-exact).
- Definitional frames (`is called X` / `known as X`): **0 of 60** (one mild appositive remains) — well within the §12 cap.

## 7. Apply & idempotency

| Stage | apply #1 | apply #2 (idempotency) |
|---|---|---|
| First 40 (`-40.json`) | wrote **40** · dup 0 | wrote **0** · dup-skip **40** |
| Consolidated 60 (`-60.json`) | wrote **20** · dup-skip **40** | wrote **0** · dup-skip **60** |
| Codex vibration fix (after targeted delete) | wrote **1** · dup-skip **59** | wrote **0** · dup-skip **60** |

## 8. DB set/item/status counts

- `complete_the_words`: draft **70** · active **0** (pilot 10 + new 60).
- Each new set has exactly **1** draft item, `input_mode='spell'`, choices empty.
- Source↔DB exact payload comparison: **60/60**.
- Shared-DB `totalSets` after: **5038** — higher than 4878+60 because **Window B** writes its own draft sets to
  the same Supabase during the parallel run. This window's net contribution is exactly **+60** `complete_the_words`
  (the vibration replace is net 0). `gen active=0` and `deprecated=0` still hold globally.

## 9. Five representative legacy IDs

| # | targetWord | set legacy_id |
|---:|---|---|
| 0 | predators | `gen:toefl-complete-the-words:set:claude:ktzolv` |
| 1 | nutrients | `gen:toefl-complete-the-words:set:claude:1o01bfz` |
| 2 | pollinate | `gen:toefl-complete-the-words:set:claude:1xtgbgp` |
| 3 | dormant | `gen:toefl-complete-the-words:set:claude:1o0xb4s` |
| 19 | vibration (post-fix) | `gen:toefl-complete-the-words:set:claude:1lcao6o` |

(item legacy_id = same tag + `:item:claude:<tag>:0`; deterministic FNV-1a over `template|level|JSON.stringify(raw)`.
Old vibration `…:1v3y5gy` was deleted.)

## 10. Manual review method & replaced drafts

Authoring by Claude (Opus) subagents across 8 domains in parallel — **no DeepSeek, no external generation API,
no scraping**. Each candidate passed (1) a **JS mechanical gate** mirroring `lib/exam-task-templates/shape.ts`
(`complete_words`), (2) an **independent adversarial verifier** (Opus) that reconstructs the word from the masked
passage without the answer and rejects ambiguous/non-recoverable/non-ordinary words, (3) loop-to-quota +
global de-dup + frame-cap fixup, and (4) controller letter-by-letter review.

**Replaced/rejected drafts (none imported):** many `occ_0` inflection mismatches auto-corrected, adversarial
ambiguity/recoverability rejects, ≥ 3 global-duplicate drops in batch 1. **Codex remediation:** 1 record
(`vibration`) replaced for scientific accuracy via targeted delete + re-apply.

## 11. Validation commands & exit codes (post-remediation)

| Command | Exit | Result |
|---|---:|---|
| `verify-toefl-complete-words-expansion.ts` (source) | 0 | 60 records all shape-pass |
| `import…--file=…-60.json` (dry-run) | 0 | parsed_ok 60, reject 0 |
| `import…--file=…-60.json --apply` (post-fix) | 0 | wrote 1, dup-skip 59 |
| same `--apply` again (idempotency) | 0 | wrote 0, dup-skip 60 |
| `verify-toefl-complete-words-expansion.ts --db` | 0 | 60/60 payload, draft 70 |
| `npm run qa:qsets-v2` | 0 | errors 0 |
| `npm run validate:qbank-v2` | 0 | active 0, errors 0 |
| `npm run lint` | 0 | clean |
| `npx tsc --noEmit` | 0 | clean |
| `npx tsx scripts/qbank-v2-snapshot.ts` | 0 | active 0, antonym 0, cet_cloze 0, totalSets 5038 (shared w/ Window B) |

`verify-toefl-pilot.ts` was **not** run or edited; global answer-position normalization was **not** run (no choice answers).

## 12. Final invariants

gen active **0** · antonym_choice **0** · cet_cloze **0** · complete_the_words draft **70** · active **0**.

## 13. Compliance statement

No DeepSeek / no external generation API. All passages 100% original — no ETS/published text copied. Nothing
promoted/activated; every set and item is `draft`. No frontend/API/schema/rate-limit/audio/paper-generator/scoring
or other shared-infrastructure file edited. `verify-toefl-pilot.ts`, `import-authored-question-sets-v2.ts`,
`lib/exam-task-templates/shape.ts`, `data/exam-task-templates/*.json` read but not modified. The remediation
deletion used precise IDs with assertions — **no broad `task_type` delete**.

## 14. Files intentionally left for central integration

- `scripts/verify-toefl-pilot.ts` — unchanged; still encodes the 10-set baseline. Central integration should update
  it to the post-merge 70-set pool after both windows land.
- `reports/qbank-production-final-summary.md`, `reports/qbank-production-issue-ledger.*`, `reports/toefl-2026-non-audio-*`
  — intentionally untouched (central integration owns them).
- Shared auto-generated validation/import reports — reverted on this branch; central integration regenerates/reconciles with Window B.
- Window B (`qbank/toefl-writing`) directory, verifier, reports — untouched.

**Recommendation:** ready for central Codex integration review. Vibration science error fixed and re-verified;
complete_the_words = 70 (10 pilot + 60 new), all draft.
