'use client'

import Link from 'next/link'
import type { ScanDocumentLibraryDetail } from '@/types/scan-history'

interface ScanHistoryCardProps {
  doc: ScanDocumentLibraryDetail
  onDelete: (id: string) => void
}

const STATUS_COLORS: Record<string, string> = {
  analyzed: '#34D399',
  'partially-analyzed': '#FFD76A',
  'needs-ocr': '#F97316',
  error: '#F87171',
}

const FILETYPE_LABELS: Record<string, string> = {
  pdf: 'PDF',
  image: 'Image',
  text: 'Text',
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function truncate(str: string | undefined, max: number): string {
  if (!str) return ''
  return str.length <= max ? str : str.slice(0, max) + '…'
}

export function ScanHistoryCard({ doc, onDelete }: ScanHistoryCardProps) {
  const statusColor = STATUS_COLORS[doc.status] ?? '#9BBFCA'

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(155,191,202,0.12)',
      borderRadius: '12px',
      padding: '16px 18px',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
            <span style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#ECFBFF',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '260px',
            }}>
              {doc.fileName}
            </span>
            <span style={{
              fontSize: '10px',
              padding: '1px 7px',
              borderRadius: '3px',
              background: 'rgba(56,189,248,0.1)',
              border: '1px solid rgba(56,189,248,0.25)',
              color: '#38BDF8',
              fontFamily: 'ui-monospace, monospace',
            }}>
              {FILETYPE_LABELS[doc.fileType] ?? doc.fileType}
            </span>
            <span style={{
              fontSize: '10px',
              padding: '1px 7px',
              borderRadius: '3px',
              background: `${statusColor}18`,
              border: `1px solid ${statusColor}40`,
              color: statusColor,
              fontFamily: 'ui-monospace, monospace',
            }}>
              {doc.status}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(155,191,202,0.5)', fontFamily: 'ui-monospace, monospace' }}>
            {formatDate(doc.createdAt)} · {doc.extractionMethod}
          </div>
        </div>
        {doc.warningCount > 0 && (
          <span title={`${doc.warningCount} warning(s)`} style={{ fontSize: '14px', flexShrink: 0 }}>⚠️</span>
        )}
      </div>

      {/* Summary */}
      {(doc.summaryZh || doc.summaryEn) && (
        <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#9BBFCA', lineHeight: 1.6 }}>
          {truncate(doc.summaryZh || doc.summaryEn, 120)}
        </p>
      )}

      {/* Counters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {[
          { label: 'Questions', value: doc.questionCount, color: '#8B5CF6' },
          { label: 'Words', value: doc.vocabularyCount, color: '#38BDF8' },
          { label: 'Notes', value: doc.studyNoteCount, color: '#34D399' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ fontSize: '11px', color, fontFamily: 'ui-monospace, monospace' }}>
            {value} {label}
          </div>
        ))}
        {doc.reviewWordsAddedCount > 0 && (
          <div style={{ fontSize: '11px', color: 'rgba(52,211,153,0.6)', fontFamily: 'ui-monospace, monospace' }}>
            +{doc.reviewWordsAddedCount} reviewed
          </div>
        )}
        {doc.quizDraftsSavedCount > 0 && (
          <div style={{ fontSize: '11px', color: 'rgba(255,215,106,0.6)', fontFamily: 'ui-monospace, monospace' }}>
            +{doc.quizDraftsSavedCount} drafts
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Link
          href={`/scan/history/${doc.id}`}
          style={{
            padding: '6px 14px',
            borderRadius: '7px',
            background: 'rgba(56,189,248,0.1)',
            border: '1px solid rgba(56,189,248,0.3)',
            color: '#38BDF8',
            fontSize: '12px',
            fontWeight: 600,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          View Details / 查看详情
        </Link>
        <button
          onClick={() => onDelete(doc.id)}
          style={{
            padding: '6px 14px',
            borderRadius: '7px',
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: 'rgba(239,68,68,0.7)',
            fontSize: '12px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Delete / 删除
        </button>
      </div>
    </div>
  )
}
