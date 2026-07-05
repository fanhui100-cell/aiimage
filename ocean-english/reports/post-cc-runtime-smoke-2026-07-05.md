# Post-CC Runtime Smoke — 2026-07-05（第二轮，收尾治理）

> 环境：`next dev` @ `127.0.0.1:3107`（非 3000 端口）。当前工作区代码（含 verify 基线同步后的状态）。
> 无 DB 写入；纯 GET/浏览器观测。浏览器项使用 Playwright/chromium。

## 结果总览

| # | 检查项 | 结果 | 证据 |
|---|---|---|---|
| 1 | `/api/mock-exam?exam={gaokao,zhongkao,cet4,cet6}&seed=1` 不含 `answer`/`answer_text`/`audio_ref`/`explanation_zh`（含追加的 `hint` 检查） | **PASS ×4** | 每个响应 `ok:true`，泄露键命中行 = 0/0/0/0（gaokao 11.6KB、zhongkao 15.2KB、cet4 21.8KB、cet6 23.1KB） |
| 2 | `/dictionary?word=carbon-dioxide` 返回 200 且不落空态 | **PASS** | HTTP 200；HTML 无"暂未收录"文案；API 双证 `/api/dictionary/word/carbon-dioxide` → `ok:true, id=carbon-dioxide, word="carbon dioxide"` |
| 3 | `/lexiverse/word/notarealwordxyz` 不硬 404 | **PASS** | HTTP 307 → `/dictionary?word=notarealwordxyz` |
| 4 | `/lexiverse?word=benefit` 消费 word 参数、不停留 universe 总览 | **PASS（focus-miss 分支）** | URL 改写为 `?word=benefit&galaxy=junior`；iframe src 切换为 `Lexiverse Galaxy.html?galaxy=junior`（非 Universe 总览）；页面显示可见 focus-miss 提示（「benefit」暂不在本星系词表） |
| 5 | `/api/dictionary/relations?word=ability` 含 antonym 关系 | **PASS** | 返回 2 条 `type:"antonym"`（ability→inability、ability→incapacity），synonym-candidate 关系并存 |

## 检查项 4 的行为差异说明（如实记录）

第一轮 smoke（同日早些，见主审查报告 Runtime smoke 段）中 `benefit` 解析落入 `galaxy=senior` 并成功聚焦词球（`wu-label is-active` + 词卡打开）；本轮解析落入 `galaxy=junior`，该星系静态词表不含 benefit，触发 focus-miss 可控降级（提示可见，非静默）。两条路径都满足 checklist §4.5 验收（"定位到所属星系视角并聚焦，或给出可见 focus-miss"，且都不是停留在 universe 总览）。

差异根因未深挖（非阻塞）：多等级词（benefit 同时在多个等级带）的 galaxy 解析在 store 为空、走 `/api/dictionary/word` fallback 时选带不稳定。建议列入后续小项：`galaxyForWord` 对多等级词优先按 `primaryLevel` 选带，并优先选静态词表实际包含该词的星系。

## 结论

CC 修复的 5 项运行时验收全部 PASS。P0（mock-exam 泄露）修复在 4 个考试上再次确认干净（含 `hint` 内嵌答案的追加修复）。
