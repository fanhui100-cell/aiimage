# Ocean English Deep Audit: QBank / Vocab / Today / Drill / Lexiverse / Learning Loop

Date: 2026-06-30  
Workspace: `D:\ai-studio\ocean-english`  
Scope: 题库、词库、Today、Review、Drill、Quiz/Practice、Lexiverse、Lexigraph、Mock/Paper、学习闭环。  
Mode: 只审查；未修改运行代码。  
Note: 本轮是代码 + DB + smoke 脚本深审，不是 Figma/截图视觉审查。

## 1. Executive Summary

整体状态：主产品链路已经能跑起来，v2 active 题库、模考服务端判分、active 听力音频、数据质量门禁、基础路由都基本可用。但仍有几处“页面能点、实际练不到/统计不准”的隐蔽问题，尤其集中在：

1. **Today / Review 的弱项卡片把 `skillKey` 当 `taskType` 跳 `/quiz`，实际空池。**
2. **Lexiverse 第 8 档聚焦和 galaxy-words 取词口径不一致，IELTS 星系可能找不到 `levels` 含 8 的词。**
3. **单词宇宙 v2 题型全部 draft，当前单词专练仍依赖 legacy/v1；v2 重建还没有真正接管背单词主卖点。**
4. **八档统一仍有旧逻辑残留：Onboarding 写旧 `band=level+1`，Today 自动升档可 7→8，`/quiz` 仍拒 level 8。**
5. **`qa:qsets-v2` 仍失败 2873 项，当前 QA 发布门不可用，需要更新 promote 后的规则。**
6. **learning-loop e2e 仍有低样本 confidence 合约失败。**
7. **普通 Practice session 会把答案/review key 下发给客户端；学习模式可以接受，但不能当防作弊考试模式。**

## 2. Verification Matrix

### 2.1 Passed

| Command | Result |
|---|---|
| `npm run validate:exam-specs` | pass；8 specs，IELTS coming_soon |
| `npx tsc --noEmit` | pass（上一轮已跑；本轮未发现 TS 层新增阻断） |
| `npm run validate:qbank-v2` | pass；active sets 1993，active items 3173，errors 0 |
| `npm run validate:data-quality` | pass；definition_en CJK 0/56602，坏词 0，关系死链 0，collocations 31069 |
| `npm run validate:learning-loop` | pass；纯函数级计划卡和分类器 0 错 |
| `npm run validate:practice-session` | pass；word source=v1，task reading source=v2，deprecated 空池 |
| `npm run validate:papers` | pass；真实 v2 组卷、确定性、池不足校验 0 错；耗时约 247s |
| `npm run validate:audio-assets` | pass；listening sets 624，active 224，audio rows 244 |
| `npm run audit:qbank-v2-coverage` | pass；MISSING 6，THIN 0，READY_ACTIVE 38，BLOCKED 5 |
| `npm run smoke:full-routes` | pass；页面/API route 文件齐全，active 退役题型 0 |
| `npm run smoke:active-serve` | pass；active reading 带 passage，active listening 带 signed audioUrl，无 transcript |
| `npm run smoke:paper-e2e` | pass；全卷判分/提交/重复提交/未登录/缺卷行为正确 |

### 2.2 Failed / Not Reliable

| Command | Result | Meaning |
|---|---|---|
| `npm run qa:qsets-v2` | fail，2873 errors | QA 规则仍按旧政策：gen active 一律错误；para_match 重复答案一律错误。当前不能作为可靠发布门。 |
| `npm run smoke:learning-loop-e2e` | fail 1 item | 低样本 `confidence=insufficient / isEstimate` 合约未满足。 |
| `npm run lint` | fail 29 problems | 主要来自 `stitch-export/` 未跟踪导出目录和 2 个 `.cjs` 工具脚本。运行时代码未必有问题，但 CI 门不干净。 |

## 3. Database Snapshot

Live Supabase snapshot:

| Table / Metric | Count |
|---|---:|
| `dictionary_words` | 28602 |
| `question_sets` | 5623 |
| `question_items` | 6803 |
| `question_target_words` | 2600 |
| `stimuli` | 2593 |
| `audio_assets` | 244 |
| `exam_specs` DB rows | 7 |
| active deprecated `antonym_choice/cet_cloze` | 0 |
| generated active sets (`legacy_id like gen:%`) | 1859 |
| dictionary `levels` contains 8 | 6759 |
| dictionary `primary_level = 8` | 0 |

DB `exam_specs` rows:

```json
[
  {"id":"zhongkao","status":"active","level":1},
  {"id":"gaokao","status":"active","level":2},
  {"id":"cet4","status":"active","level":3},
  {"id":"cet6","status":"active","level":4},
  {"id":"kaoyan","status":"active","level":5},
  {"id":"toefl","status":"draft","level":6},
  {"id":"sat","status":"draft","level":7}
]
```

TS specs 已有 IELTS level 8 coming_soon，但 DB specs 尚未 seed IELTS。

## 4. P1 Findings

### P1-1 Today / Review weak-skill practice is wired to the wrong identifier

**Evidence**

`lib/daily-plan/daily-plan-engine.ts` produces cards with `payload: { examId, skillKey }`. These `skillKey` values are diagnostic/subskill keys, for example `inference`, `listening_inference`, `detail`.

`components/screens/TodayBento.tsx:185-190`:

```ts
const skillKey = typeof p.skillKey === 'string' ? p.skillKey : ''
if (examId && skillKey) {
  router.push(`/quiz?mode=task&examId=${examId}&taskType=${skillKey}`)
  return
}
```

`components/screens/ReviewHub.tsx:111`:

```ts
<V2WeakSkills d={v2} onPractice={(s) =>
  router.push(`/quiz?mode=task&examId=${s.examId}&taskType=${s.skillKey}`)
} />
```

Actual builder check:

| Case | Result |
|---|---|
| `taskType=inference` | `source=empty`, `items=0`, `warnings=no_v1_pool_for_task` |
| `taskType=listening_inference` | `source=empty`, `items=0`, `warnings=no_v1_pool_for_task` |
| `taskType=reading_comprehension` | `source=v2`, `items=2` |
| `taskType=listening_comprehension` | `source=v2`, `items=2` |

**Impact**

Today 的“考试专项/薄弱技能”卡和 Review 的“弱项练习”按钮能跳转，但会进入空题池。学习闭环的“诊断 → 专练”断开。

**Fix direction**

Add a canonical mapper:

```ts
skillKeyToPracticeTarget(skillKey, examId) => {
  taskType: 'reading_comprehension' | 'listening_comprehension' | ...
  subskill?: skillKey
}
```

Use `taskType` for `/quiz`, keep `skillKey` as optional subskill metadata/filter, not as `taskType`.

---

### P1-2 Lexiverse level galaxy focus still mismatches dictionary membership

**Evidence**

`components/lexiverse/ReferenceLexiverseFrame.tsx:203-212` focuses a word by `levels`:

```ts
const levels = dw?.levels?.length ? dw.levels : (dw?.primaryLevel ? [dw.primaryLevel] : undefined)
enter(galaxyForWord(undefined, levels))
```

But `app/api/lexiverse/galaxy-words/route.ts:70-80` fetches ring galaxy words by `primary_level`:

```ts
if (f.ringLevels?.length) countQuery = countQuery.in('primary_level', f.ringLevels)
...
if (f.ringLevels?.length) dataQuery = dataQuery.in('primary_level', f.ringLevels)
```

DB snapshot:

- IELTS membership: `levels contains 8 = 6759`
- IELTS primary: `primary_level = 8 = 0`
- Sample `levels` includes 8 but primary lower: `anticipate`, `demonstrate`, `appreciate`, `explore`, `assess`

**Impact**

点一个 IELTS 成员词时，Frame 可能根据 `levels` 进入 IELTS 星系；但该星系的 word pool 用 `primary_level=8`，实际 0 词。于是会复发“飞到对应星系，但目标词不在星系里 / 点词没反应”的同类问题。

**Fix direction**

For level ring galaxies, decide one口径:

- If ring means “大纲成员”: use `levels contains N`.
- If ring means “原生档”: focus logic must use `primaryLevel`, not `levels`.

Given DictionaryVault already uses “按等级 = 大纲全量”, recommend Lexiverse level galaxies also use `levels contains N`, with optional visual distinction for primary vs inherited words.

---

### P1-3 Word Universe v2题库没有真正接管单词专练

**Evidence**

v2 word-universe task status:

| Type | Total | Active | Draft |
|---|---:|---:|---:|
| `en_to_zh` | 200 | 0 | 200 |
| `zh_to_en` | 200 | 0 | 200 |
| `def_to_word` | 200 | 0 | 200 |
| `cloze_choice` | 200 | 0 | 200 |
| `cloze_spell` | 200 | 0 | 200 |
| `zh_to_word_spell` | 200 | 0 | 200 |
| `word_form` | 200 | 0 | 200 |
| `listen_to_meaning` | 200 | 0 | 200 |
| `dictation_spell` | 200 | 0 | 200 |
| `synonym_choice` | 200 | 0 | 200 |
| `synonym_substitute` | 200 | 0 | 200 |
| `collocation_choice` | 200 | 0 | 200 |
| `confusable_choice` | 200 | 0 | 200 |

`validate:practice-session` also shows:

```text
word("optical"): source=v1 items=6
```

`components/screens/drill/DrillScreen.tsx` confirms:

- 考试专项 → `/quiz` + PracticeRunner
- 单词宇宙练习 → `BRun` + `buildSession()` from `drill-questions`

**Impact**

用户的主卖点“单词宇宙背单词”仍主要靠 legacy/v1 题库；v2 的单词宇宙 2600 个 item 已迁移但未 active。  
这不是立即崩溃，但“题库重建已完成并接入主学习入口”这个说法不成立。

**Fix direction**

Either:

1. Keep word-universe legacy as official path, document it, and stop treating v2 word-universe draft as serving pool; or
2. Build a controlled promotion + renderer validation path for the 13 word-universe v2 types, then migrate Drill Word Universe picker/BRun to PracticeRunner.

---

### P1-4 v2 word mode can return false empty because it samples sets before target-word filtering

**Evidence**

`lib/practice/session-builder.ts:366-390` first fetches active sets/items:

```ts
setsQ.eq('status', 'active').limit(200)
...
question_items.in('question_set_id', setIds).limit(count * 4)
```

Then `lib/practice/session-builder.ts:393-403` filters those sampled items by `question_target_words`.

**Impact**

For a given word, v2 may have a valid active target item outside the first sampled set window, but the builder returns empty or falls back to v1. This affects:

- Lexiverse word detail CTA: “练这个词”
- word-specific practice sessions
- future v2 word-universe activation

**Fix direction**

Word mode should query target words first:

1. `question_target_words` by `word_id` or normalized surface
2. active `question_items`
3. active `question_sets`
4. then apply task/exam/level/count sampling

---

### P1-5 Eight-band unification still has old write/read paths

#### A. Onboarding writes old band offset

`components/screens/OnboardingScreen.tsx:178-181`:

```ts
const band = levelToBand(s.level)
setProfile({ ..., level: s.level, band, ... })
```

`lib/levels.ts:79`:

```ts
export function levelToBand(level: number): number {
  return Math.min(level + 1, 8)
}
```

`store/lexiStore.ts:763-766` only fixes `band=level` when caller does **not** pass band. Onboarding explicitly passes old band, so the guard does not help.

#### B. Today can auto-upgrade SAT to IELTS

`store/lexiStore.ts:526-535` returns ready when `lv < MAX_LEVEL`.  
`components/screens/TodayScreen.tsx:273-280` uses `next = level + 1`.

With MAX_LEVEL=8, level 7 SAT users can be prompted into level 8 IELTS, even though IELTS is a separate coming-soon exam catalog, not “harder SAT”.

#### C. `/quiz` rejects level 8

`app/quiz/page.tsx:44`:

```ts
const level = levelParam && /^[1-7]$/.test(levelParam) ? Number(levelParam) : undefined
```

**Impact**

Level 8 is partially visible but not consistently usable. User can be moved into IELTS by Today, but `/quiz` drops `level=8`.

**Fix direction**

- Onboarding: do not pass band, or pass `band: level`.
- Today: disable auto 7→8; IELTS must be chosen explicitly.
- `/quiz`: accept `[1-8]`, and let spec status/coverage decide empty state.

---

### P1-6 QA gate is red and policy-inconsistent

`npm run qa:qsets-v2`:

```text
qa-qsets-v2: applied · 模板 30 · 错误 2873
```

Major error categories:

- `gen set ... 不应为 active（须 QA+批准）`
- `para_match item ... 答案重复`

**Analysis**

This is not necessarily 2873 bad questions. It means the QA script is outdated relative to current production:

- There are 1859 generated active sets after promotion.
- `para_match` renderer explicitly supports many-to-one paragraph mapping, but QA treats duplicate answers as invalid.

**Impact**

Release gate is unusable: teams will either ignore it or over-fix legitimate content.

**Fix direction**

Revise QA:

- Generated active is allowed only if it has promotion/audit metadata.
- Para-match duplicate answers are allowed/blocked by template flag, not globally.
- Split output into `blocking`, `needs_review`, and `policy_mismatch`.

---

### P1-7 Learning loop e2e confidence contract fails

`npm run smoke:learning-loop-e2e` fails:

```text
✗ 样本少 → confidence=insufficient（isEstimate 应为真，UI 不展示精确分）
```

Other assertions pass:

- active reading/listening fetched
- wrong reading → `inference`
- wrong listening → `listening_inference`
- `skill_states` materialized
- daily-plan produces cards
- unauth attempt does not write

**Impact**

The learning loop exists, but low-sample confidence handling is not proven. UI may display precise-looking mastery too early.

**Fix direction**

Fix `confidenceFor`/materialization/UI contract and rerun `smoke:learning-loop-e2e` to 0 failures.

## 5. P2 Findings

### P2-1 Practice session sends answers/review keys to client

Evidence:

- `lib/practice/session-builder.ts:455-472` includes `answer`, `explanationZh`, and grouped `review`.
- `components/practice/PracticeRunner.tsx:248` checks choice correctness locally:

```ts
const correct = optId === item.answer
```

- `PracticeRunner.tsx:317-318` only moves already-downloaded `item.review` into visible state after submission.

**Impact**

This is acceptable for learning drills, but not for anti-cheat or leaderboard contexts. Mock paper API has a stronger answer-stripping model; practice API does not.

**Fix direction**

Keep as learning mode, or introduce server-graded practice mode for challenge/leaderboard/timed exam.

---

### P2-2 Spec status behavior differs across surfaces

Observed:

- Drill UI disables draft/coming_soon tasks.
- Paper generator blocks `coming_soon`.
- Practice session mostly uses actual active pool, not exam spec status.

**Impact**

Same exam/section may appear as “建设中” in one surface, empty in another, or active in a third depending only on pool existence.

**Fix direction**

Define status rules once:

- `active`: public practice/paper allowed.
- `draft`: internal preview only.
- `coming_soon`: public surfaces show building state, no fallback.

---

### P2-3 DB `exam_specs` schema cannot represent `coming_soon`

`supabase/sql/p4-question-bank-v2.sql` still has:

```sql
status in ('draft','active','deprecated')
```

TS has `coming_soon`, DB has no IELTS row.

**Impact**

If seed tries to write IELTS coming_soon to DB, it cannot use the same enum. Tooling must choose between TS-only coming_soon and DB draft.

**Fix direction**

Add DB migration for `coming_soon` status and seed IELTS, or explicitly keep coming_soon TS-only and avoid reading it from DB.

---

### P2-4 Lint gate is polluted by non-runtime export and CJS utility scripts

`npm run lint` fails:

- `scripts/backfill-active-stimuli.cjs`
- `scripts/backfill-exam-id-v2.cjs`
- `stitch-export/frontend-pages-source-2026-06-26/...`

**Impact**

CI cannot trust lint as a clean gate. Most errors are not from runtime app paths, but the command still fails.

**Fix direction**

- Add `stitch-export/` to eslint ignore or move it outside repo.
- Add `.cjs` override or convert those scripts to ESM.

---

### P2-5 Legacy quiz still maps IELTS/GRE incorrectly

`components/quiz/LexiverseQuizClient.tsx` still contains:

```ts
IELTS: 6, SAT: 7, GRE: 7
```

`searchParams.get('exam') ?? 'IELTS'` also keeps IELTS as legacy default.

**Impact**

Main `/quiz` path uses PracticeRunner, but legacy fallback still exists for special flows (`vs`, yesterday, wrong-answer-booster). These flows can silently treat IELTS as TOEFL-like level 6.

**Fix direction**

Either update legacy to eight-band semantics or block IELTS/GRE in legacy flows with explicit empty state.

---

### P2-6 Scripts still hardcode 1-7

Examples:

- `scripts/stats-all.ts`: regex `lv([1-7])`, `lv <= 7`
- `scripts/qa-passages.ts`: loops `lv <= 7`
- `scripts/migrate-question-bank-v1-to-v2.ts`: v1 legacy migration still has `lv([1-7])`

**Impact**

Future audit/stats/migration tasks can omit IELTS level 8.

**Fix direction**

Use `MAX_LEVEL` / `LEVELS` from `lib/levels.ts`.

---

### P2-7 Report fallback still counts old band offset

`lib/analytics/report.ts:138-141`:

```ts
const mastered = words.filter(w =>
  w.state === 'mastered' && ((w.levels?.includes(n)) || w.band === n + 1)
).length
```

**Impact**

The comment says band offset is only old-data fallback. That is acceptable during migration, but if new onboarding still writes `band=level+1`, the fallback will keep masking bad writes.

**Fix direction**

Fix onboarding first, then add a deprecation guard/test that no new profile writes offset band.

## 6. Coverage / Content Status

### 6.1 Canonical qbank coverage

`audit:qbank-v2-coverage`:

- EXPECTED rows: 49
- READY_ACTIVE: 38
- MISSING: 6
- BLOCKED: 5
- THIN: 0

MISSING:

1. TOEFL `choose_a_response`
2. TOEFL `listening_comprehension`
3. IELTS `listening_comprehension`
4. IELTS `reading_comprehension`
5. IELTS `essay_writing`
6. IELTS `interview_speaking`

BLOCKED:

1. TOEFL `read_daily_life`: official_spec_unverified
2. TOEFL `reading_comprehension`: official_spec_unverified
3. TOEFL `build_a_sentence`: scoring_not_ready
4. TOEFL `listen_and_repeat`: audio_missing
5. TOEFL `interview_speaking`: audio_missing

### 6.2 Word-universe coverage

All 13 v2 word-universe types have 200 draft / 0 active.

This means:

- The regular “word practice” path is still v1/legacy-backed.
- v2 word target words exist but are not serving active practice.
- If the product promise is “new qbank powers all practice,” this is not yet true for the core memorization loop.

### 6.3 Answer correctness

Structural checks:

- active deprecated types: 0
- item status mismatch: 0
- bad choice answer: 0
- bad spell answer: 0
- papers scoring e2e: pass
- active listening audio: pass

Remaining risk:

- semantic answer correctness is not fully proven by these scripts.
- `qa:qsets-v2` red state prevents a clean global semantic/shape gate.
- duplicate prompt counts in listening are not automatically wrong because many listening items can share stems like “What is the main idea?”, but content-level sampling should continue.

## 7. Surface-by-Surface Flow Audit

### Today

Healthy:

- route exists
- daily plan API exists
- data quality and learning-loop pure validators pass

Broken:

- v2 exam_task cards pass `skillKey` as `taskType`; actual builder returns empty for `inference` and `listening_inference`.
- level-up can push SAT users to IELTS.

### Review

Healthy:

- ReviewHub exists
- diagnostics API exists

Broken:

- V2WeakSkills practice button uses `skillKey` as `taskType`.
- learning-loop e2e confidence contract fails.

### Drill / 专练

Healthy:

- ExamTaskPicker to `/quiz?mode=task&examId&taskType&level` works for canonical taskType.
- `reading_comprehension` and `listening_comprehension` active sessions can serve v2.

Incomplete:

- Word Universe picker still uses legacy BRun/buildSession, not PracticeRunner/v2.
- `/quiz` strips level 8.

### Quiz / Practice

Healthy:

- task mode can serve v2 reading/listening.
- attempts route writes learning-loop data.

Risks:

- answers/review keys front-loaded for learning mode.
- word mode target query can false-empty.
- taskType/subskill confusion from Today/Review.

### Lexiverse / Universe

Healthy:

- route exists
- focusWord/dictionary word fetch path exists
- all-words endpoint returns full corpus, no 500-row cap

Broken/Risky:

- focus chooses galaxy using `levels`; galaxy API ring pool uses `primary_level`; IELTS level 8 has 6759 members but 0 primary words.
- This can make a word’s target galaxy not contain that word.

### Lexigraph

No fresh blocker found in this pass. Prior relation/data quality gates pass for dead synonym/antonym links. Semantic relation quality still depends on earlier audits.

### Mock / Paper

Healthy:

- server-authoritative paper submit passes e2e.
- answers are stripped from client paper.
- duplicate submit and unauth behavior correct.

Risk:

- `validate:papers` is slow; CI timeout should be high enough.

### Dictionary / Vocabulary Library

Healthy:

- bad words 0
- definition_en CJK 0
- level browse uses `syllabus=level` and `levels contains N`
- exact count no longer stuck at 500

Risks:

- report and some legacy scripts still use old band fallback / 1-7 assumptions.
- `primary_level=8` is 0 by design if IELTS is membership-only, but all UI must avoid interpreting that as “IELTS has no words.”

## 8. Recommended Fix Order

### Batch A: Flow breakers

1. Fix TodayBento + ReviewHub weak-skill routing.
2. Fix `/quiz` level 8 parse.
3. Fix Today level-up 7→8 behavior.
4. Fix Onboarding band write.

### Batch B: Lexiverse / Word practice

1. Align Lexiverse level galaxy pool with focus logic (`levels` vs `primary_level`).
2. Fix v2 word mode target-word-first query.
3. Decide whether word-universe v2 draft pools should be promoted and served, or document legacy/v1 as the official word practice source.

### Batch C: QA / CI gates

1. Rewrite `qa:qsets-v2` post-promotion policy.
2. Fix/ignore lint pollution from `stitch-export` and `.cjs` scripts.
3. Fix `smoke:learning-loop-e2e`.

### Batch D: Coverage expansion

1. TOEFL listening: needs specs + audio.
2. IELTS four skills: currently missing by design/coming soon.
3. TOEFL blocked reading/build/speaking: needs official spec/scoring/audio decisions.

## 9. Suggested CC Prompt

Use this if you want CC to fix the next batch:

```text
Read reports/full-flow-qbank-vocab-ui-deep-audit-2026-06-30.md.

Do not expand the question bank yet. Fix only Batch A + Batch C gate issues:

1. TodayBento and ReviewHub must not route skillKey as taskType.
   - Add a canonical skillKeyToPracticeTarget mapper.
   - inference/main_idea/detail/vocab_in_context -> reading_comprehension.
   - listening_inference/listening_detail -> listening_comprehension.
   - writing/translation keys route to the correct productive task where possible.
   - Keep skillKey as subskill metadata only.
   - Add a validator/smoke proving inference no longer returns empty.

2. Finish eight-band residual fixes:
   - Onboarding must not write old band=level+1.
   - Today auto level-up must not auto-promote SAT level 7 to IELTS level 8.
   - /quiz must accept level 8 and let spec/status decide empty state.
   - Clean legacy IELTS/GRE quiz mapping or explicit-block it.

3. Make release gates meaningful:
   - Update qa:qsets-v2 so promoted gen active sets are allowed only with promotion/review metadata.
   - Fix para_match duplicate answer rule so it follows template policy, not global ban.
   - Fix smoke:learning-loop-e2e confidence failure.
   - Keep lint clean by ignoring/removing stitch-export from lint scope and handling .cjs scripts.

Do not modify qbank content except metadata needed for QA policy.
Do not promote or demote question sets.
Do not touch DeepSeek limits.
After fixes run:
npm run validate:exam-specs
npx tsc --noEmit
npm run validate:qbank-v2
npm run validate:practice-session
npm run validate:papers
npm run validate:data-quality
npm run validate:audio-assets
npm run validate:learning-loop
npm run qa:qsets-v2
npm run audit:qbank-v2-coverage
npm run smoke:full-routes
npm run smoke:active-serve
npm run smoke:learning-loop-e2e
npm run smoke:paper-e2e
npm run lint

Stop and report exact files changed, DB writes, command exit codes, and any remaining blockers.
```

## 10. Audit Limits

- I did not manually read all 6803 question items for semantic correctness.
- I did not run a live browser screenshot audit for every UI screen; this was a code/data/API smoke audit.
- I did not change code or DB.
- Some report JSON files were already dirty from validation scripts before this report; this audit did not clean or commit them.

