# CONSTRAINTS —— 硬约束清单（不可违反）

1. **只复用 `.pr-v2` 视觉语言与 globals 令牌**；新 CSS 仅限 premium overlay 的小增量（`.transcript` / `.prompt.muted` 建设中占位 / error 重试行 / 底部抽屉），且全部用既有 token，**不新增颜色**。
2. **保留全部旧 URL 参数**：`?word=`、`?word&vs`、`?yesterday`、`?returnTo`、`?mode=vocabulary-drill|sentence-practice|exam-practice|wrong-answer-booster|listening-practice|reading-practice`、`?drill=<key>`、`?level=`、`?exam=`。旧链接绝不 404/崩溃。
3. **退役题型永不渲染**：`antonym_choice`、`cet_cloze`（filter 双保险；`cet_cloze` 旧缓存重映 `cloze_choice`）。
4. **保留 `LexiverseQuizClient` 作 legacy fallback**，本阶段不删；**不碰 `/drill`**。
5. **attempts 容错**：`POST /api/practice/attempts` 返回 `storage:'none'`（v2 表未应用 / 未认证 / 仅 v1 题）时不得报 500、不得打断本地计分。`wordUpdates` 由客户端应用到 `lexiStore`，runner 不在服务端直接写 store。
6. **multi_blank / matching 无数据** → 受控「建设中」占位，不报错、不计分、不计对错。
7. **拼写题三连修复**（见 README §7）：Enter `stopPropagation` 防双触发跳题；`isComposing`/`keyCode===229` 守卫输入法；输入过滤 `/[^a-zA-Z '\-]/g` 挡中文。
8. **进场动画**：可见态为基样式，隐藏态用 `@keyframes` 进入；`prefers-reduced-motion` 下关闭，且关闭后内容仍可见（不卡隐藏态）。
9. **无障碍**：选项可键盘操作的 `<button>`（`aria-pressed`）；输入框带 `<label>`；loading/results `aria-live`；不可用/已提交态用文字 + `aria-disabled` 表达，非仅颜色。
10. **品牌**：网页端头部用真实 wordmark `Lexi`+斜体青绿`verse`（Instrument Serif）+ `词渊`（mono），应用内 Logo 无图标；不自造图标/wordmark。
11. **质量门**：`validate:practice-session` / `lint` / `tsc` 全过；4 条 smoke URL 通过。
