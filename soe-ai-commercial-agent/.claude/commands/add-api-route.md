# /add-api-route

Add a new API route to the SOE AI Commercial Agent FastAPI backend.

## Steps

1. **Identify the correct route file** in `backend/api/`:
   - Documents → `routes_documents.py`
   - Projects → `routes_projects.py`
   - Reviews/Risks → `routes_reviews.py`
   - Approvals → `routes_approvals.py`
   - Accounting → `routes_accounting.py`
   - Reports → `routes_reports.py`
   - OneDrive → `routes_onedrive.py`
   - New resource → create `routes_{resource}.py` and register in `app/main.py`

2. **Create or update the Pydantic schema** in `backend/schemas/{resource}.py`:
   - Response schema with `model_config = ConfigDict(from_attributes=True)`
   - Request schema for POST/PATCH bodies

3. **Create the service function** in `backend/services/{resource}_service.py`:
   - Accept `db: Session` as first arg
   - Contain all business logic — no DB calls in route handlers
   - Write AuditLog entry for any critical mutation

4. **Write the route handler** — thin wrapper only:
   ```python
   @router.post("/{id}/action", response_model=ResponseSchema)
   async def action_resource(
       id: int,
       body: RequestSchema,
       db: Session = Depends(get_db),
   ) -> ResponseSchema:
       result = resource_service.do_action(db, id, body)
       return result
   ```

5. **Update TypeScript types** in `frontend/types/index.ts` to match response schema

6. **Update `frontend/lib/api.ts`** with the new fetch function

7. **Write a test** if the route has business logic worth testing

## Checklist Before Finishing

- [ ] Route registered in correct router file
- [ ] Router registered in `app/main.py` (if new file)
- [ ] Response model declared on route handler
- [ ] 404 returned when resource not found
- [ ] Mutation routes write AuditLog entry
- [ ] TypeScript types updated in frontend
- [ ] API client function added to `lib/api.ts`
