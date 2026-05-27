# SOE Security Audit Skill

## Purpose

Guide security and compliance auditing of the SOE AI Commercial Agent codebase,
focusing on secret management, import boundaries, audit trail completeness,
approval gate enforcement, and compliance with Sunrise Ocean Engineering's
data protection obligations.

## Scope

- Secret scanning (hardcoded credentials)
- LLM vendor SDK import boundary check
- AuditLog coverage verification
- Approval gate enforcement check
- File storage security
- OneDrive write protection verification
- Compliance rule enforcement in code

## Out of Scope

- Network penetration testing
- Infrastructure security (server hardening, firewall)
- User authentication and identity management (V1 has no auth)
- Data encryption at rest (deferred to production deployment)

---

## Audit Checklist

### 1. Secret Management

```bash
# No real credentials committed
git ls-files | grep "\.env$"                   # Expected: empty
git log --all --full-history -- "*.env"         # Check history too

# No hardcoded secrets in source
grep -rn "sk-[a-zA-Z0-9]\{20,\}" backend/ frontend/ --include="*.py" --include="*.ts"
grep -rn "api_key\s*=\s*['\"][a-zA-Z0-9]\{16,\}" backend/ --include="*.py"
```

Pass criteria: No real credential values in any tracked file or git history.

### 2. LLM Import Boundary

```bash
# Must be empty — no vendor SDK in services/ or agents/
grep -rn "import openai\|from openai\|import anthropic\|from anthropic\|import azure\|from azure" \
  backend/services/ backend/agents/

# Must be empty — MSAL only in onedrive integration
grep -rn "import msal\|from msal" backend/services/ backend/agents/ backend/api/
```

Pass criteria: Both commands produce no output.

### 3. AuditLog Coverage

Verify AuditLog writes in:
```bash
grep -n "audit_service\|log_action\|AuditLog" \
  backend/services/approval_service.py \
  backend/services/accounting_service.py \
  backend/services/document_review_service.py \
  backend/api/routes_documents.py
```

Required events:
- [ ] Document upload → AuditLog
- [ ] Document status change → AuditLog
- [ ] Approval decision (any status) → AuditLog
- [ ] AccountingDraft created → AuditLog
- [ ] AccountingDraft status change → AuditLog
- [ ] AccountingDraft exported → AuditLog

### 4. Approval Gate

```bash
grep -n "accounting_adapter\|create_draft_bill\|create_draft_invoice\|export" \
  backend/services/accounting_service.py
```

Every adapter call must be guarded by:
```python
if draft.status != DraftStatus.APPROVED_FOR_EXPORT:
    raise HTTPException(status_code=403, detail="Draft must be approved for export first")
```

### 5. File Storage

```bash
cat backend/.gitignore | grep -E "storage|uploads|\.env"
git ls-files backend/storage/    # Expected: empty
```

Pass criteria: `storage/` directory contents are never tracked.

### 6. OneDrive Write Protection

```bash
grep -rn "DELETE\|PATCH\|PUT" backend/integrations/onedrive/ --include="*.py"
```

Pass criteria: No write HTTP methods in OneDrive integration code.

### 7. Prompt Logging Disabled

```bash
grep -rn "ENABLE_PROMPT_LOGGING" backend/app/ backend/integrations/llm/
# Verify: logging is conditional on ENABLE_PROMPT_LOGGING=true (default: false)

grep -rn "prompt.*log\|log.*prompt\|completion.*log" backend/ --include="*.py"
# Verify: no unconditional prompt/completion logging
```

---

## Severity Classification

| Severity | Examples |
|---|---|
| CRITICAL | Real API key in committed file, approval gate bypassed, auto-payment code |
| HIGH | Vendor SDK in services layer, audit log missing for financial action, OneDrive write call |
| MEDIUM | Missing disclaimer in UI, prompt logging enabled by default, weak secret pattern |
| LOW | Documentation gap, minor code style issue |

---

## Report Format

```
SEVERITY: HIGH
LOCATION: backend/services/accounting_service.py:89
FINDING: AccountingAdapter.create_draft_bill() called without checking draft.status == APPROVED_FOR_EXPORT
RISK: AI could create Xero bills without human review in future Xero integration
FIX: Add status check before adapter call; raise HTTP 403 if not approved
```

---

## Compliance Limitations

This skill identifies code-level security and compliance issues.
It does not replace:
- Professional cybersecurity assessment
- Legal data protection compliance review (PDPO HK, UU PDP Indonesia)
- Financial audit by qualified CPA
- Company data governance policy review
