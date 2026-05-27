#!/usr/bin/env bash
# Secret scan hook for SOE AI Commercial Agent
# Scans content being written for potential secrets or credentials.
# Exit 0 = allow; Exit 2 = block

set -euo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_name',''))" 2>/dev/null || echo "")

# Only scan Write and Edit tool calls
if [ "$TOOL_NAME" != "Write" ] && [ "$TOOL_NAME" != "Edit" ]; then
  exit 0
fi

TOOL_INPUT=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d.get('tool_input',{})))" 2>/dev/null || echo "{}")
FILE_PATH=$(echo "$TOOL_INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('file_path',''))" 2>/dev/null || echo "")
CONTENT=$(echo "$TOOL_INPUT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('content', '') or d.get('new_string', ''))
" 2>/dev/null || echo "")

# Skip .env.example (it's meant to have placeholder key names)
if echo "$FILE_PATH" | grep -qE "\.env\.example$|\.env\.sample$"; then
  exit 0
fi

# Skip test files (they may have fake/mock values)
if echo "$FILE_PATH" | grep -qE "/tests?/|_test\.py$|test_.*\.py$"; then
  exit 0
fi

BLOCKED=0
REASONS=""

# OpenAI API keys
if echo "$CONTENT" | grep -qE "sk-[a-zA-Z0-9]{20,}"; then
  BLOCKED=1
  REASONS="${REASONS}\n- Possible OpenAI API key detected (sk-...)"
fi

# Anthropic API keys
if echo "$CONTENT" | grep -qE "sk-ant-[a-zA-Z0-9\-]{20,}"; then
  BLOCKED=1
  REASONS="${REASONS}\n- Possible Anthropic API key detected (sk-ant-...)"
fi

# Azure connection strings
if echo "$CONTENT" | grep -qE "DefaultEndpointsProtocol=https.*AccountKey="; then
  BLOCKED=1
  REASONS="${REASONS}\n- Possible Azure storage connection string detected"
fi

# Generic high-entropy patterns that look like assigned secrets (not variable names)
if echo "$CONTENT" | grep -qE "(api_key|API_KEY|secret|SECRET|password|PASSWORD)\s*=\s*['\"][a-zA-Z0-9+/=_\-]{16,}['\"]"; then
  # Exclude lines with placeholder values like "your-key-here", "change-me", empty, or mock
  if ! echo "$CONTENT" | grep -qE "(api_key|API_KEY|secret|SECRET|password|PASSWORD)\s*=\s*['\"]?(your|change|placeholder|example|mock|test|xxx|<|$)"; then
    BLOCKED=1
    REASONS="${REASONS}\n- Possible hardcoded credential detected (key/secret/password with value)"
  fi
fi

# Microsoft client secrets (GUIDs or long strings after client_secret)
if echo "$CONTENT" | grep -qE "client_secret\s*=\s*['\"][a-zA-Z0-9~_\-\.]{20,}['\"]"; then
  BLOCKED=1
  REASONS="${REASONS}\n- Possible Microsoft client_secret value detected"
fi

if [ "$BLOCKED" = "1" ]; then
  echo -e "BLOCKED: Potential secret detected in file: $FILE_PATH${REASONS}" >&2
  echo "Store credentials in .env only. Use placeholder values in .env.example." >&2
  exit 2
fi

exit 0
