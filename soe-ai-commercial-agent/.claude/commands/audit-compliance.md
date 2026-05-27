# /audit-compliance

Run a compliance audit specific to SOE engineering company operations and
Sunrise Ocean Engineering's legal and ethical obligations.

## Step 1: AI Suggestion Labeling

Check that all AI-generated content is labeled in the frontend:

```bash
grep -rn "AI suggestion\|requires human review\|AI generated" frontend/app/ frontend/components/
```

Every page displaying agent reviews, risk assessments, or accounting suggestions
must show a disclaimer. Check these pages manually:
- [ ] `/documents/[id]` — agent review cards
- [ ] `/accounting` — draft account codes
- [ ] `/reports` — risk register, tax compliance tab

## Step 2: Professional Review Warnings

Check that professional review flags appear in UI:

```bash
grep -rn "tax advisor\|legal review\|QS review\|CPA review" frontend/app/ frontend/components/
```

These warnings must appear when:
- [ ] TaxAgent flags WHT risk
- [ ] TaxAgent flags DGT/COR requirement
- [ ] ContractAgent flags legal review
- [ ] QSAgent flags QS certification needed

## Step 3: Prohibited Code Patterns

Scan for patterns that would indicate compliance violations:

```bash
# Should never appear in any service, agent, or route:
grep -rn "evade\|conceal\|hide.*revenue\|off.book\|false.*invoice\|fake.*document\|falsif" \
  backend/ --include="*.py"
# Expected: empty

# Auto-approval patterns — should never exist:
grep -rn "auto_approve\|automatically_approve\|skip_approval" backend/ --include="*.py"
# Expected: empty
```

## Step 4: Indonesia/HK Tax Compliance

Check TaxAgent correctly identifies cross-border risk:

Read `backend/agents/tax_agent.py` and verify:
- [ ] WHT flag triggered when supplier is non-Indonesian + work in Indonesia
- [ ] DGT required flag when HK company receives Indonesia-source income
- [ ] COR required flag for treaty benefits
- [ ] PE risk flag when site presence extended
- [ ] All outputs labeled as "preliminary only — requires Indonesia tax advisor review"

## Step 5: Document Control Rules

Check rules YAML files for completeness:

```bash
cat backend/rules/document_types.yaml | grep -A5 "SUPPLIER_INVOICE:"
cat backend/rules/approval_rules.yaml | grep -A3 "high_value_payment:"
cat backend/rules/tax_rules.yaml | grep -A3 "indonesia_wht:"
```

Verify:
- [ ] High-value payment threshold defined (default: USD 10,000)
- [ ] Indonesia WHT rule present
- [ ] Missing supporting document rule present
- [ ] Duplicate invoice risk rule present

## Step 6: Accounting Draft Immutability

Verify exported drafts cannot be modified:

```bash
grep -n "EXPORTED_TO_ACCOUNTING" backend/services/accounting_service.py
# Verify there is a guard: if draft.status == DraftStatus.EXPORTED_TO_ACCOUNTING: raise HTTPException(409)
```

## Step 7: Compliance Rules Document

Check `docs/COMPLIANCE_RULES.md` exists and covers:
- [ ] Absolute prohibitions (tax evasion, false documents, etc.)
- [ ] Permitted AI assistance scope
- [ ] Professional review requirements by topic
- [ ] Indonesia-specific rules
- [ ] HK-specific rules

## Report Format

```
AREA: Tax Compliance / Document Control / Accounting / UI
ISSUE: [description]
RISK: Regulatory / Reputational / Legal
RECOMMENDATION: [specific fix]
```
