# SOE OneDrive Sync Skill

## Purpose

Guide implementation and operation of the Microsoft Graph / OneDrive integration
for Sunrise Ocean Engineering Limited's company document folder.

## Scope

- Full folder scan (initial sync)
- Delta sync (incremental change detection)
- Webhook event processing
- File metadata extraction from Graph API
- Local file download for processing
- `OneDriveSyncState` database management
- Two-mode configuration (LocalManualUpload / MicrosoftGraph)

## Out of Scope

- Writing back to OneDrive (read-only by design in V1)
- SharePoint list or page management
- Teams integration
- Email/calendar integration

---

## Operating Modes

### Mode A: LocalManualUploadMode (Default)
```
ONEDRIVE_ENABLED=false
```
All OneDrive API endpoints return `{"status": "not_configured", "mode": "LocalManualUploadMode"}`.
No Microsoft credentials required. System fully functional for manual uploads.

### Mode B: MicrosoftGraphMode
```
ONEDRIVE_ENABLED=true
MICROSOFT_TENANT_ID=...
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
MICROSOFT_REDIRECT_URI=...
ONEDRIVE_ROOT_DRIVE_ID=...
ONEDRIVE_ROOT_ITEM_ID=...
```
Requires Microsoft 365 tenant + Entra ID app registration.

---

## Required Microsoft Graph Permissions

| Permission | Type | Purpose |
|---|---|---|
| Files.Read.All | Application | Read all files in OneDrive/SharePoint |
| Sites.Read.All | Application | Read SharePoint sites |

Do NOT request write permissions. The system is read-only.

---

## Entra ID App Registration Steps

1. Azure portal → Microsoft Entra ID → App registrations → New registration
2. Name: `SOE AI Commercial Agent`
3. Account type: Single tenant
4. Redirect URI: value of `MICROSOFT_REDIRECT_URI`
5. Add API permissions: `Files.Read.All`, `Sites.Read.All` (Application type)
6. Grant admin consent
7. Create client secret → save as `MICROSOFT_CLIENT_SECRET`
8. Note Tenant ID → `MICROSOFT_TENANT_ID`
9. Note Client ID → `MICROSOFT_CLIENT_ID`

---

## Full Sync Workflow

```
1. GraphClient.list_folder_children(drive_id, root_item_id) — recursive
2. For each file item:
   a. Save metadata to Document (source_type=ONEDRIVE, source_file_id=item.id, source_path=item.parentReference.path)
   b. Download to storage/uploads/ via GraphClient.download_file()
   c. Trigger text_extraction_service + document_classification_service
   d. Set document status → CLASSIFIED
3. Store delta_link in OneDriveSyncState
```

## Delta Sync Workflow

```
1. Read delta_link from OneDriveSyncState
2. GraphClient.get_delta(drive_id, delta_link) → changed_items, new_delta_link
3. For created/updated items:
   - Update Document metadata
   - Re-download and re-process
   - Set document_status → CLASSIFIED (requires re-review)
4. For deleted items:
   - Set Document.source_file_id → mark as ARCHIVED (do NOT delete DB record)
   - Do NOT delete local processed copy
5. Store new_delta_link in OneDriveSyncState
```

## Webhook Processing

Microsoft Graph sends two distinct request types to the webhook URL:

### Subscription validation (sent once on creation)
```
POST /onedrive/webhook?validationToken=<token>
Body: may also contain validationToken

Required response:
  Status:       200 OK   (NOT 202)
  Content-Type: text/plain
  Body:         <validationToken value verbatim>

If you return JSON or 202, Graph rejects the subscription silently.
```

Implementation:
```python
@router.post("/onedrive/webhook")
async def webhook(request: Request, validationToken: str | None = Query(None)):
    if validationToken:
        # Subscription validation — must return token as plain text
        return PlainTextResponse(content=validationToken, status_code=200)
    # Actual change notification
    body = await request.json()
    # Do NOT process inline — set pending flag only
    sync_service.mark_pending_delta_sync()
    return Response(status_code=202)
```

### Change notification (ongoing)
```
POST /onedrive/webhook
Body: JSON change notification payload

Required response:
  Status: 202 Accepted   (NOT 200)

Processing:
→ Set OneDriveSyncState.pending_delta_sync = True
→ Return 202 immediately (do NOT process inline)
→ Background task picks up flag and runs delta sync
```

---

## Absolute Rules

1. **NEVER** call DELETE, PATCH, PUT on any OneDrive item via Graph API
2. **NEVER** rename or move original company files
3. **NEVER** overwrite original OneDrive files with processed versions
4. **ALWAYS** store `source_path` (original OneDrive path) and `web_url` in Document record
5. **ALWAYS** download a copy to local `storage/uploads/` — process the copy, not the original
6. If file deleted on OneDrive → mark local DB record as ARCHIVED, preserve local audit trail

---

## Compliance Limitations

- Read-only access is the design intent — never request or use write permissions
- Sync state is advisory — human must review classified documents before acting
- Downloaded copies are for processing only — do not redistribute company documents
- If Microsoft credentials are compromised, revoke via Azure portal immediately and notify management
