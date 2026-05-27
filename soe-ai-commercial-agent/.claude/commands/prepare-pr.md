# /prepare-pr

Prepare a pull request for SOE AI Commercial Agent changes.

## Pre-PR Checklist

### 1. Tests Pass

```bash
cd backend
poetry run pytest -v
# All tests must be green

cd frontend
npm run build
# Zero TypeScript errors
```

### 2. Critical Security Check

```bash
# No vendor SDK in wrong layer
grep -rn "import openai\|from openai\|import anthropic\|from anthropic" backend/services/ backend/agents/
# Expected: empty output

# No secrets committed
git diff --staged | grep -i "api_key\|password\|secret\|token" | grep "+"
# Expected: empty (no new secret values added)
```

### 3. Audit Log Coverage

For any new mutation route or service function, verify AuditLog is written.

### 4. Migration Check

If models changed:
```bash
cd backend
poetry run alembic check
# Should show: "No new upgrade operations detected" (migration already generated and applied)
```

### 5. Compliance Disclaimers

If new AI output displayed in UI:
- Verify "AI suggestion — requires human review" label added
- Verify professional review warning where applicable

## PR Description Template

```markdown
## Summary
- [What changed and why]
- [Phase X of implementation plan]

## Changes
- `backend/...` — [description]
- `frontend/...` — [description]

## Test Plan
- [ ] `poetry run pytest -v` passes
- [ ] `npm run build` passes (zero TS errors)
- [ ] No vendor SDK imports in services/agents (grep check)
- [ ] Audit log written for [action] (verified manually)
- [ ] LLM_PROVIDER=mock works without credentials (confirmed)

## Compliance
- [ ] No auto-approval logic added
- [ ] AI suggestions labeled in UI
- [ ] Professional review warnings present where applicable

## Migration
- [ ] No migration needed
- [ ] Migration generated: `alembic/versions/{hash}_description.py`
- [ ] Migration tested on SQLite locally

🤖 Generated with Claude Code (claude-sonnet-4-6)
```

## What NOT to include in PR

- Actual `.env` file or real credentials
- Files from `backend/storage/`
- Any auto-generated `requirements.txt` from pip
- Binary files or large test documents
