# Claude Code Extensions Guide
# SOE AI Commercial Agent

This document explains how to use the Claude Code customization layer for
the SOE AI Commercial Agent project.

---

## Overview

The `.claude/` directory contains project-specific customizations for Claude Code:

```
.claude/
  CLAUDE.md          ← loaded automatically every session (key rules and context)
  settings.json      ← hooks wiring and permissions
  agents/            ← 11 specialist sub-agents
  commands/          ← 10 slash commands
  hooks/             ← 6 automation scripts (pre/post tool-use, stop)
  skills/            ← 9 domain knowledge reference documents
```

---

## Sub-Agents (.claude/agents/)

Sub-agents are specialized Claude Code personas invoked automatically based on
the task at hand, or explicitly by mentioning their name.

| Agent | When Invoked |
|---|---|
| `backend-architect` | Designing service layer, dependency injection, app structure |
| `database-engineer` | SQLAlchemy models, Alembic migrations, schema changes |
| `api-engineer` | FastAPI routes, Pydantic schemas, HTTP design |
| `frontend-nextjs-engineer` | Next.js pages, TypeScript, Tailwind, shadcn/ui |
| `ai-agent-orchestrator` | LLMClient abstraction, 10 specialist agents, review pipeline |
| `accounting-adapter-engineer` | AccountingAdapter, MockAdapter, Xero placeholder |
| `onedrive-integration-engineer` | Microsoft Graph, OneDrive sync, webhook |
| `security-compliance-auditor` | Security review, import boundaries, audit trail |
| `test-engineer` | pytest, fixtures, test strategy |
| `documentation-writer` | README, architecture docs, API specs |
| `engineering-domain-reviewer` | QS/BQ/PC/VO, HK/Indonesia engineering domain |

**How to invoke explicitly:**
Simply describe the task — Claude Code selects the appropriate sub-agent.
Or say: "Use the database-engineer agent to add the new model."

---

## Slash Commands (.claude/commands/)

Slash commands are invoked with `/command-name` in the Claude Code prompt.

| Command | Purpose |
|---|---|
| `/build-v1` | Full Phase 1–10 build sequence with gates |
| `/review-architecture` | Check implementation against design spec |
| `/add-api-route` | Standard pattern for adding FastAPI routes |
| `/add-db-model` | Standard pattern for models + Alembic migrations |
| `/add-nextjs-page` | Standard pattern for Next.js dashboard pages |
| `/run-tests` | Run pytest suite with critical checks |
| `/audit-security` | Security audit: secrets, imports, audit logs, approval gates |
| `/audit-compliance` | Compliance audit: AI labels, WHT flags, prohibited patterns |
| `/prepare-pr` | Pre-PR checklist + PR description template |
| `/update-docs` | Documentation sync after code changes |

**Usage:**
```
/build-v1
/add-api-route
/audit-security
```

---

## Hooks (.claude/hooks/)

Hooks run automatically around tool use. They are wired in `.claude/settings.json`.

| Hook | Trigger | Purpose |
|---|---|---|
| `pre-tool-use-security-check.sh` | Before Bash/Edit/Write | Blocks dangerous operations: `rm -rf storage/`, force push, auto-approval patterns, direct accounting API calls |
| `secret-scan.sh` | Before Edit/Write | Scans content for hardcoded API keys, passwords, client secrets |
| `post-edit-format-and-test.sh` | After Edit/Write (Python files) | Runs health test to confirm nothing catastrophically broken |
| `post-api-change-test.sh` | After Edit/Write (route files) | Runs API tests + vendor import check after route changes |
| `post-model-change-test.sh` | After Edit/Write (model files) | Checks for pending Alembic migrations after model changes |
| `stop-final-checklist.sh` | On session stop | Prints session completion checklist to stderr |

### What Hooks Block

The pre-tool-use hook will block and explain:
- `rm -rf` on company storage directory
- `git push --force` or `git reset --hard`
- Code patterns matching `auto_approve` or `skip_approval`
- Direct curl/wget calls to Xero, Stripe, or PayPal APIs
- Writing directly to `.env` file
- Writing directly to `storage/uploads/` (use `file_storage_service` instead)

The secret-scan hook will block:
- OpenAI API keys (`sk-...`)
- Anthropic API keys (`sk-ant-...`)
- Azure connection strings
- Hardcoded `api_key`, `secret`, `password` with non-placeholder values
- Microsoft `client_secret` values

### Adjusting Hook Behavior

Edit `.claude/settings.json` to disable or modify hooks.
To temporarily bypass a hook during development, comment out the relevant entry
in `settings.json` — but restore it before committing.

---

## Domain Skills (.claude/skills/)

Skills are reference documents for domain-specific logic. They define:
- Scope and out-of-scope boundaries
- Required inputs and output format
- Business rules and validation logic
- Compliance limitations and professional review triggers

**Note:** These are knowledge documents, not executable code. They inform
how Claude Code implements agent logic, not superpowers plugin skills.

| Skill | Domain |
|---|---|
| `soe-document-control` | Filing, naming, classification, completeness |
| `soe-accounting-review` | Accounting pre-entry, account codes, draft preparation |
| `soe-qs-commercial-review` | BQ/PC/VO review, retention, overclaim detection |
| `soe-contract-review` | Contract terms, risk clauses, missing provisions |
| `soe-tax-compliance` | Indonesia/HK WHT, DGT/COR, PE risk |
| `soe-onedrive-sync` | Microsoft Graph, full/delta sync, webhook |
| `soe-xero-adapter` | Future Xero OAuth, draft bill/invoice creation |
| `soe-security-audit` | Secret scanning, import boundaries, approval gates |
| `soe-report-generation` | Report types, data sources, monthly closing checklist |

**How to reference a skill:**
Say: "Follow the soe-tax-compliance skill to implement the TaxAgent review output."

---

## Settings.json Permissions

`.claude/settings.json` also configures auto-allowed and auto-denied Bash commands:

**Auto-allowed (no confirmation prompt):**
- `poetry install*`, `poetry run*`
- `npm install*`, `npm run*`
- `alembic*`
- `git status`, `git diff*`, `git log*`, `git add*`, `git commit*`

**Auto-denied:**
- `rm -rf*`
- `git push --force*`
- `git reset --hard*`

---

## Future: MCP Servers

When the following MCP servers are available, they will extend Claude Code's
capabilities for this project:

| MCP Server | Purpose |
|---|---|
| `mcp-onedrive` | Direct OneDrive/SharePoint file browsing during development |
| `mcp-xero` | Read-only Xero data inspection for adapter development |
| `mcp-postgres` | Direct database inspection without writing SQL manually |

MCP server configuration will go in `.claude/settings.json` under `"mcpServers"`.

---

## Adding New Customizations

### Add a new sub-agent
Create `.claude/agents/{name}.md` with YAML frontmatter:
```markdown
---
name: agent-name
description: When to invoke this agent — be specific
tools: Read, Edit, Write, Bash, Grep, Glob
---
# Agent Name
[instructions]
```

### Add a new slash command
Create `.claude/commands/{name}.md`:
```markdown
# /command-name
[Description and steps]
```

### Add a new hook
1. Create `.claude/hooks/{name}.sh`
2. Make it executable: `chmod +x .claude/hooks/{name}.sh`
3. Register in `.claude/settings.json` under the appropriate event type

### Add a new domain skill
Create `.claude/skills/{skill-name}/SKILL.md` following the structure:
- Purpose, Scope, Out of Scope
- Required Inputs
- Output Format
- Business Rules
- Compliance Limitations
