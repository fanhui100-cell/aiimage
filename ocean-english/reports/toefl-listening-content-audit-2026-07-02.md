# TOEFL Listening Content Audit - 2026-07-02

## Scope

Audited the 20 TOEFL listening pilot sets in stage:

- `toefl-listening-pilot-2026-07-01`

This audit checks text-level alignment between:

- `stimuli.text_en` transcript
- item prompt
- answer key
- four answer choices

The user separately confirmed the generated audio was listenable. This audit does not claim human phonetic/prosody scoring; it confirms the spoken transcript content supports the keyed answers.

## Result

All 20 sets passed text/content alignment review.

| Task type | Sets | Items | Pass | Review | Reject |
|---|---:|---:|---:|---:|---:|
| `choose_a_response` | 10 | 10 | 10 | 0 | 0 |
| `listening_comprehension` | 10 | 30 | 30 | 0 | 0 |
| Total | 20 | 40 | 40 | 0 | 0 |

## Checks Performed

- Every item is answerable from the transcript alone.
- The keyed answer is explicitly supported by stated facts, speaker intent, or direct implication.
- Distractors are plausible but contradicted, unsupported, irrelevant, or pragmatically inappropriate.
- No item requires outside knowledge.
- No answer key depends on hidden visual context.
- No obvious double-answer item was found.
- TOEFL task style is represented without copying real ETS content.

## Notes By Type

### `choose_a_response`

The 10 short campus prompts all ask for the most appropriate response. The keyed answers match the speaker's request or situation:

- meal-plan schedule change -> ask about switching plans
- microscope reservation conflict -> help move reservation
- piano dynamics feedback -> softer touch
- course permission -> email instructor
- research group invitation -> ask meeting location
- essay evidence feedback -> add later-chapter evidence
- library fine -> check return-box records
- kitchen closure -> remove food before deadline
- shuttle route change -> transfer at science complex
- presentation visual feedback -> create a new chart

No double-answer issue was found.

### `listening_comprehension`

The 10 longer listening sets cover biology, campus announcement, psychology, geology, environmental science, art history, bookstore service, sociology discussion, technology support, and financial aid. Each set has three questions, and the keyed answers are grounded in the transcript:

- main idea/detail/inference mix is present
- detail questions are directly stated
- inference/purpose questions are supported by clear local context
- distractors are not also defensible from the transcript

No answer-key mismatch was found.

## Remaining Gate

The content is suitable to proceed to audio activation and promotion, provided the audio assets are marked active only for this stage and validation remains green.

Do not reuse this audit to approve other pending `machine_checked` audio assets outside this TOEFL listening pilot stage.
