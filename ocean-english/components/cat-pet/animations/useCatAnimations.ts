import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useCatStore } from '@/store/catStore'
import { animationRegistry } from './registry'
import { catPetConfig, moodConfig } from '../config'
import type { AnimRefs } from './types'

export function useCatAnimations(refs: AnimRefs) {
  const animState       = useCatStore(s => s.animState)
  const mood            = useCatStore(s => s.mood)
  const lastInteraction = useCatStore(s => s.lastInteraction)
  const setAnimState    = useCatStore(s => s.setAnimState)

  const stateStartRef = useRef(performance.now() / 1000)
  const completedRef  = useRef(false)  // prevents onComplete firing twice

  // Reset timer + guard on state change
  useEffect(() => {
    stateStartRef.current = performance.now() / 1000
    completedRef.current  = false
  }, [animState])

  // Idle → sleeping timer (halved when mood is low)
  useEffect(() => {
    if (animState !== 'idle') return
    const timeout = mood < moodConfig.lowThreshold
      ? catPetConfig.sleepTimeoutMs / 2
      : catPetConfig.sleepTimeoutMs

    const id = setTimeout(() => {
      if (Date.now() - lastInteraction >= timeout) setAnimState('sleeping')
    }, timeout)
    return () => clearTimeout(id)
  }, [animState, mood, lastInteraction, setAnimState])

  // Idle → walking random timer
  useEffect(() => {
    if (animState !== 'idle') return
    const delay =
      catPetConfig.idleToWalkMinMs +
      Math.random() * (catPetConfig.idleToWalkMaxMs - catPetConfig.idleToWalkMinMs)

    const id = setTimeout(() => setAnimState('walking'), delay)
    return () => clearTimeout(id)
  }, [animState, setAnimState])

  // Frame loop — must be called inside an R3F Canvas component
  useFrame(() => {
    const elapsed = performance.now() / 1000 - stateStartRef.current
    animationRegistry[animState]({
      refs,
      elapsed,
      mood,
      onComplete: () => {
        if (!completedRef.current) {
          completedRef.current = true
          setAnimState('idle')
        }
      },
    })
  })
}
