# Vocabulary Target Lists — Storage Convention

> Status: convention only (Phase 2). **No target word lists are imported yet.**
> This directory defines *how* canonical / curated target lists will be stored
> when (a later phase) we backfill `dictionary_words.levels` to close coverage
> gaps. The Phase 2 audit (`scripts/audit-vocabulary-levels.ts`) only measures
> the current gaps; it does not import anything.

## Why this exists

Training must use `dictionary_words.levels` (syllabus coverage, an `INT[]`), not
only `primary_level` (the lowest single level a word is assigned to). To backfill
`levels` safely and legally, each future import needs a traceable source.

## One file per source list

Each source list is one file in this directory:

```
data/vocabulary-targets/<exam_id>-<short-source-slug>.<json|csv|txt>
```

Examples (illustrative, **not yet present**):
`cet6-syllabus.json`, `gaokao-curriculum-2020.json`, `sat-rw-high-utility-curated.json`.

## Required front-matter / metadata per source

Every source file must declare, in a header block (for `.json` a top-level
`meta` object; for `.csv`/`.txt` a leading comment block):

| field | meaning |
|---|---|
| `source_name` | human-readable name of the list |
| `source_url` | official or licensed origin URL |
| `license_note` | license / usage basis (e.g. "official syllabus, structure only", "curated, original selection", "internal") |
| `exam_id` | one of `zhongkao` / `gaokao` / `cet4` / `cet6` / `kaoyan` / `toefl` / `sat` |
| `level` | numeric level 1-7 matching `exam_id` |
| `kind` | `official` \| `curated` \| `internal` |

The word payload itself is a list of normalized words (lemmas), optionally with
part-of-speech / sense hints.

## Per-exam rules

| exam_id | level | list kind | rule |
|---|---|---|---|
| zhongkao | 1 | official | May use a canonical syllabus list (义务教育课标 2022). |
| gaokao | 2 | official | May use a canonical syllabus list (高中课标 2017/2020). |
| cet4 | 3 | official | May use a canonical CET-4 syllabus list. |
| cet6 | 4 | official | May use a canonical CET-6 syllabus list (priority: close the direct-coverage gap). |
| kaoyan | 5 | official | May use a canonical 考研大纲 list; backfill `levels` (includes 5), do **not** rely on `primary_level=5`. |
| toefl | 6 | curated | **No claimed official complete vocabulary.** Use a curated academic / task-relevant high-utility set with explicit `license_note`. |
| sat | 7 | curated | **No claimed official complete vocabulary.** Use a curated high-utility Reading & Writing set (Words-in-Context oriented), not a giant rare-word list. |

## Hard rules

- Do **not** claim TOEFL/SAT have a fixed official complete word list.
- Do **not** import or overwrite existing `dictionary_*` content from these
  files in Phase 2. Backfill happens in a later, explicitly-scoped phase, and
  must only **add** `levels`/tags, never overwrite definitions, examples,
  mnemonics, synonyms, antonyms, etymology, or collocations.
- Every source must carry a real `license_note`. No license → not imported.
