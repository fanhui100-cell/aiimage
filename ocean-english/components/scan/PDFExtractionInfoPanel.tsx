'use client'

import { useState } from 'react'
import { DOCUMENT_CONFIG } from '@/lib/document/document-config'
import type { ExtractedDocumentData } from '@/types/document'

interface PDFExtractionInfoPanelProps {
  extractedDoc: ExtractedDocumentData
  onAnalyze: () => void
  onReset: () => void
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--ink-muted)',
  marginBottom: '2px',
  fontFamily: 'var(--font-mono)',
}

const VALUE_STYLE: React.CSSProperties = {
  fontSize: '13px',
  color: 'var(--ink)',
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={LABEL_STYLE}>{label}</div>
      <div style={VALUE_STYLE}>{value}</div>
    </div>
  )
}

export function PDFExtractionInfoPanel({
  extractedDoc,
  onAnalyze,
  onReset,
}: PDFExtractionInfoPanelProps) {
  const [rawExpanded, setRawExpanded] = useState(false)

  const { rawText, fileName, fileType, extractionMethod, pageCount, metadata, warnings } =
    extractedDoc

  // Detect placeholder / scanned PDF (our internal markers are wrapped in [ ])
  const rawTrimmed = rawText.trim()
  const isPlaceholder = rawTrimmed.startsWith('[') && rawTrimmed.endsWith(']')
  const usableTextLength = isPlaceholder ? 0 : rawTrimmed.length

  // Analysis is blocked only when there is no text at all (empty or placeholder sentinel).
  // Short but real text (< minUsableTextLength) gets a warning but analysis is still allowed.
  const hasAnyText = !isPlaceholder && rawTrimmed.length > 0
  const isShortText = hasAnyText && rawTrimmed.length < DOCUMENT_CONFIG.minUsableTextLength
  const canAnalyze = hasAnyText

  // Preview: show real text only, not placeholder strings
  const previewText = isPlaceholder ? '' : rawTrimmed.slice(0, DOCUMENT_CONFIG.maxTextPreviewLength)
  const previewTruncated = !isPlaceholder && rawTrimmed.length > DOCUMENT_CONFIG.maxTextPreviewLength

  // Will AI input be truncated?
  const aiWillTruncate = usableTextLength > DOCUMENT_CONFIG.maxRawTextForAnalysis

  // Only show metadata block if at least one field is present
  const metaEntries = metadata
    ? ([
        ['Title / 标题', metadata.title],
        ['Author / 作者', metadata.author],
        ['Subject / 主题', metadata.subject],
        ['Creator / 创建工具', metadata.creator],
        ['Producer / 生成器', metadata.producer],
        ['Created / 创建日期', metadata.creationDate],
        ['Modified / 修改日期', metadata.modificationDate],
      ] as [string, string | undefined][]).filter(([, v]) => v)
    : []

  return (
    <div>
      {/* Success header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--teal-ink)', marginBottom: '4px' }}>
          ✓ Text extraction complete / 文本提取完成
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--ink-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {extractionMethod} · {usableTextLength > 0 ? `${usableTextLength.toLocaleString()} chars extracted` : 'no usable text'}
        </div>
      </div>

      {/* File info grid */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: '12px',
          padding: '18px',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            letterSpacing: '0.1em',
            color: 'rgba(59,91,217,0.45)',
            fontFamily: 'var(--font-mono)',
            marginBottom: '14px',
          }}
        >
          FILE INFO / 文件信息
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '12px',
          }}
        >
          <InfoRow label="File Name / 文件名" value={fileName} />
          <InfoRow label="File Type / 文件类型" value={fileType.toUpperCase()} />
          <InfoRow label="Extraction Method / 提取方式" value={extractionMethod} />
          <InfoRow
            label="Text Length / 文本长度"
            value={
              usableTextLength > 0
                ? `${usableTextLength.toLocaleString()} characters`
                : 'No usable text found'
            }
          />
          {pageCount !== undefined && (
            <InfoRow label="Page Count / 页数" value={`${pageCount} page${pageCount !== 1 ? 's' : ''}`} />
          )}
        </div>
      </div>

      {/* PDF Metadata (only if any fields exist) */}
      {metaEntries.length > 0 && (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            padding: '16px 18px',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              letterSpacing: '0.1em',
              color: 'rgba(59,91,217,0.35)',
              fontFamily: 'var(--font-mono)',
              marginBottom: '12px',
            }}
          >
            PDF METADATA / 文档元数据
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '10px',
            }}
          >
            {metaEntries.map(([label, value]) => (
              <InfoRow key={label} label={label} value={value!} />
            ))}
          </div>
        </div>
      )}

      {/* Short but non-empty text — warn, still allow analysis */}
      {isShortText && (
        <div style={{
          background: 'rgba(255,215,106,0.04)',
          border: '1px solid rgba(255,215,106,0.25)',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '12px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gold-ink)', marginBottom: '4px' }}>
            ⚠ Short text extracted / 提取文本较短
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-sub)', lineHeight: 1.6 }}>
            Only {usableTextLength} character{usableTextLength !== 1 ? 's' : ''} were extracted. AI analysis may be limited, but you can still proceed.
            <br />
            仅提取到 {usableTextLength} 个字符，AI 分析效果可能有限，但仍可继续。
          </p>
        </div>
      )}

      {/* Scanned PDF / no text warning */}
      {!hasAnyText && (
        <div
          style={{
            background: 'rgba(249,115,22,0.06)',
            border: '1px solid rgba(249,115,22,0.3)',
            borderRadius: '10px',
            padding: '16px 18px',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#b3261e',
              marginBottom: '6px',
            }}
          >
            ⚠ No Selectable Text Found / 未找到可选择文本
          </div>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--ink)', lineHeight: 1.6 }}>
            This PDF appears to be image-based or scanned. OCR is required to extract text.
          </p>
          <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--ink-sub)', lineHeight: 1.6 }}>
            该 PDF 似乎是图片型或扫描件，需要 OCR 才能提取文字。
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: 'rgba(56,189,248,0.7)', lineHeight: 1.6 }}>
            💡 You can export a page as an image (PNG / JPG) and upload it — image OCR is now supported.
            <br />
            可以将 PDF 页面截图或导出为图片（PNG / JPG），然后上传图片进行 OCR 分析。
          </p>
        </div>
      )}

      {/* Long document / AI truncation warning */}
      {hasAnyText && aiWillTruncate && (
        <div
          style={{
            background: 'rgba(255,215,106,0.04)',
            border: '1px solid rgba(255,215,106,0.2)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '12px',
            fontSize: '12px',
            color: 'var(--gold-ink)',
          }}
        >
          ⚠ The document is long. Only the first{' '}
          {DOCUMENT_CONFIG.maxRawTextForAnalysis.toLocaleString()} characters will be sent to AI
          analysis. / 文档较长，本阶段仅分析前{' '}
          {DOCUMENT_CONFIG.maxRawTextForAnalysis.toLocaleString()} 个字符。
        </div>
      )}

      {/* Extraction warnings */}
      {warnings.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          {warnings.map((w, i) => (
            <div
              key={i}
              style={{
                fontSize: '12px',
                color: 'var(--ink-muted)',
                padding: '4px 0',
                borderBottom: i < warnings.length - 1 ? '1px solid rgba(155,191,202,0.06)' : 'none',
              }}
            >
              › {w}
            </div>
          ))}
        </div>
      )}

      {/* Raw text preview */}
      {hasAnyText && (
        <div style={{ marginBottom: '20px' }}>
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
            {rawExpanded ? '▲ Hide' : '▼ Show'} Raw Text Preview / 原始文本预览
            {!rawExpanded && (
              <span style={{ marginLeft: '6px', opacity: 0.6 }}>
                ({Math.min(usableTextLength, DOCUMENT_CONFIG.maxTextPreviewLength).toLocaleString()} chars)
              </span>
            )}
          </button>

          {rawExpanded && (
            <div
              style={{
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
                maxHeight: '280px',
                overflowY: 'auto',
              }}
            >
              {previewText}
              {previewTruncated && (
                <span style={{ display: 'block', marginTop: '8px', color: 'var(--ink-muted)', fontStyle: 'italic' }}>
                  … [preview truncated — full text used for analysis]
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {canAnalyze ? (
          <button
            onClick={onAnalyze}
            style={{
              padding: '12px 28px',
              borderRadius: '10px',
              background: 'rgba(179,120,31,0.1)',
              border: '1px solid rgba(255,215,106,0.5)',
              color: 'var(--gold-ink)',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              cursor: 'pointer',
            }}
          >
            ✦ Analyze with AI / AI 分析 →
          </button>
        ) : (
          <div
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              background: 'rgba(249,115,22,0.06)',
              border: '1px solid rgba(249,115,22,0.2)',
              color: 'rgba(249,115,22,0.6)',
              fontSize: '13px',
            }}
          >
            AI analysis requires selectable text. / AI 分析需要可选择文本。
          </div>
        )}
        <button
          onClick={onReset}
          style={{
            padding: '12px 20px',
            borderRadius: '10px',
            background: 'transparent',
            border: '1px solid var(--line)',
            color: 'var(--ink-sub)',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          ← Upload Different File / 重新上传
        </button>
      </div>
    </div>
  )
}
