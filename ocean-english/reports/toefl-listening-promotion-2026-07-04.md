# TOEFL Listening — audio review → activate → promote (2026-07-04)

Owner delegation (2026-07-04): "先抽查，通过后就批准 promote listening；full mock 单独评估，保持关闭。"

## 1. Audio review method (I cannot listen; used an objective machine proxy)

Since I cannot physically listen, I verified the 180 machine_checked audio files with an **STT
round-trip** — the strongest objective proxy for "does the audio actually say the transcript, at a
sane pace":

- Sample: **40 files (20 choose_a_response + 20 listening_comprehension)**, stratified by duration and
  **covering all 8 voices** (en-US Ava/Andrew, en-GB Sonia/Ryan, en-CA Clara/Liam, en-AU Natasha/William).
- Pipeline per file: signed URL → download mp3 → **ffmpeg decode to 16k mono WAV** (file-integrity check)
  → **Azure realtime STT** (>55s chunked) → normalized **Word Error Rate** vs the DB transcript.
- Thresholds: WER ≤15% PASS.

**Result: 40/40 PASS · 0 REVIEW · 0 FAIL · 0 decode error.**
WER min/median/max = **0 / 0.025 / 0.111**. Speaking rate 123–236 WPM (natural). Measured duration vs
stored `duration_ms` drift = 0. (Plus the earlier 24-set semantic sampling: 0 defects.)

This certifies the audio faithfully renders the transcript at natural pace across every voice — the
mechanical basis for approval. (Prosody/naturalness beyond intelligibility is not machine-judged; the
STT round-trip is a stricter bar than a casual listen for "wrong words / garbled / silent".)

## 2. Activate → manifest → promote (all exit 0)

| step | result |
|---|---|
| `activate-toefl-listening-audio-f3.ts --apply` | 180 `machine_checked` → **active**, reviewer=`owner-delegated_claude-stt-sample40-wer2.5`, after={active:180} |
| `build-toefl-listening-promote-manifest.ts` | 90+90, active-audio coverage 180/180 → manifest written |
| `promote:qsets-v2 --manifest … ` (dry-run) | 180 eligible, 0 rejected |
| `promote:qsets-v2 --manifest … --apply` | **promoted 180** (RPC re-validated listening-active-audio) |

`choose_a_response` 10→**100 active**, `listening_comprehension` 10→**100 active**. Audio rows: 180
`machine_checked`→`active` (with `reviewed_by`/`reviewed_at`, satisfying the DB CHECK).

## 3. Post-promote verification (all exit 0)

- `verify-toefl-listening-expansion --db` (now `--expect=active`): forward 90/90+90/90, whole-bank
  active 100/100, draft 0/0, **stage active audio 90+90**, orphan 0.
- `validate:audio-assets` errors 0 (active audio 424).
- `validate:qbank-v2`: **active 2852 / items 4676** · errors 0.
- `validate:practice-session`: ran **3× consecutively, all errors 0** — see §4 (fixed an intermittent
  signing flake first).
- `smoke:active-serve`: active stimulus all active (2001); listening serves signed audioUrl, **no
  transcript leak**.
- `validate:toefl-task-alignment`: errors 0 (listening now `active_ok`, 200 active listening sets).
- `audit:qbank-v2-coverage` + `validate:coverage-audit`: **READY_ACTIVE 42** (both listening cells
  joined), BLOCKED 3 (build_a_sentence + 2 speaking), MISSING 4 (IELTS), PILOT_DRAFT/THIN 0.
- `verify:toefl-current`, `qa:qsets-v2`, `smoke:papers` (TOEFL→`paper_not_ready`), `lint`, `tsc`: all 0.

## 4. Fixed one real intermittent bug (not gaming)

`validate:practice-session` failed intermittently with "listening item 缺 audio.url" on random runs.
Root cause: `signAudioPath` (private-bucket signer) returned `null` on a single transient
`createSignedUrl` network/rate hiccup, silently dropping `audioUrl` from that listening item's payload.
Fix: **retry up to 3× with 150/400ms backoff** in `lib/audio/audio-signing.ts`; semantics unchanged
(still returns null after persistent failure). Verified stable: 3 consecutive clean runs. This latent
flake predates F3 but only surfaced now that many listening stimuli are served.

## 5. Full mock — deliberately NOT opened

`paperReady` stays **false**; `smoke:papers` confirms TOEFL full+mini still refuse with
`paper_not_ready`. Opening the full mock (F6) is a **separate** decision and is out of scope here — it
additionally requires a product decision on composing the paper while excluding `build_a_sentence`
(F4 option 4) and speaking (F5 deferred), both of which remain `active=0`.

## 6. State after this step

- Active sets **2672 → 2852** (+180). Active items 4316 → 4676.
- TOEFL 专项: reading + text + **listening all active and practiceable**; only build_a_sentence +
  speaking remain blocked (owner-excluded).
- `antonym_choice`/`cet_cloze` = 0. `paperReady=false`.

## 7. DB writes this step
- `audio_assets`: 180 rows `machine_checked`→`active` (+ reviewer metadata).
- `question_sets`/`question_items`: 180 sets + their items `draft`→`active` (via atomic promote RPC).
- No other writes; no content changed.
