#!/usr/bin/env bash
# Post-edit hook: check for pending Alembic migrations after model file changes.

set -euo pipefail

INPUT=$(cat)
TOOL_INPUT=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d.get('tool_input',{})))" 2>/dev/null || echo "{}")
FILE_PATH=$(echo "$TOOL_INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('file_path',''))" 2>/dev/null || echo "")

# Only trigger on model files
if ! echo "$FILE_PATH" | grep -qE "backend/models/.*\.py$"; then
  exit 0
fi

# Skip base.py — changing the base class doesn't require a migration check
if echo "$FILE_PATH" | grep -qE "models/base\.py$"; then
  exit 0
fi

BACKEND_DIR=$(echo "$FILE_PATH" | sed 's|\(.*backend\)/.*|\1|')

if ! (cd "$BACKEND_DIR" && poetry env info --path &>/dev/null 2>&1); then
  exit 0
fi

if ! [ -f "$BACKEND_DIR/alembic.ini" ]; then
  exit 0
fi

echo "Model file changed: $FILE_PATH — checking Alembic migration status..." >&2

# Check if there are unapplied changes (autogenerate would produce a non-empty migration)
CHECK_OUTPUT=$(cd "$BACKEND_DIR" && poetry run alembic check 2>&1 || true)

if echo "$CHECK_OUTPUT" | grep -qE "New upgrade operations detected|ERROR"; then
  echo "WARNING: Alembic detects model changes without a corresponding migration." >&2
  echo "Run: cd backend && poetry run alembic revision --autogenerate -m 'describe_your_change'" >&2
  echo "Then: poetry run alembic upgrade head" >&2
else
  echo "Alembic: no pending migrations detected." >&2
fi

exit 0
