# Project Cleanup - 2026-07-02

## Scope

This cleanup was intentionally conservative. It removed only files that are safe to regenerate or were one-off inspection artifacts from the TOEFL listening review.

No source logic, question-bank source JSON, Supabase SQL, UI code, or runtime data contract was deleted.

## Removed

Ignored/generated local files:

- `.next/`
- `test-results/`
- `hyperframes/`
- `stitch-export/`
- `scripts/.vocab-cache/`
- `.devserver.log`
- `tmp-phase0b-dev.err.log`
- `tmp-phase0b-dev.log`
- `tsconfig.tsbuildinfo`
- `.vocab-cache-nuance.log`
- `scripts/*.log` historical generation / QA logs

One-off inspection artifact:

- `reports/toefl-listening-content-dump-2026-07-02.json`

The final human-readable audit remains:

- `reports/toefl-listening-content-audit-2026-07-02.md`

Obsolete prototype residue:

- `public/lexivault.html`
- `scripts/shoot-lexivault.mjs`

These were an old static LexiVault preview and a screenshot helper for that preview. They were tracked, but no app route, component, package script, or current report referenced them. The static HTML also contained real mojibake and was much larger than any active public entrypoint.

## Ignored Going Forward

Added `.gitignore` entries for local design/prototype exports:

- `/stitch-export/`
- `/hyperframes/`

These folders were local exports/prototypes, not runtime source, and can be regenerated from their source workflows if needed.

Also added an explicit ignore for:

- `scripts/.vocab-cache/`

## Encoding / Mojibake Notes

Several command-line outputs show mojibake when PowerShell renders UTF-8 Chinese comments. A repository search did not confirm a broad source-code corruption pattern. Therefore this cleanup did not rewrite large comment blocks across the codebase. Rewriting comments globally would create high-risk churn with no runtime benefit.

Future safe follow-up:

1. Pick one file at a time.
2. Confirm the file truly contains mojibake bytes rather than terminal display artifacts.
3. Replace only comments, never executable logic.
4. Run `npm run lint` and `npx tsc --noEmit`.

## Verification

Run after cleanup:

- `npm run validate:practice-session`
- `npm run validate:toefl-task-alignment`
- `npm run validate:audio-assets`
- `npm run validate:qbank-v2`
- `npm run lint`
- `npx tsc --noEmit`

All should remain green before this cleanup is considered complete.
