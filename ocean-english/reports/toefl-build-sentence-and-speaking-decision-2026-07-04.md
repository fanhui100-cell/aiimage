# F4 + F5 — Build a Sentence & Speaking decisions (2026-07-04)

Driver: `docs/superpowers/plans/2026-07-03-toefl-and-remaining-qbank-fable5-master-prompt.md`
(F4 product decision + F5 product decision). Owner decisions captured at the F3-boundary prompt.

## F4 — Build a Sentence: **Option 4 — keep blocked** (owner decision)

The owner chose to keep `build_a_sentence` permanently draft-only for now (not machine-scored).

**Action taken:** none required beyond documentation. The existing guards already enforce this:

- Every `build_a_sentence` set carries `qa_flags.scoring_not_ready = true` (set by the shape at import,
  `lib/exam-task-templates/shape.ts` → `meta.scoringNotReady`).
- `scripts/promote-question-sets-v2.ts` rejects any set with `scoring_not_ready === true`
  (reason `scoring_not_ready`), and the atomic `promote_question_sets_v2` RPC re-checks it server-side.
- The coverage matrix classifies the cell **BLOCKED / scoring_not_ready**.
- `validate:toefl-task-alignment` asserts the template keeps `generation.scoringNotReady = true` and
  lists `build_a_sentence` under `blockerSummary.scoringNotReady`.

**Current state:** 10 draft sets, 0 active. Renderer (`BuildSentenceRenderer`) shows the
canonical/reference order without grading. No further content was generated (per option 4).

**To revisit later:** implementing option 1/2/3 (exact canonical / accepted sequences / rule-based
equivalence) would require a scoring contract in `lib/papers/scoring.ts` + answer-contract validator
proof before the promote guard could be lifted. Not in scope now.

## F5 — Speaking pipeline: **Defer** (owner decision)

The owner chose to defer `listen_and_repeat` and `interview_speaking`. No mic capture / storage / ASR /
audio-scoring pipeline is built in this run.

**Action taken:** none required beyond documentation. Existing guards keep both blocked:

- Both task types have `input_mode='speak'` items; the promote script rejects any speak item unless
  `qa_flags.speaking_ready === true` (reason `speaking_pipeline_not_ready`), and also requires a
  `rubric_id` — the RPC re-validates. `speaking_ready` is not set on any set.
- `listen_and_repeat` prompt audio is also `audio_missing` (no active audio for the speak prompts).
- Coverage classifies both cells BLOCKED; `validate:toefl-task-alignment` lists them under
  `blockerSummary.speakingPipelineNotReady`.
- Runtime: `inputMode='speak'` routes to the free-text/transcript path (2026-07-02 boundary work), so
  there is no incorrect choice/spell fallback; `/api/scoring/speaking` remains a transcript-only estimate.

**Current state:** 10 draft each, 0 active. No microphone capture/storage/privacy/ASR exists.

**To revisit later:** requires owner answers on (1) record mic audio? (2) storage/privacy model?
(3) ASR provider? (4) transcript-only scoring acceptable for first release? (5) practice-only vs
mock-scoring? Then renderer + consent UI + scoring + `smoke-speaking-practice.ts` before any promote.

## Net effect on the full-mock gate (F6)

Both decisions keep `build_a_sentence`, `listen_and_repeat`, `interview_speaking` out of any active
TOEFL paper. Under F6, the TOEFL full/mini mock can only open if these are either active-with-scoring
or **explicitly excluded by product decision** — which they now are (F4 option 4; F5 defer). The
remaining full-mock blockers are therefore: listening active audio + review (in progress), and a
product decision on whether the paper composes acceptably while excluding build/speaking. `paperReady`
stays **false**; F6 is not triggered in this run.

## No DB writes; no content generated; no code changed

This phase is documentation only. `active` unchanged (2672); `paperReady=false`;
`antonym_choice`/`cet_cloze` = 0.
