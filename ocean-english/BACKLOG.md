# BACKLOG — 大缺口与后续升级（不烂尾清单）

> F6 收尾时点（2026-06-12）。按价值/工作量排序。

## 数据与内容
1. **AI 关系层批处理**（阶段2-3B 脚本已就绪）：`npx tsx scripts/generate-relations.ts --ai --levels 3,4` — themeTags 主题标注 + 精选近反义/易混。跑完后：宇宙主题星系自动扩容、词图近反义扇区变厚。消耗 LLM 配额，需用户确认执行。
2. **阅读文章库扩容**：现 4 篇原创起步量。方向：每档 5+ 篇；或接 AI 生成（按用户 level 生成带 keyWords 标注的短文）。
3. **听力/语法板块**：grammar_points 表骨架已建（阶段2），内容与页面未做。

## 宇宙
4. **方案 B 聚合星团**（U5 规格原文）：远景状态星团 sprite + 数字徽标，镜头推近实例化展开（InstancedMesh ≤800 + 星区分页已是前置）。工作量大（scene.js LOD 重写）。
5. **帧率自适应降档**（U5）：rAF 采样 <40fps 连续 2s → 关 bloom→减粒子→静态星点，档位记 localStorage。

## 知识库
6. **原 LexiVault 视觉迁移**：bundle 源码（lv-data.jsx 等）若后续拿到，可把重建版的数据层接回原视觉；或照原视觉重写样式层。当前重建版功能全真、视觉走纸面 token。

## 系统
7. **PWA 后台推送提醒**：当前提醒为「打开页面时检查」（F6-B2 已注明降级）。完整方案需 Service Worker + Push API + 服务端推送，工作量 >1 天。
8. **AI 导学本地降级**：AI_PROVIDER 未配置时目前诚实报错；可加本地规则版建议（基于错题/到期词的模板话术）。
9. **--ink-sub 全站硬编码清理**：F1-4 已统一 token 值；个别屏幕仍有与 token 同值的 hex 字面量（视觉一致，仅维护性问题），可机械替换。
10. **题库 question-bank 死代码清理**：lib/question-bank/question-bank-session-builder.ts 及 data/mock-quiz.ts 无运行时引用，可删。
