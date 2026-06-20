// Rate limiter keyed by IP + endpoint.
// 配了 Upstash（UPSTASH_REDIS_REST_*）→ 走 Redis（跨实例一致）；否则回退进程内存版。

import type { NextRequest } from 'next/server'
import { redisEnabled, redisCmd } from './redis-client'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

export interface RateLimitConfig {
  windowMs: number
  max: number
}

// Per-endpoint limits (requests per windowMs per IP)
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  chat: { windowMs: 60_000, max: 30 },
  'word-explain': { windowMs: 60_000, max: 20 },
  'quiz-generate': { windowMs: 60_000, max: 10 },
  'mistake-analysis': { windowMs: 60_000, max: 5 },
  'study-plan': { windowMs: 60_000, max: 5 },
  // Phase 4A — document routes
  'document-extract': { windowMs: 60_000, max: 10 },
  'document-analysis': { windowMs: 60_000, max: 5 },
  // 公开用 service role 查用户名 → 限流防枚举
  'username-check': { windowMs: 60_000, max: 30 },
}

export function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}

/** Returns true if the request is within limits, false if rate-limited. */
export async function checkRateLimit(key: string, config: RateLimitConfig): Promise<boolean> {
  if (redisEnabled()) {
    const windowSec = Math.max(1, Math.ceil(config.windowMs / 1000))
    const count = await redisCmd<number>(['INCR', `rl:${key}`])
    if (typeof count === 'number') {
      if (count === 1) await redisCmd(['EXPIRE', `rl:${key}`, windowSec])
      return count <= config.max
    }
    // Redis 抖动 → 落到内存版，避免误杀
  }
  return checkRateLimitMemory(key, config)
}

/** 进程内存版（无 Redis 或 Redis 失败时使用）。 */
function checkRateLimitMemory(key: string, config: RateLimitConfig): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return true
  }

  if (entry.count >= config.max) return false
  entry.count++
  return true
}

export function rateLimitKey(endpoint: string, ip: string): string {
  return `${endpoint}:${ip}`
}
