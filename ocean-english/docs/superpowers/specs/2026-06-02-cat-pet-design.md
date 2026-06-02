# Cat Pet Widget — Design Spec
**Date:** 2026-06-02  
**Project:** ocean-english (Next.js 16, React 19)  
**Status:** Approved

---

## Overview

A global AI desktop-pet widget embedded in ocean-english. A cute spooky ghost-cat (3D model) floats in the bottom corner of every page, animates autonomously, reacts to user interaction, and provides a one-click path to the AI chat feature.

---

## Model

**Source file:** `C:\Users\fanhu\Downloads\cute-spooky-cat\source\Sketchfab_2020_10_20_22_32_06.blend`  
**Exported asset:** `ocean-english/public/models/spooky-cat.glb` (1.80 MB, already exported)

**Mesh structure (confirmed via Blender 5.1 headless inspection):**

| Mesh name     | Role      | Material | Vertices |
|---------------|-----------|----------|----------|
| Quad Sphere   | Body/head | Material | 50 984   |
| Sphère        | Left eye  | eyes     | 482      |
| Sphère.001    | Right eye | eyes     | 482      |
| Sphère.002    | Nose      | nose     | 482      |

No armature, no built-in animations. All motion is programmatic (R3F `useFrame`).

---

## Architecture

### File layout

```
ocean-english/
  public/models/
    spooky-cat.glb              ← static 3D asset
  components/cat-pet/
    CatPet.tsx                  ← fixed-position container, drag logic
    CatScene.tsx                ← R3F Canvas + model + animation loop
    CatPopup.tsx                ← click-triggered bubble menu
    useCatAnimations.ts         ← animation state machine + useFrame
    catStore.ts                 ← Zustand global state
  app/
    layout.tsx                  ← mounts <CatPet /> once, site-wide
```

### Mount point

`layout.tsx` renders `<CatPet />` via `next/dynamic` with `{ ssr: false }` so Three.js never runs server-side.

### Data flow

```
User gesture (click / hover / drag / menu button)
        ↓
   catStore.setState(...)
        ↓
  CatScene reads state → useCatAnimations drives useFrame
        ↓
  Visual output (3D animation) + CatPopup (UI overlay)
```

---

## Component Details

### `catStore.ts` (Zustand)

```ts
{
  position: { x: number; y: number }   // current screen position (px from bottom-right)
  animState: AnimState                  // see states below
  mood: number                          // 0–100; persisted in localStorage
  popupOpen: boolean
}
```

`mood` is read/written via localStorage so it persists across sessions.

### `CatPet.tsx`

- `position: fixed`, `z-index: 9999`, default bottom-right corner
- Size: **200 × 200 px**, transparent background
- **Long-press drag**: `pointerdown` → 300 ms timer → drag mode; `pointerup` snaps to nearest corner and saves position to `localStorage`
- Contains `<CatScene />` (the Canvas) and `<CatPopup />`
- Pointer events: container has `pointer-events: none`; the canvas area restores `pointer-events: auto`

### `CatScene.tsx`

- `<Canvas gl={{ alpha: true }} style={{ background: 'transparent' }} frameloop="demand">`
- Loads model with `useGLTF('/models/spooky-cat.glb')`
- Groups all mesh nodes under one `<group ref={groupRef}>`
- Passes individual mesh refs (`bodyRef`, `leftEyeRef`, `rightEyeRef`) to `useCatAnimations`
- Suspense fallback: invisible (no spinner — too small an area)

### `useCatAnimations.ts`

Animation state machine driven by `useFrame`. Reads `animState` from the store and applies transforms to refs each frame.

### `CatPopup.tsx`

- Framer Motion `AnimatePresence` for enter/exit
- Appears above the cat (offset upward)
- Three items: **前往 AI 聊天** / **摸摸我** / **心情 ❤️ {mood}**

---

## Animation States

```
idle ──(random 30–60 s)──→ walking ──(arrives)──→ idle
  │
  ├──(click)─────────────→ jumping ──(done)──→ idle
  ├──(right-click / dbl)──→ rolling ──(done)──→ idle
  ├──("摸摸我" button)─────→ petting ──(done)──→ idle
  └──(5 min no input)─────→ sleeping ──(click)──→ idle
```

### Per-state animation detail

| State      | Body (Quad Sphere)                           | Eyes (Sphère / .001)               | Nose (.002) |
|------------|----------------------------------------------|------------------------------------|-------------|
| `idle`     | Y += sin(t) * 0.04; random micro-rotation    | scaleY blink every ~4 s            | follows body |
| `walking`  | X translate + ±2° Z tilt to movement dir     | normal blink                       | follows body |
| `jumping`  | Y spike up then down; scaleXY/Z squash on land | widen slightly on ascent           | follows body |
| `rolling`  | rotateZ 0 → 2π over ~0.8 s                   | spin with body                     | spin with body |
| `petting`  | rapid ±5° Z shake; scale pulse 1 → 1.08      | scaleXY 1 → 1.3 (big happy eyes)  | follows body |
| `sleeping` | ultra-slow scaleY ±0.01 "breathing"          | scaleY → 0.05 (closed)            | follows body |

`mood > 80`: idle wiggle amplitude ×1.5  
`mood < 30`: sleep timeout drops to 2 min

---

## Interaction Map

| Gesture             | Effect                                           |
|---------------------|--------------------------------------------------|
| Single click        | Toggle popup menu                                |
| Long-press (300 ms) | Enter drag mode                                  |
| Right-click / dbl   | Trigger `rolling` animation                      |
| Hover               | Cat orients slightly toward cursor               |
| "前往 AI 聊天"      | `router.push('/chat')`, close popup              |
| "摸摸我"            | `mood += 10` (cap 100), trigger `petting` anim   |
| Idle 5 min          | Transition to `sleeping`                         |

### Mood decay / growth

- +10 on pet (button)
- +1 per minute while page is active (capped 100)
- −1 per minute while page is inactive (minimum 0)
- Stored in `localStorage` as `cat-mood`

---

## Technical Constraints

| Concern           | Solution                                                                 |
|-------------------|--------------------------------------------------------------------------|
| SSR               | `dynamic(() => import('./CatPet'), { ssr: false })`                      |
| Canvas transparent | `gl={{ alpha: true }}` + CSS `background: transparent`                  |
| Page click-through | Container `pointer-events: none`, canvas region `pointer-events: auto`  |
| Render cost       | `frameloop="demand"`; invalidate on animation state change only          |
| Non-ASCII mesh names | Access via `gltf.scene.getObjectByName('Quad Sphere')` etc.           |
| No new dependencies | Uses existing: R3F, drei, Zustand, Framer Motion, Next.js navigation   |

---

## Out of Scope (v1)

- Mixamo rigged walk/run animations (can be added in v2)
- Sound effects
- Mobile touch drag
- Multiple cat skins
