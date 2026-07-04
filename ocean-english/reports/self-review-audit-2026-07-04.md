# CC 自复核 + 剩余任务盘点（2026-07-04，只读审计）

范围：owner 指令的全项自复核。本轮**无 DB 写入、无 promote、无题库内容改动、无代码修改**。
唯一文件改动 = 本报告。Git HEAD：`47269d5`（审查返修）。

## 总体结论：**通过**

全部必跑命令与三个 TOEFL verifier 退出码 0；听力 24 条抽样 0 缺陷；音频 180/180 元数据齐全且
对象真实存在；WU 来源 100% gen；退役题型 active=0；full mock 受控关闭。两项预存遗留（IELTS rubric
缺口、wu-pz 3 条 draft 偏斜）不阻断本阶段，已列入剩余任务。

## 1. Git / 工作区

- `git log -10`：F0→审查返修 10 个提交链完整（3d5d8f2→47269d5）。
- ocean-english 内脏文件：审计开始时 3 个、过程中 7 个报告 JSON 被验证器刷新 —— 全部为机器产物
  （6 个仅 `generatedAt` 时间戳；`promote-qsets-v2-report.json` 被 WU 守卫的 dry-run 覆盖，历史
  apply 记录在 b68c162 中完好）。分类：**可忽略的报告刷新**，已定向还原，现 dirty=0。
- **需要提交的真实修复：无。不应存在的脏文件：无**（ocean-english 内）。
- 范围外提示：父仓 `../.claude/skills`、`../.firecrawl`、`../korean-cosmos`(submodule)、`../reports`、
  `../tmp` 等为工作站/其他项目产物，不属本项目，未处理。

## 2. TOEFL 当前状态（只读 DB 快照）

| task | active | draft | 判定 |
|---|---:|---:|---|
| read_daily_life | 100 | 0 | ✅ active（F2 promote） |
| reading_comprehension | 98 | 2 | ✅ active；2 条 pilot REVIEW 按契约保持 draft |
| complete_the_words | 100 | 0 | ✅ active |
| email_writing | 100 | 0 | ✅ active |
| academic_discussion | 100 | 0 | ✅ active |
| choose_a_response | 10 | 90 | ✅ 按契约：pilot 10 active；F3 90 draft + machine_checked 音频 |
| listening_comprehension | 10 | 90 | ✅ 同上 |
| build_a_sentence | 0 | 10 | ✅ blocked `scoring_not_ready`（F4 option 4） |
| listen_and_repeat | 0 | 10 | ✅ blocked/deferred（F5） |
| interview_speaking | 0 | 10 | ✅ blocked/deferred（F5） |

TOEFL full/mini：`paper_not_ready`（smoke 逐 exam 精确断言）✅。

## 3. 必跑命令（本轮实跑，全部退出码 0）

| 命令 | exit | 关键输出 |
|---|---:|---|
| npm run lint | 0 | |
| npx tsc --noEmit --incremental false | 0 | |
| npm run validate:qbank-v2 | 0 | active 2672 / items 4316 / 错误 0 |
| npm run qa:qsets-v2 | 0 | 模板 32 · 错误 0 |
| npm run validate:practice-session | 0 | TOEFL complete/choose/listening 均 v2 出题、听力 audio=4 |
| npm run validate:audio-assets | 0 | audio rows 444 · 错误 0 |
| npm run smoke:papers | 0 | TOEFL→paper_not_ready · IELTS→exam_coming_soon · 其余 6 考试出卷 |
| npm run smoke:active-serve | 0 | active stimulus 全 active(1821)；听力 signed URL、无 transcript |
| verify-toefl-reading-expansion --db | 0 | 前向 90/90+90/90 · active 100/98 · draft 0/2 · orphan 0 |
| verify-toefl-text-topup --db | 0 | 前向 30/40/40 · active 100/100/100 · orphan 0 |
| verify:toefl-current | 0 | 聚合 100/100/100 · build 10 draft/0 active · 阻塞/退役 active=0 |

## 4. 音频复核（不 promote）

- **数量/状态**：F3 stage 180 set → 180 唯一 stimuli → **180 条 audio 行，byStatus={machine_checked:180}**，
  缺音频 stimuli=0。
- **元数据**：url/storage_path/duration_ms/checksum/voice_id/accent/provider(azure)/transcript/
  synth_instructions **零缺失**；时长 10.2s–79.8s（中位 53.1s），与 30-80/120-200 词稿量吻合。
- **对象存在性**：随机抽 3 个 storage_path 签名 URL + HEAD → 全 200，audio/mpeg，字节数与时长成比例。
- **transcript 不泄露**：smoke:active-serve + validate:practice-session 断言听力 payload 只含 signed
  audioUrl、无 textEn/transcript；180 条 F3 为 draft，本就不进 payload。
- **answer 命中选项**：verify-toefl-listening-expansion 逐条断言过（F3），本轮 reading/text verifier
  同类断言全绿。
- **抽样语义**（每型 12 条，均匀取 index 1..89）：24/24 通过——transcript↔题目对应、唯一正确答案、
  干扰项合理、可作口语音频，0 缺陷。
- **结论（三选一）**：**机器检查通过，但必须用户亲自试听后才能 promote。**
  （机器无法证明合成发音/语速/可听度；pilot 先例即人工试听后激活。）

## 5. Paper / full mock gate

- TOEFL full+mini：仅 `paper_not_ready` 受控拒绝 ✅（listening 未 active，paperReady=false 正确）。
- IELTS full+mini：仅 `exam_coming_soon` ✅。
- build_a_sentence / speaking：active=0，generatePaper 只抽 active 池 → **不可能被误抽**；
  verify:toefl-current 断言阻塞/退役 active=0 ✅。
- 六个已 active 考试（中考/高考/CET4/6/考研/SAT）mini+full 全部正常出卷，未被 TOEFL gate 误伤 ✅。

## 6. Word Universe

- 来源：active 351 = **gen 351 / qb 0** / migrated 0 / other 0，badProvenance 0（--fail-on-qb-active 通过）✅。
- promote guards：qb draft → `rejected:word_universe_non_gen_source`，gen draft eligible ✅。
- 退役题型：antonym_choice + cet_cloze = 0（多验证器交叉断言）✅。
- 答案位置：active 三型各位置 20-27%（无偏斜）；TOEFL 阅读 active A 位 31%（守卫带 15-35% 内，
  A 稍偏来自 pilot 题）。⚠ 唯一超标：`wu-pz-2026-07-01` stage **draft** confusable_choice n=3
  （67% B）——draft 态不被服务、预存遗留，列入剩余任务。
- complete_the_words 不下发完整答案词：shape 层把 passage 中目标词全部整词替换为 maskedForm，
  verify-toefl-complete-words-expansion §5.15 断言 mapped prompt 含 0 个未遮盖目标词（本轮经
  verify:toefl-current 跑绿）✅。

## 7. 可建议批准 / 不能批准

**可建议批准（需用户逐项明示）**
1. TOEFL listening promote：内容与音频机器侧全就绪，**唯一前置=用户亲自试听**（试听通过后：激活音频
   → "Promote TOEFL listening reviewed manifest" → 100+100 active）。
2. （可选）重写 2 条 pilot 学术阅读 REVIEW 的 Q4 后补 promote → reading_comprehension 100。

**不能批准（维持 blocked）**
- TOEFL full/mini mock 开启（前置：listening active + 产品决策"排除 build/speaking 的组卷可接受"）。
- build_a_sentence 判分/promote（owner 已选 option 4 keep blocked）。
- speaking 管线（owner 已延后；缺 mic/存储/ASR/评分决策）。
- IELTS 启动（F7 未获批准；保持 coming_soon）。

## 8. 剩余任务盘点

| 优先级 | 任务 | 当前状态 | 需用户决策 | 下一步 |
|---|---|---|---|---|
| P0 | TOEFL listening 试听 + promote | 180 draft + machine_checked 音频，机器侧就绪 | **是**（试听+批准语） | 用户试听样本 → 激活音频 → promote 清单 |
| P1 | TOEFL full mock 开启（F6） | paper_not_ready，正确关闭 | **是** | listening active 后评估排除 build/speaking 的组卷 |
| P1 | 2 条 pilot 阅读 REVIEW Q4 重写 | draft 保留 | 否（内容返修可直接做） | 重写→复审→补 promote 至 100 |
| P2 | validate:rubrics IELTS 缺口 | 退 1（ielts/writing+speaking 缺 rubric） | **是**（seed 或 scope 到 active 考试） | 二选一后清红 |
| P2 | wu-pz-2026-07-01 draft 偏斜 | confusable 3 条 draft 67% B | 否 | 返修/删除该 3 条或补量再平衡 |
| P2 | 旧 qb: draft 处置 | 留库 draft，promote guard 已硬拒 | **是**（保留/rejected/删除） | 决策后批量置 rejected 或精确删除 |
| P2 | 报告副作用收口 | 本轮已还原 7 个刷新件；机制上验证器仍会刷报告 | 否 | 可选：报告文件加 .gitignore 或 CI 只读跑 |
| 内容工程 | build_a_sentence 判分（若未来启用） | blocked（option 4） | **是**（改选 1/2/3 才做） | 判分契约+90 题+验证 |
| 内容工程 | speaking 管线（F5） | deferred | **是**（5 项产品决策） | 决策后实现+烟测 |
| 内容工程 | IELTS 建设（F7） | coming_soon，0 内容 | **是** | 批准后先做官方格式 spec 文档 |
| 内容工程 | WU v2-only cleanup（F8） | v1 fallback 共存（88 警告，非阻断） | **是**（是否要 v2-only） | 批准后按级/型小批补量 |

## 9. 披露

- 本轮 DB 写入：**无**（全部只读查询；签名 URL 为只读操作）。
- 本轮 promote：**无**。
- 本轮文件改动：**仅本报告**（代码 0 改动；7 个被验证器刷新的报告 JSON 已还原至 HEAD）。
- 需要用户决策的问题：见 §7/§8 表（listening 试听+promote、full mock、rubrics 缺口处置、
  qb draft 处置、speaking/build/IELTS/WU-v2 四项工程开关）。
- P0/P1 新发现：**无**（无新阻断问题；上表 P0/P1 均为既定待决事项，非缺陷）。
