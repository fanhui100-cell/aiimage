export interface CatMenuItem {
  id:       string
  label:    string
  icon:     string
  action:   'navigate' | 'pet' | 'display-mood' | 'custom'
  target?:  string
  handler?: () => void
  readonly?: boolean
}

// ── Add / remove items here — no component changes needed ─────────────────────
export const catMenuItems: CatMenuItem[] = [
  { id: 'chat', label: '前往 AI 聊天', icon: '💬', action: 'navigate', target: '/chat' },
  { id: 'pet',  label: '摸摸我',       icon: '🐾', action: 'pet' },
  { id: 'mood', label: '',             icon: '❤️', action: 'display-mood', readonly: true },
]

export const moodConfig = {
  initial:             50,
  max:                100,
  min:                  0,
  petGain:             10,
  activeGainPerMin:     1,
  inactiveDecayPerMin:  1,
  highThreshold:       80,  // mood > 80 → wider idle amplitude
  lowThreshold:        30,  // mood < 30 → sleep timeout halved
  storageKey:         'cat-mood',
} as const

export const catPetConfig = {
  size:              200,           // canvas px
  longPressDuration: 300,           // ms before drag activates
  defaultCorner:     'bottom-right' as const,
  idleToWalkMinMs:   30_000,
  idleToWalkMaxMs:   60_000,
  sleepTimeoutMs:    5 * 60_000,
  modelPath:        '/models/spooky-cat.glb',
  meshNames: {
    body:     'Quad Sphere',
    leftEye:  'Sphère',
    rightEye: 'Sphère.001',
    nose:     'Sphère.002',
  },
} as const
