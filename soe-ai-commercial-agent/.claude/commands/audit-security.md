# /audit-security

Run a security audit on the SOE AI Commercial Agent codebase.

## Step 1: Secret Scan

Check for hardcoded secrets in Python and TypeScript:

```bash
# API keys and tokens
grep -rn "sk-\|Bearer \|api_key\s*=\s*['\"][^'\"]\|password\s*=\s*['\"][^'\"]" \
  backend/ frontend/ --include="*.py" --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.venv

# Check .env files are not committed
git ls-files | grep "\.env$"
# Expected: empty (only .env.example should be tracked)
```

## Step 2: Import Boundary Check

No vendor SDK may appear in services/ or agents/:

```bash
echo "=== Checking for vendor SDK imports in services/ ==="
grep -rn "import openai\|from openai\|import anthropic\|from anthropic\|import azure\|from azure\|import msal\|from msal" \
  backend/services/ backend/agents/
# Expected: empty

echo "=== Checking LLM imports in agents are via abstraction ==="
grep -rn "from integrations.llm" backend/agents/
# Expected: each agent file appears here
```

## Step 3: Audit Log Coverage

Every critical mutation must log to AuditLog:

```bash
echo "=== Checking audit_service usage in services/ ==="
grep -rn "audit_service\|log_action\|AuditLog" backend/services/
# Expected: appears in approval_service, accounting_service, document_review_service
```

Manually verify these operations all write audit logs:
- [ ] Document upload
- [ ] Approval decision (approve/reject/flag)
- [ ] AccountingDraft status changes
- [ ] AccountingDraft export

## Step 4: Approval Gate Check

No AccountingAdapter call without prior approval status check:

```bash
grep -n "accounting_adapter\|create_draft_bill\|create_draft_invoice" backend/services/accounting_service.py
# Verify each call is preceded by: if draft.status != DraftStatus.APPROVED_FOR_EXPORT
```

## Step 5: File Storage Check

Uploaded files must be outside source code and gitignored:

```bash
cat backend/.gitignore | grep storage
# Expected: storage/ appears

ls backend/storage/uploads/ 2>/dev/null | head -5
# Files should be here, not in tracked source
```

## Step 6: OneDrive Read-Only Check

When `ONEDRIVE_ENABLED=true` is eventually activated:

```bash
grep -rn "delete\|move\|rename\|patch\|put" backend/integrations/onedrive/
# Verify no write operations on OneDrive items
```

## Report Format

List issues as:
```
SEVERITY: HIGH
LOCATION: backend/services/accounting_service.py:67
ISSUE: [description]
FIX: [specific recommendation]
```

Severity guide:
- HIGH: Secret exposed, vendor SDK in wrong layer, approval gate bypassed
- MEDIUM: Missing audit log, unclear disclaimer
- LOW: Code style, documentation gap
