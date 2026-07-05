'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ScanQuizDraft, ScanStudyNote, QuizDraftStatus } from '@/types/scan-learning'

const MAX_DRAFTS = 100
const MAX_NOTES = 100

interface ScanStore {
  // Persisted
  scanQuizDrafts: ScanQuizDraft[]
  scanStudyNotes: ScanStudyNote[]

  // Actions
  addScanQuizDraft: (draft: ScanQuizDraft) => void
  addScanQuizDrafts: (drafts: ScanQuizDraft[]) => void
  removeScanQuizDraft: (id: string) => void
  updateScanQuizDraftStatus: (id: string, status: QuizDraftStatus) => void
  clearScanDraftsForDocument: (documentId: string) => void

  addScanStudyNote: (note: ScanStudyNote) => void
  removeScanStudyNote: (id: string) => void
}

const INITIAL_STATE = {
  scanQuizDrafts: [] as ScanQuizDraft[],
  scanStudyNotes: [] as ScanStudyNote[],
}

export const useScanStore = create<ScanStore>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      addScanQuizDraft: draft => {
        set(s => {
          // Deduplicate by documentId + prompt
          const exists = s.scanQuizDrafts.some(
            d => d.documentId === draft.documentId && d.prompt === draft.prompt,
          )
          if (exists) return s
          return { scanQuizDrafts: [draft, ...s.scanQuizDrafts].slice(0, MAX_DRAFTS) }
        })
      },

      addScanQuizDrafts: drafts => {
        set(s => {
          const toAdd = drafts.filter(
            d => !s.scanQuizDrafts.some(e => e.documentId === d.documentId && e.prompt === d.prompt),
          )
          if (toAdd.length === 0) return s
          return { scanQuizDrafts: [...toAdd, ...s.scanQuizDrafts].slice(0, MAX_DRAFTS) }
        })
      },

      removeScanQuizDraft: id =>
        set(s => ({ scanQuizDrafts: s.scanQuizDrafts.filter(d => d.id !== id) })),

      updateScanQuizDraftStatus: (id, status) =>
        set(s => ({
          scanQuizDrafts: s.scanQuizDrafts.map(d => (d.id === id ? { ...d, status } : d)),
        })),

      clearScanDraftsForDocument: documentId =>
        set(s => ({
          scanQuizDrafts: s.scanQuizDrafts.filter(d => d.documentId !== documentId),
        })),

      addScanStudyNote: note => {
        set(s => {
          const exists = s.scanStudyNotes.some(
            n => n.documentId === note.documentId && n.title === note.title,
          )
          if (exists) return s
          return { scanStudyNotes: [note, ...s.scanStudyNotes].slice(0, MAX_NOTES) }
        })
      },

      removeScanStudyNote: id =>
        set(s => ({ scanStudyNotes: s.scanStudyNotes.filter(n => n.id !== id) })),
    }),
    {
      name: 'lexiocean-scan',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Merge-forward migration: preserve all existing data, fill missing fields with defaults.
      // This survives schema additions without losing user's saved drafts and notes.
      migrate: (persistedState: unknown) => ({
        ...INITIAL_STATE,
        ...(persistedState as object),
      }),
      partialize: state => ({
        scanQuizDrafts: state.scanQuizDrafts,
        scanStudyNotes: state.scanStudyNotes,
      }),
    },
  ),
)
