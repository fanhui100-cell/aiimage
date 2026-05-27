#!/usr/bin/env bash
# Post-edit hook: run API health and classification tests after route file changes.

set -euo pipefail

INPUT=$(cat)
TOOL_INPUT=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d.get('tool_input',{})))" 2>/dev/null || echo "{}")
FILE_PATH=$(echo "$TOOL_INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('file_path',''))" 2>/dev/null || echo "")

# Only trigger on route files
if ! echo "$FILE_PATH" | grep -qE "backend/api/routes_.*\.py$"; then
  exit 0
fi

BACKEND_DIR=$(echo "$FILE_PATH" | sed 's|\(.*backend\)/.*|\1|')

if ! (cd "$BACKEND_DIR" && poetry env info --path &>/dev/null 2>&1); then
  exit 0
fi

echo "API route file changed: $FILE_PATH — running API tests..." >&2

RESULT=0
(cd "$BACKEND_DIR" && poetry run pytest tests/test_api_health.py -q --tb=short 2>&1) || RESULT=$?

if [ "$RESULT" != "0" ]; then
  echo "WARNING: API tests failed after editing $(basename "$FILE_PATH"). Check route registration in app/main.py." >&2
fi

# Also check for vendor SDK import violations after any route edit
VIOLATIONS=$(grep -rn "import openai\|from openai\|import anthropic\|from anthropic" \
  "$BACKEND_DIR/services/" "$BACKEND_DIR/agents/" 2>/dev/null || true)

if [ -n "$VIOLATIONS" ]; then
  echo "VIOLATION DETECTED: Vendor SDK imported in services/ or agents/:" >&2
  echo "$VIOLATIONS" >&2
  echo "Move LLM calls to integrations/llm/ and use get_llm_client()." >&2
fi

exit 0
