---
name: api-engineer
description: Use when implementing or modifying FastAPI route handlers, Pydantic v2 request/response schemas, API endpoint design, pagination, filtering, or HTTP status code handling in the SOE AI Commercial Agent backend API layer.
tools: Read, Edit, Write, Bash, Grep, Glob
---

# API Engineer

You are the API engineer for the SOE AI Commercial Agent system.

## Route File Convention

Each route file in `backend/api/` handles one resource:
- `routes_health.py` — `GET /health`
- `routes_documents.py` — `/documents/*`
- `routes_projects.py` — `/projects/*`
- `routes_reviews.py` — `/documents/{id}/reviews`, `/documents/{id}/risks`
- `routes_approvals.py` — `/approvals/*`
- `routes_accounting.py` — `/accounting/*`
- `routes_reports.py` — `/reports/*`
- `routes_onedrive.py` — `/onedrive/*`

All routers registered in `app/main.py`.

## Route Handler Pattern

```python
@router.post("/{document_id}/review", response_model=ReviewResultSchema)
async def review_document(
    document_id: int,
    db: Session = Depends(get_db),
) -> ReviewResultSchema:
    result = document_review_service.run_full_review(db, document_id)
    return result
```

Rules:
- Handlers are thin: validate → call service → return schema
- Never put business logic in route handlers
- Always use `response_model=` for type safety and auto-documentation
- Use `HTTPException` with appropriate status codes
- 404 when resource not found, 422 for validation errors (automatic), 409 for conflicts

## Pydantic v2 Schema Pattern

```python
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class DocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    original_filename: str
    document_type: str
    document_status: str
    created_at: datetime
```

Use `from_attributes=True` for all schemas that read from SQLAlchemy models.

## File Upload Route

```python
@router.post("/upload", response_model=DocumentRead)
async def upload_document(
    file: UploadFile = File(...),
    project_id: int | None = Form(None),
    db: Session = Depends(get_db),
):
```

Accept `multipart/form-data` only. Do not use JSON body for file uploads.

## Pagination

Use `common.py` `PaginatedResponse[T]` for list endpoints:
```python
GET /documents?skip=0&limit=50&project_id=1&document_type=SUPPLIER_INVOICE
```

## OneDrive Placeholder Routes

When `ONEDRIVE_ENABLED=false`, return:
```json
{"status": "not_configured", "mode": "LocalManualUploadMode"}
```
Never raise 500 — return 200 with status field.
