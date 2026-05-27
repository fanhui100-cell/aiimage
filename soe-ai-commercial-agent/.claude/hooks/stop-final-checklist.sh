#!/usr/bin/env bash
# Stop hook: final checklist printed when Claude finishes a task session.
# This is a reminder only — does not block.

set -euo pipefail

cat >&2 << 'CHECKLIST'

══════════════════════════════════════════════════════════════════
SOE AI Commercial Agent — Session Completion Checklist
══════════════════════════════════════════════════════════════════

Before considering this session complete, verify:

CODE QUALITY
  □ No vendor SDK (openai, anthropic, msal) imported in services/ or agents/
    → grep -rn "import openai\|from openai\|import anthropic" backend/services/ backend/agents/

  □ All critical actions write AuditLog entries
    → grep -rn "audit_service\|log_action" backend/services/

  □ LLM_PROVIDER=mock works without external credentials
    → poetry run pytest tests/test_llm_provider_mock.py -v

TESTS
  □ Backend tests pass
    → cd backend && poetry run pytest -v

  □ Frontend TypeScript builds clean
    → cd frontend && npm run build

SECRETS & SECURITY
  □ No secrets committed (.env not tracked)
    → git ls-files | grep "\.env$"  ← expected: empty

  □ storage/ not committed
    → git ls-files | grep "^backend/storage/"  ← expected: empty

DATABASE
  □ Migrations generated and applied if models changed
    → cd backend && poetry run alembic current

COMPLIANCE
  □ AI suggestions labeled in UI ("AI suggestion — requires human review")
  □ Professional review warnings shown for tax/legal/QS content
  □ No auto-approval logic introduced

DOCUMENTATION
  □ README updated if new features added
  □ .env.example updated if new env vars added
  □ TypeScript types in frontend/types/index.ts match backend schemas

══════════════════════════════════════════════════════════════════
CHECKLIST

exit 0
