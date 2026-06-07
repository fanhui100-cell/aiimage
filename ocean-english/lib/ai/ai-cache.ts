// In-memory cache placeholder.
// TODO Phase 3C: Replace with Redis or Vercel KV for production use.
// TODO Phase 3C: Add per-user rate limiting keyed by session/IP.

interface CacheEntry {
  value: string
  expiresAt: number
}

const store = new Map<string, CacheEntry>()
const DEFAULT_TTL_MS = 60 * 60 * 1000 // 1 hour

export function cacheGet(key: string): string | null {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return null
  }
  return entry.value
}

export function cacheSet(key: string, value: string, ttlMs = DEFAULT_TTL_MS): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
}

export function makeCacheKey(...parts: string[]): string {
  return parts.join(':')
}
