# /review-architecture

Review the current SOE AI Commercial Agent implementation against the design spec.

## Reference Documents

- Spec: `docs/superpowers/specs/2026-05-27-soe-ai-commercial-agent-design.md`
- Plan: `docs/superpowers/plans/2026-05-27-soe-ai-commercial-agent-plan.md`

## Review Areas

### 1. Directory Structure Compliance

```bash
# Check required directories exist
ls backend/app/ backend/api/ backend/models/ backend/schemas/ \
   backend/services/ backend/agents/ backend/integrations/llm/ \
   backend/integrations/onedrive/ backend/integrations/accounting/ \
   backend/rules/ backend/storage/ backend/tests/
ls frontend/app/ frontend/components/ frontend/lib/ frontend/types/
```

### 2. Layer Separation

Check that business logic is not leaking into route handlers:
```bash
# Services should not be empty
wc -l backend/services/*.py

# Route handlers should be short
wc -l backend/api/*.py
# If any route file is > 200 lines, it probably has business logic inside
```

### 3. LLM Abstraction Integrity

```bash
# All LLM usage must go through get_llm_client()
grep -rn "get_llm_client\|LLMClient" backend/agents/
grep -rn "import openai\|import anthropic\|import azure" backend/ --include="*.py"
# Second command: expected empty in services/ and agents/
```

### 4. Model Completeness

Verify all 10 models exist:
- company, project, document, extracted_field, review, risk, approval, accounting_draft, audit_log, onedrive_sync

```bash
ls backend/models/
```

### 5. API Route Completeness

Verify all routes from design spec §6 are implemented:
```bash
grep -rn "@router\." backend/api/ | grep -E "get|post|put|patch|delete" | sort
```

Compare against spec §6 checklist.

### 6. YAML Rules Completeness

```bash
ls backend/rules/
# Should have: document_types.yaml, account_mapping.yaml, approval_rules.yaml,
#              risk_rules.yaml, qs_rules.yaml, tax_rules.yaml, filing_rules.yaml
```

### 7. Frontend Route Completeness

```bash
ls frontend/app/\(dashboard\)/
# Should have: upload/, documents/, approvals/, projects/, accounting/, onedrive/, reports/
```

### 8. Environment Variables

```bash
diff <(grep "^[A-Z]" backend/.env.example | sort) \
     <(python -c "from app.config import Settings; print('\n'.join(Settings.model_fields.keys()))" | sort)
# Ideally no diff — every env var in .env.example has a corresponding Settings field
```

## Scoring

Report:
- PASS: Implemented and matches spec
- PARTIAL: Implemented but incomplete or deviating from spec
- MISSING: Not yet implemented (check which phase it belongs to)
- DEVIATION: Implemented differently from spec — explain why and whether spec should be updated
