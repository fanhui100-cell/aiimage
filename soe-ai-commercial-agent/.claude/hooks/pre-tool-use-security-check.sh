#!/usr/bin/env bash
# Pre-tool-use security check for SOE AI Commercial Agent
# Blocks dangerous operations before they execute.
# Exit 0 = allow; Exit 2 = block (stderr is shown to Claude as reason)

set -euo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_name',''))" 2>/dev/null || echo "")
TOOL_INPUT=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d.get('tool_input',{})))" 2>/dev/null || echo "{}")

# ── Bash tool checks ──────────────────────────────────────────────────────────
if [ "$TOOL_NAME" = "Bash" ]; then
  COMMAND=$(echo "$TOOL_INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('command',''))" 2>/dev/null || echo "")

  # Block: destructive file operations on company storage
  if echo "$COMMAND" | grep -qE "rm\s+-rf\s+.*storage/|rm\s+-rf\s+/|rmdir.*storage"; then
    echo "BLOCKED: Destructive deletion of storage directory is not allowed. Company documents must not be deleted automatically." >&2
    exit 2
  fi

  # Block: force push
  if echo "$COMMAND" | grep -qE "git push.*--force|git push.*-f\b"; then
    echo "BLOCKED: Force push is not allowed without explicit user confirmation." >&2
    exit 2
  fi

  # Block: hard reset
  if echo "$COMMAND" | grep -qE "git reset --hard"; then
    echo "BLOCKED: git reset --hard is not allowed without explicit user confirmation." >&2
    exit 2
  fi

  # Block: direct accounting approval patterns
  if echo "$COMMAND" | grep -qE "auto_approve|skip_approval|bypass.*approval"; then
    echo "BLOCKED: Auto-approval patterns are not allowed in SOE AI Commercial Agent. All accounting entries require human confirmation." >&2
    exit 2
  fi

  # Block: curl/wget to external payment or accounting APIs without review
  if echo "$COMMAND" | grep -qE "curl.*xero\.com|curl.*stripe\.com|curl.*paypal\.com|wget.*xero"; then
    echo "BLOCKED: Direct API calls to payment/accounting services must be reviewed. Use the AccountingAdapter pattern." >&2
    exit 2
  fi

  # Warn (but allow): operations on OneDrive files that could modify originals
  if echo "$COMMAND" | grep -qE "PATCH.*drive.*items|DELETE.*drive.*items|PUT.*drive.*items"; then
    echo "WARNING: Detected potential OneDrive write/delete operation. Ensure ONEDRIVE_ENABLED rules are followed — originals must not be modified." >&2
    # Do not block — just warn (exit 0)
  fi
fi

# ── Write tool checks ─────────────────────────────────────────────────────────
if [ "$TOOL_NAME" = "Write" ] || [ "$TOOL_NAME" = "Edit" ]; then
  FILE_PATH=$(echo "$TOOL_INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('file_path',''))" 2>/dev/null || echo "")

  # Block: writing to .env (use .env.example instead)
  if echo "$FILE_PATH" | grep -qE "\.env$"; then
    echo "BLOCKED: Do not write to .env directly. Edit .env.example and let the user copy it. Real credentials must never be committed." >&2
    exit 2
  fi

  # Block: writing directly to storage/uploads (files must go through file_storage_service)
  if echo "$FILE_PATH" | grep -qE "storage/uploads/"; then
    echo "BLOCKED: Do not write directly to storage/uploads/. Use file_storage_service.save_upload() instead." >&2
    exit 2
  fi
fi

exit 0
