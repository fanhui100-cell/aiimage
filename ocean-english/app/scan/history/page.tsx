'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { useScanHistoryStore } from '@/store/useScanHistoryStore'
import { ScanHistoryCard } from '@/components/scan/history/ScanHistoryCard'
import { ScanHistoryFilters } from '@/components/scan/history/ScanHistoryFilters'
import { ScanHistoryEmptyState } from '@/components/scan/history/ScanHistoryEmptyState'

export default function ScanHistoryPage() {
  const {
    scanDocuments,
    scanHistoryFilters,
    setFilters,
    getFilteredDocuments,
    deleteScanDocument,
    clearScanHistory,
  } = useScanHistoryStore()

  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const filtered = getFilteredDocuments()
  const hasFilters =
    scanHistoryFilters.query !== '' ||
    scanHistoryFilters.fileType !== 'all' ||
    scanHistoryFilters.hasWarnings ||
    scanHistoryFilters.hasQuestions ||
    scanHistoryFilters.hasVocabulary

  function handleDelete(id: string) {
    deleteScanDocument(id)
  }

  function handleClearAll() {
    clearScanHistory()
    setShowClearConfirm(false)
  }

  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '16px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
            <div>
              <h1 style={{ margin: '0 0 4px', fontSize: '28px', fontWeight: 700, color: '#ECFBFF' }}>
                Scan History{' '}
                <span style={{ fontSize: '16px', color: '#9BBFCA' }}>扫描历史</span>
              </h1>
              <p style={{ margin: 0, fontSize: '13px', color: '#9BBFCA', lineHeight: 1.6 }}>
                Review previous document analyses stored locally in this browser.
                <br />
                <span style={{ color: 'rgba(155,191,202,0.6)', fontSize: '12px' }}>
                  查看保存在当前浏览器本地的历史文档分析结果。
                </span>
              </p>
            </div>
            <Link href="/scan" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none', whiteSpace: 'nowrap', alignSelf: 'flex-start', marginTop: '4px' }}>
              ← Back to Scan / 返回扫描
            </Link>
          </div>

          {/* Compliance notice */}
          <div style={{
            background: 'rgba(255,215,106,0.04)',
            border: '1px solid rgba(255,215,106,0.15)',
            borderRadius: '8px',
            padding: '10px 14px',
            margin: '16px 0 20px',
            fontSize: '11px',
            color: 'rgba(255,215,106,0.6)',
            lineHeight: 1.7,
          }}>
            🔒 Your scan history is stored locally in this browser only. Original uploaded files are not saved.
            You can delete any record at any time. Do not upload documents you do not have permission to analyze.
            <br />
            🔒 扫描历史仅保存在当前浏览器本地。系统不会保存原始上传文件。你可以随时删除任何记录。请不要上传你无权分析的材料。
          </div>

          {/* Filters */}
          <ScanHistoryFilters
            filters={scanHistoryFilters}
            onChange={setFilters}
            totalCount={scanDocuments.length}
            filteredCount={filtered.length}
          />

          {/* Document list */}
          {filtered.length === 0 ? (
            <ScanHistoryEmptyState hasFilters={hasFilters} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
              {filtered.map(doc => (
                <ScanHistoryCard key={doc.id} doc={doc} onDelete={handleDelete} />
              ))}
            </div>
          )}

          {/* Clear all */}
          {scanDocuments.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(155,191,202,0.1)', paddingTop: '20px', marginTop: '8px' }}>
              {!showClearConfirm ? (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '7px',
                    background: 'rgba(239,68,68,0.05)',
                    border: '1px solid rgba(239,68,68,0.15)',
                    color: 'rgba(239,68,68,0.6)',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Clear All History / 清空扫描历史
                </button>
              ) : (
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  background: 'rgba(239,68,68,0.05)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  flexWrap: 'wrap',
                }}>
                  <span style={{ fontSize: '13px', color: 'rgba(239,68,68,0.85)' }}>
                    Delete all {scanDocuments.length} records? This cannot be undone. /
                    删除全部 {scanDocuments.length} 条记录？此操作不可撤销。
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleClearAll}
                      style={{ padding: '5px 14px', borderRadius: '6px', background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.4)', color: '#F87171', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Delete All / 全部删除
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      style={{ padding: '5px 12px', borderRadius: '6px', background: 'none', border: '1px solid rgba(155,191,202,0.2)', color: '#9BBFCA', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Cancel / 取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </AppShell>
  )
}
