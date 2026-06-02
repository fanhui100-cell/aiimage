import type { MutableRefObject } from 'react'
import type * as THREE from 'three'

export type AnimState =
  | 'idle'
  | 'walking'
  | 'jumping'
  | 'rolling'
  | 'petting'
  | 'sleeping'

export interface AnimRefs {
  group:    MutableRefObject<THREE.Group | null>
  body:     MutableRefObject<THREE.Mesh | null>
  leftEye:  MutableRefObject<THREE.Mesh | null>
  rightEye: MutableRefObject<THREE.Mesh | null>
}

export interface AnimContext {
  refs:       AnimRefs
  elapsed:    number      // seconds since this state started
  mood:       number      // 0–100
  onComplete: () => void  // call to return to idle
}

export type AnimHandler = (ctx: AnimContext) => void
