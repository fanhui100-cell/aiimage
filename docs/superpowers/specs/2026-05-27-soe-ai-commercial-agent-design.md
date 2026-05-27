# SOE AI Commercial Agent — Architecture Design Spec
# Sunrise Ocean Engineering Limited / 旭海洋工程有限公司
# Version: 1.1 (Post-Brainstorming Corrections Applied)
# Date: 2026-05-27

---

## 0. Document Purpose

This document is the authoritative architecture design for the SOE AI Commercial Agent system.
It supersedes the original implementation brief and incorporates all corrections agreed during
the brainstorming session on 2026-05-27.

Key corrections from original brief:
- Frontend: Next.js (not Streamlit)
- LLM: Provider-agnostic abstraction with MockLLMClient as default
- Runtime: Poetry + Python 3.13 (aligned with existing backend convention)
- Database: SQLite local default / PostgreSQL production-ready
- OneDrive: Two explicit modes (LocalManualUpload / MicrosoftGraph)
- File upload: Browser → FastAPI directly (no Next.js proxy)
- All 10 agents remain in scope across phases

---

## 1. Project Identity

```
System Name:   SOE AI Commercial Agent
Company:       Sunrise Ocean Engineering Limited (旭海洋工程有限公司)
Type:          Internal company engineering commercial management system
Pilot Project: Indonesia Jetty Extension Project (IDN-JETTY-2026)
Location:      test/soe-ai-commercial-agent/  (standalone project, not shared with existing apps)
```

---

## 2. Core Design Principles

### 2.1 Human-in-the-loop (non-negotiable)

AI may: read, extract, classify, suggest, draft, report, flag, recommend.

AI must NOT automatically:
- Approve accounting entries or invoices
- Pay suppliers
- Create final ledger records without human confirmation
- Delete, move, or rename original files
- Approve Xero bills
- Confirm tax treatment without professional review
- Assist with tax evasion, false invoices, hidden revenue, or any compliance violation

Every critical action requires an explicit human approval step tracked in the database.

### 2.2 Provider-agnostic by design

Claude Code is the development tool only. The application runtime LLM provider is pluggable.
V1 must run with zero external API credentials. See §7 for full LLM strategy.

### 2.3 Mock-first, real integrations later

All external systems (Xero, Microsoft Graph, LLM providers) must have:
- A mock adapter implementing the same interface
- A placeholder real adapter
- A config-driven switch (environment variable)

The system must boot and run full local workflows with all env vars unset.

### 2.4 OneDrive is not the only source

The system operates in two explicit modes. See §9.

---

## 3. Technology Stack

### 3.1 Backend

```
Language:         Python 3.13 (canonical, no other versions)
Dependency mgmt:  Poetry (pyproject.toml + poetry.lock — source of truth)
                  requirements.txt must NOT be manually maintained;
                  if needed for deployment, generate via: poetry export
Framework:        FastAPI
ORM:              SQLAlchemy 2.x
Migrations:       Alembic
Validation:       Pydantic v2
Database (local): SQLite  — DATABASE_URL=sqlite:///./storage/local.db
Database (prod):  PostgreSQL — DATABASE_URL=postgresql://...
ASGI server:      Uvicorn
```

### 3.2 Frontend

```
Framework:    Next.js (App Router, TypeScript)
Styling:      Tailwind CSS
UI components: shadcn/ui (or equivalent lightweight component library)
API calls:    fetch / axios directly to FastAPI backend (browser → http://localhost:8000)
              Next.js does NOT proxy or relay API requests
Type safety:  TypeScript types in frontend/types/index.ts mirroring Pydantic schemas
```

CORS: FastAPI must allow `http://localhost:3000` in development.

### 3.3 File Upload Pattern

```
Browser  →  POST multipart/form-data  →  FastAPI /documents/upload
FastAPI saves file to backend/storage/uploads/
FastAPI returns document_id + metadata
Next.js displays result
```

Next.js frontend does NOT handle raw file bytes. All file processing happens in FastAPI.

### 3.4 LLM Providers (see §7 for full strategy)

```
Default (V1):   MockLLMClient   — LLM_PROVIDER=mock
Optional:       OpenAILLMClient, AnthropicLLMClient, AzureOpenAILLMClient
Packaging:      Optional Poetry extras — not installed by default
```

### 3.5 Document Processing Libraries

```
PDF:           pypdf
Word:          python-docx
Excel:         openpyxl
OCR:           Placeholder service (not active in V1)
```

---

## 4. Directory Structure

```
soe-ai-commercial-agent/
│
├── README.md
├── .env.example
├── .gitignore
├── docker-compose.yml           ← defines backend + frontend services for team dev
│
├── backend/                     ← FastAPI application (Python)
│   ├── pyproject.toml
│   ├── poetry.lock
│   ├── alembic.ini
│   ├── alembic/
│   │   └── versions/
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              ← FastAPI app init, CORS, router registration
│   │   ├── config.py            ← pydantic-settings, reads .env
│   │   ├── database.py          ← SQLAlchemy engine + session factory
│   │   ├── dependencies.py      ← FastAPI dependency injection helpers
│   │   └── logging_config.py    ← structured logging, prompt logging disabled by default
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes_health.py
│   │   ├── routes_documents.py
│   │   ├── routes_projects.py
│   │   ├── routes_reviews.py
│   │   ├── routes_approvals.py
│   │   ├── routes_accounting.py
│   │   ├── routes_reports.py
│   │   └── routes_onedrive.py
│   │
│   ├── models/                  ← SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── company.py
│   │   ├── project.py
│   │   ├── document.py
│   │   ├── extracted_field.py
│   │   ├── review.py
│   │   ├── risk.py
│   │   ├── approval.py
│   │   ├── accounting_draft.py
│   │   ├── audit_log.py
│   │   └── onedrive_sync.py
│   │
│   ├── schemas/                 ← Pydantic v2 request/response schemas
│   │   ├── __init__.py
│   │   ├── common.py
│   │   ├── company.py
│   │   ├── project.py
│   │   ├── document.py
│   │   ├── review.py
│   │   ├── approval.py
│   │   ├── accounting_draft.py
│   │   └── report.py
│   │
│   ├── services/                ← Business logic (no LLM vendor imports)
│   │   ├── __init__.py
│   │   ├── file_storage_service.py
│   │   ├── text_extraction_service.py
│   │   ├── document_classification_service.py
│   │   ├── document_review_service.py
│   │   ├── approval_service.py
│   │   ├── report_service.py
│   │   ├── audit_service.py
│   │   ├── risk_service.py
│   │   ├── search_index_service.py
│   │   └── notification_service.py
│   │
│   ├── agents/                  ← Agent layer (calls LLMClient abstraction only)
│   │   ├── __init__.py
│   │   ├── orchestrator_agent.py
│   │   ├── document_control_agent.py
│   │   ├── accounting_agent.py
│   │   ├── qs_agent.py
│   │   ├── contract_agent.py
│   │   ├── tax_agent.py
│   │   ├── procurement_agent.py
│   │   ├── payment_agent.py
│   │   ├── compliance_agent.py
│   │   └── reporting_agent.py
│   │
│   ├── integrations/
│   │   ├── __init__.py
│   │   ├── llm/
│   │   │   ├── __init__.py
│   │   │   ├── base.py              ← LLMClient abstract interface
│   │   │   ├── mock_llm.py          ← default V1 provider
│   │   │   ├── openai_llm.py        ← optional, requires extras=openai
│   │   │   ├── anthropic_llm.py     ← optional, requires extras=anthropic
│   │   │   └── azure_openai_llm.py  ← optional, requires extras=azure
│   │   │
│   │   ├── onedrive/
│   │   │   ├── __init__.py
│   │   │   ├── graph_client.py
│   │   │   ├── sync_service.py
│   │   │   ├── webhook_service.py
│   │   │   └── token_store.py
│   │   │
│   │   └── accounting/
│   │       ├── __init__.py
│   │       ├── base.py              ← AccountingAdapter interface
│   │       ├── mock_accounting.py   ← default V1 adapter
│   │       └── xero_accounting.py   ← placeholder TODO
│   │
│   ├── rules/                   ← YAML classification and compliance rules
│   │   ├── document_types.yaml
│   │   ├── account_mapping.yaml
│   │   ├── approval_rules.yaml
│   │   ├── risk_rules.yaml
│   │   ├── qs_rules.yaml
│   │   ├── tax_rules.yaml
│   │   └── filing_rules.yaml
│   │
│   ├── storage/                 ← runtime file storage (gitignored)
│   │   ├── uploads/
│   │   ├── processed/
│   │   ├── reports/
│   │   └── tmp/
│   │
│   ├── scripts/
│   │   ├── init_db.py
│   │   ├── seed_demo_data.py
│   │   └── reset_local_db.py
│   │
│   └── tests/
│       ├── __init__.py
│       ├── test_document_classification.py
│       ├── test_approval_service.py
│       ├── test_mock_accounting.py
│       ├── test_risk_service.py
│       ├── test_llm_provider_mock.py   ← confirms LLM_PROVIDER=mock works without credentials
│       └── test_api_health.py
│
├── frontend/                    ← Next.js application (TypeScript)
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx             ← redirect to /dashboard
│   │   └── (dashboard)/
│   │       ├── layout.tsx       ← sidebar nav
│   │       ├── upload/
│   │       │   └── page.tsx
│   │       ├── documents/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── approvals/
│   │       │   └── page.tsx
│   │       ├── projects/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── accounting/
│   │       │   └── page.tsx
│   │       ├── onedrive/
│   │       │   └── page.tsx
│   │       └── reports/
│   │           └── page.tsx
│   ├── components/
│   │   ├── DocumentCard.tsx
│   │   ├── RiskBadge.tsx
│   │   ├── ApprovalActions.tsx
│   │   └── ui/                  ← shadcn/ui components
│   ├── lib/
│   │   └── api.ts               ← typed API client, all fetch calls to localhost:8000
│   └── types/
│       └── index.ts             ← TypeScript types mirroring Pydantic schemas
│
└── docs/
    ├── ARCHITECTURE.md
    ├── COMPLIANCE_RULES.md
    ├── LLM_PROVIDER_STRATEGY.md
    └── ONEDRIVE_INTEGRATION.md
```

---

## 5. Database Schema

All tables include `created_at` and `updated_at` timestamps.
Local dev uses SQLite. Production switches to PostgreSQL via `DATABASE_URL`.

### 5.1 Company
```
id, name_en, name_zh, registration_number, business_registration_number,
default_currency, created_at, updated_at
```

### 5.2 Project
```
id, company_id (FK), project_code, project_name, client_name,
country, status, contract_amount, currency, start_date, end_date,
description, created_at, updated_at
```

### 5.3 Document
```
id, project_id (FK nullable), company_id (FK),
source_type ENUM[MANUAL_UPLOAD, ONEDRIVE, SHAREPOINT],
source_file_id (nullable), source_path (nullable),
original_filename, stored_filename, file_extension, mime_type,
file_size, sha256_hash,
document_type ENUM[SUPPLIER_INVOICE, CONTRACT, BQ, PAYMENT_CERTIFICATE, ...],
document_status ENUM[UPLOADED, EXTRACTED, CLASSIFIED, REVIEWED,
                     PENDING_APPROVAL, APPROVED, REJECTED, ARCHIVED],
language, extracted_text (nullable), extraction_status,
classification_confidence, recommended_folder, recommended_filename,
created_at, updated_at
```

### 5.4 ExtractedField
```
id, document_id (FK), field_name, field_value, confidence,
source_page (nullable), created_at
```

### 5.5 Review
```
id, document_id (FK), agent_name, review_type,
summary, risk_level ENUM[LOW, MEDIUM, HIGH, CRITICAL],
review_json, created_at, updated_at
```

### 5.6 Risk
```
id, document_id (FK), project_id (FK nullable),
risk_category, risk_level, risk_title, risk_description,
recommended_action, requires_professional_review (bool),
professional_type (nullable),
status ENUM[OPEN, ACKNOWLEDGED, RESOLVED, WAIVED],
created_at, updated_at
```

### 5.7 Approval
```
id, document_id (FK),
approval_type,
status ENUM[PENDING, APPROVED, REJECTED, NEED_MORE_INFO,
            NEED_CPA_REVIEW, NEED_TAX_ADVISOR_REVIEW,
            NEED_LEGAL_REVIEW, NEED_QS_REVIEW],
reviewer_name, reviewer_role, comments,
approved_at (nullable), created_at, updated_at
```

### 5.8 AccountingDraft
```
id, document_id (FK), project_id (FK nullable),
draft_type ENUM[BILL, SALES_INVOICE, EXPENSE, PAYMENT_SUPPORT, JOURNAL_SUGGESTION],
counterparty_name, invoice_number (nullable), invoice_date (nullable),
due_date (nullable), currency, amount, tax_amount (nullable),
suggested_account_code, suggested_tax_code, suggested_tracking_category,
description,
status ENUM[DRAFT, PENDING_APPROVAL, APPROVED_FOR_EXPORT,
            EXPORTED_TO_ACCOUNTING, REJECTED],
external_accounting_id (nullable), created_at, updated_at
```

### 5.9 AuditLog
```
id, entity_type, entity_id, action, actor, details_json, created_at
```

### 5.10 OneDriveSyncState
```
id, drive_id, folder_item_id, folder_path, delta_link (nullable),
last_sync_at (nullable), sync_status, created_at, updated_at
```

---

## 6. API Routes

### Health
```
GET  /health
```

### Documents
```
POST /documents/upload
GET  /documents
GET  /documents/{id}
POST /documents/{id}/extract
POST /documents/{id}/classify
POST /documents/{id}/review
GET  /documents/{id}/reviews
GET  /documents/{id}/risks
```

### Approvals
```
GET  /approvals/pending
POST /approvals/{id}/approve
POST /approvals/{id}/reject
POST /approvals/{id}/need-more-info
POST /approvals/{id}/mark-cpa-review
POST /approvals/{id}/mark-tax-advisor-review
POST /approvals/{id}/mark-legal-review
POST /approvals/{id}/mark-qs-review
```

### Accounting
```
GET  /accounting/drafts
GET  /accounting/drafts/{id}
POST /accounting/drafts/from-document/{document_id}
POST /accounting/drafts/{id}/approve-for-export
POST /accounting/drafts/{id}/export          ← V1: MockAccountingAdapter only
```

### Projects
```
GET  /projects
POST /projects
GET  /projects/{id}
GET  /projects/{id}/documents
GET  /projects/{id}/risks
GET  /projects/{id}/reports/summary
```

### Reports
```
GET  /reports/company-file-map
GET  /reports/missing-documents
GET  /reports/risk-register
GET  /reports/accounting-drafts
GET  /reports/tax-compliance
GET  /reports/qs-summary
```

### OneDrive
```
GET  /onedrive/status
POST /onedrive/configure
POST /onedrive/sync/full
POST /onedrive/sync/delta
POST /onedrive/webhook
GET  /onedrive/sync/history
```

---

## 7. LLM Provider Strategy

### 7.1 Core principle

Claude Code is the development tool only.
The application runtime LLM is pluggable and provider-neutral.
No vendor SDK (openai, anthropic, azure) may be imported directly in business logic or agents.

### 7.2 Interface

```python
# integrations/llm/base.py
class LLMClient:
    def complete(self, prompt: str, system: str | None = None) -> str: ...
    def classify(self, text: str, categories: list[str]) -> dict: ...
    def extract_fields(self, text: str, fields: list[str]) -> dict: ...
```

### 7.3 Providers

| Provider | Class | Poetry extra | When |
|---|---|---|---|
| Mock | MockLLMClient | (none, always installed) | V1 default, CI |
| OpenAI | OpenAILLMClient | `--extras openai` | Internal testing |
| Anthropic | AnthropicLLMClient | `--extras anthropic` | Internal testing |
| Azure OpenAI | AzureOpenAILLMClient | `--extras azure` | Enterprise production |

### 7.4 Environment variables

```
LLM_PROVIDER=mock           # mock | openai | anthropic | azure
OPENAI_API_KEY=
OPENAI_MODEL=
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_API_VERSION=
AZURE_OPENAI_DEPLOYMENT_NAME=
```

### 7.5 V1 agent implementation

All agents in V1 use deterministic rule-based logic + MockLLMClient.
LLM calls are structured so a real provider can replace mock without changing agent code.

### 7.6 Prompt logging

Disabled by default. Company documents are sensitive.
Never log prompt content or LLM responses to files or external services in production.

---

## 8. Accounting Adapter

```python
# integrations/accounting/base.py
class AccountingAdapter:
    def list_contacts(self) -> list[dict]: ...
    def list_accounts(self) -> list[dict]: ...
    def list_tracking_categories(self) -> list[dict]: ...
    def create_draft_bill(self, payload: dict) -> dict: ...
    def create_draft_invoice(self, payload: dict) -> dict: ...
    def attach_file(self, external_record_id: str, file_path: str) -> dict: ...
```

V1: `MockAccountingAdapter` — stores drafts locally, returns mock external ID.
Future: `XeroAccountingAdapter` — placeholder with TODO, OAuth not yet configured.

Critical: Never auto-approve Xero bills or invoices.

---

## 9. OneDrive Integration — Two Modes

### Mode A: LocalManualUploadMode (Default, V1)

```
STORAGE_MODE=local
ONEDRIVE_ENABLED=false
```

- Manual upload via `/documents/upload`
- No Microsoft credentials required
- Full workflow: upload → extract → classify → review → approve → accounting draft → report
- This is the complete V1 feature set

### Mode B: MicrosoftGraphMode (Future)

```
STORAGE_MODE=local
ONEDRIVE_ENABLED=true
MICROSOFT_TENANT_ID=...
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
```

- Read-only by default
- Must NOT delete, overwrite, move, or rename original OneDrive/SharePoint files
- Full scan → delta sync → webhook receiver
- Requires Microsoft 365 tenant + Entra ID app registration

### OneDrive environment variables

```
ONEDRIVE_ENABLED=false
MICROSOFT_TENANT_ID=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_REDIRECT_URI=
ONEDRIVE_ROOT_DRIVE_ID=
ONEDRIVE_ROOT_ITEM_ID=
```

---

## 10. Document Types

```
COMPANY_REGISTRATION, BUSINESS_REGISTRATION, CERTIFICATE_OF_INCORPORATION,
BOARD_RESOLUTION, BANK_DOCUMENT,
CONTRACT, CONTRACT_APPENDIX,
BQ, QUOTATION, PURCHASE_ORDER, VARIATION_ORDER,
PAYMENT_CERTIFICATE, PROGRESS_CLAIM,
SALES_INVOICE, SUPPLIER_INVOICE, RECEIPT, BANK_SLIP, PAYMENT_PROOF,
DELIVERY_NOTE, TIMESHEET, PAYROLL_SUPPORT,
TAX_DGT, TAX_COR, TAX_FORM,
SUPPLIER_PROFILE, CV, METHOD_STATEMENT, RISK_ASSESSMENT,
INSPECTION_RECORD, SITE_DAILY_REPORT, MEETING_MINUTES, PHOTO_RECORD,
CUSTOMS_DOCUMENT, LOGISTICS_DOCUMENT,
UNKNOWN
```

Classification uses `rules/document_types.yaml` keyword matching in V1.
LLM-assisted classification is enabled when `LLM_PROVIDER != mock`.

---

## 11. Agent Definitions

### Orchestrator Agent
Receives document + context → dispatches to specialist agents → merges outputs →
assigns overall risk level → prepares human review package.

### Document Control Agent
File name check, type check, scan quality, signatures, stamps, page count,
recommended filing path, recommended standardized filename.

### Accounting Pre-entry Agent
Classify accounting treatment, suggest account code + tracking category + tax code,
flag missing invoice fields, duplicate invoice risk, prepare MockAccountingDraft.
Must not approve entries.

### QS Commercial Agent
Detect BQ/quotation/PC/VO, extract contract amount, BQ items, retention,
cumulative claimed vs approved, flag overclaim or missing VO.

### Contract Review Agent
Extract parties, amount, payment terms, retention, variation procedure,
tax clause, governing law, signature status, flag unfavorable clauses.

### Tax Compliance Agent
Indonesia/HK cross-border WHT risk, DGT/COR tracking, PE risk flag,
CPA and Indonesia tax advisor review flags.
Never advise evasion or concealment.

### Procurement Agent
Supplier quote check, PO/invoice/delivery note match,
bank details verification flag, missing PO or delivery evidence.

### Payment & Collection Agent
Receivables from PC/invoice, payables from supplier bills,
bank slip matching, director approval for high-value payments.

### Compliance & Audit Agent
Red flags, duplicate invoice, abnormal payment, unsupported cost,
fake document indicators, authorization checks, audit trail completeness.

### Reporting Agent
Project summary, missing document report, risk register,
accounting draft report, QS status report, tax compliance report,
monthly closing checklist.

---

## 12. Demo Seed Data

```
Company:
  name_en: Sunrise Ocean Engineering Limited
  name_zh: 旭海洋工程有限公司

Project:
  project_code: IDN-JETTY-2026
  project_name: Indonesia Jetty Extension Project
  country: Indonesia
  currency: USD
  status: Active

Default tracking category: Indonesia Jetty Extension

Account codes:
  Direct Cost - Subcontractor
  Direct Cost - Materials
  Direct Cost - Plant and Equipment
  Project Travel Expense
  Professional Fees
  Contract Revenue
  Retention Receivable
  Retention Payable
```

---

## 13. Security Baseline (V1)

- All secrets via `.env` (never hardcoded)
- Files stored outside source code in `backend/storage/` (gitignored)
- SHA-256 hash on every uploaded file
- All critical actions written to `AuditLog`
- Role constants defined (`ADMIN`, `DIRECTOR`, `ACCOUNTANT`, `QS`,
  `PROJECT_MANAGER`, `TAX_ADVISOR`, `CPA`, `VIEWER`)
- Approval functions accept `reviewer_name` and `reviewer_role`
- No full authentication required in V1 (internal tool, single-team)
- Prompt/completion logging disabled by default

---

## 14. Compliance Rules (Summary)

System must never assist:
- Tax evasion, hidden revenue, off-book accounts
- False invoices, fake supplier contracts, false payroll
- Forged signatures, bank slips, delivery notes
- Avoiding withholding tax illegally
- Misleading audit support

System may assist:
- Legal tax planning, document completeness, accounting classification suggestions
- Professional review checklists, missing document reports, risk alerts
- Draft records subject to human review

Always required professional review for:
- HK profits tax, Indonesia WHT, DGT/COR applications
- PE risk assessment, legal contract interpretation
- Final account / QS certification, customs matters

---

## 15. V1 Acceptance Criteria

1. Project starts locally: `poetry run uvicorn app.main:app --reload` — no errors
2. Frontend starts: `npm run dev` — no errors
3. `GET /health` returns `{"status": "ok"}`
4. User can upload PDF / Excel / Word
5. File saved to `storage/uploads/`, SHA-256 recorded in DB
6. Text extraction runs and stores extracted text
7. Document classified against YAML rules
8. At least 5 agent reviews generated per document
9. Risks created and stored
10. Pending approval created automatically
11. User can approve / reject / flag for professional review
12. Accounting draft created from document
13. Accounting draft exported to MockAccountingAdapter
14. AuditLog records all critical actions
15. Reports page shows: document list, risk register, missing docs, accounting drafts
16. OneDrive page shows placeholder config + sync status
17. `LLM_PROVIDER=mock` runs without any external credentials
18. No real Xero / Microsoft / OpenAI / Anthropic credentials required
