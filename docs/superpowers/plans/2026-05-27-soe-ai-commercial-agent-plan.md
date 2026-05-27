# SOE AI Commercial Agent — Implementation Plan
# Date: 2026-05-27
# Reference spec: docs/superpowers/specs/2026-05-27-soe-ai-commercial-agent-design.md

---

## Development Environment

### Prerequisites
- Python 3.13
- Poetry
- Node.js 20+
- Git

### Local ports
- Backend:  http://localhost:8000
- Frontend: http://localhost:3000
- API docs: http://localhost:8000/docs

---

## Phase 1 — Project Skeleton and Infrastructure

**Goal:** Bare project boots with health endpoint and empty frontend shell.

### Backend tasks

- [ ] Create `test/soe-ai-commercial-agent/` directory
- [ ] Create `backend/pyproject.toml` with Python 3.13, Poetry, core deps:
  ```toml
  [tool.poetry]
  name = "soe-ai-commercial-agent-backend"
  version = "0.1.0"

  [tool.poetry.dependencies]
  python = ">=3.13,<3.14"
  fastapi = "^0.115"
  uvicorn = {extras = ["standard"], version = "^0.30"}
  sqlalchemy = "^2.0"
  alembic = "^1.13"
  pydantic = "^2.7"
  pydantic-settings = "^2.3"
  python-dotenv = "^1.0"
  python-multipart = "^0.0.9"
  httpx = "^0.27"
  PyYAML = "^6.0"
  pypdf = "^4.0"
  python-docx = "^1.1"
  openpyxl = "^3.1"
  pandas = "^2.2"
  python-dateutil = "^2.9"
  aiofiles = "^23.2"
  # Optional LLM provider packages — declared optional so extras work correctly
  openai = {version = "^1.35", optional = true}
  anthropic = {version = "^0.30", optional = true}
  msal = {version = "^1.28", optional = true}

  [tool.poetry.extras]
  # Install with: poetry install --extras openai
  openai = ["openai"]
  anthropic = ["anthropic"]
  azure = ["openai"]       # Azure OpenAI reuses the openai package
  microsoft = ["msal"]

  [tool.poetry.group.dev.dependencies]
  pytest = "^8.2"
  pytest-asyncio = "^0.24"   # was pytest-anyio which does not exist; use pytest-asyncio
  httpx = "^0.27"
  ```
- [ ] Create `backend/.env.example`:
  ```
  DATABASE_URL=sqlite:///./storage/local.db
  # DATABASE_URL=postgresql://user:pass@localhost:5432/soe_agent

  LLM_PROVIDER=mock
  OPENAI_API_KEY=
  OPENAI_MODEL=
  ANTHROPIC_API_KEY=
  ANTHROPIC_MODEL=
  AZURE_OPENAI_ENDPOINT=
  AZURE_OPENAI_API_KEY=
  AZURE_OPENAI_API_VERSION=
  AZURE_OPENAI_DEPLOYMENT_NAME=

  STORAGE_MODE=local
  ONEDRIVE_ENABLED=false
  MICROSOFT_TENANT_ID=
  MICROSOFT_CLIENT_ID=
  MICROSOFT_CLIENT_SECRET=
  MICROSOFT_REDIRECT_URI=
  ONEDRIVE_ROOT_DRIVE_ID=
  ONEDRIVE_ROOT_ITEM_ID=

  CORS_ORIGINS=http://localhost:3000
  LOG_LEVEL=INFO
  ENABLE_PROMPT_LOGGING=false
  ```
- [ ] Create `backend/app/config.py` — pydantic-settings class reading all env vars
- [ ] Create `backend/app/database.py` — SQLAlchemy engine + `get_db` dependency
- [ ] Create `backend/app/main.py` — FastAPI app, CORS middleware, router registration
- [ ] Create `backend/api/routes_health.py` — `GET /health` returns `{"status":"ok","app":"SOE AI Commercial Agent"}`
- [ ] Create `backend/app/logging_config.py` — structured logging, ENABLE_PROMPT_LOGGING=false guard
- [ ] Create `backend/storage/` subdirectories: `uploads/`, `processed/`, `reports/`, `tmp/`
- [ ] Create `backend/.gitignore` — exclude `storage/`, `.env`, `__pycache__`, `.venv`

**Phase 1 acceptance:**
```bash
cd backend
poetry install
cp .env.example .env
poetry run uvicorn app.main:app --reload
# GET http://localhost:8000/health → {"status":"ok"}
```

### Frontend tasks

- [ ] `cd frontend && npx create-next-app@latest . --typescript --tailwind --app --no-src-dir`
- [ ] Install shadcn/ui: `npx shadcn@latest init`
- [ ] Create `frontend/types/index.ts` — empty TypeScript types stub
- [ ] Create `frontend/lib/api.ts` — base fetch client pointing to `http://localhost:8000`
- [ ] Create `frontend/app/(dashboard)/layout.tsx` — sidebar with nav links:
  - Upload Documents
  - Document Review
  - Approvals
  - Projects
  - Accounting Drafts
  - OneDrive Sync
  - Reports
- [ ] Create stub `page.tsx` for each route (just "Coming soon" text)
- [ ] Create root `page.tsx` that redirects to `/upload`

**Phase 1 acceptance:**
```bash
cd frontend
npm install
npm run dev
# http://localhost:3000 → shows sidebar with all nav items
```

### Project-level files

- [ ] Create top-level `README.md` (see template below)
- [ ] Create top-level `.gitignore`
- [ ] Create `docker-compose.yml` defining backend + frontend services

---

## Phase 2 — Database Models and Migrations

**Goal:** All 10 ORM models exist; Alembic initial migration runs cleanly; seed data loads.

- [ ] Create `backend/models/base.py` — declarative Base, `TimestampMixin` with created_at/updated_at
- [ ] Create `backend/models/company.py`
- [ ] Create `backend/models/project.py`
- [ ] Create `backend/models/document.py` — include all enums: `SourceType`, `DocumentType`, `DocumentStatus`
- [ ] Create `backend/models/extracted_field.py`
- [ ] Create `backend/models/review.py` — `RiskLevel` enum
- [ ] Create `backend/models/risk.py` — `RiskStatus` enum
- [ ] Create `backend/models/approval.py` — `ApprovalStatus` enum
- [ ] Create `backend/models/accounting_draft.py` — `DraftType`, `DraftStatus` enums
- [ ] Create `backend/models/audit_log.py`
- [ ] Create `backend/models/onedrive_sync.py`
- [ ] Create `backend/models/__init__.py` — import all models so Alembic can detect them
- [ ] Configure `backend/alembic.ini` and `backend/alembic/env.py` to read `DATABASE_URL` from settings
- [ ] Run `alembic revision --autogenerate -m "initial_schema"`
- [ ] Run `alembic upgrade head` — verify all tables created in SQLite
- [ ] Create `backend/scripts/seed_demo_data.py`:
  - Insert Sunrise Ocean Engineering Limited company
  - Insert IDN-JETTY-2026 project
  - Insert default account mapping entries
- [ ] Create `backend/scripts/init_db.py` — runs migration + seed in one command
- [ ] Create `backend/scripts/reset_local_db.py` — drops and recreates local SQLite DB

**Phase 2 acceptance:**
```bash
poetry run python scripts/init_db.py
# All tables created, seed data inserted
# SELECT * FROM projects; → IDN-JETTY-2026 row present
```

---

## Phase 3 — Document Upload API and Frontend

**Goal:** User can upload a file from the browser; it is saved and recorded in the DB.

### Schemas
- [ ] Create `backend/schemas/common.py` — `PaginatedResponse`, `MessageResponse`
- [ ] Create `backend/schemas/document.py` — `DocumentCreate`, `DocumentRead`, `DocumentListItem`
- [ ] Create `backend/schemas/project.py` — `ProjectRead`, `ProjectCreate`

### Services
- [ ] Create `backend/services/file_storage_service.py`:
  - `save_upload(file, original_filename) -> (stored_path, stored_filename, sha256_hash)`
  - Saves to `storage/uploads/{uuid}_{original_filename}`
  - Calculates SHA-256
  - Detects MIME type from extension
- [ ] Create `backend/services/audit_service.py`:
  - `log_action(db, entity_type, entity_id, action, actor, details)`

### API
- [ ] Create `backend/api/routes_documents.py`:
  - `POST /documents/upload` — multipart form, optional `project_id`
    - Saves file, calculates hash, creates Document row with status=UPLOADED
    - Creates AuditLog entry
    - Returns `DocumentRead`
  - `GET /documents` — list with filters: project_id, document_type, document_status
  - `GET /documents/{id}` — full document detail
- [ ] Create `backend/api/routes_projects.py`:
  - `GET /projects`, `POST /projects`, `GET /projects/{id}`
- [ ] Register both routers in `app/main.py`

### Frontend
- [ ] Update `frontend/types/index.ts` — add Document, Project TypeScript types
- [ ] Update `frontend/lib/api.ts` — add `uploadDocument()`, `listDocuments()`, `getDocument()`, `listProjects()`
- [ ] Build `frontend/app/(dashboard)/upload/page.tsx`:
  - Project selector dropdown (fetches from `/projects`)
  - File input (multiple files supported)
  - Upload button — POST to `http://localhost:8000/documents/upload`
  - Success: show filename, document_id, sha256_hash, document_type=UNKNOWN
  - Error: show error message
- [ ] Build `frontend/app/(dashboard)/documents/page.tsx`:
  - Table of documents with columns: filename, type, status, project, risk, uploaded_at
  - Filter bar: project, type, status
  - Click row → navigate to `/documents/{id}`
- [ ] Build `frontend/app/(dashboard)/documents/[id]/page.tsx`:
  - Document metadata panel
  - Extracted fields panel (empty until Phase 4)
  - Agent reviews panel (empty until Phase 5)
  - Risks panel (empty until Phase 6)
  - Approvals panel (empty until Phase 6)
  - "Run Extract + Classify + Review" action button

**Phase 3 acceptance:**
- Upload a PDF → file appears in `storage/uploads/`
- DB row created with correct sha256
- Document list page shows the file
- Detail page loads without error

---

## Phase 4 — Text Extraction and Classification

**Goal:** Uploaded documents get text extracted and classified by type.

### Rule files
- [ ] Create `backend/rules/document_types.yaml` — keyword lists + required_fields + agents for each type
- [ ] Create `backend/rules/account_mapping.yaml`
- [ ] Create `backend/rules/risk_rules.yaml`
- [ ] Create `backend/rules/approval_rules.yaml`
- [ ] Create `backend/rules/qs_rules.yaml`
- [ ] Create `backend/rules/tax_rules.yaml`
- [ ] Create `backend/rules/filing_rules.yaml`

### LLM abstraction (establish before agents)
- [ ] Create `backend/integrations/llm/base.py` — `LLMClient` abstract class with `complete()`, `classify()`, `extract_fields()`
- [ ] Create `backend/integrations/llm/mock_llm.py` — `MockLLMClient`:
  - `classify()` returns highest-confidence match from keyword rules
  - `extract_fields()` returns regex-based field extraction
  - `complete()` returns structured template string
- [ ] Create `backend/integrations/llm/openai_llm.py` — stub with TODO, raises `NotImplementedError` if called without key
- [ ] Create `backend/integrations/llm/anthropic_llm.py` — stub with TODO
- [ ] Create `backend/integrations/llm/azure_openai_llm.py` — stub with TODO
- [ ] Create `backend/integrations/llm/__init__.py` — factory function `get_llm_client() -> LLMClient` reads `LLM_PROVIDER` from settings

### Services
- [ ] Create `backend/services/text_extraction_service.py`:
  - `extract_text(file_path, mime_type) -> (text, extraction_status)`
  - PDF: pypdf
  - Word: python-docx
  - Excel: openpyxl — extract sheet names, cell values as text summary
  - Image/unknown: return empty string, status=UNSUPPORTED
- [ ] Create `backend/services/document_classification_service.py`:
  - `classify_document(text, filename) -> (document_type, confidence, extracted_fields)`
  - Loads `rules/document_types.yaml`
  - Keyword scoring across all types
  - Returns top match + confidence score
  - Extracts fields using LLMClient.extract_fields()
  - Stores ExtractedField rows

### API endpoints
- [ ] `POST /documents/{id}/extract`:
  - Read file from storage
  - Run text extraction
  - Update Document.extracted_text, extraction_status
  - Return updated document
- [ ] `POST /documents/{id}/classify`:
  - Run classification on extracted text
  - Update Document.document_type, classification_confidence
  - Create ExtractedField rows
  - Update status to CLASSIFIED
  - Return classification result
- [ ] Chain extract → classify automatically after upload if `auto_process=true` query param

### Tests
- [ ] `tests/test_document_classification.py`:
  - Test keyword matching for SUPPLIER_INVOICE, CONTRACT, PAYMENT_CERTIFICATE
  - Test confidence scoring
  - Test field extraction (invoice_number, amount, supplier_name patterns)
- [ ] `tests/test_llm_provider_mock.py`:
  - Test `LLM_PROVIDER=mock` boots without credentials
  - Test `MockLLMClient.classify()` returns valid result
  - Test agents import only `LLMClient`, not vendor SDKs

**Phase 4 acceptance:**
- Upload a PDF invoice → extract + classify → type becomes SUPPLIER_INVOICE
- ExtractedField rows created for invoice_number, amount, supplier_name
- `LLM_PROVIDER=mock` confirmed working in test suite

---

## Phase 5 — Agent Review System

**Goal:** All 10 agents implemented; OrchestratorAgent runs full review and stores results.

Each agent follows this contract:
```python
class BaseAgent:
    def __init__(self, llm_client: LLMClient): ...
    def review(self, document: Document, extracted_fields: dict, context: dict) -> dict: ...
    # Returns structured dict matching agent's output schema
    # Never imports openai, anthropic, or azure directly
```

### Implementation order

#### Group A — implement fully in Phase 5

- [ ] `backend/agents/document_control_agent.py`
  - Check filename, type, scan quality indicators, page count estimate
  - Recommend filing path using `rules/filing_rules.yaml`
  - Output: `document_type`, `recommended_folder`, `recommended_filename`, `signature_required`, `page_issue`, `missing_documents`

- [ ] `backend/agents/accounting_agent.py`
  - Determine `draft_type` from document type
  - Look up `rules/account_mapping.yaml` for suggested codes
  - Flag missing invoice fields
  - Check for duplicate risk (query DB for same supplier + amount + date)
  - Output: `should_create_accounting_draft`, `draft_type`, `suggested_account_code`, `suggested_tax_code`, `requires_cpa_review`

- [ ] `backend/agents/compliance_agent.py`
  - Run red-flag checks using `rules/risk_rules.yaml`
  - Check missing supporting documents
  - Duplicate invoice risk
  - Output: `red_flags`, `missing_support`, `overall_compliance_risk`, `recommended_action`

#### Group B — implement with full logic in Phase 5

- [ ] `backend/agents/tax_agent.py`
  - Indonesia/HK WHT flag from document type + country context
  - DGT/COR required flag
  - Output: `tax_sensitive`, `possible_wht_issue`, `dgt_required`, `cor_required`, `tax_risk_level`

- [ ] `backend/agents/qs_agent.py`
  - Detect BQ/PC/VO document types
  - Extract PC number, gross/retention/net amounts
  - Output: `commercial_document_type`, `pc_number`, `gross_amount`, `retention_amount`, `qs_risk_level`

- [ ] `backend/agents/contract_agent.py`
  - Extract parties, amounts, payment terms from CONTRACT type
  - Flag missing signatures
  - Output: `contract_parties`, `payment_terms`, `signature_status`, `contract_risk_level`

- [ ] `backend/agents/procurement_agent.py`
  - Match PO/invoice/delivery note
  - Supplier bank details flag
  - Output: `supplier_name`, `po_reference`, `procurement_risk_level`

- [ ] `backend/agents/payment_agent.py`
  - Detect payment proofs, bank slips
  - Flag high-value payment (threshold from `rules/approval_rules.yaml`)
  - Output: `payment_type`, `amount`, `requires_director_approval`

- [ ] `backend/agents/reporting_agent.py`
  - Generate text summaries for each report type
  - Used by Phase 8 report endpoints

#### Orchestrator

- [ ] `backend/agents/orchestrator_agent.py`:
  - Accept document + all extracted fields + project context
  - Decide which agents to run based on document_type (use `rules/document_types.yaml` `agents:` list)
  - Run selected agents in sequence
  - Merge outputs into unified review JSON
  - Assign overall risk level (max of agent risk levels)
  - Return: `conclusion`, `specialist_reviews`, `risk_list`, `missing_documents`, `recommended_actions`

### Review storage
- [ ] `backend/services/document_review_service.py`:
  - `run_full_review(db, document_id) -> ReviewResult`
  - Calls OrchestratorAgent
  - Stores one Review row per agent
  - Stores Risk rows for each risk identified
  - Updates document status to REVIEWED
  - Creates AuditLog entry

### API
- [ ] `POST /documents/{id}/review` — triggers `document_review_service.run_full_review()`
- [ ] `GET /documents/{id}/reviews` — list all Review rows for document
- [ ] `GET /documents/{id}/risks` — list all Risk rows for document

### Frontend
- [ ] Update document detail page `/documents/[id]`:
  - "Run Full Review" button → POST to `/documents/{id}/review`
  - Display each agent review as collapsible card
  - Display risk list with colored `RiskBadge` component
  - Show overall risk level prominently
  - Show recommended actions list

**Phase 5 acceptance:**
- Upload supplier invoice → run review → see 5+ agent review cards
- Risk rows created in DB
- OrchestratorAgent returns structured JSON with conclusion
- No vendor SDK imports in any agent file (confirmed by test)

---

## Phase 6 — Risk Register and Approval Workflow

**Goal:** Risks are tracked; approvals can be actioned by the user.

### Services
- [ ] Create `backend/services/risk_service.py`:
  - `get_open_risks(db, project_id?) -> list[Risk]`
  - `acknowledge_risk(db, risk_id, actor) -> Risk`
  - `resolve_risk(db, risk_id, actor, notes) -> Risk`
- [ ] Create `backend/services/approval_service.py`:
  - `create_approval(db, document_id, approval_type) -> Approval`
  - Auto-called after review completes
  - `approve(db, approval_id, reviewer_name, reviewer_role, comments) -> Approval`
  - `reject(db, approval_id, ...) -> Approval`
  - `mark_status(db, approval_id, status, ...) -> Approval` — handles all other statuses
  - Each action writes AuditLog entry

### API
- [ ] `GET /approvals/pending`
- [ ] `POST /approvals/{id}/approve`
- [ ] `POST /approvals/{id}/reject`
- [ ] `POST /approvals/{id}/need-more-info`
- [ ] `POST /approvals/{id}/mark-cpa-review`
- [ ] `POST /approvals/{id}/mark-tax-advisor-review`
- [ ] `POST /approvals/{id}/mark-legal-review`
- [ ] `POST /approvals/{id}/mark-qs-review`

### Frontend
- [ ] Build `frontend/app/(dashboard)/approvals/page.tsx`:
  - List pending approvals grouped by document
  - Each row: document name, type, risk level, agent summary snippet
  - Action buttons: Approve / Reject / Need Info / Mark for CPA / Tax Advisor / Legal / QS
  - Reviewer name input field (free text, no auth required in V1)
  - Comments textarea
  - After action: row moves out of pending list, shows confirmation

### Tests
- [ ] `tests/test_approval_service.py`:
  - Test approve → status=APPROVED, audit log created
  - Test reject → status=REJECTED
  - Test that approved document cannot be approved again without explicit re-open

**Phase 6 acceptance:**
- Review a document → pending approval created automatically
- Approvals page shows pending item
- Approve action → status changes → audit log row written

---

## Phase 7 — Accounting Drafts and Mock Adapter

**Goal:** Accounting drafts can be created from documents and exported to MockAccountingAdapter.

### Accounting adapter
- [ ] Create `backend/integrations/accounting/base.py` — `AccountingAdapter` interface
- [ ] Create `backend/integrations/accounting/mock_accounting.py`:
  - `create_draft_bill()` — saves payload to `storage/reports/mock_accounting_{id}.json`, returns mock external ID
  - All other methods return mock data
  - Never calls any external API
- [ ] Create `backend/integrations/accounting/xero_accounting.py` — all methods raise `NotImplementedError` with TODO comments

### Service
- [ ] Create `backend/services/accounting_service.py`:
  - `create_draft_from_document(db, document_id) -> AccountingDraft`
    - Reads AccountingAgent review JSON from Review table
    - Creates AccountingDraft row with DRAFT status
    - Creates AuditLog entry
  - `approve_for_export(db, draft_id, reviewer_name) -> AccountingDraft`
    - Status → APPROVED_FOR_EXPORT
  - `export_draft(db, draft_id) -> dict`
    - Calls AccountingAdapter.create_draft_bill() or create_draft_invoice()
    - Updates draft status to EXPORTED_TO_ACCOUNTING
    - Stores external_accounting_id
    - Creates AuditLog entry

### API
- [ ] `GET /accounting/drafts`
- [ ] `GET /accounting/drafts/{id}`
- [ ] `POST /accounting/drafts/from-document/{document_id}`
- [ ] `POST /accounting/drafts/{id}/approve-for-export`
- [ ] `POST /accounting/drafts/{id}/export`

### Frontend
- [ ] Build `frontend/app/(dashboard)/accounting/page.tsx`:
  - List accounting drafts with status badges
  - Show suggested account code + tracking category
  - "Create Draft from Document" button
  - "Approve for Export" button (requires reviewer name)
  - "Export to Mock Accounting" button — triggers export, shows returned mock ID
  - Warning banner: "All accounting entries require human approval. AI suggestions only."

### Tests
- [ ] `tests/test_mock_accounting.py`:
  - Test create_draft_bill saves JSON file
  - Test export_draft updates AccountingDraft status
  - Test mock external_accounting_id format

**Phase 7 acceptance:**
- Create accounting draft from supplier invoice document
- Approve for export → status changes
- Export → JSON file created in `storage/reports/`, mock ID stored in DB

---

## Phase 8 — Reports

**Goal:** All 6 report endpoints return useful data; reports page displays them.

### Service
- [ ] Create `backend/services/report_service.py`:
  - `get_company_file_map(db) -> dict` — documents grouped by type and project
  - `get_missing_documents(db, project_id?) -> list` — documents with OPEN risks of category MISSING_SUPPORT
  - `get_risk_register(db, project_id?, min_level?) -> list[Risk]`
  - `get_accounting_draft_report(db) -> dict` — drafts grouped by status and type
  - `get_tax_compliance_report(db) -> list` — documents with tax_sensitive risks
  - `get_qs_summary(db, project_id) -> dict` — QS agent reviews grouped by document

### API
- [ ] `GET /reports/company-file-map`
- [ ] `GET /reports/missing-documents`
- [ ] `GET /reports/risk-register`
- [ ] `GET /reports/accounting-drafts`
- [ ] `GET /reports/tax-compliance`
- [ ] `GET /reports/qs-summary`

Also complete:
- [ ] `GET /projects/{id}/documents`
- [ ] `GET /projects/{id}/risks`
- [ ] `GET /projects/{id}/reports/summary`

### Frontend
- [ ] Build `frontend/app/(dashboard)/reports/page.tsx`:
  - Tab navigation: File Map / Missing Docs / Risk Register / Accounting / Tax / QS
  - File Map: table grouped by document type with counts
  - Missing Docs: list with document name, missing item description, project
  - Risk Register: table with risk level color coding, sortable by level
  - Accounting Drafts: summary table by status
  - Tax Compliance: list of flagged documents with WHT/DGT/COR flags
  - QS Summary: PC list with gross/retention/net amounts
- [ ] Build `frontend/app/(dashboard)/projects/page.tsx` — project list with status
- [ ] Build `frontend/app/(dashboard)/projects/[id]/page.tsx` — project detail with tabs

**Phase 8 acceptance:**
- After seeding and uploading test documents, reports page shows non-empty data in all 6 tabs
- Risk register correctly color-codes HIGH/CRITICAL items
- Missing documents report shows realistic missing items for supplier invoices

---

## Phase 9 — OneDrive Placeholder

**Goal:** OneDrive page exists with configuration UI and placeholder sync actions.

- [ ] Create `backend/integrations/onedrive/graph_client.py` — Microsoft Graph API client stub
- [ ] Create `backend/integrations/onedrive/sync_service.py` — full sync + delta sync stubs
- [ ] Create `backend/integrations/onedrive/webhook_service.py` — webhook receiver stub
- [ ] Create `backend/integrations/onedrive/token_store.py` — token storage stub

### API
- [ ] `GET /onedrive/status` — returns `{"enabled": false, "mode": "LocalManualUpload"}` when `ONEDRIVE_ENABLED=false`
- [ ] `POST /onedrive/configure` — stores drive_id + folder_item_id in OneDriveSyncState (placeholder)
- [ ] `POST /onedrive/sync/full` — returns `{"status": "not_configured"}` in V1
- [ ] `POST /onedrive/sync/delta` — returns `{"status": "not_configured"}` in V1
- [ ] `POST /onedrive/webhook` — accepts POST, logs payload, returns 200 (required by Microsoft Graph validation)
- [ ] `GET /onedrive/sync/history` — list OneDriveSyncState rows

### Frontend
- [ ] Build `frontend/app/(dashboard)/onedrive/page.tsx`:
  - Status banner: "OneDrive integration is not enabled. Running in Local Manual Upload mode."
  - Configuration section (grayed out): tenant ID, client ID, drive ID fields
  - "Test Connection" button (disabled when not configured)
  - Sync history table (empty in V1)
  - Instructions panel: what to configure to enable MicrosoftGraphMode

**Phase 9 acceptance:**
- `GET /onedrive/status` returns correct mode
- `POST /onedrive/webhook` returns 200 (needed for future Graph subscription validation)
- OneDrive page loads without error, shows correct status

---

## Phase 10 — Documentation and Final Polish

**Goal:** System is fully documented and ready for team handoff.

### Required documentation

- [ ] `docs/ARCHITECTURE.md`:
  - System overview diagram (ASCII)
  - Data flow: upload → extract → classify → review → approve → accounting → report
  - Technology decisions and rationale
  - Component responsibilities

- [ ] `docs/COMPLIANCE_RULES.md`:
  - What the system must never assist with
  - What the system may assist with
  - Professional review requirements by topic
  - Indonesia/HK specific rules

- [ ] `docs/LLM_PROVIDER_STRATEGY.md`:
  - Claude Code is development tool only
  - Runtime providers: Mock (V1), OpenAI/Anthropic (V1.5), Azure (enterprise)
  - How to switch provider
  - Why prompt logging is disabled by default
  - How to add a new provider

- [ ] `docs/ONEDRIVE_INTEGRATION.md`:
  - Two modes explained
  - How to enable MicrosoftGraphMode
  - Entra ID app registration steps
  - Read-only constraint explained
  - Webhook setup

### README.md (top-level)

Complete README with:
```
## Quick Start

# 1. Backend
cd backend
poetry install
cp .env.example .env
poetry run python scripts/init_db.py
poetry run uvicorn app.main:app --reload
# → http://localhost:8000/docs

# 2. Frontend
cd frontend
npm install
npm run dev
# → http://localhost:3000

## Running tests
cd backend
poetry run pytest

## Switching LLM provider
Edit backend/.env:
LLM_PROVIDER=openai  # requires: poetry install --extras openai

## Enabling OneDrive
Edit backend/.env:
ONEDRIVE_ENABLED=true
MICROSOFT_TENANT_ID=...
```

### Smoke test (automated happy path)

- [ ] Create `backend/scripts/smoke_test.py` using FastAPI `TestClient` — covers the full main flow:

```python
# backend/scripts/smoke_test.py
"""
Automated happy-path integration test.
Run: poetry run python scripts/smoke_test.py
Requires: init_db.py already run, LLM_PROVIDER=mock
"""
import io
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_workflow():
    # 1. Health check
    r = client.get("/health")
    assert r.status_code == 200

    # 2. Get project list (seed data must exist)
    r = client.get("/projects")
    assert r.status_code == 200
    projects = r.json()["items"]
    assert len(projects) > 0
    project_id = projects[0]["id"]

    # 3. Upload a mock PDF
    pdf_bytes = b"%PDF-1.4 supplier invoice amount 5000 USD invoice number INV-2026-001"
    r = client.post(
        "/documents/upload",
        files={"file": ("test_invoice.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        data={"project_id": str(project_id)},
    )
    assert r.status_code == 200
    doc_id = r.json()["id"]
    assert r.json()["sha256_hash"]

    # 4. Extract
    r = client.post(f"/documents/{doc_id}/extract")
    assert r.status_code == 200

    # 5. Classify
    r = client.post(f"/documents/{doc_id}/classify")
    assert r.status_code == 200

    # 6. Full agent review
    r = client.post(f"/documents/{doc_id}/review")
    assert r.status_code == 200
    reviews = client.get(f"/documents/{doc_id}/reviews").json()
    assert len(reviews) >= 3, "Expect at least 3 agent reviews"

    # 7. Pending approval created
    r = client.get("/approvals/pending")
    pending = [a for a in r.json()["items"] if a["document_id"] == doc_id]
    assert len(pending) >= 1
    approval_id = pending[0]["id"]

    # 8. Approve
    r = client.post(f"/approvals/{approval_id}/approve",
                    json={"reviewer_name": "Smoke Test", "reviewer_role": "ADMIN", "comments": "OK"})
    assert r.status_code == 200

    # 9. Create accounting draft
    r = client.post(f"/accounting/drafts/from-document/{doc_id}")
    assert r.status_code == 200
    draft_id = r.json()["id"]

    # 10. Approve for export
    r = client.post(f"/accounting/drafts/{draft_id}/approve-for-export",
                    json={"reviewer_name": "Smoke Test"})
    assert r.status_code == 200

    # 11. Export to mock adapter
    r = client.post(f"/accounting/drafts/{draft_id}/export")
    assert r.status_code == 200
    assert r.json()["external_accounting_id"].startswith("MOCK-")

    # 12. Risk register non-empty
    r = client.get("/reports/risk-register")
    assert r.status_code == 200

    print("Smoke test PASSED — full workflow verified.")

if __name__ == "__main__":
    test_full_workflow()
```

### Final polish tasks

- [ ] Add docstrings to all public service functions and agent classes
- [ ] Add TODO markers for all unimplemented integrations (Xero, real LLM providers, MSAL)
- [ ] Run smoke test: `poetry run python scripts/smoke_test.py` — PASSED
- [ ] Verify all 18 acceptance criteria from §15 of design spec
- [ ] Run `poetry run pytest` — all tests green
- [ ] Run `npm run build` in frontend — no TypeScript errors

---

## Testing Strategy

### Backend tests (pytest)

| Test file | What it covers |
|---|---|
| `test_api_health.py` | `GET /health` returns 200 |
| `test_document_classification.py` | Keyword matching, confidence scoring |
| `test_approval_service.py` | Approve/reject state machine, audit log |
| `test_mock_accounting.py` | Draft creation, JSON file output |
| `test_risk_service.py` | Risk creation from agent output |
| `test_llm_provider_mock.py` | Mock boots without credentials; no vendor imports in agents |

Run: `poetry run pytest -v`

### Frontend (manual in V1)

No automated frontend tests in V1. Test manually:
1. Upload flow
2. Document detail with reviews
3. Approval actions
4. Accounting draft creation and export
5. Reports page — all tabs show data

### Integration smoke test

After completing Phase 10, run this manual script:
```
1. Start backend + frontend
2. Upload sample-invoice.pdf
3. POST /documents/{id}/extract
4. POST /documents/{id}/classify → type should be SUPPLIER_INVOICE
5. POST /documents/{id}/review → 5+ reviews returned
6. GET /approvals/pending → approval present
7. POST /approvals/{id}/approve with reviewer_name="Test User"
8. POST /accounting/drafts/from-document/{id}
9. POST /accounting/drafts/{id}/approve-for-export
10. POST /accounting/drafts/{id}/export → mock JSON file created
11. GET /reports/risk-register → risks present
12. GET /reports/missing-documents → missing docs listed
```

---

## Phase Dependencies

```
Phase 1 (Skeleton)
  └── Phase 2 (DB Models)
        └── Phase 3 (Upload API)
              └── Phase 4 (Extraction + Classification)
                    └── Phase 5 (Agent Reviews)
                          ├── Phase 6 (Risk + Approval)
                          │     └── Phase 7 (Accounting)
                          │           └── Phase 8 (Reports)
                          │                 └── Phase 9 (OneDrive)
                          │                       └── Phase 10 (Docs)
                          └── (Phase 4 LLM abstraction feeds directly into Phase 5)
```

Phases 1-4 must complete before Phase 5. Phases 5-9 can overlap once Phase 4 is stable.

---

## Key Constraints (Carry Through All Phases)

1. `LLM_PROVIDER=mock` must work with zero external credentials at every phase
2. No vendor SDK (`openai`, `anthropic`, `msal`, `xero`) imported in `services/` or `agents/`
3. Every critical user action writes an `AuditLog` row
4. Every AI suggestion is labeled as a suggestion; no auto-approval anywhere
5. `ONEDRIVE_ENABLED=false` must produce a fully functional local system
6. Poetry is the only dependency manager; do not create or edit `requirements.txt` manually
7. Python version pinned to `>=3.13,<3.14` in `pyproject.toml`
