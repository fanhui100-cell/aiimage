import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AnimState } from '@/components/cat-pet/animations/types'
import { moodConfig, catPetConfig } from '@/components/cat-pet/config'

export type Corner = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

interface CatState {
  animState:       AnimState
  mood:            number
  corner:          Corner
  popupOpen:       boolean
  isDragging:      boolean
  lastInteraction: number  // Date.now()
}

interface CatActions {
  setAnimState:     (s: AnimState) => void
  addMood:          (delta: number) => void
  setCorner:        (c: Corner) => void
  togglePopup:      () => void
  closePopup:       () => void
  setDragging:      (v: boolean) => void
  touchInteraction: () => void
}

export const useCatStore = create<CatState & CatActions>()(
  persist(
    (set, get) => ({
      animState:       'idle',
      mood:            moodConfig.initial,
      corner:          catPetConfig.defaultCorner,
      popupOpen:       false,
      isDragging:      false,
      lastInteraction: Date.now(),

      setAnimState: (animState) => set({ animState }),

      addMood: (delta) => {
        const next = Math.max(
          moodConfig.min,
          Math.min(moodConfig.max, get().mood + delta),
        )
        set({ mood: next })
      },

      setCorner:        (corner)     => set({ corner }),
      togglePopup:      ()           => set(s => ({ popupOpen: !s.popupOpen })),
      closePopup:       ()           => set({ popupOpen: false }),
      setDragging:      (isDragging) => set({ isDragging }),
      touchInteraction: ()           => set({ lastInteraction: Date.now() }),
    }),
    {
      name:    'cat-pet-v1',
      version:  1,
      storage: createJSONStorage(() => localStorage),
      migrate: () => ({
        animState:       'idle' as AnimState,
        mood:            moodConfig.initial,
        corner:          catPetConfig.defaultCorner as Corner,
        popupOpen:       false,
        isDragging:      false,
        lastInteraction: Date.now(),
      }),
      partialize: (s) => ({ mood: s.mood, corner: s.corner }),
    },
  ),
)
