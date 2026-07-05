# Ocean English v2 — R6 (Audio Pipeline) + R7 (Listening/Speaking Content) 实施与决策计划

> 研究方法：8 代理多代理工作流（4 代码侧理解 + 3 外部 provider/成本/许可研究 + 1 综合），2026-06-23。
> 状态：研究/决策阶段，**无代码/DB 改动**。R6 的 6 项前置决策见 §4，等用户确认后开工。


## 1. 现状 (what exists vs stubbed)

### 已存在且可用 (read-side 闭环完整)
- **DB schema**: `audio_assets` 表完整定义 (`supabase/sql/p4-question-bank-v2.sql:105-118`)。列含 `url TEXT NOT NULL`、`transcript TEXT NOT NULL`、`duration_ms`、`accent`、`voice_id`、`provider`、`checksum`、`qa_status`(CHECK `draft/machine_checked/human_checked/active/rejected`)。FK `stimulus_id → stimuli ON DELETE CASCADE`,索引 `idx_v2_audio_stimulus(stimulus_id, qa_status)`,`updated_at` trigger,RLS 只暴露 `qa_status='active'` (`:353-355`)。**但 p4 尚未 apply 到生产 DB**(`reports/audio-assets-generation-report.json` 显示 `schema='not_applied'`)。
- **读取客户端**: `lib/audio/audio-asset-client.ts` — `fetchAudioByStimulus/fetchAudioByAssetId`,`AUDIO_PRACTICE_COLUMNS`(不含 transcript)vs `AUDIO_REVIEW_COLUMNS`(含 transcript),`isPlayableAudioUrl`(只接受 `http(s)://` 或 `/` 开头),TTS fallback。功能完整。
- **播放 UI**: `components/practice/audio/AudioPlayer.tsx`(HTML5 `<audio>` + TTS 回退 + replay 限制)、`components/practice/renderers/ListeningRenderer.tsx`(只在 locked 后以 review 模式拉 transcript)。smoke 6/6 通过。
- **会话装配**: `lib/practice/session-builder.ts:328-360` 只 select `audio_assets.url`(active),listening 的 `text_en/text_zh` 在提交前置 `undefined`(`:345-348`)。`PracticeItem.audio` 类型仅 `{url?}`。
- **校验门**: `scripts/validate-audio-assets.ts` — 静态 + 可选 live 断言 practice payload 不含 transcript;校验已有行 shape;active listening set 必须有 active audio。
- **晋升门**: `supabase/sql/p5-question-bank-promotion-rpc.sql:119-127` — 任何 listening set 无 active audio 则 reject `listening_without_active_audio`。
- **口语 rubric(代码侧)**: `lib/scoring/rubrics.ts:60` `toefl:speaking` 1–6 分、`SPEAKING_DIMS`(pronunciation .2/fluency .2/vocabulary .15/grammar .15/coherence .15/task_achievement .15),已绑 `listen_and_repeat`+`interview_speaking`。

### Stub / 完全缺失 (write-side 一片空白)
- **`--apply` 被硬拒绝**: `scripts/generate-audio-assets.ts:95-99` 无条件 `if (APPLY) { exit(1) }`(早于 schema/config 检查),注释明示"避免 exit 0 但写 0"。当前只跑 dry-run 枚举(`:112-183`)。
- **零 TTS 合成 / 零 Storage 上传 / 零 INSERT**: 全仓 grep `storage.from` / `.upload(` / `synthesize` 无任何真实实现(唯一 `.upload(` 命中是 vendored three.js)。`SUPABASE_AUDIO_BUCKET` 被读但从不用于写。
- **无 checksum/幂等**: `checksum` 只是 validator 要求非空的列,没有任何 hash 逻辑或按 checksum 去重(现有"排除已 active audio"≠ checksum 相等,machine_checked 同 checksum 不会被跳)。
- **无 provider adapter**: `lib/audio/providers/` 目录不存在。
- **无 review 脚本**: `scripts/review-audio-assets.ts` 不存在;package.json 仅 `generate:audio-assets`+`validate:audio-assets`。
- **无 Storage bucket / 无 storage.objects RLS / 无 signed-vs-public 决策 / 无确定性路径约定 / 无失败回滚**。
- **env 缺失**: `SUPABASE_AUDIO_BUCKET`、`AUDIO_TTS_API_KEY`、`AUDIO_TTS_PROVIDER` 在 `.env.local` 和 `.env.example` 都没有。`SUPABASE_SERVICE_ROLE_KEY` 已存在(脚本用它绕 RLS 写)。

### 内容模板现状
- **无任何 listening/speaking 生成模板**。`data/exam-task-templates/` 只有 `toefl-four-skills.json`(`multi_skill` manual_seed 伞,不可跑)。`lib/exam-task-templates/shape.ts` 无 listening MCQ / choose_a_response / listen_and_repeat / interview 的 mapper shape。
- **6 个内容 cell 待办**: zhongkao/gaokao/cet6 listening = MISSING(0 draft);cet4 listening = BLOCKED audio_missing(67 draft, 67 stimuli, 0 active audio);toefl choose_a_response/listening_comprehension/listen_and_repeat/interview_speaking = MISSING。全部 0 active。
- **现实库存**: issue ledger 467 listen sets / 0 active / 0 audio rows。~5.9k v1 listening 仍把全文存在 `audio_ref` 走浏览器 TTS,这正是迁移后 v2 listening 卡 draft 的根因。
- **口语 rubric 未落 DB**: 代码有定义,但 coverage 显示 speaking cell 0 rubricItems,未 seed 进 rubrics 表、未绑 `question_items.rubric_id`。

---

## 2. 架构 (target pipeline)

端到端流程(严格对齐 master-plan `:674-685` 的 10 点 contract),映射到本仓具体文件:

```
stimulus(text_en=transcript) ──┐
                               ▼
[1] normalizeSynthInput(text_en)            lib/audio/checksum.ts (新建)
                               │  trim/collapse 空白/统一标点 → 规范输入
                               ▼
[2] checksum = sha256(normInput + voiceId + accent + provider + settings)
                               │           lib/audio/checksum.ts (新建)
                               ▼
[3] SELECT audio_assets WHERE checksum=? ── 命中 → SKIP(幂等,写 0)
                               │ 未命中     scripts/generate-audio-assets.ts (改)
                               ▼
[4] provider.synthesize({text,voiceId,accent,settings})
                               │  → {bytes:Buffer, mimeType, durationMs}
                               │           lib/audio/providers/azure.ts (新建)
                               ▼
[5] 校验产物: bytes 非空 / MIME ∈ {audio/mpeg} / duration ∈ [minMs,maxMs] / 重算 checksum 一致
                               │           scripts/validate-audio-assets.ts 复用的 verifySynthOutput()
                               ▼
[6] storage.upload(deterministicPath, bytes)   确定性路径:
                               │  audio/v2/{accent}/{voiceId}/{checksum}.mp3
                               │  upsert:false → 上传失败/重复即报错
                               ▼
[7] INSERT audio_assets {url=publicUrl, transcript=text_en, duration_ms,
                               │   accent, voice_id, provider, checksum,
                               │   qa_status='machine_checked'}  ← 绝不 active
                               ▼
[8] 人工试听 → scripts/review-audio-assets.ts (新建)
                               │   machine_checked → human_checked → active(独立操作)
                               ▼
[9] active 行 → RLS 暴露 → session-builder 只取 url → AudioPlayer <audio src>
```

### 三大保证如何在本仓实现

**(A) No-transcript-leak(已实现,只需保持)**
- `audio_assets.transcript` 存原文(DB 必须有);但 `AUDIO_PRACTICE_COLUMNS` 不含它(`audio-asset-client.ts:17`),`session-builder.ts:333` 只 select `stimulus_id,url`,listening 的 stimulus 文本提交前置空(`:345-348`)。transcript 仅 review 模式、locked 后拉取。`validate-audio-assets.ts:49-86` 静态+live 双重断言。R6 **不改动**这套,只在 validator 增一条"machine_checked 不得出现在 practice payload"。

**(B) Idempotency(rerun 写 0)**
- 由 `[2][3]` 的 checksum 相等跳过实现,**不是**靠"排除 active"。建议同时加 **DB 级 UNIQUE index on checksum**(新 migration,见 §7),把幂等下沉到约束层,防并发重复写。generate 报告必须区分 `planned` vs `synthesized` vs `skipped(checksum)` vs `uploaded` vs `inserted`,acceptance 断言第二次 run `inserted=0 uploaded=0`。

**(C) Failed-upload-no-dangling-row**
- 严格顺序:**先 upload `[6]` 成功 → 再 INSERT `[7]`**。任一步抛错:
  - synth/validate 失败 → 不 upload、不 insert;
  - upload 失败 → 不 insert(无 DB 行);
  - insert 失败(如 UNIQUE 冲突)→ `storage.remove(path)` 清掉刚传的对象,避免孤儿文件。
- 因 Supabase 无跨 Storage+DB 事务,用 try/catch + compensating delete 实现"无 active/无悬挂行"。新行恒为 `machine_checked`,即便 insert 后流程崩溃也不会自动 active(无任何代码把 audio 自动转 active)。

---

## 3. Provider 推荐

| Provider | US | CA | AU | UK | 多说话人(单次合成) | Node/TS API | 计价单位 | 商用授权(存储+分发) |
|---|---|---|---|---|---|---|---|---|
| **Azure AI Speech** ✅ | ✅ 多(Ava/Andrew…) | ✅ **唯一**(Clara F/Liam M) | ✅ 多(Natasha/William…) | ✅ 多(Sonia/Ryan…) | ✅ 原生 `<mstts:dialog>` MultiTalker | `microsoft-cognitiveservices-speech-sdk` / REST | $15/1M 字符(Std Neural) | ✅ 无版税/无许可/无署名要求(自有输入文本);只 CNV 受限,prebuilt 不受限 |
| Google Cloud TTS | ✅ | ❌ **无 en-CA** | ✅ | ✅ | ⚠️ Studio multispeaker(Experimental) | `@google-cloud/text-to-speech`(SA JSON) | $16/1M(Neural2) | ⚠️ 拥有音频但"重打包为分发媒体库"是灰区,需自行 clear |
| Amazon Polly | ✅ | ❌ **无 en-CA** | ⚠️ 无男性 neural | ✅ | ❌ 需自行拼接 | `@aws-sdk/client-polly` | $16/1M(Neural) | ✅ 明确允许存储/再分发/e-learning |
| ElevenLabs | 音色绑定 | ❌ 无确定性 locale | ❌ | ❌ | ✅ 最自然 Dialogue | 官方 TS SDK | 信用/订阅(~$50–100/1M) | ✅ 但贵 3–6x |
| OpenAI TTS | ❌ 无 locale 选择 | ❌ | ❌ | ❌ | ❌ 无 SSML | `openai` SDK | $15/1M(tts-1) | 商用可,但口音不可复现 |

### PRIMARY: **Azure AI Speech (Neural TTS)**
理由:(1) **唯一覆盖全四口音**,含本仓 R4 强制要求的 Canadian English(en-CA Clara/Liam)—— Google/Polly 都缺 en-CA,直接不达标;(2) **命名确定性 voice_id**(如 `en-GB-RyanNeural`)→ 同一 transcript 每次再合成字节稳定,正是 `audio_assets.voice_id/accent/provider` 列的数据模型;(3) **原生单文档多说话人** `en-US-MultiTalker-Ava-Andrew:DragonHDLatestNeural` + `<mstts:dialog>`,直接产出 TOEFL/CET6 对话与访谈;(4) 商用授权干净;(5) **与现有代码一致**——`generate-audio-assets.ts:34` 的 `--provider` 默认就是 `'azure'`;(6) **成本最低且 5M 字符/月免费档基本覆盖整批**(见 §5)。用简单 API-key 流(`AUDIO_TTS_API_KEY`)即可,无需 GCP SA JSON 那种重认证,契合 Supabase/Vercel TS 栈。

### FALLBACK: **Google Cloud Text-to-Speech (Neural2)**
功能最近的孪生(命名 US/UK/AU 男女声、$16/1M)。**代价**:无 en-CA → Canadian 内容用 US 声替代或跳过;multispeaker 还在 Experimental;再分发条款有灰区需确认。仅在 Azure 不可用时启用。

**ElevenLabs** 保留为少量"展示级对话"的可选高级引擎,不用于批量(口音不可确定性 pin + 信用贵)。**OpenAI/Polly 不作主引擎**;OpenAI 可继续充当当前浏览器 TTS 那种"单词发音回退"角色。

---

## 4. 6 个决策 (R6 prerequisite gate — 每项给推荐 DEFAULT,确认即可)

> master-plan `:648-659`:任一项缺失则记 `audio_missing` 停 R6。以下默认值已可让用户直接 confirm。

1. **TTS / 音频 provider** — **DEFAULT: Azure AI Speech (Neural TTS, Standard)**。理由见 §3(唯一全四口音 + 多说话人 + 与代码默认一致)。

2. **凭证与允许用法** — **DEFAULT**:开一个 Azure Speech 资源,取 `AUDIO_TTS_API_KEY` + region;用法限定"自有原创 transcript 合成存储到 Supabase Storage 并分发给学习者",启用 Azure 建议的合成声明 byline(非硬性)。env 新增 `AUDIO_TTS_PROVIDER=azure`、`AUDIO_TTS_API_KEY`、`AZURE_SPEECH_REGION`,写入 `.env.local` 并在 `.env.example` 占位。

3. **Supabase Storage bucket 名 + 访问策略** — **DEFAULT**:bucket 名 `audio-assets`,**public bucket + `getPublicUrl`**。理由:`audio_assets.url` 现为静态 TEXT,table-RLS 已用 `qa_status='active'` 控制"哪些 stimulus 可被发现",`<audio src>` 直接吃 public URL,最简单且不破坏现有静态串模型;transcript 不在文件名/URL 中(只存 checksum),无泄漏。Private+signed URL 会要求 session-build 时现签 URL、破坏静态串假设——**仅在合规要求音频不可被未授权直链时**才升级,届时加 `storage.objects` SELECT policy + 在 session-builder 签 URL。确定性路径:`audio/v2/{accent}/{voiceId}/{checksum}.mp3`。

4. **口音 + 具体 voice(US/CA/AU/UK,均男女各一)** — **DEFAULT(Azure 命名声,均衡轮配)**:
   - **en-US**: `en-US-AvaNeural`(F)、`en-US-AndrewNeural`(M)
   - **en-CA**: `en-CA-ClaraNeural`(F)、`en-CA-LiamNeural`(M)  ← 唯一来源,变化少,接受
   - **en-AU**: `en-AU-NatashaNeural`(F)、`en-AU-WilliamNeural`(M)
   - **en-GB**: `en-GB-SoniaNeural`(F)、`en-GB-RyanNeural`(M)
   - **多说话人对话/访谈**: `en-US-MultiTalker-Ava-Andrew:DragonHDLatestNeural` + `<mstts:dialog>`
   - 口音按 R4"均衡 US/CA/AU/UK + 性别"在每个 cell 内轮配(generate 加 accent/voice 分配函数,确定性按 stimulus 序号取模,保证可复现)。

5. **成本上限 + 批大小** — **DEFAULT**:成本上限 **$25**(实际 base ~$8、含重录 ~$10,远低于上限;Azure 5M 字符/月免费档可能让整批近 $0)。批流程 **pilot 5 → 人工试听 → 50/批** apply。先 `--limit=5` dry-run、`--apply` 验证幂等(连跑两次第二次写 0),通过后才放量。

6. **人工试听负责人** — **DEFAULT**:由 **fanhui(项目负责人)** 负责 listening review;`scripts/review-audio-assets.ts --dry-run` 列出 machine_checked 清单 + 可播 URL,试听后逐条 `--approve <id>` 把 `machine_checked → human_checked → active`(口语 cell 额外校 transcript/口音/replay 元数据)。绝不自动晋升。

---

## 5. 成本估算

- **字符量**:8 个 listening/speaking cell × ~50 set + cet4 已 draft 67 set ≈ **~467 clip**,取 ~500 clip。平均每 clip ~1,000 字符(120–250 词 / 35–100 词 / 短句分层混合,700–1,500 字符)。base ≈ **0.5M 字符**;含 pilot + 20–30% 重录 ≈ **0.65M 字符**。

| Provider × 档位 | 单价 | 0.5M base | 0.65M 含重录 |
|---|---|---|---|
| **Azure Neural Std**(推荐) | $15/1M | **$7.50** | **$9.75** |
| Azure 免费档 5M/月 | $0 | **~$0** | **~$0**(可全覆盖) |
| Google Neural2 / Polly Neural | $16/1M | $8.00 | $10.40 |
| Azure Neural HD V2 / Google Chirp3 HD / Polly Generative | $30/1M | $15.00 | $19.50 |
| ElevenLabs(Pro 月) | 订阅 | ~$99 | ~$99 |

**结论**:此规模成本可忽略。**预算 $10–20,选 Azure Neural Standard,实际很可能因免费档落到 $0。** 成本不是约束,优化点是音质与口音真实性。口语示范音(prosody 重要)如需更自然,可对 `listen_and_repeat`/`interview_speaking` 少量用 Azure HD,增量 <$5。

---

## 6. R7 内容计划

通用约束(R4 confirmed,`exam-spec-revalidation-2026-06-23.md:28-38`):**听力录音播放一次(no replay)**,需写入 `AudioPlayer` 的 `replayLimit=1`;**音频长度分层**:brief(≤6 重读音节)/ intermediate 35–100 词 / extended monologic ≤250 词;**口音均衡 US/CA/AU/UK + 性别**;每听力题 ≤1 分;印刷题干 + 选择题。所有 transcript **原创**(`copyrightPolicy: original_only`)。音频经 `stimuli(text_en=transcript) → audio_assets.stimulus_id` 链接到题组。

**通用批流**(每 cell):写 transcript → 建 stimulus(kind dialogue/lecture/announcement,word_count)→ 出题(MCQ 4 选项 + key + 中文解析)→ **pilot 10** 条走 generate→shape→draft→QA→audio synth(machine_checked)→人工试听 → 通过后 **放量到 ~50** → 全部 active → 晋升。**未达 50 不晋升整 cell**;每 cell 停下供 Codex review。

| Cell | 待创作内容 | 音频长度/kind | 口音 | replay | 选项/题数 |
|---|---|---|---|---|---|
| **zhongkao listening**(20项/25分) | 短对话 + 篇章 transcript;主旨/细节/推断 MCQ | dialogue 短 + announcement intermediate 35–100 词 | 均衡四口音 | 1 | 4 选项 |
| **gaokao listening**(20项/30分) | 对话 + 独白 transcript | dialogue + monologic ≤250 词 | 均衡四口音 | 1 | 4 选项 |
| **cet6 listening**(25项/249分) | 长对话 + 听力篇章 + 讲座/报道(CET6 特色) | lecture/announcement extended ≤250 词,多说话人用 `<mstts:dialog>` | 均衡 | 1 | 4 选项 |
| **cet4 listening**(25项,**67 draft 已存 stimulus**) | **复用现有 67 stimulus 文本** → 直接进 R6 合成 audio(此 cell 优先,验证全链路) | 短篇新闻+长对话+篇章 | 均衡 | 1 | 4 选项 |
| **toefl choose_a_response**(15–19,A1–B2) | 短 utterance 音频 + 选"最佳口头回应";**新 shape** | **brief ≤6 重读音节** | 均衡 | 1 | ⚠️ 选项数 **官方未定** |
| **toefl listening_comprehension**(Conversation 10 / Announcement 6–10 / Academic Talk 8–16) | 对话/通知/学术讲座 transcript;**子型 item 数编码为 RANGE** | conversation 多说话人 / announcement intermediate / talk extended ≤250 词 | 均衡 | 1 | ⚠️ 选项数 **官方未定** |
| **toefl listen_and_repeat**(7,input_mode=speak,requiresAudio+rubric) | 音频 prompt + reference transcript;绑 `toefl:speaking` rubric | brief/intermediate | 均衡 | 1 | 无选项;rubric 1–6 |
| **toefl interview_speaking**(4,speak,requiresAudio+rubric) | 访谈音频 prompt + model answer;绑 rubric | 多说话人访谈 | 均衡 | 1 | 无选项;rubric 1–6 |

**⚠️ TOEFL MCQ 选项数硬阻断**:R4 `:42-47` 明确 ETS 未公布 listening/reading MCQ 的"每题选项数"。`choose_a_response` 与 `listening_comprehension` 模板**必须保持 `official_spec_unverified=true` / BLOCKED**,**不得臆造选项数**——待 ETS 新源发布后再解锁。其它 item 数按 **RANGE 编码**(15–19 / 6–10 / 8–16),不写死。

**口语 rubric 落地**:`lib/scoring/rubrics.ts:60` 的 `toefl:speaking`(1–6,SPEAKING_DIMS)需 **seed 进 DB rubrics 表 + 绑 `question_items.rubric_id`**(当前 0 rubricItems)。本期基于文字转写评分。

**执行优先级**:**cet4 listening 先行**(67 stimulus 已就绪,纯走 R6 合成,最快验证全链路)→ zhongkao/gaokao/cet6(需新写 transcript)→ toefl speaking(rubric 已有)→ toefl MCQ cell **保持 BLOCKED** 直到选项数确认。

---

## 7. 文件改动清单

### R6 — 管线
**新建**
- `lib/audio/providers/azure.ts` — `synthesize({text,voiceId,accent,settings}) → {bytes:Buffer, mimeType, durationMs}`;读 `AUDIO_TTS_API_KEY`+`AZURE_SPEECH_REGION`;SSML 组装(单声 `<voice>` / 对话 `<mstts:dialog>`);纯边界,让 generate 保持 provider 无关。
- `lib/audio/checksum.ts` — `normalizeSynthInput(text)`、`computeChecksum(normInput+voiceId+accent+provider+settings)`(sha256)、`deterministicStoragePath(accent,voiceId,checksum,ext)`;generate 与 validate 共用。
- `scripts/review-audio-assets.ts` — 人工试听晋升器;`--dry-run` 列 machine_checked + URL,`--approve <id>` 设 `human_checked`/`active`,绝不自动晋升。
- `supabase/sql/p6-audio-pipeline.sql`(**新隔离 migration,不改 p4**)— `ALTER TABLE audio_assets ADD COLUMN storage_path TEXT` + `CREATE UNIQUE INDEX uniq_v2_audio_checksum ON audio_assets(checksum)`(DB 级幂等);如选 private bucket,追加 `storage.objects` SELECT policy。

**修改**
- `scripts/generate-audio-assets.ts` — **删除 `:95-99` 无条件 `--apply` 拒绝**;接入 `[1]→[7]` 真实管线(normalize→hash→按 checksum SELECT 跳过→azure.synthesize→verifySynthOutput→storage.upload(确定性路径)→insert `machine_checked`);upload/insert 失败补偿删除孤儿对象;dry-run 仍为默认;报告区分 planned/synthesized/skipped/uploaded/inserted。
- `scripts/validate-audio-assets.ts` — 加 `verifySynthOutput()`(非空字节 / MIME `audio/mpeg` / duration ∈ [min,max] / checksum 重算一致);收紧已有行 duration 仅 `>0` → 加上下界;加"synth 产出行必须 machine_checked、不得在 practice payload"断言。
- `package.json` — 新增 `review:audio-assets` script。
- `.env.local` / `.env.example` — 加 `AUDIO_TTS_PROVIDER=azure`、`AUDIO_TTS_API_KEY`、`AZURE_SPEECH_REGION`、`SUPABASE_AUDIO_BUCKET=audio-assets`。
- `lib/audio/audio-asset-client.ts` — 仅在选 private+signed URL 时改(暴露 asset id / 现签);transcript 契约**不动**。

**R6 验证命令**(master-plan `:689-697`):
```
npm run generate:audio-assets -- --limit=5
npm run generate:audio-assets -- --limit=5 --apply   # 写 5
npm run generate:audio-assets -- --limit=5 --apply   # 幂等,写 0
npm run validate:audio-assets
npx tsx scripts/review-audio-assets.ts --dry-run
npm run lint && npx tsc --noEmit
```

### R7 — 内容
**新建**
- `data/exam-task-templates/zhongkao-listening-comprehension.json`、`gaokao-listening-comprehension.json`、`cet4-listening-comprehension.json`、`cet6-listening-comprehension.json` — kind dialogue/lecture/announcement、`perStimulusItems`、`optionCount:4`、`answerSchema` 复用 `reading_multi`(但 stimulus 为 audio)、音频长度/口音约束、`copyrightPolicy:original_only`。
- `data/exam-task-templates/toefl-listening.json` — `choose_a_response`(15–19)+ `listening_comprehension` 子型(conversation 10 / announcement 6–10 / academic talk 8–16),**item 数编码为 RANGE**,**选项数保持 BLOCKED `official_spec_unverified`**。
- `data/exam-task-templates/toefl-speaking.json` — `listen_and_repeat`(7)+ `interview_speaking`(4),`input_mode:speak`,`requiresAudio+requiresRubric`,manual_seed。

**修改**
- `lib/exam-task-templates/shape.ts` — 加 mapper shape:`listening_mcq`(audio stimulus 上复用 reading_multi)、`choose_a_response`、`speak_prompt`(两个口语型共用)。
- `lib/scoring/rubrics.ts` — 核对/扩展 speaking rubric,然后 **seed 进 DB rubrics 表 + 绑 `question_items.rubric_id`**。
- `scripts/qa-question-sets-v2.ts` — 扩 QA:断言 audio ≤250 词、口音集合 ⊂ {US,CA,AU,UK}、子型 item 数落在 RANGE、listening/speaking shape 规则。
- `lib/exam-specs/specs.ts` — **默认不改**(R4 `:48` 明确无 spec 变更必要;RANGE/replay/长度在模板创建时编码)。

**每阶段 verifier**:`validate:exam-specs`、`validate:question-types`、`qa-question-sets-v2`、`validate:audio-assets`、`validate:rubrics`,每 cell 跑一遍并停下供 review。

---

## 8. 风险 + 顺序

### 风险
- **成本**:极低(~$10–20,可能 $0 免费档)。**非约束**。设 $25 上限即可。
- **口音真实性**:en-CA 仅 Clara/Liam 两声 → Canadian item 音色多样性受限。缓解:接受单对,或 Canadian 题穿插额外 en-CA transcript 变化;其余三口音音色充足。
- **多说话人**:Azure `<mstts:dialog>`/MultiTalker 为 DragonHD,单价更高($22–30/1M)且为 preview;仅对话/访谈 cell 用,monologic 用 Std Neural 控成本与稳定性。回退:用单声分段 `<voice>` 拼接。
- **Review 吞吐**:~500 clip 人工试听是瓶颈。缓解:pilot 5→50 分批、`review-audio-assets.ts` 提供可播 URL 清单批量试听、cet4 先行验证流程后再放量。
- **TOEFL MCQ 选项数未定**:`choose_a_response`/`listening_comprehension` **保持 BLOCKED**,不臆造;先做四国内 listening + toefl speaking,避免被卡住的 cell 阻塞整体。
- **幂等并发**:靠 checksum UNIQUE index 下沉到 DB,防多进程重复写。
- **失败悬挂行**:先 upload 后 insert + 补偿删除;新行恒 machine_checked,不自动 active。

### 推荐执行顺序
1. **决策 gate**:用户 confirm §4 六项(默认值即可)→ 否则记 `audio_missing` 停。
2. **apply p4 + p6 migration**;建 `audio-assets` public bucket;配 env。
3. **R6 管线建好,先用 cet4 的 5 个 stimulus 跑 `--limit=5 --apply`** → 连跑两次证幂等(第二次写 0)→ `validate:audio-assets` 绿。
4. **人工试听这 5 条**(`review-audio-assets.ts`)→ 晋升 active → 跑 listening practice smoke 确认播放 + 无 transcript 泄漏 → Codex review R6。
5. **R6 通过后,R7 逐 cell**:cet4 listening(已 stimulus,纯合成放量到 active)→ zhongkao → gaokao → cet6 → toefl speaking(rubric seed)。每 cell:pilot 10 → 试听 → 放量 ~50 → active → 停下 review。
6. **toefl MCQ cell 保持 BLOCKED**,待 ETS 公布选项数再解锁。

每步遵守 master-plan acceptance:首批写恰好计划数、rerun 写 0、每行有 provider/checksum/duration/url/stimulus/qa_status、无自动 active、practice payload 无 transcript、每 cell 停下供人工试听 + Codex review。

---

相关文件(绝对路径):
- 管线脚本:`D:/ai-studio/ocean-english/scripts/generate-audio-assets.ts`、`scripts/validate-audio-assets.ts`、`scripts/review-audio-assets.ts`(新)
- provider/工具:`D:/ai-studio/ocean-english/lib/audio/providers/azure.ts`(新)、`lib/audio/checksum.ts`(新)、`lib/audio/audio-asset-client.ts`
- SQL:`D:/ai-studio/ocean-english/supabase/sql/p4-question-bank-v2.sql`、`supabase/sql/p6-audio-pipeline.sql`(新)、`supabase/sql/p5-question-bank-promotion-rpc.sql`
- 内容:`D:/ai-studio/ocean-english/data/exam-task-templates/{zhongkao,gaokao,cet4,cet6}-listening-comprehension.json`、`toefl-listening.json`、`toefl-speaking.json`(均新)、`lib/exam-task-templates/shape.ts`、`lib/scoring/rubrics.ts`、`lib/exam-specs/specs.ts`
- 配置:`D:/ai-studio/ocean-english/.env.local`、`.env.example`、`package.json`