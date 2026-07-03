# TOEFL Listening Promotion - 2026-07-02

## Scope

Promoted the TOEFL listening pilot stage after:

1. The user confirmed the generated audio was listenable.
2. Codex performed a text-level transcript/question/answer audit.
3. The 20 matching audio assets were moved to `active`.
4. Promotion dry-run reported 0 rejected for both listening task types.

Stage:

- `toefl-listening-pilot-2026-07-01`

## Content Audit

Report:

- `reports/toefl-listening-content-audit-2026-07-02.md`

Result:

- `choose_a_response`: 10/10 pass
- `listening_comprehension`: 30/30 items pass
- Review/reject: 0

## Audio Activation

Activation report:

- `reports/toefl-listening-audio-activation-2026-07-02.json`

Final audio state for the 20 TOEFL pilot stimuli:

- `active`: 20
- `machine_checked`: 0
- `human_checked`: 0

Reviewer marker:

- `user-listened_codex-content-audit`

This marker means the user checked audio listenability and Codex checked transcript/question content alignment. It does not claim professional phonetic scoring.

## Promotion

`choose_a_response`:

- dry-run candidates: 10
- dry-run eligible: 10
- dry-run rejected: 0
- apply promoted: 10

`listening_comprehension`:

- dry-run candidates: 10
- dry-run eligible: 10
- dry-run rejected: 0
- apply promoted: 10

Final DB summary:

- sets: 20
- items: 40
- stimuli: 20
- audio rows: 20
- set status: 20 active / 0 draft
- item status: 40 active / 0 draft
- audio status: 20 active

## Safety Checks

- No deprecated task types were promoted.
- No TOEFL full/mini paper readiness change was made.
- TOEFL `paperReady` remains false.
- Listening transcripts are stored in DB/audio assets but must not be exposed in practice payload before answer reveal.
- Promotion used existing RPC/script gates and required active audio.

## Post-Promotion Serve Check

After promotion, a practice-session smoke check initially exposed a validation blind spot: the ad-hoc script had not loaded `.env.local` into `process.env`, so signed audio URLs appeared missing outside the Next.js runtime. The real server path uses environment variables, and the smoke was rerun with `loadDotenv()`.

To prevent future regressions, `scripts/validate-practice-session.ts` now asserts:

- `task(toefl/choose_a_response)` serves from `v2`.
- `task(toefl/listening_comprehension)` serves from `v2`.
- every sampled item has `inputMode='listen'`;
- every sampled item has `audio.url`;
- no sampled item exposes `stimulus.textEn`, `stimulus.textZh`, or a `transcript` field in the practice payload.

Current result:

- `choose_a_response`: 4/4 sampled items have audio URLs.
- `listening_comprehension`: 4/4 sampled items have audio URLs.
- transcript leakage: 0.

## Remaining TOEFL Gaps

Still not done in this phase:

- TOEFL full mock is not ready.
- `read_daily_life` and TOEFL academic `reading_comprehension` remain blocked by `official_spec_unverified`.
- `build_a_sentence` remains blocked by `scoring_not_ready`.
- Speaking tasks remain blocked by speaking pipeline readiness.

The next TOEFL content phase should address reading official-spec uncertainty or speaking pipeline readiness, not flip `paperReady`.
