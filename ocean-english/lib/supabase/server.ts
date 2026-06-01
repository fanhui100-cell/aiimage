// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './client'

/**
 * Returns a server-side Supabase client for use in Server Components and Route Handlers.
 * Uses Next.js cookie store for session management.
 */
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Server Components cannot set cookies — silently ignored.
          // Route Handlers can set cookies and this will succeed there.
        }
      },
    },
  })
}
