// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

/** True only when both Supabase env vars are set. Auth features are disabled otherwise. */
export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY)

/** Returns a browser-side Supabase client. Only call when isSupabaseConfigured is true. */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
