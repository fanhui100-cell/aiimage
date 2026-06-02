'use client'

import { useRef, useEffect, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { useCatStore, type Corner } from '@/store/catStore'
import { moodConfig, catPetConfig } from './config'
import { CatScene } from './CatScene'
import { CatPopup } from './CatPopup'

function getCornerStyle(corner: Corner): CSSProperties {
  const gap = 16
  return {
    bottom: corner.includes('bottom') ? gap : 'auto',
    top:    corner.includes('top')    ? gap : 'auto',
    right:  corner.includes('right')  ? gap : 'auto',
    left:   corner.includes('left')   ? gap : 'auto',
  }
}

function nearestCorner(x: number, y: number): Corner {
  const v = y < window.innerHeight / 2 ? 'top'  : 'bottom'
  const h = x < window.innerWidth  / 2 ? 'left' : 'right'
  return `${v}-${h}` as Corner
}

export function CatPet() {
  const corner       = useCatStore(s => s.corner)
  const setCorner    = useCatStore(s => s.setCorner)
  const setDragging  = useCatStore(s => s.setDragging)
  const isDragging   = useCatStore(s => s.isDragging)
  const closePopup   = useCatStore(s => s.closePopup)
  const addMood      = useCatStore(s => s.addMood)

  const containerRef  = useRef<HTMLDivElement>(null)
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragActiveRef = useRef(false)

  // ── Long-press drag ─────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    pressTimerRef.current = setTimeout(() => {
      dragActiveRef.current = true
      setDragging(true)
      closePopup()
      containerRef.current?.setPointerCapture(e.pointerId)
    }, catPetConfig.longPressDuration)
  }, [setDragging, closePopup])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragActiveRef.current || !containerRef.current) return
    const half = catPetConfig.size / 2
    containerRef.current.style.left   = `${e.clientX - half}px`
    containerRef.current.style.top    = `${e.clientY - half}px`
    containerRef.current.style.right  = 'auto'
    containerRef.current.style.bottom = 'auto'
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current)
    if (!dragActiveRef.current) return

    dragActiveRef.current = false
    setDragging(false)

    const snapped = nearestCorner(e.clientX, e.clientY)
    setCorner(snapped)

    // Snap container imperatively so transition is instant
    if (containerRef.current) {
      const GAP = '16px'
      const el  = containerRef.current
      el.style.left   = snapped.includes('left')   ? GAP : 'auto'
      el.style.right  = snapped.includes('right')  ? GAP : 'auto'
      el.style.top    = snapped.includes('top')    ? GAP : 'auto'
      el.style.bottom = snapped.includes('bottom') ? GAP : 'auto'
    }
  }, [setDragging, setCorner])

  useEffect(() => {
    const cancel = () => { if (pressTimerRef.current) clearTimeout(pressTimerRef.current) }
    window.addEventListener('pointercancel', cancel)
    return () => window.removeEventListener('pointercancel', cancel)
  }, [])

  // ── Mood ticking: +1/min while visible, −1/min while hidden ────────────────
  useEffect(() => {
    const id = setInterval(() => {
      addMood(
        document.visibilityState === 'visible'
          ?  moodConfig.activeGainPerMin
          : -moodConfig.inactiveDecayPerMin,
      )
    }, 60_000)
    return () => clearInterval(id)
  }, [addMood])

  return (
    <div
      ref={containerRef}
      style={{
        position:      'fixed',
        zIndex:        9999,
        width:         catPetConfig.size,
        height:        catPetConfig.size,
        pointerEvents: 'none',
        userSelect:    'none',
        ...getCornerStyle(corner),
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Re-enable pointer events only for the canvas area */}
      <div style={{ width: '100%', height: '100%', pointerEvents: 'auto', cursor: isDragging ? 'grabbing' : 'pointer' }}>
        <CatScene />
      </div>

      <CatPopup />
    </div>
  )
}
