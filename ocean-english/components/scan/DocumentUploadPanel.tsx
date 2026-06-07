'use client'

import { useRef, useState } from 'react'
import { DOCUMENT_CONFIG } from '@/lib/document/document-config'
import { validateFileClient } from '@/lib/document/document-validation'

interface DocumentUploadPanelProps {
  disabled: boolean
  onFile: (file: File) => void
  onDemo: () => void
}

export function DocumentUploadPanel({ disabled, onFile, onDemo }: DocumentUploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    setValidationError(null)
    if (!files || files.length === 0) return
    const file = files[0]
    const err = validateFileClient(file)
    if (err) {
      setValidationError(err.userMessage)
      return
    }
    onFile(file)
  }

  return (
    <div>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp"
        style={{ display: 'none' }}
        onChange={e => { handleFiles(e.target.files); e.target.value = '' }}
      />

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); if (!disabled) setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => {
          e.preventDefault()
          setIsDragging(false)
          if (!disabled) handleFiles(e.dataTransfer.files)
        }}
        onClick={() => { if (!disabled) fileInputRef.current?.click() }}
        style={{
          border: `2px dashed ${isDragging && !disabled ? 'rgba(255,215,106,0.7)' : disabled ? 'rgba(155,191,202,0.15)' : 'rgba(255,215,106,0.35)'}`,
          borderRadius: '14px',
          padding: '40px 24px',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: isDragging && !disabled ? 'rgba(255,215,106,0.05)' : 'transparent',
          transition: 'all 0.2s',
          opacity: disabled ? 0.5 : 1,
          marginBottom: '12px',
        }}
      >
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>📄</div>
        <div
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: disabled ? 'rgba(155,191,202,0.5)' : 'rgba(255,215,106,0.85)',
            marginBottom: '6px',
          }}
        >
          {disabled
            ? 'Confirm the notice above to enable upload / 请先确认上方须知'
            : 'Drop file here, or click to select / 拖放文件至此，或点击选择'}
        </div>
        <div
          style={{
            fontSize: '12px',
            color: 'rgba(155,191,202,0.5)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {DOCUMENT_CONFIG.displayFormats} · Max {DOCUMENT_CONFIG.displayMaxSize}
        </div>
      </div>

      {/* Validation error */}
      {validationError && (
        <div
          style={{
            padding: '10px 14px',
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '8px',
            fontSize: '13px',
            color: 'rgba(239,68,68,0.8)',
            marginBottom: '12px',
          }}
        >
          ⚠️ {validationError}
        </div>
      )}

      {/* Demo button */}
      {!disabled && (
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onDemo}
            style={{
              background: 'none',
              border: '1px dashed rgba(155,191,202,0.3)',
              borderRadius: '8px',
              padding: '8px 18px',
              color: 'rgba(155,191,202,0.6)',
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.06em',
            }}
          >
            ▷ Try demo document / 使用示例文档
          </button>
        </div>
      )}
    </div>
  )
}
