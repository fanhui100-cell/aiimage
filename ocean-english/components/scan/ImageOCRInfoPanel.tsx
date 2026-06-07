'use client'

import { useState } from 'react'
import { DOCUMENT_CONFIG } from '@/lib/document/document-config'
import type { ExtractedDocumentData } from '@/types/document'

interface ImageOCRInfoPanelProps {
  extractedDoc: ExtractedDocumentData
  onAnalyze: () => void
  onReset: () => void
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '11px',
  color: 'rgba(155,191,202,0.5)',
  marginBottom: '2px',
  fontFamily: 'var(--font-mono)',
}

const VALUE_STYLE: React.CSSProperties = {
  fontSize: '13px',
  color: '#ECFBFF',
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={LABEL_STYLE}>{label}</div>
      <div style={VALUE_STYLE}>{value}</div>
    </div>
  )
}

export function ImageOCRInfoPanel({
  extractedDoc,
  onAnalyze,
  onReset,
}: ImageOCRInfoPanelProps) {
  const [rawExpanded, setRawExpanded] = useState(false)

  const { rawText, fileName, fileType, extractionMethod, confidence, warnings } = extractedDoc

  const rawTrimmed = rawText.trim()
  const isPlaceholder = rawTrimmed.startsWith('[') && rawTrimmed.endsWith(']')
  const usableTextLength = isPlaceholder ? 0 : rawTrimmed.length

  // Analysis is blocked only when there is literally no text (empty or placeholder sentinel).
  // Short but real text (< minUsableTextLength) gets a warning but analysis is still allowed.
  const hasAnyText = !isPlaceholder && rawTrimmed.length > 0
  const isShortText = hasAnyText && rawTrimmed.length < DOCUMENT_CONFIG.minUsableTextLength
  const canAnalyze = hasAnyText

  const previewText = isPlaceholder ? '' : rawTrimmed.slice(0, DOCUMENT_CONFIG.maxTextPreviewLength)
  const previewTruncated = !isPlaceholder && rawTrimmed.length > DOCUMENT_CONFIG.maxTextPreviewLength

  const aiWillTruncate = usableTextLength > DOCUMENT_CONFIG.maxRawTextForAnalysis

  const isMockOCR = extractionMethod === 'mock-ocr'
  const confidencePct = confidence !== undefined ? Math.round(confidence * 100) : null

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#34D399', marginBottom: '4px' }}>
          ✓ Image OCR complete / 图片 OCR 完成
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(155,191,202,0.5)', fontFamily: 'var(--font-mono)' }}>
          {extractionMethod}
          {confidencePct !== null && ` · confidence ${confidencePct}%`}
          {' · '}
          {usableTextLength > 0
            ? `${usableTextLength.toLocaleString()} chars extracted`
            : 'no usable text'}
        </div>
      </div>

      {/* File info grid */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(155,191,202,0.12)',
        borderRadius: '12px',
        padding: '18px',
        marginBottom: '12px',
      }}>
        <div style={{
          fontSize: '11px',
          letterSpacing: '0.1em',
          color: 'rgba(56,189,248,0.5)',
          fontFamily: 'var(--font-mono)',
          marginBottom: '14px',
        }}>
          FILE INFO / 文件信息
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
          <InfoRow label="File Name / 文件名" value={fileName} />
          <InfoRow label="File Type / 文件类型" value={fileType.toUpperCase()} />
          <InfoRow label="OCR Method / 提取方式" value={extractionMethod} />
          <InfoRow
            label="Text Length / 文本长度"
            value={usableTextLength > 0 ? `${usableTextLength.toLocaleString()} characters` : 'No usable text found'}
          />
        </div>
      </div>

      {/* Mock OCR notice */}
      {isMockOCR && (
        <div style={{
          background: 'rgba(56,189,248,0.04)',
          border: '1px solid rgba(56,189,248,0.2)',
          borderRadius: '10px',
          padding: '14px 16px',
          marginBottom: '12px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#38BDF8', marginBottom: '4px' }}>
            Demo OCR Mode / 演示 OCR 模式
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#9BBFCA', lineHeight: 1.6 }}>
            No Vision API is configured. Showing demo text. Upload a clear image and configure a Vision API for real OCR results.
            <br />
            未配置 Vision API，当前显示预加载示例文本。配置 Vision API 后上传清晰图片可启用真实 OCR。
          </p>
        </div>
      )}

      {/* Short but non-empty text warning — allow analysis, just caution */}
      {isShortText && (
        <div style={{
          background: 'rgba(255,215,106,0.04)',
          border: '1px solid rgba(255,215,106,0.25)',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '12px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,215,106,0.9)', marginBottom: '4px' }}>
            ⚠ Short text extracted / 提取文本较短
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#9BBFCA', lineHeight: 1.6 }}>
            Only {usableTextLength} character{usableTextLength !== 1 ? 's' : ''} were extracted. AI analysis may be limited, but you can still proceed.
            <br />
            仅提取到 {usableTextLength} 个字符，AI 分析效果可能有限，但仍可继续。
          </p>
        </div>
      )}

      {/* No text warning */}
      {!hasAnyText && !isMockOCR && (
        <div style={{
          background: 'rgba(249,115,22,0.06)',
          border: '1px solid rgba(249,115,22,0.3)',
          borderRadius: '10px',
          padding: '16px 18px',
          marginBottom: '12px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#F97316', marginBottom: '6px' }}>
            ⚠ No Text Extracted / 未提取到文字
          </div>
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#ECFBFF', lineHeight: 1.6 }}>
            OCR found little or no text in this image. Try a higher-resolution, well-lit image with clear text.
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: '#9BBFCA', lineHeight: 1.6 }}>
            OCR 未能从图片中提取足够文字。请尝试使用更清晰、光线充足、文字清楚的图片。
          </p>
        </div>
      )}

      {/* Long document warning */}
      {hasAnyText && aiWillTruncate && (
        <div style={{
          background: 'rgba(255,215,106,0.04)',
          border: '1px solid rgba(255,215,106,0.2)',
          borderRadius: '8px',
          padding: '10px 14px',
          marginBottom: '12px',
          fontSize: '12px',
          color: 'rgba(255,215,106,0.8)',
        }}>
          ⚠ The extracted text is long. Only the first{' '}
          {DOCUMENT_CONFIG.maxRawTextForAnalysis.toLocaleString()} characters will be sent to AI
          analysis. / 提取文本较长，本阶段仅分析前 {DOCUMENT_CONFIG.maxRawTextForAnalysis.toLocaleString()} 个字符。
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          {warnings.map((w, i) => (
            <div key={i} style={{
              fontSize: '12px',
              color: 'rgba(155,191,202,0.6)',
              padding: '4px 0',
              borderBottom: i < warnings.length - 1 ? '1px solid rgba(155,191,202,0.06)' : 'none',
            }}>
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
              border: '1px solid rgba(155,191,202,0.15)',
              borderRadius: '6px',
              padding: '6px 14px',
              color: 'rgba(155,191,202,0.5)',
              fontSize: '11px',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {rawExpanded ? '▲ Hide' : '▼ Show'} OCR Text Preview / OCR 文本预览
            {!rawExpanded && (
              <span style={{ marginLeft: '6px', opacity: 0.6 }}>
                ({Math.min(usableTextLength, DOCUMENT_CONFIG.maxTextPreviewLength).toLocaleString()} chars)
              </span>
            )}
          </button>

          {rawExpanded && (
            <div style={{
              marginTop: '8px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(155,191,202,0.1)',
              borderRadius: '8px',
              padding: '14px 16px',
              fontSize: '12px',
              color: '#9BBFCA',
              lineHeight: 1.8,
              fontFamily: 'var(--font-mono)',
              whiteSpace: 'pre-wrap',
              maxHeight: '280px',
              overflowY: 'auto',
            }}>
              {previewText}
              {previewTruncated && (
                <span style={{ display: 'block', marginTop: '8px', color: 'rgba(155,191,202,0.4)', fontStyle: 'italic' }}>
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
              background: 'rgba(255,215,106,0.12)',
              border: '1px solid rgba(255,215,106,0.5)',
              color: '#FFD76A',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              cursor: 'pointer',
            }}
          >
            {isMockOCR
              ? '✦ Analyze Demo Text / 分析演示文本 →'
              : '✦ Analyze with AI / AI 分析 →'}
          </button>
        ) : (
          <div style={{
            padding: '12px 20px',
            borderRadius: '10px',
            background: 'rgba(249,115,22,0.06)',
            border: '1px solid rgba(249,115,22,0.2)',
            color: 'rgba(249,115,22,0.6)',
            fontSize: '13px',
          }}>
            AI analysis requires extracted text. / AI 分析需要提取到可用文字。
          </div>
        )}
        <button
          onClick={onReset}
          style={{
            padding: '12px 20px',
            borderRadius: '10px',
            background: 'transparent',
            border: '1px solid rgba(155,191,202,0.2)',
            color: '#9BBFCA',
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
