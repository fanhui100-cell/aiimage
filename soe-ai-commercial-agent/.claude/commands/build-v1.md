# /build-v1

Build the SOE AI Commercial Agent V1 system following the phased implementation plan.

Reference plan: `docs/superpowers/plans/2026-05-27-soe-ai-commercial-agent-plan.md`
Reference spec: `docs/superpowers/specs/2026-05-27-soe-ai-commercial-agent-design.md`

## Execution Order

Work through these phases in sequence. Complete each phase's acceptance criteria before moving to the next.

### Phase 1 — Project Skeleton
- Create `backend/` with `pyproject.toml` (Python 3.13, Poetry)
- Create `backend/app/main.py`, `config.py`, `database.py`
- Create `backend/api/routes_health.py` — `GET /health`
- Create `backend/app/logging_config.py`
- Create `backend/storage/` subdirectories
- Create `frontend/` as Next.js App Router project
- Create sidebar layout with all 7 nav items
- Create stub pages for each route

**Gate:** `poetry run uvicorn app.main:app --reload` starts; `GET /health` returns 200; `npm run dev` starts.

### Phase 2 — Database Models
- Create all 10 SQLAlchemy models with TimestampMixin
- Configure Alembic
- Run initial migration
- Create seed scripts

**Gate:** `poetry run python scripts/init_db.py` completes; IDN-JETTY-2026 row present.

### Phase 3 — Document Upload
- Implement `file_storage_service.py`, `audit_service.py`
- Implement `POST /documents/upload`, `GET /documents`, `GET /documents/{id}`
- Build upload page and document list page in Next.js

**Gate:** Upload PDF from browser; file in `storage/uploads/`; DB row created.

### Phase 4 — Extraction and Classification
- Create all YAML rule files in `rules/`
- Create LLMClient abstraction and MockLLMClient
- Create openai/anthropic/azure stubs
- Implement `text_extraction_service.py`, `document_classification_service.py`
- Wire `POST /documents/{id}/extract` and `POST /documents/{id}/classify`

**Gate:** PDF invoice classifies as SUPPLIER_INVOICE; ExtractedField rows created; tests pass.

### Phase 5 — Agent Reviews
- Implement all 10 agents
- Implement `document_review_service.py`
- Wire `POST /documents/{id}/review`
- Build review display in document detail page

**Gate:** Review generates 5+ agent cards; risk rows created; no vendor SDK imports in agents.

### Phase 6 — Approvals
- Implement `approval_service.py`, `risk_service.py`
- Implement all approval routes
- Build approvals page

**Gate:** Pending approval created after review; approve action writes audit log.

### Phase 7 — Accounting Drafts
- Implement MockAccountingAdapter and XeroAdapter stub
- Implement `accounting_service.py`
- Implement all accounting routes
- Build accounting drafts page

**Gate:** Draft created; approved; exported to mock JSON file.

### Phase 8 — Reports
- Implement `report_service.py`
- Implement all report routes
- Build reports page with all 6 tabs

**Gate:** All report tabs show non-empty data after test documents uploaded.

### Phase 9 — OneDrive Placeholder
- Create all OneDrive integration stubs
- Implement OneDrive routes (returning not_configured in V1)
- Build OneDrive page

**Gate:** `/onedrive/status` returns correct mode; page loads; webhook returns 200.

### Phase 10 — Documentation
- Write `docs/ARCHITECTURE.md`, `COMPLIANCE_RULES.md`, `LLM_PROVIDER_STRATEGY.md`, `ONEDRIVE_INTEGRATION.md`
- Complete `README.md`
- Run full acceptance criteria check against spec §15

**Gate:** All 18 acceptance criteria in design spec §15 pass.

## Key Constraints (check at every phase)

- `LLM_PROVIDER=mock` works with zero credentials
- No vendor SDK imports in `services/` or `agents/`
- Every critical action writes AuditLog
- Poetry is the only dependency manager
- ONEDRIVE_ENABLED=false produces fully functional local system
