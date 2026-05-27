# /run-tests

Run the SOE AI Commercial Agent test suite.

## Full Test Suite

```bash
cd backend
poetry run pytest -v
```

## Specific Test Categories

```bash
# LLM provider isolation (most critical — run first)
poetry run pytest tests/test_llm_provider_mock.py -v

# Document classification
poetry run pytest tests/test_document_classification.py -v

# Approval state machine
poetry run pytest tests/test_approval_service.py -v

# Mock accounting adapter
poetry run pytest tests/test_mock_accounting.py -v

# API health
poetry run pytest tests/test_api_health.py -v

# Run with coverage
poetry run pytest --cov=app --cov=api --cov=services --cov=agents -v
```

## Critical Check: No Vendor SDK in Agents

This test must always pass before any PR or commit:

```bash
poetry run pytest tests/test_llm_provider_mock.py::test_agents_have_no_vendor_imports -v
```

Expected: PASSED — all agent files import only from `integrations.llm`, never from `openai`, `anthropic`, or `azure`.

## Environment for Tests

Tests must run with `LLM_PROVIDER=mock` and no external credentials.
The test suite should never require `.env` to be set — all test fixtures must provide safe defaults.

If a test requires environment variables, use `monkeypatch.setenv()` in the test itself.

## When Tests Fail

1. Read the full error traceback
2. Check if it's a missing import (Poetry extras not installed)
3. Check if it's a DB issue (run `poetry run python scripts/reset_local_db.py`)
4. Check if a migration is missing (run `poetry run alembic upgrade head`)
5. Do NOT skip tests to make CI green — fix the root cause

## Frontend Type Check

```bash
cd frontend
npm run build
```

TypeScript compilation errors must be zero before any PR.
