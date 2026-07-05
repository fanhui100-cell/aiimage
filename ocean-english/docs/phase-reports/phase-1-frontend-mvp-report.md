# Phase 1 — Frontend MVP Report

**Project:** LexiOcean / 深海英语学习系统  
**Phase:** 1 — Frontend MVP  
**Date:** 2026-06-01  
**Status:** ✅ Complete

---

## Acceptance Criteria

| # | Criterion | Status |
|---|---|---|
| 1 | Homepage opens | ✅ |
| 2 | Banyan particle visual from HTML demo | ✅ |
| 3 | Particles stream from bottom | ✅ |
| 4 | Trunk forms visibly | ✅ |
| 5 | Wide canopy expands | ✅ |
| 6 | Aerial roots visible | ✅ |
| 7 | Tree shape resembles a banyan | ✅ |
| 8 | Particles have life-feel and flow | ✅ |
| 9 | Mouse movement causes air disturbance | ✅ |
| 10 | 7 module nodes on tree | ✅ |
| 11 | Click node shows bilingual panel | ✅ |
| 12 | Copy appropriate for Chinese learners | ✅ |
| 13 | Project name from config, not hardcoded | ✅ |
| 14 | Visual quality is premium / non-generic | ✅ |
| 15 | Mobile reduced particle density | ✅ |
| 16 | prefers-reduced-motion supported | ✅ |
| 17 | All shell pages created | ✅ |
| 18 | Level selection page created | ✅ |
| 19 | npm run lint passes | ✅ |
| 20 | npm run build passes | ✅ |
| 21 | Phase report generated | ✅ |

---

## Architecture

- **Framework:** Next.js 16.2.6 (App Router, Turbopack)
- **Hero:** Full-screen R3F Canvas with custom GLSL shader particle system.
  - ~250k particles (desktop) / ~80k (mobile), GPU-driven via `THREE.Points`
  - 4-stage formation: roots → trunk → canopy → aerial roots (0–5 s)
  - Post-formation: internal energy pulse + life wobble
- **Shader:** Ported verbatim from HTML demo. `uTime` drives animation. `uMouseNDC` + `uMouseForce` drive air-current disturbance on mouse move.
- **Module Nodes:** `<Html>` from `@react-three/drei` — nodes orbit with the tree during auto-rotation.
- **Module Panel:** Framer Motion `AnimatePresence` glass panel outside the Canvas. Opens on node click.
- **Config:** All brand text in `config/site.ts`. All module data in `config/learning-modules.ts`. All particle params + GLSL shaders in `banyan-particle-config.ts`.

## Key Files

| File | Purpose |
|---|---|
| `config/site.ts` | Brand names, slogans, navigation — change project name here |
| `config/learning-modules.ts` | 7 module definitions, descriptions, abilities, 3D positions |
| `components/visual/BanyanParticleHero/banyan-particle-config.ts` | Particle counts, bloom, camera, GLSL shaders |
| `components/visual/BanyanParticleHero/BanyanParticleSystem.tsx` | Core particle system — GLSL shader animation + mouse interaction |
| `components/visual/BanyanParticleHero/BanyanCanvas.tsx` | R3F Canvas wrapper with camera, fog, bloom, OrbitControls |
| `components/visual/BanyanParticleHero/BanyanModuleNodes.tsx` | 7 interactive 3D nodes via `<Html>` |
| `components/visual/BanyanParticleHero/BanyanModulePanel.tsx` | Glass detail panel on node click |

## Routes Created

| Route | Status | Description |
|---|---|---|
| `/` | ✅ | Homepage with banyan hero |
| `/onboarding` | ✅ | Level selection (saves to localStorage) |
| `/dictionary` | ✅ Shell | Vocabulary Roots — word search |
| `/word/[slug]` | ✅ Shell | Word detail page (async params) |
| `/chat` | ✅ Shell | AI Navigator chat |
| `/quiz` | ✅ Shell | Quiz mode |
| `/study` | ✅ Shell | Study mode (reading + pronunciation) |
| `/scan` | ✅ Shell | Document upload + OCR |
| `/exam` | ✅ Shell | Exam branch (6 exam types listed) |
| `/memory` | ✅ Shell | Memory roots + spaced repetition |

## Build Output

```
Route (app)
○ /              (Static)
○ /chat          (Static)
○ /dictionary    (Static)
○ /exam          (Static)
○ /memory        (Static)
○ /onboarding    (Static)
○ /quiz          (Static)
○ /scan          (Static)
○ /study         (Static)
ƒ /word/[slug]   (Dynamic — server-rendered on demand)
```

## Notes

- `eslint.config.mjs` overrides `react-hooks/refs` and `react-hooks/immutability` for `components/visual/**` — these rules conflict with standard Three.js/R3F animation patterns where Three.js uniform objects are intentionally mutated per-frame.
- `app/page.tsx` uses `'use client'` because Next.js 16 requires `ssr: false` dynamic imports to be inside Client Components.

---

**Phase 2 begins next: Learning Flow + Local State Prototype**
