# SOE AI Commercial Agent — Claude Code Project Instructions
# Sunrise Ocean Engineering Limited / 旭海洋工程有限公司

## Project Overview

This is an internal Engineering Commercial Management AI System for Sunrise Ocean Engineering.
It covers document control, contract management, QS/BQ/PC/VO commercial management,
accounting pre-entry review, tax compliance, supplier control, and reporting.

Current pilot project: **Indonesia Jetty Extension Project (IDN-JETTY-2026)**

Design spec: `docs/superpowers/specs/2026-05-27-soe-ai-commercial-agent-design.md`
Implementation plan: `docs/superpowers/plans/2026-05-27-soe-ai-commercial-agent-plan.md`

---

## Stack

- **Backend:** Python 3.13, Poetry, FastAPI, SQLAlchemy 2.x, Alembic, Pydantic v2
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Database:** SQLite (local dev) / PostgreSQL (production), switched via DATABASE_URL
- **LLM:** Provider-agnostic — default `LLM_PROVIDER=mock`, no credentials needed for V1
- **File upload:** Browser → FastAPI directly (no Next.js proxy)

---

## Non-Negotiable Rules

1. **Never auto-approve** accounting entries, invoices, or bills
2. **Never auto-pay** suppliers
3. **Never delete, move, or rename** original company documents automatically
4. **Never import** `openai`, `anthropic`, or `msal` directly in `services/` or `agents/`
   — all LLM calls must go through `integrations/llm/base.py → LLMClient`
5. **Never commit secrets** — all keys via `.env` only
6. **Never assist** with tax evasion, false invoices, hidden revenue, or forged documents
7. **Every AI suggestion** must be labeled as a suggestion pending human confirmation
8. **Every critical action** must write an `AuditLog` row
9. **Poetry only** — do not create or manually edit `requirements.txt`
10. **Python 3.13** — pinned in `pyproject.toml` as `>=3.13,<3.14`

---

## Key File Locations

```
backend/
  app/main.py              ← FastAPI entry point
  app/config.py            ← all env var settings
  integrations/llm/base.py ← LLMClient interface — agents call this only
  integrations/llm/__init__.py ← get_llm_client() factory
  agents/orchestrator_agent.py ← top-level review dispatcher
  rules/*.yaml             ← classification and compliance rules
  storage/uploads/         ← uploaded files (gitignored)

frontend/
  app/(dashboard)/         ← all pages
  lib/api.ts               ← all fetch calls to localhost:8000
  types/index.ts           ← TypeScript types mirroring Pydantic schemas
```

---

## Common Commands

```bash
# Backend
cd backend
poetry install
cp .env.example .env
poetry run python scripts/init_db.py
poetry run uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev

# Tests
cd backend && poetry run pytest -v

# Add LLM provider
poetry install --extras openai
# then set LLM_PROVIDER=openai in .env
```

---

## Sub-Agents Available

See `.claude/agents/` for specialized sub-agents:
- `backend-architect` — FastAPI structure, service design
- `database-engineer` — SQLAlchemy models, Alembic migrations
- `api-engineer` — FastAPI routes, Pydantic schemas
- `frontend-nextjs-engineer` — Next.js pages, TypeScript, shadcn/ui
- `ai-agent-orchestrator` — LLMClient abstraction, agent design
- `accounting-adapter-engineer` — AccountingAdapter, MockAdapter, Xero placeholder
- `onedrive-integration-engineer` — Microsoft Graph, sync, webhooks
- `security-compliance-auditor` — security review, compliance checks
- `test-engineer` — pytest, coverage, test structure
- `documentation-writer` — docs, README, API specs
- `engineering-domain-reviewer` — QS/BQ/PC/VO, HK/Indonesia engineering domain

## Slash Commands Available

See `.claude/commands/` — e.g. `/build-v1`, `/add-api-route`, `/add-db-model`,
`/audit-compliance`, `/audit-security`, `/prepare-pr`

## Domain Skills Available

See `.claude/skills/` — e.g. `soe-document-control`, `soe-accounting-review`,
`soe-tax-compliance`, `soe-qs-commercial-review`
