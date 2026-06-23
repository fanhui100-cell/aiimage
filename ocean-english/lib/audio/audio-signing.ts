/* ════════════════════════════════════════════════════════════════════════
   lib/audio/audio-signing.ts — server-only signed-URL minter for the PRIVATE audio bucket (R6).

   Decision #5: bucket qbank-audio is PRIVATE; playback must go through a backend short-lived
   signed URL. The user-scoped SSR client cannot read private storage objects, so signing uses a
   service-role client built lazily from server env. NEVER import this from a client component
   (it reads SUPABASE_SERVICE_ROLE_KEY). The key is never returned or logged.
   ════════════════════════════════════════════════════════════════════════ */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _admin: SupabaseClient | null = null
function admin(): SupabaseClient | null {
  if (_admin) return _admin
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  _admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  return _admin
}
const bucket = () => process.env.SUPABASE_AUDIO_BUCKET || ''

/** Mint a short-lived signed URL for a private-bucket object path. Returns null if unavailable. */
export async function signAudioPath(path: string | null | undefined, ttlSeconds = 3600): Promise<string | null> {
  const a = admin()
  const b = bucket()
  if (!a || !b || !path) return null
  try {
    const { data, error } = await a.storage.from(b).createSignedUrl(path, ttlSeconds)
    if (error) return null
    return data?.signedUrl ?? null
  } catch {
    return null
  }
}
