# SOE Document Control Skill

## Purpose

Guide document filing, naming, classification, and completeness checks for
Sunrise Ocean Engineering Limited company documents.

## Scope

- Document type classification (35 types defined in `rules/document_types.yaml`)
- Recommended filing path generation
- Recommended standardized filename generation
- Signature/stamp completeness check
- Missing document identification
- Scan quality assessment

## Out of Scope

- Accounting treatment (→ use `soe-accounting-review` skill)
- Tax analysis (→ use `soe-tax-compliance` skill)
- QS commercial review (→ use `soe-qs-commercial-review` skill)

---

## Required Inputs

```python
{
  "original_filename": str,
  "file_extension": str,          # pdf, xlsx, docx, jpg, etc.
  "extracted_text": str,          # from text_extraction_service
  "project_code": str | None,     # e.g. "IDN-JETTY-2026"
  "source_type": str,             # "MANUAL_UPLOAD" | "ONEDRIVE"
}
```

---

## Output Format

```python
{
  "document_type": str,                    # from DocumentType enum
  "classification_confidence": float,      # 0.0–1.0
  "filing_category": str,                  # e.g. "Commercial / Payment Certificate"
  "recommended_folder": str,               # e.g. "IDN-JETTY-2026/Commercial/PC"
  "recommended_filename": str,             # e.g. "IDN-JETTY-2026_PC-007_2026-04.pdf"
  "signature_required": bool,
  "stamp_required": bool,
  "signature_detected": bool | None,       # None if cannot determine
  "stamp_detected": bool | None,
  "page_count_estimate": int | None,
  "page_issue": bool,
  "scan_quality_issue": bool,
  "missing_documents": list[str],          # e.g. ["Signed version required"]
  "document_control_risk_level": str,      # LOW | MEDIUM | HIGH
}
```

---

## Classification Logic (V1 Rule-Based)

1. Load `rules/document_types.yaml`
2. Score each document type by keyword match count against `extracted_text` and `original_filename`
3. Return highest scoring type
4. If confidence < 0.3: classify as UNKNOWN
5. Flag for human review if UNKNOWN

## Filing Path Convention

```
{project_code}/
  Company/          ← registrations, bank docs
  Commercial/
    Contract/
    BQ/
    PC/             ← payment certificates
    VO/             ← variation orders
    Invoice/
      Sales/
      Supplier/
  Tax/
    DGT/
    COR/
  Procurement/
    PO/
    Delivery/
  Payroll/
  Site/
    Reports/
    Photos/
    Inspections/
```

## Filename Convention

```
{PROJECT_CODE}_{DOCTYPE_ABBREV}_{COUNTERPARTY_OR_REF}_{DATE}.{ext}

Examples:
  IDN-JETTY-2026_PC-007_2026-04.pdf
  IDN-JETTY-2026_INV-SUP_ABC-Concrete_2026-04-15.pdf
  IDN-JETTY-2026_CONTRACT_MainContract_2025-11.pdf
```

---

## Compliance Limitations

- This skill provides filing recommendations only
- Do not treat filing recommendations as final legal or accounting decisions
- Signature/stamp detection is keyword-based in V1 — not cryptographic verification
- All recommendations require human review before action
- Missing document lists are suggestions based on document type rules — not exhaustive legal checklists
