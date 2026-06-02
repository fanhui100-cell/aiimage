import type { AnimHandler, AnimState } from './types'

const TWO_PI = Math.PI * 2

// ── idle ─────────────────────────────────────────────────────────────────────
const idle: AnimHandler = ({ refs, elapsed, mood }) => {
  const amp = mood > 80 ? 1.5 : 1.0
  const { group, leftEye, rightEye } = refs

  if (group.current) {
    group.current.position.y = Math.sin(elapsed * 1.2) * 0.04 * amp
    group.current.rotation.z = Math.sin(elapsed * 0.7) * 0.02 * amp
  }

  // Blink: close eyes for ~0.12 s every 4 s
  const blinkPhase = elapsed % 4
  const eyeY = blinkPhase > 3.88 ? 0.05 : 1
  if (leftEye.current)  leftEye.current.scale.y = eyeY
  if (rightEye.current) rightEye.current.scale.y = eyeY
}

// ── walking ──────────────────────────────────────────────────────────────────
const walking: AnimHandler = ({ refs, elapsed, onComplete }) => {
  const { group } = refs
  const duration = 3.0

  if (elapsed >= duration) {
    if (group.current) {
      group.current.position.x = 0
      group.current.rotation.z = 0
    }
    onComplete()
    return
  }

  if (group.current) {
    group.current.position.x = Math.sin(elapsed * 2.5) * 0.35
    group.current.rotation.z = -Math.cos(elapsed * 2.5) * 0.06
  }
}

// ── jumping ──────────────────────────────────────────────────────────────────
const jumping: AnimHandler = ({ refs, elapsed, onComplete }) => {
  const { group, body } = refs
  const duration = 0.7

  if (elapsed >= duration) {
    if (group.current) group.current.position.y = 0
    if (body.current)  body.current.scale.set(1, 1, 1)
    onComplete()
    return
  }

  const t = elapsed / duration
  if (group.current) group.current.position.y = Math.sin(t * Math.PI) * 0.6

  if (body.current) {
    if (t > 0.85) {
      const s = 1 - ((t - 0.85) / 0.15) * 0.22
      body.current.scale.set(1 + (1 - s) * 0.35, s, 1 + (1 - s) * 0.35)
    } else {
      body.current.scale.set(1, 1, 1)
    }
  }
}

// ── rolling ──────────────────────────────────────────────────────────────────
const rolling: AnimHandler = ({ refs, elapsed, onComplete }) => {
  const { group } = refs
  const duration = 0.85

  if (elapsed >= duration) {
    if (group.current) group.current.rotation.z = 0
    onComplete()
    return
  }

  if (group.current) group.current.rotation.z = (elapsed / duration) * TWO_PI
}

// ── petting ──────────────────────────────────────────────────────────────────
const petting: AnimHandler = ({ refs, elapsed, onComplete }) => {
  const { group, leftEye, rightEye } = refs
  const duration = 1.0

  if (elapsed >= duration) {
    if (group.current)    group.current.rotation.z = 0
    if (leftEye.current)  leftEye.current.scale.setScalar(1)
    if (rightEye.current) rightEye.current.scale.setScalar(1)
    onComplete()
    return
  }

  const fade = 1 - elapsed / duration
  if (group.current)    group.current.rotation.z = Math.sin(elapsed * 28) * 0.08
  const eyeS = 1 + fade * 0.35
  if (leftEye.current)  leftEye.current.scale.setScalar(eyeS)
  if (rightEye.current) rightEye.current.scale.setScalar(eyeS)
}

// ── sleeping ─────────────────────────────────────────────────────────────────
const sleeping: AnimHandler = ({ refs, elapsed }) => {
  const { group, leftEye, rightEye } = refs

  if (group.current) group.current.scale.y = 1 + Math.sin(elapsed * 0.5) * 0.015
  if (leftEye.current)  leftEye.current.scale.y = 0.05
  if (rightEye.current) rightEye.current.scale.y = 0.05
}

// ── registry — extend here to add new states ─────────────────────────────────
export const animationRegistry: Record<AnimState, AnimHandler> = {
  idle,
  walking,
  jumping,
  rolling,
  petting,
  sleeping,
}
