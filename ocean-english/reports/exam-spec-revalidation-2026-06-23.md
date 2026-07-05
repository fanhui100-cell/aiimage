# Exam Spec Revalidation — R4 (2026-06-23)

Research/specification phase. **No content writes, no DB writes, no schema/template changes.** Purpose: revalidate the canonical seven-level format and resolve (or keep blocked) the TOEFL blocked task types using only official examination-authority sources.

## Source policy

Only official authority sources establish hard schema constraints. Third-party prep sites do not.

| Exam | Level | Official sources (in `EXAM_SPECS.sourceUrls`) |
|---|---:|---|
| zhongkao | 1 | MOE 课标 PDF; Beijing/Shanghai 考试院 |
| gaokao | 2 | NEEA 考试大纲 / 课标 PDF; MOE |
| cet4 | 3 | NEEA CET 官方 |
| cet6 | 4 | NEEA CET 官方 |
| kaoyan | 5 | 研招网（chsi）英语一/二大纲 |
| toefl | 6 | ETS *Test Content and Structure*; **ETS *TOEFL iBT Test Blueprint and Specifications (2026 Update)* PDF** |
| sat | 7 | College Board *Digital SAT* structure / RW / sample questions PDF |

Primary TOEFL evidence: ETS official Blueprint/Specifications, captured locally at `.firecrawl/toefl-spec-2026.md` (accessed 2026-06-22/23). The Jan-2026 sample-test page is behind an email form wall and is **not** used as a spec source. ETS notes the document may receive minor revisions before launch.

## TOEFL iBT 2026 — confirmed / ranged / unverified

### CONFIRMED (official, fixed)
- Scoring **method** (from the Blueprint): machine-scored = selected-response (exact match / predefined logic); AI-scored = constructed (writing/speaking) via NLP+ML.
- ⚠️ Score **scale** correction: the **1–6 per-section scale** (with the 2-year transition mapping to 0–120) is **NOT stated in this Blueprint capture** — the capture reports only **Raw Points (145 total)** + **CEFR (A1–C2)** and explicitly defers score reporting to *"Section III: Scoring and Score Reporting of the Technical Manual"*, which is **not** in the capture. The 1–6 scale is carried in `EXAM_SPECS` from the ETS *Test Content and Structure* page (a separate official source in the table above), not established by this Blueprint capture. Do not cite the Blueprint for the score scale.
- Section item totals: **Reading 50**, **Listening 47**, **Writing 12**, **Speaking 11** — these match `EXAM_SPECS` exactly (no change needed).
- Reading & Listening are **two-stage adaptive**; Writing & Speaking are **linear**.
- **Listening recordings are played once** (no replay). *(Blueprint "Stimulus": "Recordings are played once …")* — gates R7 (replay rule).
- Listening response: printed stems + multiple-choice; items individually or in sets by length/complexity; **max 1 pt/item**.
- Listening audio: **AI-generated + sometimes human voice actors**; balanced **US/Canadian, Australian, British** accents and gendered voices — gates R6 (provider/accents).
- `read_daily_life`: official **2-item and 3-item sets** (2–3 items per material) confirmed.
- `complete_the_words`: 30 items/test; machine-scored; no rubric; B1–C1+.
- `email_writing` / `academic_discussion`: 1 item/test each; AI/rubric scored, **max 5 pts**; CEFR B1–C2 — already live (toefl/writing rubric exists, validate:rubrics 0).

### RANGED (official gives a range — encode the range, never an invented fixed value)
- Listening sub-type item counts: **Listen and Choose a Response 15–19** (A1–B2), **Listen to a Conversation 10** (A2–C1), **Listen to an Announcement 6–10** (A2–C1), **Listen to an Academic Talk 8–16** (A2–C2).
- Speaking: **Listen and Repeat 7**, **Take an Interview 4** (both A1–C2).
- Audio length: brief utterances (≤6 stressed syllables) → extended monologic **≤250 words**; intermediate **35–100 words**.
- `academic_reading` / general reading: the Blueprint gives a **per-task-type range of 5–15 items** (Read in Daily Life 5–15; Read an Academic Passage 5–15) — this is per task type, **not** "per claim". The top-level reading claim ("Read and comprehend information presented in a variety of formats") is a **fixed total of 20 items** spanning both task types; there is still **no per-passage fixed count**.

### UNVERIFIED — keep `official_spec_unverified=true`, content stays BLOCKED, exact missing fact recorded
- **MCQ option count** (read_daily_life, academic_reading, and listening MCQ): the Blueprint only says "selected-response formats (e.g., multiple choice)" — it **never states a fixed number of options**. Missing fact: *options per MCQ item*.
- **academic_reading items-per-passage**: only the per-task-type range (5–15) is given; **per-passage item count is not specified**. Missing fact: *items per academic passage*.
- `build_a_sentence` **acceptable-arrangement scoring rule**: official is machine-scored, but ETS does not publish the equivalence/normalization logic for accepted permutations. Stays `scoring_not_ready` (resolution is R3, not a spec unblock).

### Decision (per plan §R4 rules)
- **`read_daily_life` and `academic_reading` (reading_comprehension·toefl) remain BLOCKED.** Not unblocked by assumption — the option count and per-passage count are still officially unspecified. R1 coverage matrix already shows both as `BLOCKED(official_spec_unverified)`. Re-enable only after ETS publishes those numbers.
- **No EXAM_SPECS / template / DB change is warranted.** Current `EXAM_SPECS` TOEFL totals already match official; the richer listening/speaking sub-type ranges + replay=once + audio lengths are recorded here for R6/R7 to encode when those templates are created (no listening/speaking template exists yet to change).

## Other six levels (zhongkao / gaokao / cet4 / cet6 / kaoyan / sat)

Already encoded in `EXAM_SPECS` with official authority sources and pass `validate:exam-specs` (7 exams, errors 0) and `validate:question-types` (errors 0). No official evidence in this pass requires a constraint change. SAT Reading & Writing remains modeled per College Board domains (Information and Ideas, Craft and Structure, Expression of Ideas, Standard English Conventions) — consistent with R1's per-domain matrix. No change made.

## Outcome
- Confirmed / ranged / unverified constraints listed separately (above).
- No blocked TOEFL type unblocked by assumption; both reading MCQ types stay blocked with the exact missing fact documented.
- No DB writes; no spec/template changes.
- Audio/speaking official specs (replay=once, sub-type item ranges, audio lengths, accents) documented to unblock R6/R7 design once authorized.
