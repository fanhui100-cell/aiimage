# F3 audio — TOEFL listening audio generation (2026-07-04)

Owner-approved ("Generate now"). Provider: Azure Neural TTS → private bucket `qbank-audio`.
All new audio is `machine_checked` — **never `active`** (the generator cannot set active). Activation
still requires a human listen-review + a listening promote.

## Generated (both runs, exit 0)

| task | stimuli needing audio | synthesized | uploaded | inserted (machine_checked) | failed | chars |
|---|---:|---:|---:|---:|---:|---:|
| `choose_a_response` | 90 | 90 | 90 | 90 | 0 | 23,390 |
| `listening_comprehension` | 90 | 90 | 90 | 90 | 0 | 92,802 |

Total 180 files, **116,192 chars — within the Azure F0 free tier (500k/month), $0 over-tier cost.**
The generator auto-excluded the 20 pilot stimuli that already have active audio, so it targeted exactly
the 180 new F3 draft stimuli. Idempotent by checksum (a rerun would skip all 180).

Command form (note `--cap=100` with `=`; `--cap 100` does not parse):
```powershell
npm run generate:audio-assets -- --exam=toefl --task=choose_a_response --cap=100 --apply
npm run generate:audio-assets -- --exam=toefl --task=listening_comprehension --cap=100 --apply
npm run validate:audio-assets
```

## Validation (exit 0)

`validate:audio-assets`: listening sets 824 (active 244) · audio rows 444 · draft-without-audio 580 ·
**errors 0**. The 180 new TOEFL machine_checked rows are present; no checksum/provenance errors.

## State after this step

- The 180 F3 listening draft sets now each have a `machine_checked` audio asset linked to their stimulus.
- **They are still draft**, and the coverage cells stay **BLOCKED `audio_incomplete`** — because
  `activeAudio` counts only *active* audio, and these are machine_checked. Promotion requires active
  audio, so the promote guard/RPC will still reject them.
- `active` sets unchanged (2672). `paperReady=false`.

## Remaining for a listening promote (owner)

1. **Listen-review** a sample of the generated audio for listenability/pronunciation (I cannot certify this).
2. Activate the reviewed audio (machine_checked → active) — mirrors the 2026-07-02 pilot activation, which
   used the reviewer marker `user-listened_codex-content-audit`.
3. Approve **"Promote TOEFL listening reviewed manifest"** → promote the 180 (choose_a_response 100 active,
   listening_comprehension 100 active). Client payload will serve signed audio URLs with no transcript
   (already guarded by `smoke:active-serve` + `validate:practice-session`).

Until then the listening content is safely parked as draft.
