// Simple in-memory rate limiter keyed by IP + endpoint.
// TODO Phase 3C: Replace with Redis-based distributed rate limiter before multi-instance deploy.

import type { NextRequest } from 'next/server'

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
}

export function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}

/** Returns true if the request is within limits, false if rate-limited. */
export function checkRateLimit(key: string, config: RateLimitConfig): boolean {
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
