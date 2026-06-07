/**
 * Companion event bus — lightweight pub/sub for Phase 6F reserve interface.
 *
 * Current behavior (Phase 6F): events fire into registered listeners.
 *   No 3D pet is rendered. No AI is called.
 *
 * Future behavior (Phase 6G+): CatPet / Lumi Cat calls onCompanionEvent()
 *   to subscribe and react to learning events in real-time.
 *
 * Usage:
 *   emitCompanionEvent('word_added_to_review', { word: 'accept' })
 *
 *   const unsubscribe = onCompanionEvent('word_added_to_review', ({ word }) => {
 *     // animate CatPet reaction
 *   })
 *   // later: unsubscribe()
 */

import type { CompanionEventType, CompanionEventPayload, CompanionListener } from './companion-types'

// Module-level registry — client-side only, resets on page navigation
const _registry = new Map<CompanionEventType, Set<CompanionListener>>()

/**
 * Subscribe to a companion event.
 * Returns an unsubscribe function — call it in useEffect cleanup.
 */
export function onCompanionEvent(
  event: CompanionEventType,
  listener: CompanionListener,
): () => void {
  if (!_registry.has(event)) _registry.set(event, new Set())
  _registry.get(event)!.add(listener)
  return () => { _registry.get(event)?.delete(listener) }
}

/**
 * Emit a companion event. Notifies all registered listeners.
 * Safe to call anywhere (client-side); no-op on server.
 */
export function emitCompanionEvent(
  event: CompanionEventType,
  payload: CompanionEventPayload = {},
): void {
  if (typeof window === 'undefined') return
  _registry.get(event)?.forEach(listener => {
    try { listener(payload) } catch {}
  })
}
