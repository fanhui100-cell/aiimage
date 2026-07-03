/*
  validate-practice-answer-contracts.ts

  Pure contract checks for server-side scoring and structured practice payloads.
  This script intentionally avoids DB/UI dependencies.
*/
import { scoreItem } from '@/lib/papers/scoring'
import type { PaperItem } from '@/lib/papers/paper-types'
import { resolvePracticeAnswerMode } from '@/lib/practice/answer-mode'
import { reconstructBuildSentence } from '@/lib/practice/session-builder'

const fails: string[] = []
function ok(cond: boolean, msg: string): void {
  if (!cond) fails.push(msg)
}

type Choice = { id: string; text: string }
function mk(inputMode: string, answerKey: unknown, choices?: Choice[]): PaperItem {
  return { questionItemId: 'q', inputMode, answerKey, choices } as unknown as PaperItem
}

// choice
{
  const it = mk('choice', 'b', [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }])
  ok(scoreItem(it, 'b', 1).awarded === 1 && scoreItem(it, 'b', 1).correct === true, 'choice: exact correct => full')
  ok(scoreItem(it, 'a', 1).awarded === 0 && scoreItem(it, 'a', 1).correct === false, 'choice: wrong => 0')
  ok(scoreItem(it, '', 1).awarded === 0, 'choice: empty => 0')
}

// spell
{
  const it = mk('spell', 'Abruptly')
  ok(scoreItem(it, '  abruptly ', 1).correct === true, 'spell: case/whitespace-insensitive match')
  ok(scoreItem(it, 'abrupt', 1).correct === false, 'spell: wrong => incorrect')
}

// multi_blank
{
  const it = mk('multi_blank', ['went', 'bluer', 'and'])
  ok(scoreItem(it, ['went', 'bluer', 'and'], 9).awarded === 9 && scoreItem(it, ['went', 'bluer', 'and'], 9).correct === true, 'multi_blank: all correct => full')
  ok(Math.abs(scoreItem(it, ['went', 'WRONG', 'and'], 9).awarded - 6) < 1e-9 && scoreItem(it, ['went', 'WRONG', 'and'], 9).correct === false, 'multi_blank: partial credit')
  ok(scoreItem(it, ['  WENT ', 'bluer', 'AND'], 9).awarded === 9, 'multi_blank: case/space-normalized')
  ok(scoreItem(it, [], 9).awarded === 0, 'multi_blank: empty response => 0')
  ok(scoreItem(it, ['went'], 9).awarded > 0 && scoreItem(it, ['went'], 9).awarded < 9, 'multi_blank: short response => partial')
}

// multi_blank with {answer} key shape and empty key
{
  const itObj = mk('multi_blank', [{ answer: 'x' }, { answer: 'y' }])
  ok(scoreItem(itObj, ['x', 'y'], 2).awarded === 2, 'multi_blank: {answer}[] key shape supported')
  const itEmpty = mk('multi_blank', [])
  ok(scoreItem(itEmpty, ['x'], 2).kind === 'needs_manual_or_ai_scoring', 'multi_blank: empty answerKey => needs scoring')
}

// matching
{
  const it = mk('matching', [2, 0, 1])
  ok(scoreItem(it, [2, 0, 1], 6).awarded === 6 && scoreItem(it, [2, 0, 1], 6).kind === 'matching', 'matching: all correct => full')
  ok(Math.abs(scoreItem(it, [2, 9, 1], 6).awarded - 4) < 1e-9, 'matching: partial credit')
}

// listen
{
  const withKey = mk('listen', 'b', [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }])
  ok(scoreItem(withKey, 'b', 1).kind === 'objective' && scoreItem(withKey, 'b', 1).correct === true, 'listen+choices: objective correct')
  ok(scoreItem(withKey, 'a', 1).awarded === 0 && scoreItem(withKey, 'a', 1).correct === false, 'listen+choices: objective wrong')
  const bare = mk('listen', null)
  const s = scoreItem(bare, 'whatever', 3)
  ok(s.kind === 'needs_manual_or_ai_scoring' && s.needsScoring === true && s.awarded === 0, 'listen bare => needs scoring')
}

// free_text / speak
{
  for (const m of ['free_text', 'speak']) {
    const it = mk(m, null)
    const s = scoreItem(it, 'any user response', 5)
    ok(s.kind === 'needs_manual_or_ai_scoring' && s.needsScoring === true && s.awarded === 0 && (s as { correct?: boolean }).correct === undefined, `${m}: needs scoring, no fabricated correctness`)
  }
}

// build_sentence
{
  const body = reconstructBuildSentence(
    'Arrange all chunks into a natural sentence.',
    null,
    [
      { id: '0', text: 'The library' },
      { id: '1', text: 'opens' },
      { id: '2', text: 'early' },
    ],
    [0, 1, 2],
    'Reference order only; other grammatical orders may be acceptable after future scoring work.',
  )
  ok(!!body, 'build_sentence: valid chunk permutation reconstructs into build body')
  ok(body?.buildBody.tokens.length === 3, 'build_sentence: body carries all draggable chunks')
  ok(body?.review.build?.canonical.join(' ') === 'The library opens early', 'build_sentence: review carries canonical/reference order')
  ok(reconstructBuildSentence(
    'Arrange all chunks.',
    null,
    [
      { id: '0', text: 'The library' },
      { id: '1', text: 'opens' },
      { id: '2', text: 'early' },
    ],
    [0, 1, 1],
    '',
  ) === null, 'build_sentence: non-permutation answer is rejected')
}

// answer-mode routing
{
  ok(resolvePracticeAnswerMode({ type: 'interview_speaking', inputMode: 'speak' }) === 'free_text', 'answer mode: speak routes to free_text transcript/scoring UI')
  ok(resolvePracticeAnswerMode({ type: 'build_a_sentence', inputMode: 'multi_blank' }) === 'build_sentence', 'answer mode: build_a_sentence routes to build_sentence UI even if stored as multi_blank')
  ok(resolvePracticeAnswerMode({ type: 'listen_to_meaning', inputMode: 'listen', choices: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }] }) === 'choice', 'answer mode: listen with choices routes to choice')
  ok(resolvePracticeAnswerMode({ type: 'dictation_spell', inputMode: 'listen' }) === 'spell', 'answer mode: bare listen routes to spell')
}

if (fails.length) {
  console.error(`validate-practice-answer-contracts FAILED (${fails.length}):`)
  for (const f of fails) console.error(`  - ${f}`)
  process.exit(1)
}

console.log('validate-practice-answer-contracts PASSED')
