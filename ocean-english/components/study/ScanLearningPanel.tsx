'use client'

import Link from 'next/link'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import type { ScanDocumentLibraryDetail } from '@/types/scan-history'

interface Props {
  scanDocuments: ScanDocumentLibraryDetail[]
  scanNoteCount: number
}

export function ScanLearningPanel({ scanDocuments, scanNoteCount }: Props) {
  const recentDocs = scanDocuments.slice(0, 2)
  const hasActivity = scanDocuments.length > 0 || scanNoteCount > 0

  return (
    <div
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        padding: '20px',
      }}
    >
      <SectionHeader label="SCAN LEARNING" labelZh="文档学习" style={{ marginTop: 0, marginBottom: '12px' }} />

      {!hasActivity ? (
        <EmptyState
          icon="📄"
          title="No documents yet"
          titleZh="尚未扫描文档"
          description="Upload a PDF or image to extract vocabulary and generate quizzes."
          descriptionZh="上传 PDF 或图片以提取生词、生成练习题。"
          variant="empty"
          actions={[{ label: 'Scan a Document / 扫描文档', href: '/scan' }]}
        />
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
            <div style={{ fontSize: '13px', color: '#9BBFCA' }}>
              <span style={{ color: '#FFD76A', fontWeight: 700, fontSize: '18px' }}>{scanDocuments.length}</span>
              <span style={{ marginLeft: '4px', fontSize: '11px' }}>docs / 文档</span>
            </div>
            <div style={{ fontSize: '13px', color: '#9BBFCA' }}>
              <span style={{ color: '#38BDF8', fontWeight: 700, fontSize: '18px' }}>{scanNoteCount}</span>
              <span style={{ marginLeft: '4px', fontSize: '11px' }}>notes / 笔记</span>
            </div>
          </div>

          {/* Recent docs */}
          {recentDocs.map(doc => (
            <Link
              key={doc.id}
              href={`/scan/history/${doc.id}`}
              style={{
                display: 'block', textDecoration: 'none', marginBottom: '6px',
                padding: '8px 12px', borderRadius: '7px',
                background: 'rgba(255,215,106,0.04)', border: '1px solid rgba(255,215,106,0.12)',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#ECFBFF', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {doc.fileName}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(155,191,202,0.45)' }}>
                {doc.vocabularyCount ?? 0} vocab · {doc.questionCount ?? 0} questions
              </div>
            </Link>
          ))}

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
            <Link
              href="/scan"
              style={{
                padding: '7px 14px', borderRadius: '7px', textDecoration: 'none', fontSize: '12px', fontWeight: 600,
                background: 'rgba(255,215,106,0.08)', border: '1px solid rgba(255,215,106,0.25)', color: '#FFD76A',
              }}
            >
              + Scan New / 扫描新文档
            </Link>
            <Link
              href="/scan/history"
              style={{
                padding: '7px 14px', borderRadius: '7px', textDecoration: 'none', fontSize: '12px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(155,191,202,0.12)', color: '#9BBFCA',
              }}
            >
              History / 历史记录 →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
