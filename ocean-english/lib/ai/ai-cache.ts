// AI 响应缓存。配了 Upstash（UPSTASH_REDIS_REST_*）→ 走 Redis（跨实例共享）；否则进程内存版。

import { redisEnabled, redisCmd } from './redis-client'

interface CacheEntry {
  value: string
  expiresAt: number
}

const store = new Map<string, CacheEntry>()
const DEFAULT_TTL_MS = 60 * 60 * 1000 // 1 hour

export async function cacheGet(key: string): Promise<string | null> {
  if (redisEnabled()) {
    const v = await redisCmd<string | null>(['GET', `cache:${key}`])
    return typeof v === 'string' ? v : null
  }
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return null
  }
  return entry.value
}

export async function cacheSet(key: string, value: string, ttlMs = DEFAULT_TTL_MS): Promise<void> {
  if (redisEnabled()) {
    await redisCmd(['SET', `cache:${key}`, value, 'EX', String(Math.max(1, Math.ceil(ttlMs / 1000)))])
    return
  }
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
}

export function makeCacheKey(...parts: string[]): string {
  return parts.join(':')
}
