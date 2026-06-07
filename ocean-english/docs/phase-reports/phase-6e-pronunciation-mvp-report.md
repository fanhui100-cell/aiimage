# Phase 6E — Pronunciation MVP + LexiGraph Action Polish Report

**Date:** 2026-06-02
**Branch:** feat/lexiocean-phase1
**Status:** Complete

---

## 1. Phase 6E Goals

- Surface a unified, reusable pronunciation experience across `/word/[slug]` and `/lexigraph`.
- Add `ExampleSentencePlayer` for inline example sentence playback.
- Add `AccentSelector` (Auto / US / UK) shared via localStorage.
- Wire `onPlayed` callback into `PronunciationButton` to support motivation hooks.
- Trigger LexiStar +2 on successful pronunciation play in both routes.
- Add one-shot outward wave ring animation on the LexiGraph center node when pronunciation plays.
- Lumi companion message updated after pronunciation in LexiGraph.
- Default accent changed from `'us'` to `'auto'`.

---

## 2. Files Added

| File | Purpose |
|---|---|
| `components/pronunciation/ExampleSentencePlayer.tsx` | Compact ▶ EN play button for English example sentences |
| `components/pronunciation/AccentSelector.tsx` | 3-button Auto/US/UK toggle, reads/writes `lexiocean-accent-preference` |
| `docs/phase-reports/phase-6e-pronunciation-mvp-report.md` | This file |

---

## 3. Files Modified

| File | Change |
|---|---|
| `lib/pronunciation/pronunciation-types.ts` | `DEFAULT_ACCENT_PREFERENCE.accent`: `'us'` → `'auto'` |
| `components/pronunciation/PronunciationButton.tsx` | Added `onPlayed?: () => void` prop; added empty-text guard |
| `app/word/[slug]/WordDetailClient.tsx` | Accent state + AccentSelector + PronunciationButton near IPA + ExampleSentencePlayer per example + `addLexiStar(2, 'pronunciation')` |
| `components/lexigraph/LexiGraphPanel.tsx` | Accent state + AccentSelector + updated PronunciationButton with `onPlayed` + motivation hooks + Lumi message + ExampleSentencePlayer in examples + `onPronunciationPlayed` prop |
| `components/lexigraph/LexiGraphPage.tsx` | `waveActive` state + `handlePronunciationPlayed` + passes `waveActive` to Map + `onPronunciationPlayed` to Panel |
| `components/lexigraph/LexiGraphMap.tsx` | Added `waveActive?: boolean` prop, forwarded to core node as `isWaving` |
| `components/lexigraph/LexiGraphNode.tsx` | Added `isWaving?: boolean` prop; renders one-shot `lxi-wave` ring when true |
| `app/globals.css` | Added `@keyframes lxiWave` + `.lxi-wave` CSS class |

---

## 4. Pronunciation Provider Design

The provider architecture was already complete from Phase 6A. Phase 6E builds only at the component layer:

```
SpeechSynthesisProvider   (lib/pronunciation/speech-synthesis-provider.ts)
  ↓  PronunciationProvider interface
usePronunciation() hook   (lib/pronunciation/pronunciation-client.ts)
  ↓  state: idle/loading/speaking/error/unsupported
PronunciationButton       (components/pronunciation/PronunciationButton.tsx)
ExampleSentencePlayer     (components/pronunciation/ExampleSentencePlayer.tsx)
  ↓  onPlayed callback
WordDetailClient / LexiGraphPanel
  ↓  motivation hooks + wave animation
```

Zero changes to `speech-synthesis-provider.ts` or the hook internals.

---

## 5. speechSynthesis Fallback Strategy

| Scenario | Behavior |
|---|---|
| `speechSynthesis` not available | `isSupported = false` → both `PronunciationButton` and `ExampleSentencePlayer` return `null` |
| Empty `text`/`sentence` | `handleClick` returns early (guard added to `PronunciationButton`); `ExampleSentencePlayer` renders nothing |
| en-US voice absent | `selectVoice` falls back to any `en-*` voice |
| No English voice | Falls back to any available voice |
| `accent = 'auto'` | `ACCENT_LOCALE_MAP['auto'] = null` → selects first available English voice; `utterance.lang = 'en-US'` fallback |
| iOS Safari stall | Existing `setTimeout(resume, 50)` already in provider |
| Multiple buttons on page | Provider-level `cancel()` before each new `speak()` |
| `onPlayed` callback throws | Wrapped in try/catch in both `WordDetailClient` and `LexiGraphPanel` |

---

## 6. Word Detail Integration

**`/word/[slug]` changes:**

1. IPA row replaced with a flex row: `[IPA span] [▶ US button] [Auto][US][UK]`
2. If no IPA, only button + selector shown (spec: "pronunciation button still works without IPA").
3. Each English example sentence has a `▶ EN` button aligned to the right of the example block.
4. `accent` state initialized to `'auto'`; updated from localStorage on mount via `useEffect`.
5. Word pronunciation awards `LexiStar +2` once per page lifecycle via `useRef(false)` anti-spam.
6. `useMotivationStore.addLexiStar` call wrapped in try/catch — failure cannot crash the page.
7. No Lumi on word detail (Lumi lives in LexiGraph); motivation store update still happens silently.

---

## 7. LexiGraph Integration

**`LexiGraphPanel` changes:**

1. IPA row: `[IPA] [▶ sm button] [Auto][US][UK]` — AccentSelector shares same accent state.
2. Example section: `▶ EN` player added alongside the first example.
3. `handlePronunciationPlayed` called by `PronunciationButton.onPlayed`:
   - Awards `LexiStar +2` once per panel lifecycle (via `useRef(false)` anti-spam).
   - Sets Lumi companion message: `'Good. Let the sound shape the memory.'`
   - Calls `onPronunciationPlayed?.()` to trigger wave animation.
4. All motivation calls wrapped in try/catch.

**Wave animation flow:**
```
LexiGraphPanel.handlePronunciationPlayed()
  → onPronunciationPlayed() callback
  → LexiGraphPage.handlePronunciationPlayed()
  → setWaveActive(true)
  → setTimeout(setWaveActive(false), 1700ms)
  → LexiGraphMap receives waveActive=true
  → LexiGraphNode (core node) receives isWaving=true
  → renders <circle className="lxi-wave"> (one-shot scale 1→2.8, opacity 0.8→0, 1.6s)
  → after 1700ms: waveActive=false, circle unmounts
```

---

## 8. Motivation / Lumi Integration

| Action | LexiStar | Lumi Message | Where |
|---|---|---|---|
| Play pronunciation (word) | +2 (`'pronunciation'`) | none (no Lumi on word detail) | `/word/[slug]` |
| Play pronunciation (word in LexiGraph) | +2 (`'pronunciation'`) | 'Good. Let the sound shape the memory.' | `/lexigraph` |
| Play example sentence | no additional award | — | both pages |

**Anti-spam:** `useRef(false)` per component lifecycle — resets when panel remounts (word change) or page reloads.

**Existing cooldown:** `useMotivationStore.addLexiStar` has a 5-second per-reason in-memory cooldown as secondary protection.

---

## 9. Browser Compatibility Notes

| Browser | Status |
|---|---|
| Chrome / Edge | Full support; voices load async (3s timeout already handled) |
| Firefox | Full support; voices available synchronously |
| Safari (macOS) | Full support |
| Safari iOS | Full support; stall workaround already in provider |
| Samsung Internet | Generally supported |
| Older browsers without `speechSynthesis` | Graceful null render |

`transform-box: fill-box` and `transform-origin: center` used for wave animation — supported in all modern browsers (Chrome 64+, Firefox 55+, Safari 11+).

---

## 10. Known Limitations

1. `ExampleSentencePlayer` only plays the first example in the LexiGraph panel (single example shown). All examples in `/word/[slug]` each have their own player.
2. Accent preference affects the TTS voice selection but the browser may not have the exact requested accent — falls back to any English voice.
3. Multiple `PronunciationButton`/`ExampleSentencePlayer` instances share one provider: clicking one while another plays cancels the previous (by design). The cancelled button may briefly show error state.
4. `onPlayed` fires on playback *start*, not on completion — motivation is awarded even if user stops early. This is intentional for responsive UX.
5. Wave animation uses CSS `transform-box: fill-box` — visually correct in modern browsers; may not animate in very old browsers (degrades silently, no crash).

---

## 11. Future TTS Provider Path

To swap in a cloud TTS provider (e.g. AWS Polly, Azure TTS):

1. Implement `PronunciationProvider` interface in a new file: `lib/pronunciation/cloud-tts-provider.ts`.
2. Change `getSpeechSynthesisProvider()` → `getActivePronunciationProvider()` in `pronunciation-client.ts` to select based on config.
3. No changes needed to `PronunciationButton`, `ExampleSentencePlayer`, `AccentSelector`, or any page code.

---

## 12. Test Commands

```bash
npm run lint      # expect: 0 errors
npm run build     # expect: 46 routes, TypeScript clean

# Smoke: verify PronunciationButton prop updated
npx tsx -e "
const src = require('fs').readFileSync('./components/pronunciation/PronunciationButton.tsx', 'utf8');
console.log('onPlayed present:', src.includes('onPlayed'));
console.log('empty guard:', src.includes('if (!text.trim())'));
"

# Smoke: verify default accent
npx tsx -e "
const src = require('fs').readFileSync('./lib/pronunciation/pronunciation-types.ts', 'utf8');
console.log('default auto:', src.includes(\"accent: 'auto'\"));
"
```

---

## 13. Codex Review Checklist

- [ ] `PronunciationButton` renders on `/word/[slug]` next to IPA
- [ ] `AccentSelector` (Auto/US/UK) renders on `/word/[slug]` next to pronunciation button
- [ ] Clicking `PronunciationButton` on word detail speaks the word
- [ ] `ExampleSentencePlayer` renders next to each example on `/word/[slug]`
- [ ] Clicking `▶ EN` on word detail speaks the example sentence
- [ ] Changing accent selector → next pronunciation uses new accent
- [ ] Accent preference saved to localStorage key `lexiocean-accent-preference`
- [ ] Reloading `/word/[slug]` restores last selected accent
- [ ] `PronunciationButton` renders in `/lexigraph` panel next to IPA
- [ ] `AccentSelector` renders in `/lexigraph` panel
- [ ] `ExampleSentencePlayer` renders in `/lexigraph` panel examples section
- [ ] Playing pronunciation in LexiGraph triggers `LexiStar +2` (visible in HUD)
- [ ] Playing pronunciation in LexiGraph updates Lumi message (check bubble)
- [ ] Playing pronunciation in LexiGraph triggers outward wave ring on center node (~1.6s)
- [ ] Wave animation is one-shot: plays once, disappears cleanly
- [ ] Anti-spam: rapid pronunciation clicks do not infinitely increment LexiStar (only +2 once per word per session)
- [ ] Playing pronunciation on `/word/[slug]` triggers `LexiStar +2` (check in LexiGraph HUD)
- [ ] `speechSynthesis` unsupported: no buttons rendered, no errors
- [ ] Empty sentence: `ExampleSentencePlayer` renders nothing
- [ ] `/dictionary`, `/quiz`, `/memory`, `/scan`, `/chat` unchanged
- [ ] Phase 5 auth / cloud sync / migration unchanged
- [ ] `npm run lint` passes
- [ ] `npm run build` passes (46 routes)
