import Link from 'next/link'

interface ScanHistoryEmptyStateProps {
  hasFilters: boolean
}

export function ScanHistoryEmptyState({ hasFilters }: ScanHistoryEmptyStateProps) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '60px 24px',
      color: 'var(--ink-sub)',
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
      {hasFilters ? (
        <>
          <p style={{ fontSize: '15px', color: 'var(--ink)', marginBottom: '6px' }}>
            No matching documents
          </p>
          <p style={{ fontSize: '13px', color: 'var(--ink-muted)' }}>
            Try clearing the filters / 尝试清除筛选条件
          </p>
        </>
      ) : (
        <>
          <p style={{ fontSize: '15px', color: 'var(--ink)', marginBottom: '6px' }}>
            No scan history yet / 暂无扫描历史
          </p>
          <p style={{ fontSize: '13px', color: 'var(--ink-muted)', marginBottom: '24px' }}>
            Analyze a document and save it to your library to get started.
            <br />
            分析文档并保存到库以开始使用。
          </p>
          <Link
            href="/scan"
            style={{
              display: 'inline-block',
              padding: '8px 20px',
              borderRadius: '8px',
              background: 'rgba(56,189,248,0.12)',
              border: '1px solid rgba(59,91,217,0.35)',
              color: 'var(--blue-ink)',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Go to Scan / 前往扫描 →
          </Link>
        </>
      )}
    </div>
  )
}
