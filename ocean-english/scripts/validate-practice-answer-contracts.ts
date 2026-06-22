/* ════════════════════════════════════════════════════════════════════════
   validate-practice-answer-contracts.ts — R3 (design-independent) answer/scoring contract validator.

   Locks the server-side scoring contract (lib/papers/scoring.ts `scoreItem`) that every active-capable
   input mode submits against, BEFORE the renderers are wired to it. Pure fixtures, no DB, no UI:
     · choice        — exact match → full/zero
     · spell         — case/whitespace-insensitive match (looseEq)
     · multi_blank   — per-position partial credit; exact / partial / empty-response / alternative-valid
     · matching      — per-position partial credit (one-to-one)
     · free_text/speak — needs_manual_or_ai_scoring (never fabricates correct/incorrect)
     · empty answerKey on multi_blank/matching → needs_manual_or_ai_scoring (not a false 0)

   This does NOT cover renderer visuals (gated on design notes) nor the client-payload no-leak
   architecture decision (see ledger R3-answerkey-leak). Exit 1 on any contract mismatch.
   Usage: npx tsx scripts/validate-practice-answer-contracts.ts
   ════════════════════════════════════════════════════════════════════════ */
import { scoreItem } from '@/lib/papers/scoring'
import type { PaperItem } from '@/lib/papers/paper-types'

const fails: string[] = []
function ok(cond: boolean, msg: string): void { if (!cond) fails.push(msg) }
type Choice = { id: string; text: string }
function mk(inputMode: string, answerKey: unknown, choices?: Choice[]): PaperItem {
  return { questionItemId: 'q', inputMode, answerKey, choices } as unknown as PaperItem
}

// choice
{
  const it = mk('choice', 'b', [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }])
  ok(scoreItem(it, 'b', 1).awarded === 1 && scoreItem(it, 'b', 1).correct === true, 'choice: exact correct → full')
  ok(scoreItem(it, 'a', 1).awarded === 0 && scoreItem(it, 'a', 1).correct === false, 'choice: wrong → 0')
  ok(scoreItem(it, '', 1).awarded === 0, 'choice: empty → 0')
}
// spell (case/whitespace-insensitive)
{
  const it = mk('spell', 'Abruptly')
  ok(scoreItem(it, '  abruptly ', 1).correct === true, 'spell: case/whitespace-insensitive match')
  ok(scoreItem(it, 'abrupt', 1).correct === false, 'spell: wrong → incorrect')
}
// multi_blank — partial credit + alternative-valid + empty + needs-scoring
{
  const it = mk('multi_blank', ['went', 'bluer', 'and'])
  ok(scoreItem(it, ['went', 'bluer', 'and'], 9).awarded === 9 && scoreItem(it, ['went', 'bluer', 'and'], 9).correct === true, 'multi_blank: all correct → full + correct')
  ok(Math.abs(scoreItem(it, ['went', 'WRONG', 'and'], 9).awarded - 6) < 1e-9 && scoreItem(it, ['went', 'WRONG', 'and'], 9).correct === false, 'multi_blank: 2/3 → partial, not correct')
  ok(scoreItem(it, ['  WENT ', 'bluer', 'AND'], 9).awarded === 9, 'multi_blank: alternative-valid (case/space) → full')
  ok(scoreItem(it, [], 9).awarded === 0, 'multi_blank: empty response → 0')
  ok(scoreItem(it, ['went'], 9).awarded > 0 && scoreItem(it, ['went'], 9).awarded < 9, 'multi_blank: short response → partial')
}
// multi_blank with {answer} key shape + empty key
{
  const itObj = mk('multi_blank', [{ answer: 'x' }, { answer: 'y' }])
  ok(scoreItem(itObj, ['x', 'y'], 2).awarded === 2, 'multi_blank: {answer}[] key shape supported')
  const itEmpty = mk('multi_blank', [])
  ok(scoreItem(itEmpty, ['x'], 2).kind === 'needs_manual_or_ai_scoring', 'multi_blank: empty answerKey → needs scoring (not false 0-correct)')
}
// matching — per-position partial (one-to-one)
{
  const it = mk('matching', [2, 0, 1])
  ok(scoreItem(it, [2, 0, 1], 6).awarded === 6 && scoreItem(it, [2, 0, 1], 6).kind === 'matching', 'matching: all correct → full')
  ok(Math.abs(scoreItem(it, [2, 9, 1], 6).awarded - 4) < 1e-9, 'matching: 2/3 → partial')
}
// free_text / speak — always needs manual/AI, never fabricated correctness
{
  for (const m of ['free_text', 'speak']) {
    const it = mk(m, null)
    const s = scoreItem(it, 'any user response', 5)
    ok(s.kind === 'needs_manual_or_ai_scoring' && s.needsScoring === true && s.awarded === 0 && (s as { correct?: boolean }).correct === undefined, `${m}: needs_manual_or_ai_scoring, no fabricated correctness`)
  }
}

if (fails.length) { console.error(`✗ validate-practice-answer-contracts FAILED (${fails.length}):`); for (const f of fails) console.error(`  ✗ ${f}`); process.exit(1) }
console.log('✓ validate-practice-answer-contracts PASSED — choice/spell/multi_blank/matching partial-credit + alternative-valid + free_text/speak no-fabrication contracts hold')
