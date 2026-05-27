# SOE Xero Adapter Skill

## Purpose

Guide implementation of the `XeroAccountingAdapter` for future integration with
Sunrise Ocean Engineering Limited's Xero accounting system.

**Status: FUTURE — Not active in V1.**
V1 uses `MockAccountingAdapter` only. This skill documents the design for future implementation.

## Scope

- `XeroAccountingAdapter` implementation guide
- OAuth 2.0 PKCE flow for Xero
- Contacts API
- Chart of accounts API
- Tracking categories API
- Draft Bill creation
- Draft Sales Invoice creation
- File attachment upload
- Token refresh management

## Out of Scope

- Approving or posting Xero transactions (human action only)
- Deleting Xero records
- Xero payroll
- Xero reporting API

---

## Adapter Interface (from integrations/accounting/base.py)

```python
class XeroAccountingAdapter(AccountingAdapter):
    def list_contacts(self) -> list[dict]: ...
    def list_accounts(self) -> list[dict]: ...
    def list_tracking_categories(self) -> list[dict]: ...
    def create_draft_bill(self, payload: dict) -> dict: ...
    def create_draft_invoice(self, payload: dict) -> dict: ...
    def attach_file(self, external_record_id: str, file_path: str) -> dict: ...
```

All methods currently raise `NotImplementedError`. Implement when Xero is ready.

---

## Xero OAuth 2.0 Setup

1. Xero Developer Portal → New App → Web App
2. Scopes required:
   - `accounting.transactions`
   - `accounting.contacts`
   - `accounting.settings`
   - `files`
3. Redirect URI: value of `XERO_REDIRECT_URI`
4. Note Client ID → `XERO_CLIENT_ID`
5. Note Client Secret → `XERO_CLIENT_SECRET`
6. Implement PKCE flow in `integrations/accounting/xero_accounting.py`
7. Store tokens in `xero_token_store.json` or database (never in `.env`)

---

## Draft Bill Payload Format

```python
{
  "Type": "ACCPAY",              # Accounts Payable Bill
  "Status": "DRAFT",            # ALWAYS DRAFT — never SUBMITTED or AUTHORISED automatically
  "Contact": {"Name": counterparty_name},
  "LineItems": [
    {
      "Description": description,
      "Quantity": 1.0,
      "UnitAmount": amount,
      "AccountCode": suggested_account_code,   # e.g. "500" — must match Xero chart of accounts
      "TaxType": suggested_tax_code,
      "Tracking": [{"Name": "Project", "Option": suggested_tracking_category}],
    }
  ],
  "Date": invoice_date,
  "DueDate": due_date,
  "Reference": invoice_number,
  "CurrencyCode": currency,
}
```

## Draft Invoice Payload Format

```python
{
  "Type": "ACCREC",             # Accounts Receivable Invoice
  "Status": "DRAFT",           # ALWAYS DRAFT
  "Contact": {"Name": client_name},
  "LineItems": [...],
  "Date": invoice_date,
  "DueDate": due_date,
  "Reference": pc_number_or_invoice_number,
  "CurrencyCode": "USD",
}
```

---

## Critical Rules

1. **Status MUST always be `"DRAFT"`** — never `"SUBMITTED"`, `"AUTHORISED"`, `"PAID"`
2. **Never auto-approve** Xero invoices or bills on behalf of the user
3. **Never delete** Xero records via API
4. **Never void** Xero records without explicit human confirmation
5. **Never access** Xero without valid OAuth token — do not store tokens in code
6. Token refresh must be automatic and transparent — expired tokens cause retry, not error exposure
7. `external_accounting_id` set to Xero's returned `InvoiceID` or `BillID` after creation

---

## Compliance Limitations

**Must label all Xero draft outputs as:** "Draft entry created in Xero — requires human review and approval within Xero before posting."

**Must NOT:**
- Create approved or posted Xero entries
- Pay Xero bills automatically
- Modify Xero entries that are already approved
- Create Xero contacts with unverified bank account details
- Upload documents to Xero that are not authentic company documents

**Before activating Xero integration:**
- Confirm with HK CPA that account codes match the chart of accounts
- Confirm tracking category names match exactly
- Test in Xero Demo Company first
- Get director approval before connecting production Xero organisation
