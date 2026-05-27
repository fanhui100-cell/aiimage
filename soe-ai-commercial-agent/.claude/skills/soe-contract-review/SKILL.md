# SOE Contract Review Skill

## Purpose

Guide preliminary contract analysis for engineering contracts entered into by
Sunrise Ocean Engineering Limited, identifying key terms, risk clauses, and
missing provisions requiring legal attention.

## Scope

- Extract contract parties, amount, currency, governing law
- Extract payment terms, retention terms, variation procedure
- Extract tax clauses and withholding tax provisions
- Identify signature and execution status
- Flag unfavorable, unusual, or missing clauses
- Identify clauses requiring legal professional review

## Out of Scope

- Legal advice or legal opinion (requires qualified solicitor)
- Final contract execution decisions
- Tax treatment of contract payments (→ `soe-tax-compliance` skill)
- QS commercial valuation (→ `soe-qs-commercial-review` skill)

---

## Required Inputs

```python
{
  "document_type": str,        # CONTRACT | CONTRACT_APPENDIX
  "extracted_text": str,
  "original_filename": str,
  "project_code": str | None,
}
```

---

## Output Format

```python
{
  "contract_parties": {
    "employer": str | None,
    "contractor": str | None,
    "engineer_or_qs": str | None,
  },
  "contract_amount": float | None,
  "currency": str | None,
  "contract_date": str | None,
  "governing_law": str | None,            # e.g. "Hong Kong law", "Indonesian law"
  "dispute_resolution": str | None,       # e.g. "HKIAC arbitration", "Indonesian courts"
  "payment_terms": {
    "interim_payment_days": int | None,   # e.g. 30
    "final_payment_days": int | None,
    "payment_on_certification": bool | None,
  },
  "retention_terms": {
    "retention_percentage": float | None,
    "pc_release_percentage": float | None,
    "dlp_release_percentage": float | None,
    "dlp_period_months": int | None,
  },
  "variation_procedure": str | None,
  "tax_clause_present": bool,
  "wht_addressed": bool,                  # Indonesia WHT explicitly mentioned?
  "signature_status": {
    "employer_signed": bool | None,
    "contractor_signed": bool | None,
    "dated": bool | None,
    "stamped": bool | None,
  },
  "risk_flags": list[str],
  "missing_clauses": list[str],
  "contract_risk_level": str,             # LOW | MEDIUM | HIGH | CRITICAL
  "requires_legal_review": bool,
  "legal_review_reason": str | None,
}
```

---

## Key Risk Flags for HK Engineering Companies

| Clause | Risk if missing/unfavorable |
|---|---|
| Variation procedure | No entitlement to payment for extra work |
| Payment certification | Subjective client discretion on payment |
| Dispute resolution | Forced into Indonesian court jurisdiction |
| WHT clause | Unexpected tax deduction on payments |
| PE clause | Unintended permanent establishment in Indonesia |
| Force majeure | No relief for Covid/weather/political events |
| Liability cap | Unlimited exposure |
| DLP and defects | Open-ended liability period |

## Unfavorable Terms to Flag

- Payment > 60 days net (cash flow risk for engineering company)
- No variation order procedure defined
- No dispute resolution or Indonesian courts only
- Governing law is Indonesian law without arbitration clause
- No WHT provision despite cross-border service payments
- Liquidated damages > 10% of contract value
- No practical completion (PC) or taking-over certificate defined
- Employer has unilateral right to terminate without compensation

---

## Compliance Limitations

**Must label all outputs as:** "Preliminary contract review — requires review by a qualified solicitor before execution or reliance on any contract term."

**Must NOT:**
- Provide legal advice or legal opinions
- Confirm legal enforceability of any clause
- Advise on litigation strategy
- Draft contract terms (this is legal professional work)
- Certify that a contract is compliant with Indonesian or HK law

**Always flag for legal review when:**
- Contract value > USD 100,000
- Governing law is Indonesian law
- Dispute resolution clause is absent or unfavorable
- Unusual indemnity or liability provisions
- Government or SOE counterparty (Indonesia state entities)
- Construction permit or concession conditions attached
