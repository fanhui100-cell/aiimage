# SOE QS Commercial Review Skill

## Purpose

Guide Quantity Surveying (QS) commercial review of engineering project documents
for Sunrise Ocean Engineering Limited, with focus on the Indonesia Jetty Extension Project.

## Scope

- Identify and classify commercial documents: BQ, Quotation, Payment Certificate (PC), Progress Claim, Variation Order (VO)
- Extract contract amount, BQ items, PC certified amounts, retention figures
- Validate claimed amounts against contract sum and approved VOs
- Track cumulative certified amounts vs claimed amounts
- Flag overclaim, under-support, or missing VO
- Retention calculation check

## Out of Scope

- Final QS certification (requires qualified QS professional)
- Contract legal interpretation (→ `soe-contract-review` skill)
- Tax treatment of certified amounts (→ `soe-tax-compliance` skill)
- Accounting entries (→ `soe-accounting-review` skill)

---

## Required Inputs

```python
{
  "document_type": str,             # BQ | PAYMENT_CERTIFICATE | PROGRESS_CLAIM | VARIATION_ORDER | QUOTATION
  "extracted_text": str,
  "extracted_fields": dict,
  "project": {
    "contract_amount": float,
    "currency": str,
    "project_code": str,
  },
  "prior_pcs": list[dict],          # [{pc_number, gross_amount, certified_amount, date}]
  "approved_vos": list[dict],       # [{vo_number, amount, date_approved}]
}
```

---

## Output Format

```python
{
  "commercial_document_type": str,        # BQ | PC | PROGRESS_CLAIM | VO | QUOTATION
  "pc_number": str | None,
  "vo_number": str | None,
  "claim_period": str | None,             # e.g. "2026-04-01 to 2026-04-30"
  "gross_amount": float | None,
  "retention_percentage": float | None,   # e.g. 0.05 for 5%
  "retention_amount": float | None,
  "net_certified_amount": float | None,
  "cumulative_gross_claimed": float | None,
  "cumulative_gross_certified": float | None,
  "contract_sum_reference": float | None,
  "approved_vo_total": float | None,
  "revised_contract_sum": float | None,   # contract_sum + approved_vo_total
  "overclaim_flag": bool,
  "overclaim_amount": float | None,
  "missing_vo_flag": bool,
  "missing_vo_description": str | None,
  "retention_inconsistency_flag": bool,
  "qs_risk_level": str,                   # LOW | MEDIUM | HIGH | CRITICAL
  "qs_flags": list[str],
  "requires_qs_review": bool,
  "qs_review_reason": str | None,
}
```

---

## Validation Rules

### Overclaim Check
```
overclaim = cumulative_gross_claimed > (contract_sum + approved_vo_total)
```
If overclaim: `qs_risk_level = HIGH`, flag `requires_qs_review = True`

### Retention Check
Typical retention for HK/Indonesia engineering contracts:
- 5% during construction
- 2.5% released on Practical Completion
- 2.5% released after Defects Liability Period (DLP)

Flag inconsistency if retention % differs from contract or prior PCs.

### Missing VO Detection
If PC references variation work not covered by an approved VO in `approved_vos`:
- Flag `missing_vo_flag = True`
- Describe in `missing_vo_description`

---

## IDN-JETTY-2026 Specific Context

```
Project:      Indonesia Jetty Extension Project
Type:         Marine/civil engineering — jetty extension
Currency:     USD (contract), possible IDR for local subcontractors
Retention:    Verify against main contract schedule
Key risk:     Variation work scope creep without formal VO approval
```

---

## Compliance Limitations

**Must label all outputs as:** "QS preliminary review — requires confirmation by a qualified Quantity Surveyor before any commercial decision."

**Must NOT:**
- Certify payment amounts
- Approve variation orders
- Issue final account settlements
- Sign off on extension of time (EOT) claims
- Calculate liquidated damages (LD)

**Always flag for qualified QS review when:**
- Final account stage
- VO disputes
- Retention release
- EOT claims
- LD calculations
- Cumulative certified > 80% of contract sum
