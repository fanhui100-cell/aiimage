# /update-docs

Update project documentation after a meaningful code change.

## Triggers

Run this command after:
- Adding a new API route
- Adding a new database model
- Changing an existing API response schema
- Adding a new environment variable
- Completing a phase of the implementation plan

## Steps

### After Adding API Route

1. Update `frontend/types/index.ts` with new TypeScript types
2. Update `frontend/lib/api.ts` with new fetch function
3. If `docs/API_SPEC.md` exists: add route entry with method, path, request, response
4. If README has a "features" section: update it

### After Adding Database Model

1. Update `docs/DATABASE_SCHEMA.md` (if it exists) with new table definition
2. Update `backend/scripts/seed_demo_data.py` if new seed rows needed
3. Update `frontend/types/index.ts` with corresponding TypeScript type

### After Adding Environment Variable

1. Add to `backend/.env.example` with comment explaining what it does
2. Add to `backend/app/config.py` Settings class with type and default
3. Document in `README.md` configuration section
4. Update `docs/LLM_PROVIDER_STRATEGY.md` if it's an LLM-related var
5. Update `docs/ONEDRIVE_INTEGRATION.md` if it's an OneDrive-related var

### After Completing a Phase

1. Update `README.md` to reflect what features are now available
2. Mark phase as complete in `docs/superpowers/plans/2026-05-27-soe-ai-commercial-agent-plan.md`
3. Update `docs/ARCHITECTURE.md` with any new components

## Doc Quality Standards

- Every env var must have a one-line comment in `.env.example` explaining its purpose
- Every breaking change must note the migration path
- Compliance warnings must use MUST/MUST NOT language (not SHOULD/MAY)
- Commands in README must be copy-paste ready — no placeholders like `<your-value>`

## Quick Consistency Check

```bash
# Env vars in .env.example but not in Settings class:
grep "^[A-Z_]*=" backend/.env.example | cut -d= -f1 | sort > /tmp/env_keys.txt
python -c "from app.config import Settings; [print(k.upper()) for k in Settings.model_fields]" \
  | sort > /tmp/settings_keys.txt
diff /tmp/env_keys.txt /tmp/settings_keys.txt
```
