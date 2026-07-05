# Listening Audio Expansion Plan (2026-07-05)

> **Track split from** `docs/superpowers/plans/2026-07-05-post-cc-review-conditional-pass-development-plan.md` (Task 6).
> **Purpose:** Close the CC-review P2-11 gap — active v2 listening audio currently exists **only for CET6**. zhongkao / gaokao / CET4 / TOEFL declare `requiresAudio` listening sections but have zero active audio, so their mock listening section builds empty (`insufficient_pool`) and listening practice silently degrades to browser TTS. The TOEFL 4-accent pool is entirely unexercised. This is an **audio/content production track** with human QA, kept out of the safety-fix branch.

## Goal

Give every active exam that declares a listening section real, human-reviewed, signed audio, so mock listening sections stop building empty and so no exam advertises listening/accent capability it cannot serve.

## Initial Target (first measurable milestone)

Initial target: add active listening audio beyond CET6 for zhongkao, gaokao, CET4, and TOEFL; do not advertise TOEFL accent coverage until TOEFL listening audio rows are active and human-reviewed.

## Global Constraints

- No DB reset, delete, or `promote --apply` without explicit owner approval.
- Audio must be signed / private-bucket; practice and mock payloads must never ship transcript (`textEn`) — preserve the existing double-strip guarantee.
- Until an exam has active listening audio, the mock UI must disclose that the listening section is unavailable for that exam (do not silently drop it or fake it with TTS).
- Do not claim TOEFL accent differentiation until active TOEFL listening audio exists and is human-reviewed.

## Work Outline (fill in per batch)

1. **Measure baseline** — list active listening sets by exam/level (currently CET6 only); list exams with `requiresAudio` listening sections lacking active audio.
2. **Produce audio per exam** — generate/import audio for zhongkao, gaokao, CET4, TOEFL listening sets; keep scenario/accent/speed appropriate to each exam (zhongkao/gaokao school scenarios; CET campus/daily; TOEFL academic + 4 accents).
3. **Human QA** — review each asset before activation (`review:audio-assets`); reject transcript leakage or mismatched audio.
4. **Activate in owner-approved batches** — pair each active listening set with an active audio row; verify no orphaned audioless active listening set remains.
5. **Re-verify + update disclosure** — once an exam has audio, remove its "listening unavailable" disclosure; keep it for exams still lacking audio.

## Validation Commands (run each batch)

```powershell
npm run validate:audio-assets
npm run validate:audio-pipeline
npm run review:audio-assets
npm run smoke:active-serve
npm run validate:papers
```

## Definition of Done (first milestone)

- zhongkao / gaokao / CET4 / TOEFL each have ≥1 active listening set backed by active, human-reviewed, signed audio.
- `validate:papers` / `smoke:active-serve`: their mock listening sections build non-empty with signed `audioUrl` and no transcript leak.
- TOEFL accent coverage is only advertised after active TOEFL listening audio exists.
- `reports/audio-assets-validation.json` reflects the new active audio; disclosure copy updated for covered exams.
