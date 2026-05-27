# SOE Tax Compliance Skill

## Purpose

Guide preliminary tax compliance review for Sunrise Ocean Engineering Limited,
focusing on Hong Kong–Indonesia cross-border engineering project transactions.

## Scope

- Identify tax-sensitive documents and transactions
- Flag Indonesia withholding tax (WHT) risk on service payments
- Track DGT (Directorate General of Taxes) certificate and COR (Certificate of Residence) requirements
- Flag permanent establishment (PE) risk
- Flag HK profits tax considerations
- Generate checklist items for Indonesia tax advisor and HK CPA review

## Out of Scope

- Final tax filing or tax advice (requires qualified HK CPA and Indonesia tax advisor)
- Tax return preparation
- Transfer pricing analysis
- Individual income tax for expatriates
- Customs and import duties (→ `soe-document-control` for customs documents)

---

## Required Inputs

```python
{
  "document_type": str,
  "extracted_text": str,
  "extracted_fields": dict,          # supplier country, payment amount, currency, service type
  "project": {
    "country": str,                  # "Indonesia"
    "company_hk": str,               # "Sunrise Ocean Engineering Limited"
    "site_presence_months": int | None,
  },
  "existing_dgt_certificates": list[dict],   # [{document_id, expiry_date}]
  "existing_cor_documents": list[dict],      # [{document_id, tax_year}]
}
```

---

## Output Format

```python
{
  "tax_sensitive": bool,
  "jurisdiction": list[str],              # ["Hong Kong", "Indonesia"]
  "transaction_type": str | None,         # "service", "goods", "employment", "rental"
  "payment_direction": str | None,        # "HK → Indonesia" | "Indonesia → HK" | "Indonesia → Indonesia"

  "indonesia_wht": {
    "applicable": bool,
    "wht_type": str | None,              # "Article 23", "Article 26", "Article 15", "Article 4(2)"
    "estimated_rate": float | None,      # e.g. 0.02 for 2%, 0.20 for 20%
    "treaty_rate_available": bool,
    "treaty_rate": float | None,         # reduced rate under HK-Indonesia DTA
    "wht_risk_level": str,              # LOW | MEDIUM | HIGH
  },

  "dgt_certificate": {
    "required": bool,
    "current_dgt_valid": bool | None,
    "dgt_expiry": str | None,
    "action_required": str | None,       # "Apply for DGT-1 form" | "Renew before expiry"
  },

  "cor_document": {
    "required": bool,
    "current_cor_valid": bool | None,
    "action_required": str | None,
  },

  "pe_risk": {
    "flagged": bool,
    "risk_description": str | None,     # e.g. "Site presence >183 days may create PE"
    "months_on_site": int | None,
  },

  "hk_profits_tax": {
    "offshore_claim_possible": bool | None,
    "offshore_claim_risk": str | None,
    "requires_cpa_review": bool,
  },

  "tax_risk_level": str,                 # LOW | MEDIUM | HIGH | CRITICAL
  "tax_flags": list[str],
  "requires_indonesia_tax_advisor_review": bool,
  "requires_hk_cpa_review": bool,
  "tax_advisor_checklist": list[str],    # specific items for advisor
}
```

---

## Indonesia Tax Rules Reference

### Withholding Tax (PPh) by Article

| Article | Transaction Type | Standard Rate | DTA Rate (HK) |
|---|---|---|---|
| Art. 23 | Services from Indonesian company | 2% | 2% (no change) |
| Art. 26 | Services from non-Indonesian (HK) company | 20% | 5%–15% with DTA |
| Art. 15 | International shipping/aviation | special | special |
| Art. 4(2) | Construction services | 2–4% final | varies |

### DGT Certificate (Surat Keterangan Domisili)
- Required for HK company to claim treaty benefits under HK-Indonesia DTA
- Apply via: Indonesia tax office (DJP) using DGT-1 or DGT-2 form
- Valid: typically 1 tax year
- Must be obtained BEFORE payment to avoid standard 20% rate

### COR (Certificate of Residence)
- Issued by: Hong Kong Inland Revenue Department
- Purpose: Evidence that SOE is HK tax resident for DTA claim
- Required alongside DGT application

### PE Risk Triggers (Indonesia)
- Fixed place of business in Indonesia
- Construction site presence > 183 days (HK-Indonesia DTA)
- Dependent agent in Indonesia
- PE may create Indonesia corporate tax liability

---

## Compliance Limitations

**Must label all outputs as:** "Preliminary tax compliance review — all findings must be confirmed by a qualified Hong Kong CPA and Indonesia-registered tax advisor before any tax filing, payment, or treaty claim."

**Must NOT:**
- File tax returns or advise on tax filings
- Confirm treaty benefit eligibility without professional review
- Recommend arrangements that reduce tax through non-compliant means
- Advise on tax positions that hide income, transactions, or related parties
- Provide specific legal tax opinions

**The following are absolute prohibitions:**
- Recommending WHT evasion or concealment
- Suggesting under-declaration of service payments
- Splitting transactions to stay below withholding thresholds artificially
- Advising on false DGT/COR documentation
- Recommending false characterization of transactions to avoid tax
