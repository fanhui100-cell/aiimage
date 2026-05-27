# SOE Accounting Pre-entry Review Skill

## Purpose

Guide accounting classification, draft entry preparation, and supporting document
checks for Sunrise Ocean Engineering Limited financial documents.

## Scope

- Determine whether a document should generate an accounting draft
- Suggest `draft_type`: BILL / SALES_INVOICE / EXPENSE / PAYMENT_SUPPORT / JOURNAL_SUGGESTION
- Suggest account code from `rules/account_mapping.yaml`
- Suggest tracking category (default: "Indonesia Jetty Extension")
- Suggest tax code (preliminary only — requires CPA confirmation)
- Flag missing invoice fields
- Flag duplicate invoice risk
- Prepare `AccountingDraft` row (DRAFT status — never auto-approve)

## Out of Scope

- Final accounting approval (human required)
- Tax filing decisions (→ `soe-tax-compliance` skill)
- QS certification (→ `soe-qs-commercial-review` skill)
- Xero data entry (→ `soe-xero-adapter` skill)

---

## Required Inputs

```python
{
  "document_type": str,           # from DocumentType enum
  "extracted_fields": dict,       # supplier_name, invoice_number, amount, currency, date, etc.
  "extracted_text": str,
  "project_code": str | None,
  "existing_drafts": list[dict],  # for duplicate check: [{supplier, invoice_number, amount}]
}
```

---

## Output Format

```python
{
  "should_create_accounting_draft": bool,
  "draft_type": str,                         # BILL | SALES_INVOICE | EXPENSE | PAYMENT_SUPPORT | JOURNAL_SUGGESTION
  "counterparty_name": str | None,
  "invoice_number": str | None,
  "invoice_date": str | None,                # ISO date
  "due_date": str | None,
  "currency": str,                           # USD | HKD | IDR
  "amount": float | None,
  "tax_amount": float | None,
  "suggested_account_code": str,
  "suggested_tax_code": str,
  "suggested_tracking_category": str,        # default: "Indonesia Jetty Extension"
  "description": str,
  "required_supporting_documents": list[str],
  "duplicate_risk": bool,
  "duplicate_reason": str | None,
  "missing_fields": list[str],               # fields required but not found
  "accounting_risk_level": str,              # LOW | MEDIUM | HIGH | CRITICAL
  "requires_cpa_review": bool,
  "cpa_review_reason": str | None,
}
```

---

## Account Code Mapping (from rules/account_mapping.yaml)

| Document Type | Suggested Account Code |
|---|---|
| SUPPLIER_INVOICE (subcontractor) | Direct Cost - Subcontractor |
| SUPPLIER_INVOICE (materials) | Direct Cost - Materials |
| SUPPLIER_INVOICE (plant/equipment) | Direct Cost - Plant and Equipment |
| PAYMENT_CERTIFICATE (received) | Contract Revenue |
| SALES_INVOICE | Contract Revenue |
| EXPENSE / RECEIPT | Project Travel Expense or Professional Fees |
| PAYROLL_SUPPORT | [requires CPA review] |

## Duplicate Risk Check

Flag as `duplicate_risk=True` if any of these match an existing draft:
- Same `supplier_name` + `invoice_number`
- Same `supplier_name` + `amount` + `invoice_date` (within ±3 days)
- Same `sha256_hash` as an existing document

---

## Required Supporting Documents by Type

| Type | Required Support |
|---|---|
| SUPPLIER_INVOICE | Contract or PO, Work completion evidence, Payment approval |
| PAYMENT_CERTIFICATE | Client approval, DGT/COR if cross-border |
| EXPENSE | Receipt, Project justification |
| BANK_SLIP | Linked invoice or PC |

---

## Compliance Limitations

**Must label all outputs as:** "AI accounting suggestion — requires human review and CPA confirmation before any accounting entry is created."

**Must NOT:**
- Approve any accounting draft automatically
- Confirm tax treatment without CPA review
- Create final ledger entries
- Modify approved or exported accounting records
- Recommend tax positions that reduce liability through non-compliant means
- Suggest splitting invoices to avoid approval thresholds

**Always flag for CPA review when:**
- Manual journals suggested
- Payroll-related entries
- Tax code is uncertain
- Amount > USD 50,000
- Cross-border payments with withholding tax implications
