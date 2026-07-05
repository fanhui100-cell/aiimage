# LexiOcean AI Integration Guide

**Phase 3A — AI Foundation**
**Date:** 2026-06-01

---

## Architecture Overview

```
Frontend (Client)
  │
  ├── /chat page ──────────────────── fetch POST /api/ai/chat
  └── /word/[slug] page ───────────── fetch POST /api/ai/word-explain
                                             ↓
                               app/api/ai/* (Next.js Route Handlers)
                                             ↓
                               lib/ai/ai-client.ts  ← factory
                                             ↓
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
             MockProvider           OpenAIProvider           AnthropicProvider
             (full impl)            (skeleton)                (skeleton)
                                                                      │
                                                             GeminiProvider
                                                             (skeleton)
```

**Key principle:** API keys never leave the server. Client components only call `/api/ai/*` routes via `fetch()`.

---

## Provider System

### AIProvider Interface (`lib/ai/ai-provider.ts`)

All providers implement the same 5 methods:

| Method | Purpose |
|---|---|
| `chat(messages, context)` | Conversational AI tutor |
| `explainWord(request)` | Vocabulary deep-dive explanation |
| `generateQuiz(request)` | Quiz question generation |
| `analyzeMistakes(request)` | Wrong-answer pattern analysis |
| `generateStudyPlan(request)` | Personalized study plan |

### Switching Providers

Set `AI_PROVIDER` in `.env.local`:

```bash
# Use mock (default — no API key needed)
AI_PROVIDER=mock

# Use OpenAI (requires OPENAI_API_KEY)
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...

# Use Anthropic Claude (requires ANTHROPIC_API_KEY)
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Use Google Gemini (requires GEMINI_API_KEY)
AI_PROVIDER=gemini
GEMINI_API_KEY=AIza...
```

The factory in `lib/ai/ai-client.ts` automatically selects the correct provider at runtime.

---

## Configuring .env.local

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your values. **Never commit `.env.local` to git** — it is already in `.gitignore`.

Available variables:

| Variable | Default | Description |
|---|---|---|
| `AI_PROVIDER` | `mock` | Which provider to use |
| `OPENAI_API_KEY` | _(empty)_ | OpenAI API key |
| `ANTHROPIC_API_KEY` | _(empty)_ | Anthropic Claude API key |
| `GEMINI_API_KEY` | _(empty)_ | Google Gemini API key |
| `AI_MODEL` | _(provider default)_ | Model override |
| `AI_MAX_OUTPUT_TOKENS` | `1024` | Max tokens per response |
| `AI_ENABLE_CACHE` | `true` | Enable response caching |

---

## API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/ai/chat` | POST | Conversational AI tutor |
| `/api/ai/word-explain` | POST | Word explanation |
| `/api/ai/quiz-generate` | POST | Quiz generation |
| `/api/ai/mistake-analysis` | POST | Error pattern analysis |
| `/api/ai/study-plan` | POST | Study plan generation |

### Request / Response Formats

**POST /api/ai/chat**
```json
// Request
{
  "messages": [
    { "role": "user", "content": "What does ephemeral mean?" }
  ],
  "context": {
    "userLevel": "intermediate",
    "language": "bilingual"
  }
}

// Response (200 OK)
{
  "content": "**ephemeral** /ɪˈfem.ər.əl/ ...",
  "provider": "mock",
  "cached": false
}

// Error Response (4xx/5xx)
{
  "error": {
    "code": "invalid_input",
    "message": "messages array is required",
    "retryable": false
  }
}
```

**POST /api/ai/word-explain**
```json
// Request
{ "word": "ubiquitous", "userLevel": "advanced" }

// Response (200 OK)
{ "content": "**ubiquitous** ...", "provider": "mock", "cached": false }
```

---

## Current AI Status by Feature

| Feature | Page | Status | Notes |
|---|---|---|---|
| AI Chat | `/chat` | ✅ Connected | Calls `/api/ai/chat`, falls back to local mock on error |
| Word Explain | `/word/[slug]` | ✅ Connected | "Ask AI" button, calls `/api/ai/word-explain` |
| Quiz Generation | `/quiz` | 🔲 Mock only | API route ready, frontend not yet wired |
| Mistake Analysis | `/memory` | 🔲 Mock only | API route ready, frontend not yet wired |
| Study Plan | `/study` | 🔲 Mock only | API route ready, frontend not yet wired |
| Scan OCR | `/scan` | 🔲 Mock only | Phase 3D — real OCR integration |

---

## Prompt Templates (`lib/ai/prompts/`)

Each prompt file exports a `build*Messages()` function that constructs an `AIMessage[]` array for real AI providers.

| File | Function | Used by |
|---|---|---|
| `chat-tutor.ts` | `buildChatTutorMessages()` | OpenAI/Anthropic/Gemini chat |
| `word-explanation.ts` | `buildWordExplanationMessages()` | Word explain providers |
| `quiz-generation.ts` | `buildQuizGenerationMessages()` | Quiz generation |
| `mistake-analysis.ts` | `buildMistakeAnalysisMessages()` | Error analysis |
| `study-plan.ts` | `buildStudyPlanMessages()` | Study planning |

The mock provider does **not** use these prompts — it generates its own responses internally. When real providers are connected in Phase 3B, these prompts will be passed to the provider APIs.

---

## Phase Roadmap

### Phase 3A (Current) — Foundation
- [x] AI provider abstraction layer
- [x] Mock provider (full bilingual responses)
- [x] Real provider skeletons (OpenAI, Anthropic, Gemini)
- [x] 5 API routes with input validation
- [x] Chat page wired to `/api/ai/chat`
- [x] Word detail page "Ask AI" button
- [x] In-memory cache placeholder
- [x] Error normalization layer

### Phase 3B — Real Provider Integration
- [ ] Implement one real provider (recommend Anthropic claude-haiku-4-5-20251001)
- [ ] Parse structured JSON responses from real AI
- [ ] Add response caching to reduce API costs
- [ ] Wire Quiz page to `/api/ai/quiz-generate`
- [ ] Wire Memory page to `/api/ai/mistake-analysis`

### Phase 3C — Cost & Safety
- [ ] Replace in-memory cache with Vercel KV or Redis
- [ ] Add per-user rate limiting
- [ ] Add request logging and monitoring
- [ ] Add token usage tracking

### Phase 3D — Advanced Features
- [ ] Wire Study page to `/api/ai/study-plan`
- [ ] Real OCR for Scan Hollow (`/scan`)
- [ ] AI-powered reading annotation
- [ ] Voice/pronunciation AI feedback

---

## API Key Security

1. **Never hardcode API keys** in source files
2. **Never prefix** with `NEXT_PUBLIC_` — this exposes keys to the browser
3. **Store in `.env.local`** — already gitignored by Next.js
4. **Server-side only** — `lib/ai/` is never imported by client components
5. **Rotate keys** if you suspect exposure
6. **Set spending limits** on your AI provider dashboard before enabling real providers

---

## Adding a New Provider

1. Create `lib/ai/providers/my-provider.ts` implementing `AIProvider`
2. Add `'my-provider'` to `AIProviderName` in `types/ai.ts`
3. Add the case to `createAIClient()` in `lib/ai/ai-client.ts`
4. Add the env var to `.env.example`

The system will automatically use the new provider when `AI_PROVIDER=my-provider` is set.
