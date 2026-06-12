'use client'

interface DocumentComplianceNoticeProps {
  confirmed: boolean
  onConfirm: (confirmed: boolean) => void
}

export function DocumentComplianceNotice({ confirmed, onConfirm }: DocumentComplianceNoticeProps) {
  return (
    <div
      style={{
        background: 'rgba(255,215,106,0.04)',
        border: '1px solid rgba(255,215,106,0.25)',
        borderRadius: '12px',
        padding: '18px 20px',
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          letterSpacing: '0.12em',
          color: 'var(--gold-ink)',
          fontFamily: 'var(--font-mono)',
          marginBottom: '10px',
        }}
      >
        UPLOAD NOTICE / 上传须知
      </div>

      <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--ink)', lineHeight: 1.6 }}>
        Please only upload documents you own or have the right to process. Do not upload copyrighted
        textbooks, past exam papers, or third-party materials without authorization.
      </p>
      <p style={{ margin: '0 0 14px', fontSize: '12px', color: 'var(--ink-sub)', lineHeight: 1.6 }}>
        请仅上传您拥有或有权处理的文档。请勿上传受版权保护的教材、历年真题或未经授权的第三方材料。
      </p>

      <label
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={confirmed}
          onChange={e => onConfirm(e.target.checked)}
          style={{
            marginTop: '2px',
            width: '16px',
            height: '16px',
            accentColor: 'var(--gold-ink)',
            flexShrink: 0,
            cursor: 'pointer',
          }}
        />
        <span style={{ fontSize: '13px', color: confirmed ? 'var(--gold-ink)' : 'var(--ink-sub)', lineHeight: 1.5 }}>
          I confirm I have the right to process this document / 我确认我有权处理此文档
        </span>
      </label>
    </div>
  )
}
