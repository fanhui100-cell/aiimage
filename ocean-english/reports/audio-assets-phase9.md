# Listening Audio Assets — Phase 9 Report

Date: 2026-06-20
Phase: 9 — listening audio asset pipeline + player
Branch: iter5-f1
Frontend: implemented directly (user pre-approved; functional player reusing the existing
`.pr-v2` ListenButton visual, **no redesign**).

## 0. Goal

Give formal listening tasks a path to **stable audio assets** (v2 `audio_assets`) instead of
relying only on browser TTS — without regenerating content, without writing Storage by default,
and without breaking the existing word-level pronunciation / TTS fallback.

## 1. Changed files

| File | Type | Purpose |
|---|---|---|
| `lib/audio/audio-asset-client.ts` | created | Disciplined audio fetch by `stimulus_id`/`audio_asset_id`; **transcript only in review mode** (practice mode never selects the column); `speakFallback`/`stopFallback` TTS bridge; `isPlayableAudioUrl`; exported `AUDIO_PRACTICE_COLUMNS`/`AUDIO_REVIEW_COLUMNS` contracts |
| `scripts/generate-audio-assets.ts` | created | Dry-run-default generator; `--apply/--limit/--exam/--task/--provider`; lists listening stimuli lacking active audio; gated apply |
| `scripts/validate-audio-assets.ts` | created | Audio QA gate (not_applied aware); active-listening-needs-audio; shape checks; client transcript-exposure contract |
| `scripts/smoke-listening-phase9.ts` | created | Playwright click-level smoke for the listening practice route |
| `components/practice/audio/AudioPlayer.tsx` | created | Accessible player: play/pause, loading/error, replay, mock replay-limit, transcript only when revealed, TTS fallback |
| `components/practice/renderers/ListeningRenderer.tsx` | modified | Uses `AudioPlayer`; real URL → audio, else TTS text; transcript fetched **only on review** via audio client |
| `components/quiz/practice-session.css` | modified | Added `@keyframes pr-spin` (player loading spinner) |
| `lib/practice/session-types.ts` | modified | **Removed `transcript` from `PracticeItem.audio`** (practice payload can't carry it); added non-revealing `stimulusId` |
| `lib/practice/session-builder.ts` | modified | v2 path drops `transcript` from the `audio_assets` select/payload; **suppresses listening `stimulus.textEn/textZh`** in practice; emits `stimulusId` for review fetch |
| `package.json` | modified | Added `generate:audio-assets` + `validate:audio-assets` |
| `reports/audio-assets-phase9.md` | created | This report |

**Not touched:** `lib/pronunciation/word-audio.ts`, `components/screens/PronunciationScreen.tsx`
(word-level pronunciation/TTS unchanged), `components/screens/drill/MockExam.tsx`, DeepSeek route /
rate-limiting. **No DB/Storage writes.**

## 2. Was audio generation applied?

**No — and `--apply` is now an explicit hard-refusal.** `generate-audio-assets.ts` is **dry-run
only**: a real TTS-synthesis / Storage-upload / `audio_assets`-insert path is **not implemented
yet**, so `--apply` **always exits 1** with a clear `provider_not_implemented`-style message
(after first reporting any missing v2 schema / `SUPABASE_AUDIO_BUCKET` / `AUDIO_TTS_API_KEY`). This
removes the earlier "exit 0 but wrote nothing" trap — apply never silently succeeds. New audio
rows, once the pipeline is implemented, must default to **`machine_checked`** — never `active`.

## 3. Storage / database writes

**None.** No Supabase Storage files were written; no `audio_assets` rows were inserted. `--apply`
is hard-refused (exit 1) until a real synthesis+upload+insert path is built.

## 4. Validation results (exit codes)

| Command | Result |
|---|---|
| `npx tsc --noEmit` | ✅ exit 0 |
| `npm run lint` | ✅ exit 0 |
| `npm run validate:audio-assets` | ✅ exit 0 (`not_applied`; client transcript contract enforced) |
| `npm run validate:qbank-v2` | ✅ exit 0 (`not_applied`) |
| `generate:audio-assets --limit=5` (dry-run) | ✅ exit 0 (`not_applied`, no writes) |
| `generate:audio-assets --apply --limit=1` | ✅ **exit 1 refused** (v2 + audio config missing) |
| `smoke-listening-phase9.ts` (Playwright) | ✅ **6/6**, 0 failures |

Smoke (listening practice `/quiz?mode=task&taskType=listening_comprehension&level=3`): AudioPlayer
button renders; v1 has no stable audio → **「朗读模式」 (TTS fallback)**; **no transcript before
answer**; clicking play does not crash; answering locks without crash; no `pageerror`.

## 5. Listening tasks still missing audio

**All of them.** v1 listening (`listening_comprehension`, ~5.9k rows) stores the passage text in
`audio_ref` and is read aloud by TTS; there is no stable audio file anywhere. Phase 8 keeps
migrated listening sets `draft` precisely because no stable audio exists, and this phase does not
synthesize any. A real audio corpus requires: applying the v2 schema, configuring a Storage bucket
+ a TTS provider key, then running `generate:audio-assets --apply` (writes `machine_checked` rows),
and finally a human/QA promotion to `active`. Until then, listening runs on TTS fallback and stays
out of `active` v2 pools.

## 6. Fallback behavior for word-level audio

Unchanged and preserved. `AudioPlayer` only switches to the HTML5 `<audio>` element when
`isPlayableAudioUrl(url)` is true (`http(s)://` or `/…`). For:
- **word-level listen** (`listen_to_meaning`, `dictation_spell`) — `audio.url` is a word/слаг or
  null → **TTS mode** (`speakFallback` → `word-audio.speakSmart`, word-first real audio then TTS),
  identical to the previous `ListenButton`.
- **v1 `listening_comprehension`** — `audio.url` holds passage **text** (not a URL) → TTS reads the
  passage, same as before.
- **audio load error** — the player auto-falls back to TTS (no dead-end), never crashes on
  draft/no-audio states.

## 7. Transcript exposure discipline (Codex P1a — fixed)

Transcript is now **never sent in the practice payload**, enforced at three layers:

1. **Type:** `PracticeItem.audio` no longer has a `transcript` field — a practice session
   *cannot* carry it (tsc enforces every producer conforms).
2. **session-builder (v2):** the `audio_assets` query selects only `stimulus_id, url` (no
   transcript), and for **listening** sets the `stimulus.text_en/text_zh` (which *is* the
   transcript) is **omitted** from the practice payload; only `url` + a non-revealing `stimulusId`
   are sent.
3. **Review fetch:** `ListeningRenderer` fetches the transcript **only after `locked`** via
   `fetchAudioByStimulus(stimulusId, 'review')` (review-mode columns include transcript); RLS only
   returns `active` audio. `AudioPlayer` renders it only when `revealed`.

`validate-audio-assets` machine-checks this: (a) the client column contracts
(`AUDIO_PRACTICE_COLUMNS` excludes transcript, `AUDIO_REVIEW_COLUMNS` includes it); (b) a **static
payload contract** — `PracticeItem.audio` type and every `session-builder` `audio_assets.select`
are asserted transcript-free; (c) an **optional live API assertion** (when `BASE` is set) that a
real `/api/practice/session` listening payload has no `item.audio.transcript`. Verified live: the
v1 listening payload carries no `audio.transcript` (`livePayloadChecked: true`).
