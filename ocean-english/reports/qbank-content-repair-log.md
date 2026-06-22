# R2 Content Repair Log

## R2-source-db-drift — 3 productive stages re-synced to canonical disk source (2026-06-23)

**Finding (read-only audit `scripts/verify-source-db-all-authored.ts`):** of 1314 authored source records, 1154 mapped 1:1 to DB; **150 drifted** across `prod-ky-aw` (50), `prod-ky-essay` (50), `prod-zk-aw` (50). The disk source files were edited after their original import, so the deterministic legacy hash no longer matched the live DB rows (prompts still matched live items exactly). 150 disk records ↔ 150 DB draft sets: same content, mutually unlinked. Separately, 10 early-stage records (g3 6, g4 2, gapfill 2) fail `shapeToItems` (passage_too_short) — superseded historical drafts the importer correctly never wrote.

**Decision (user):** disk source is canonical → re-import to replace the stale DB rows. Early shape-reject stages → superseded historical (excluded from the audit as info-skips).

**Repair (rule-12 compliant; `scripts/repair-prod-drift-r2.ts`):** enumerated the EXACT stale legacy_ids (DB sets in those stages not matching the current disk hashes), and per row asserted `status='draft'` + `qa_flags.stage` + `task_type` before deleting child items → set → orphan stimulus. **No prune-by-stage.**

| step | result |
|---|---|
| dry-run | stale 150 (50×3), aborts 0, disk-expected 50 each |
| delete (`--apply`) | deleted sets **150**, orphan stimuli 0 (prompt-only writing tasks), aborts 0 |
| re-import first apply | `prod-ky-aw` wrote 50/dup 0 · `prod-ky-essay` wrote 50/dup 0 · `prod-zk-aw` wrote 50/dup 0 (**150**) |
| re-import idempotency | each wrote 0 / dup 50 (**0/150**) |
| `verify-source-db-all-authored.ts` | **PASS** — 1304/1314 1:1 (10 superseded shape-rejects info-skipped), no orphan |

**Invariants after repair:** totalSets **5038** (net-zero: −150 +150), active **0**, antonym_choice **0**, cet_cloze **0**; `essay_writing` 150 draft, `applied_writing` 150 draft (counts preserved). `qa:qsets-v2`, `validate:qbank-v2`, `validate:practice-session`, `validate:papers`, `validate:data-quality`, `lint`, `tsc --noEmit` all exit 0.

**Content preservation:** prompts/choices/answers unchanged in meaning; the re-imported rows carry the canonical disk-source content. No active rows created; no deprecated types touched.

## No other blocking content defects

`scripts/audit-qbank-content-semantics.ts`: 0 within-item duplicate choice texts, 0 unresolved single-choice answers (of 3910 choice items). The 45 "shared-prompt" clusters are benign instruction stems for stimulus-based/templated task types (reading/listening/translation/SAT), not content duplicates. No semantic repairs required.
