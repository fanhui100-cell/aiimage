'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useScanHistoryStore } from '@/store/useScanHistoryStore'
import type { DocumentAnalysisResult, UploadedDocumentType } from '@/types/document'

interface ScanHistorySaveButtonProps {
  analysisResult: DocumentAnalysisResult
  documentId: string
  extractionMethod: string
  fileType: UploadedDocumentType
  pageCount?: number
  confidence?: number
}

type SaveState = 'idle' | 'saved' | 'already-exists' | 'storage-full' | 'error'

const MESSAGE: Record<SaveState, { en: string; zh: string; color: string }> = {
  idle: { en: '', zh: '', color: '' },
  saved: {
    en: '✓ Saved to Scan Library',
    zh: '已保存到扫描库',
    color: '#34D399',
  },
  'already-exists': {
    en: '✓ Already saved',
    zh: '已保存',
    color: '#34D399',
  },
  'storage-full': {
    en: 'Library full (50 docs). Delete older records to save more.',
    zh: '扫描库已满（50 条）。请删除旧记录后重试。',
    color: '#FFD76A',
  },
  error: {
    en: 'Unable to save scan history locally. Please delete older records and try again.',
    zh: '无法保存扫描历史，请删除旧记录后重试。',
    color: '#F87171',
  },
}

export function ScanHistorySaveButton({
  analysisResult,
  documentId,
  extractionMethod,
  fileType,
  pageCount,
  confidence,
}: ScanHistorySaveButtonProps) {
  const { saveScanDocument, scanDocuments } = useScanHistoryStore()
  const [saveState, setSaveState] = useState<SaveState>(() => {
    return scanDocuments.some(d => d.id === documentId) ? 'already-exists' : 'idle'
  })

  const isSaved = saveState === 'saved' || saveState === 'already-exists'

  function handleSave() {
    if (isSaved) return
    const result = saveScanDocument(analysisResult, {
      documentId,
      extractionMethod,
      fileType,
      pageCount,
      confidence,
    })
    setSaveState(result === 'saved' ? 'saved' : result)
  }

  const msg = MESSAGE[saveState]
  const count = scanDocuments.length

  return (
    <div style={{ marginTop: '20px', padding: '14px 16px', background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
        <button
          onClick={handleSave}
          disabled={isSaved}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            background: isSaved ? 'rgba(52,211,153,0.08)' : 'rgba(56,189,248,0.12)',
            border: `1px solid ${isSaved ? 'rgba(52,211,153,0.35)' : 'rgba(56,189,248,0.4)'}`,
            color: isSaved ? '#34D399' : '#38BDF8',
            fontSize: '13px',
            fontWeight: 600,
            cursor: isSaved ? 'default' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {isSaved ? '✓ Saved to Scan Library / 已保存到扫描库' : '+ Save to Scan Library / 保存到扫描库'}
        </button>

        <Link
          href="/scan/history"
          style={{
            fontSize: '12px',
            color: '#38BDF8',
            textDecoration: 'none',
            opacity: 0.8,
            whiteSpace: 'nowrap',
          }}
        >
          View Scan History →
        </Link>
      </div>

      {saveState !== 'idle' && msg.en && (
        <div style={{ fontSize: '12px', color: msg.color, marginBottom: '4px' }}>
          {msg.en} / {msg.zh}
        </div>
      )}

      <div style={{ fontSize: '11px', color: 'rgba(155,191,202,0.45)', lineHeight: 1.5 }}>
        Scan history is stored locally in this browser. Original files are not stored.
        {count > 0 && ` (${count}/50 documents stored)`}
        <br />
        <span style={{ color: 'rgba(155,191,202,0.35)' }}>
          扫描历史仅保存在当前浏览器本地，系统不会保存原始上传文件。
        </span>
      </div>

      {count >= 45 && count < 50 && (
        <div style={{ marginTop: '6px', fontSize: '11px', color: '#FFD76A' }}>
          ⚠ Approaching library limit ({count}/50). Consider deleting older records.
        </div>
      )}
    </div>
  )
}
