# Phase 3A — AI Foundation Report

**Project:** LexiOcean (`d:\ai-studio\ocean-english`)
**Phase:** 3A — AI Integration Foundation
**Date:** 2026-06-01

---

## 1. 新增文件（23个）

### Types
| 文件 | 说明 |
|---|---|
| `types/ai.ts` | AI 类型定义：AIProviderName / AIUserLevel / AIMessage / AIRequestContext / AIResponse / AIError / 4个 Request 类型 |

### AI Library
| 文件 | 说明 |
|---|---|
| `lib/ai/ai-config.ts` | 环境变量读取，resolveProvider() 安全解析 |
| `lib/ai/ai-errors.ts` | makeAIError / normalizeProviderError 错误归一化 |
| `lib/ai/ai-cache.ts` | 内存缓存占位（TTL 1h），TODO Redis 注释 |
| `lib/ai/ai-provider.ts` | AIProvider 接口定义（5个方法） |
| `lib/ai/ai-client.ts` | createAIClient() 工厂函数，按 AI_CONFIG.provider 返回对应实例 |
| `lib/ai/providers/mock-provider.ts` | **全实现** mock provider：chat / explainWord / generateQuiz / analyzeMistakes / generateStudyPlan，双语输出 |
| `lib/ai/providers/openai-provider.ts` | OpenAI skeleton，读 OPENAI_API_KEY，TODO Phase 3B 注释 |
| `lib/ai/providers/anthropic-provider.ts` | Anthropic skeleton，读 ANTHROPIC_API_KEY，TODO Phase 3B 注释 |
| `lib/ai/providers/gemini-provider.ts` | Gemini skeleton，读 GEMINI_API_KEY，TODO Phase 3B 注释 |
| `lib/ai/prompts/chat-tutor.ts` | buildChatTutorMessages()，level-aware system prompt |
| `lib/ai/prompts/word-explanation.ts` | buildWordExplanationMessages()，结构化格式要求 |
| `lib/ai/prompts/quiz-generation.ts` | buildQuizGenerationMessages()，JSON 输出规范 |
| `lib/ai/prompts/mistake-analysis.ts` | buildMistakeAnalysisMessages()，Pattern Analysis 格式 |
| `lib/ai/prompts/study-plan.ts` | buildStudyPlanMessages()，4-week plan 格式 |

### API Routes
| 文件 | 路由 |
|---|---|
| `app/api/ai/chat/route.ts` | POST /api/ai/chat |
| `app/api/ai/word-explain/route.ts` | POST /api/ai/word-explain |
| `app/api/ai/quiz-generate/route.ts` | POST /api/ai/quiz-generate |
| `app/api/ai/mistake-analysis/route.ts` | POST /api/ai/mistake-analysis |
| `app/api/ai/study-plan/route.ts` | POST /api/ai/study-plan |

### Config & Docs
| 文件 | 说明 |
|---|---|
| `.env.example` | 环境变量模板，无真实 key |
| `docs/ai-integration.md` | AI 架构文档 |
| `docs/phase-reports/phase-3a-ai-foundation-report.md` | 本报告 |

---

## 2. 修改文件（2个）

| 文件 | 改了什么 |
|---|---|
| `app/chat/page.tsx` | handleSend 改为 async，try/catch 调用 /api/ai/chat，error 自动 fallback 到 getMockAiResponse()。新增 userLevel 从 Zustand 读取。页面不崩。 |
| `app/word/[slug]/WordDetailClient.tsx` | 新增 aiExplanation / aiLoading / aiError 状态。新增 handleAIExplain() 函数。新增 "✦ Ask AI / AI 解释" 按钮（放在 SaveWordButton 右侧）。新增 AI explanation 面板（在 Back 链接上方）。新增 renderAIContent() 内联 bold 渲染函数。 |

---

## 3. 是否修改 Banyan 首页

**否。** `app/page.tsx` 完全未动。BanyanParticleHero 所有组件完全未动。

## 4. 是否修改 Universe 占位页

**否。** `app/universe/page.tsx`、`app/universe/[module]/page.tsx`、`app/visual-lab/cosmic-td/page.tsx` 完全未动。

## 5. 是否破坏 Phase 2 功能页面

**否。** 以下页面完全未动：
- dictionary / word/[slug] / quiz / study / memory / exam / scan / onboarding

`app/word/[slug]/WordDetailClient.tsx` 新增了 AI 按钮，但仅是追加内容，不修改任何现有字段、函数或布局。

---

## 6. AI Provider 安全性

- **无 API key 硬编码** — 所有 key 通过 process.env 读取
- **无 NEXT_PUBLIC_ 前缀** — API key 不暴露到浏览器
- **lib/ai/ 仅服务端** — 客户端组件只通过 fetch() 调用 /api/ai/* 路由
- **Skeleton providers** 在 key 为空时输出 console.warn，不 crash

---

## 7. 前端集成说明

### Chat 页面

```
用户发送消息
  → 记录 history（当前 chatMessages + 新用户消息）
  → fetch POST /api/ai/chat
    → 成功：使用 AIResponse.content
    → 失败（网络/500）：fallback 到 getMockAiResponse()（本地，无网也能用）
  → setIsTyping(false)
```

### Word Detail 页面

```
用户点击 "✦ Ask AI / AI 解释"
  → setAiLoading(true)
  → fetch POST /api/ai/word-explain { word, userLevel }
    → 成功：setAiExplanation(data.content)
    → 失败：setAiError(message) + 显示 Retry 按钮
  → setAiLoading(false)
  → AI 面板在 Back 链接上方展示（分节样式，紫色主题）
```

---

## 8. 成本控制预留

| 机制 | 实现状态 |
|---|---|
| Max prompt length (4000 chars) | ✅ 已实现，超长返回 400 |
| Max output tokens (env 可配) | ✅ AI_MAX_OUTPUT_TOKENS |
| Input validation | ✅ 所有路由有字段检查 |
| Safe fallback | ✅ Chat 页面 catch → local mock |
| Error normalization | ✅ normalizeProviderError() |
| In-memory cache | ✅ 占位实现（ai-cache.ts） |
| Rate limit | 🔲 TODO Phase 3C |
| Token tracking | 🔲 TODO Phase 3C |

---

## 9. Lint 结果

```
> npm run lint
(无错误，无警告)
```

**✓ 通过**

---

## 10. Build 结果

```
▲ Next.js 16.2.6 (Turbopack)
✓ Compiled successfully in 2.5s
✓ TypeScript 通过（0 错误）
✓ 19 个页面 + 5 个 API routes 全部生成

新增 API routes：
├ ƒ /api/ai/chat
├ ƒ /api/ai/mistake-analysis
├ ƒ /api/ai/quiz-generate
├ ƒ /api/ai/study-plan
└ ƒ /api/ai/word-explain
```

**✓ 通过**

---

## 11. Phase 3B 接入建议

**推荐首选：Anthropic claude-haiku-4-5-20251001**（成本低、中文能力强、响应快）

接入步骤：
1. `.env.local` 设置 `AI_PROVIDER=anthropic` + `ANTHROPIC_API_KEY=sk-ant-...`
2. 实现 `lib/ai/providers/anthropic-provider.ts` 中的 5 个方法（已有 TODO 注释和代码框架）
3. 安装 SDK：`npm install @anthropic-ai/sdk`
4. 测试 `/api/ai/chat` 和 `/api/ai/word-explain`
5. 根据真实 AI 响应格式调整 WordDetailClient 的渲染逻辑（如需 JSON 解析）

无需改动：
- `types/ai.ts`（类型已完备）
- `lib/ai/ai-config.ts`（provider 切换已支持）
- `lib/ai/ai-client.ts`（工厂模式已支持）
- `app/api/ai/*`（API 路由已实现，provider 无关）
- `app/chat/page.tsx`（调用层已就绪）
- `app/word/[slug]/WordDetailClient.tsx`（UI 层已就绪）

---

*Report generated: 2026-06-01*
