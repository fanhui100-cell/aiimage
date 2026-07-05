'use client'

import { useState } from 'react'
import type { DocumentAnalysisResult, DocumentStudyNote } from '@/types/document'
import type { ScanStudyNote } from '@/types/scan-learning'

interface StudyNotesPanelProps {
  result: DocumentAnalysisResult
  documentId?: string
  onSaveNote?: (note: ScanStudyNote) => void
}

export function StudyNotesPanel({ result, documentId = '', onSaveNote }: StudyNotesPanelProps) {
  const [rawExpanded, setRawExpanded] = useState(false)
  const [savedNotes, setSavedNotes] = useState<Set<number>>(new Set())

  function handleSaveNote(note: DocumentStudyNote, index: number) {
    if (!onSaveNote) return
    const scanNote: ScanStudyNote = {
      id: `note-${documentId || result.fileName}-${index}-${Date.now()}`,
      documentId,
      sourceFileName: result.fileName,
      title: note.title,
      titleZh: note.titleZh,
      content: note.content,
      contentZh: note.contentZh,
      createdAt: new Date().toISOString(),
    }
    onSaveNote(scanNote)
    setSavedNotes(prev => new Set(prev).add(index))
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Summary */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: '10px',
        padding: '16px 18px',
        marginBottom: '12px',
      }}>
        <div style={{
          fontSize: '11px',
          letterSpacing: '0.1em',
          color: 'rgba(56,189,248,0.6)',
          fontFamily: 'var(--font-mono)',
          marginBottom: '10px',
        }}>
          DOCUMENT SUMMARY / 文档摘要
        </div>
        <p style={{ margin: '0 0 6px', fontSize: '13px', color: 'var(--ink)', lineHeight: 1.7 }}>
          {result.summaryEn}
        </p>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-sub)', lineHeight: 1.7 }}>
          {result.summaryZh}
        </p>
      </div>

      {/* Study Notes with Save button */}
      {result.studyNotes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
          {result.studyNotes.map((note, i) => {
            const isSaved = savedNotes.has(i)
            return (
              <div key={i} style={{
                background: 'var(--card)',
                border: '1px solid var(--line)',
                borderRadius: '10px',
                padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--blue-ink)', marginBottom: '4px' }}>
                      {note.title} / {note.titleZh}
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--ink)', lineHeight: 1.6 }}>
                      {note.content}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-sub)', lineHeight: 1.6 }}>
                      {note.contentZh}
                    </p>
                  </div>
                  {onSaveNote && (
                    <button
                      onClick={() => handleSaveNote(note, i)}
                      disabled={isSaved}
                      style={{
                        flexShrink: 0,
                        padding: '5px 12px',
                        borderRadius: '6px',
                        background: isSaved ? 'rgba(52,211,153,0.06)' : 'rgba(56,189,248,0.08)',
                        border: `1px solid ${isSaved ? 'rgba(52,211,153,0.3)' : 'rgba(56,189,248,0.25)'}`,
                        color: isSaved ? 'var(--teal-ink)' : 'var(--blue-ink)',
                        fontSize: '11px',
                        cursor: isSaved ? 'default' : 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isSaved ? '✓ Saved' : '+ Save Note'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div style={{
          background: 'rgba(255,215,106,0.04)',
          border: '1px solid rgba(255,215,106,0.2)',
          borderRadius: '8px',
          padding: '12px 14px',
          marginBottom: '12px',
        }}>
          <div style={{
            fontSize: '11px',
            color: 'var(--gold-ink)',
            fontFamily: 'var(--font-mono)',
            marginBottom: '6px',
          }}>
            NOTICES / 提示
          </div>
          {result.warnings.map((w, i) => (
            <div key={i} style={{ fontSize: '12px', color: 'var(--gold-ink)', marginBottom: '3px' }}>
              ⚠ {w}
            </div>
          ))}
        </div>
      )}

      {/* Raw text collapsible */}
      <div>
        <button
          onClick={() => setRawExpanded(v => !v)}
          style={{
            background: 'none',
            border: '1px solid var(--line)',
            borderRadius: '6px',
            padding: '6px 14px',
            color: 'var(--ink-muted)',
            fontSize: '11px',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {rawExpanded ? '▲ Hide' : '▼ Show'} Raw Extracted Text / 原始提取文本
        </button>
        {rawExpanded && (
          <div style={{
            marginTop: '8px',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--line)',
            borderRadius: '8px',
            padding: '14px 16px',
            fontSize: '12px',
            color: 'var(--ink-sub)',
            lineHeight: 1.8,
            fontFamily: 'var(--font-mono)',
            whiteSpace: 'pre-wrap',
            maxHeight: '300px',
            overflowY: 'auto',
          }}>
            {result.rawText}
          </div>
        )}
      </div>
    </div>
  )
}
