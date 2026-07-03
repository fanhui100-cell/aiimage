# F3 — TOEFL Listening Expansion (2026-07-03) — DRAFT content landed; audio + promote gated

Driver: `docs/superpowers/plans/2026-07-03-toefl-and-remaining-qbank-fable5-master-prompt.md` (Phase F3)
Branch: `iter5-f1`. Stage: `toefl-listening-expansion-2026-07-03`.
Generation provider: **Claude-authored JSON, DeepSeek not used.**

## 1. What this phase did (and deliberately did not do)

Authored and imported **180 new TOEFL listening sets as draft** (the transcript + question content
that audio is later synthesized from):

| taskType | active before | added draft | items added | after |
|---|---:|---:|---:|---:|
| `choose_a_response` | 10 (active, w/ audio) | +90 draft | 90 | 10 active + 90 draft |
| `listening_comprehension` | 10 (active, w/ audio) | +90 draft | 270 | 10 active + 90 draft |

**Stopped before audio generation and promote.** No audio was synthesized, no row was promoted, no
active row changed. This is an intentional hand-off boundary — see §7.

## 2. Authoring method

Six parallel Claude authors, disjoint scenario allocations, each with the pilot scenarios to avoid:

- `choose_a_response` (+90): A = campus_life/classroom · B = student_services/advising · C = library/housing.
  Each set = a 30-80 word spoken prompt + one "best response" item (4 options).
- `listening_comprehension` (+90): A = campus_conversation/service_encounter · B = academic_talk/seminar ·
  C = announcement. Each set = a 120-200 word spoken transcript + three items (4 options); at least one
  detail and one inference/purpose/attitude question per set.

Correct-answer letters are spread (final: choose_a_response+listening combined A=93 · B=95 · C=90 · D=82).

## 3. Semantic self-review (§1.2)

Two independent adversarial reviewers (one per task type, 100% of sets):

- `choose_a_response`: **0 REJECT**, 3 REVIEW (near-duplicate *response frames* in the batch-C
  service-desk block: pay-fine-cash, "here's my ID", "that time works").
- `listening_comprehension`: **0 REJECT**, 2 REVIEW (set 25 lost-item skeleton dup of set 1; set 41
  tree-ring concept dup of set 34 varves).

**All 7 REVIEW items were replaced with fresh distinct content before import** (5 choose_a_response
scenarios rewritten; 2 listening sets replaced with a dining-allergy service encounter and a honeybee
waggle-dance lecture). The imported manifest is therefore **100% PASS**.

| taskType | authored | PASS | REVIEW | REJECT | imported draft | promoted active |
|---|---:|---:|---:|---:|---:|---:|
| choose_a_response | 95 | 90 | 0 | 0 (5 REVIEW replaced pre-import) | 90 | 0 |
| listening_comprehension | 92 | 90 | 0 | 0 (2 REVIEW replaced pre-import) | 90 | 0 |

## 4. Import + verification

| step | result |
|---|---|
| dry-run | parsed_ok 180 · reject 0 (exit 0) |
| apply #1 | **wrote 180** · dup 0 (exit 0) |
| apply #2 (idempotency) | wrote 0 · dup-skip 180 (exit 0) |

`verify-toefl-listening-expansion --source` (exit 0): 90/90 + 90/90 through `shapeToItems(listening_multi)`,
every item `input_mode='listen'`, 4 options, answer hits, transcript word bounds (25-90 / 110-220),
no in-source dup, no deprecated type.

`verify-toefl-listening-expansion --db` (exit 0): source→DB forward 1:1 (90/90 + 90/90), all draft +
correct stage + `input_mode='listen'`; whole-bank draft = 90 each; **active this stage = 0**; active
audio this stage = **0** (expected — audio not yet generated); reverse orphan 0; stage sets 180 = 180.

DB writes: `stimuli` +180 draft, `question_sets` +180 draft, `question_items` +360 draft. No active change.

## 5. Commands and exit codes (all 0)

| command | exit |
|---|---:|
| `verify-toefl-listening-expansion --source` | 0 |
| `import:authored-qsets-v2 --stage` (dry-run) | 0 |
| `… --apply` ×2 | 0 (wrote 180 → wrote 0/dup 180) |
| `verify-toefl-listening-expansion --db` | 0 |
| `qa:qsets-v2` | 0 (模板 32 · 错误 0) |
| `validate:qbank-v2` | 0 (active 2364 · 错误 0) |
| `validate:practice-session` | 0 |
| `smoke:active-serve` | 0 (active stimulus all active; listening serves signed audio, no transcript leak) |
| `validate:toefl-task-alignment` | 0 (errors=0 warnings=0) |
| `lint` | 0 |
| `tsc --noEmit --incremental false` | 0 |

(`generate:audio-assets` and `validate:audio-assets` were **not** run — see §7. No audio was generated.)

## 6. Active / deprecated counts

- Active sets total: **2364** (unchanged — F3 wrote draft only).
- `antonym_choice` = 0 · `cet_cloze` = 0. TOEFL `paperReady` = **false** (full mock closed).

## 7. Audio + promote boundary — the decision that stops this phase

The 180 draft transcripts are ready to become audio, but three things are genuinely out of scope for
an autonomous content pass and need an owner decision:

**a) Audio credentials are PRESENT.** `.env.local` has `SUPABASE_AUDIO_BUCKET`, `AZURE_SPEECH_KEY`,
`AZURE_SPEECH_REGION`, and Supabase creds — so `generate:audio-assets --apply` (Azure Neural TTS →
private bucket → `machine_checked` audio rows) is technically runnable. The 180 transcripts total well
under the 0.5M-char Azure free tier, so cost is ~$0. It was **not run** because synthesizing + uploading
180 audio files is an external provider side-effect that should be an explicit go, not assumed.

**b) `generate:audio-assets` has no `--stage` flag** (the plan anticipated this). It filters by
`--exam`/`--task` and auto-excludes stimuli that already have active audio, and caps at 20 per exam-cell
by default (`--cap` raises it). So the working command to target exactly these 180 new draft stimuli is:

```powershell
npm run generate:audio-assets -- --exam=toefl --task=choose_a_response --cap 100          # dry-run + cost preview
npm run generate:audio-assets -- --exam=toefl --task=choose_a_response --cap 100 --apply  # → machine_checked
npm run generate:audio-assets -- --exam=toefl --task=listening_comprehension --cap 100 --apply
npm run validate:audio-assets
```

No `--stage` support needs to be added; the exam/task filter is sufficient and precise here.

**c) Activation to `active` requires a human listening review.** `generate:audio-assets` only ever
writes `machine_checked` audio — it never sets `active`. The pilot 20 were activated only after "the
user confirmed the generated audio was listenable" (`reports/toefl-listening-promotion-2026-07-02.md`).
I cannot self-certify that synthesized audio sounds correct, so I cannot promote listening to active.

**Promote gate** (unchanged): even with audio, promote requires the explicit instruction
`Promote TOEFL listening reviewed manifest` AND active audio for all 180.

## 8. Recommended next steps (your call)

1. **Generate audio now** (recommended): approve running the `--exam=toefl --task=… --cap 100 --apply`
   commands above to synthesize 180 `machine_checked` audio files (≈free), then `validate:audio-assets`.
2. **Human listening review**: spot-check the synthesized audio for listenability.
3. **Promote**: once audio is reviewed active and you say "Promote TOEFL listening reviewed manifest",
   promote the 180 → active (choose_a_response 100 active, listening_comprehension 100 active).

Until then, all 180 sets remain draft and are not served. If you'd rather skip audio for now, the draft
content stays safely parked (exactly like the F1 reading and F2B text drafts) and F4 (Build a Sentence)
can proceed independently.

## 9. Self-review checklist (§1.1)

- [x] Phase-owned files created (2 stage JSONs, verifier, reports, import reports)
- [x] All run commands' real exit codes recorded (§5); audio commands explicitly NOT run (§7)
- [x] Every authored item self-reviewed; 7 REVIEW replaced pre-import; manifest 100% PASS
- [x] No promote, no active change, no audio generated; write counts matched (180 / 0+180 dup)
- [x] `paperReady=false`; no hard-stop; stopped at the documented audio/promote decision boundary
