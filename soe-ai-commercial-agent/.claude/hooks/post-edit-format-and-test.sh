#!/usr/bin/env bash
# Post-edit hook: format Python files and run fast tests after meaningful edits.
# Skips if no Python file was changed, or if backend/ is not set up.

set -euo pipefail

INPUT=$(cat)
TOOL_INPUT=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d.get('tool_input',{})))" 2>/dev/null || echo "{}")
FILE_PATH=$(echo "$TOOL_INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('file_path',''))" 2>/dev/null || echo "")

# Only act on Python files
if ! echo "$FILE_PATH" | grep -qE "\.py$"; then
  exit 0
fi

# Only act on backend Python files
if ! echo "$FILE_PATH" | grep -qE "^.*backend/"; then
  exit 0
fi

BACKEND_DIR=$(echo "$FILE_PATH" | sed 's|\(.*backend\)/.*|\1|')

# Check Poetry environment is available
if ! (cd "$BACKEND_DIR" && poetry env info --path &>/dev/null 2>&1); then
  # Poetry not set up yet — skip silently
  exit 0
fi

# Run only the fast health test to confirm nothing is catastrophically broken
# Full test suite runs on /run-tests command — not on every edit
(cd "$BACKEND_DIR" && poetry run pytest tests/test_api_health.py -q --tb=short 2>&1) || {
  echo "WARNING: Health test failed after editing $FILE_PATH. Run /run-tests for full details." >&2
  # Do not block (exit 0) — just warn. Blocking post-hooks are too disruptive mid-session.
  exit 0
}

exit 0
