# /add-nextjs-page

Add a new page to the SOE AI Commercial Agent Next.js dashboard.

## Steps

1. **Create the page file** at `frontend/app/(dashboard)/{route}/page.tsx`:

   ```typescript
   'use client'

   import { useEffect, useState } from 'react'
   import { listMyResources } from '@/lib/api'
   import type { MyResource } from '@/types'

   export default function MyPage() {
     const [data, setData] = useState<MyResource[]>([])
     const [loading, setLoading] = useState(true)
     const [error, setError] = useState<string | null>(null)

     useEffect(() => {
       listMyResources()
         .then(setData)
         .catch((e) => setError(e.message))
         .finally(() => setLoading(false))
     }, [])

     if (loading) return <div className="p-6">Loading...</div>
     if (error) return <div className="p-6 text-red-600">Error: {error}</div>

     return (
       <div className="p-6">
         <h1 className="text-xl font-semibold mb-4">Page Title</h1>
         {/* content */}
       </div>
     )
   }
   ```

2. **Add nav link** in `frontend/app/(dashboard)/layout.tsx` sidebar if not already present

3. **Add API function** in `frontend/lib/api.ts`:
   ```typescript
   export async function listMyResources(): Promise<MyResource[]> {
     const res = await fetch(`${API_BASE}/my-resources`)
     if (!res.ok) throw new Error(`API error ${res.status}`)
     return res.json()
   }
   ```

4. **Add TypeScript types** in `frontend/types/index.ts` if not already present

## UI Standards for Internal Tool

- Use compact table layout for list views (not cards for tabular data)
- Use `RiskBadge` component for risk level display
- Action buttons inline with table rows
- Status badges with color coding matching backend enums
- Always show loading state and error state

## Compliance UI Requirements

When displaying AI-generated content:
```tsx
<div className="text-xs text-gray-500 mt-1">
  AI suggestion — requires human review before action
</div>
```

When displaying tax analysis:
```tsx
<div className="text-xs text-amber-600 mt-1">
  Requires professional tax advisor review
</div>
```

When showing accounting drafts:
```tsx
<div className="text-xs text-blue-600 mt-1">
  Accounting entry requires human approval before export
</div>
```

## Checklist

- [ ] Page created at correct route
- [ ] Nav link added to sidebar layout
- [ ] API function added to `lib/api.ts`
- [ ] TypeScript types defined in `types/index.ts`
- [ ] Loading and error states handled
- [ ] Compliance disclaimers shown where AI content is displayed
- [ ] No direct `fetch` calls in page component (use `lib/api.ts` functions)
