import type { ExtractedDocumentData, PdfMetadata } from '@/types/document'
import { DOCUMENT_CONFIG } from '../document-config'

// ── pdf-parse v2 type shims ───────────────────────────────────────────────────
// pdf-parse 2.x exports a PDFParse class; the v1 direct-function API no longer exists.
// We use a lightweight inline interface to avoid importing pdfjs-dist types here.

interface PdfParseV2Text {
  text: string
  total: number // page count
}

interface PdfParseV2Info {
  total: number // page count
  info?: Record<string, unknown> // PDF Info dict: Title, Author, Subject, Creator, Producer, CreationDate, ModDate …
}

interface PdfParseV2Instance {
  getText(params?: object): Promise<PdfParseV2Text>
  getInfo(params?: object): Promise<PdfParseV2Info>
  destroy(): Promise<void>
}

interface PdfParseV2Module {
  PDFParse: new (opts: { data: Uint8Array }) => PdfParseV2Instance
}

// ── DOMMatrix polyfill ────────────────────────────────────────────────────────
// pdfjs-dist 5.x (used by pdf-parse 2.x) uses DOMMatrix for page coordinate transforms.
// Node.js 24 does not expose DOMMatrix as a global. This minimal implementation
// covers the 2-D matrix operations pdfjs-dist needs for text extraction only;
// it does not implement the full WHATWG Geometry Interfaces spec.
function ensureDOMMatrixPolyfill(): void {
  if (typeof globalThis.DOMMatrix !== 'undefined') return

  class DOMMatrix {
    a: number; b: number; c: number; d: number; e: number; f: number
    m11: number; m12: number; m21: number; m22: number; m41: number; m42: number
    is2D: boolean

    constructor(init?: number[] | string) {
      const arr = Array.isArray(init) && init.length === 6 ? init : [1, 0, 0, 1, 0, 0]
      this.a = arr[0]; this.b = arr[1]; this.c = arr[2]; this.d = arr[3]; this.e = arr[4]; this.f = arr[5]
      this.m11 = this.a; this.m12 = this.b; this.m21 = this.c; this.m22 = this.d
      this.m41 = this.e; this.m42 = this.f; this.is2D = true
    }

    static fromMatrix(m: Partial<DOMMatrix>): DOMMatrix {
      return new DOMMatrix([m.a ?? 1, m.b ?? 0, m.c ?? 0, m.d ?? 1, m.e ?? 0, m.f ?? 0])
    }

    static fromFloat64Array(a: Float64Array): DOMMatrix {
      return new DOMMatrix(Array.from(a))
    }

    translate(x: number, y: number): DOMMatrix {
      const r = new DOMMatrix([this.a, this.b, this.c, this.d, this.e, this.f])
      r.e += this.a * x + this.c * y
      r.f += this.b * x + this.d * y
      r.m41 = r.e; r.m42 = r.f; return r
    }

    scale(sx: number, sy: number = sx): DOMMatrix {
      return new DOMMatrix([this.a * sx, this.b * sx, this.c * sy, this.d * sy, this.e, this.f])
    }

    multiply(m: DOMMatrix): DOMMatrix {
      return new DOMMatrix([
        this.a * m.a + this.c * m.b, this.b * m.a + this.d * m.b,
        this.a * m.c + this.c * m.d, this.b * m.c + this.d * m.d,
        this.a * m.e + this.c * m.f + this.e, this.b * m.e + this.d * m.f + this.f,
      ])
    }

    transformPoint(p: { x: number; y: number }): { x: number; y: number } {
      return { x: this.a * p.x + this.c * p.y + this.e, y: this.b * p.x + this.d * p.y + this.f }
    }

    inverse(): DOMMatrix {
      const det = this.a * this.d - this.b * this.c
      if (det === 0) return new DOMMatrix()
      return new DOMMatrix([
        this.d / det, -this.b / det, -this.c / det, this.a / det,
        (this.c * this.f - this.d * this.e) / det,
        (this.b * this.e - this.a * this.f) / det,
      ])
    }

    toFloat64Array(): Float64Array {
      return new Float64Array([this.a, this.b, this.c, this.d, this.e, this.f])
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).DOMMatrix = DOMMatrix
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function trimField(val: unknown): string | undefined {
  if (typeof val !== 'string') return undefined
  const s = val.trim()
  return s.length > 0 ? s : undefined
}

function buildMetadata(info: Record<string, unknown> | undefined): PdfMetadata | undefined {
  if (!info) return undefined
  const meta: PdfMetadata = {
    title: trimField(info['Title']),
    author: trimField(info['Author']),
    subject: trimField(info['Subject']),
    creator: trimField(info['Creator']),
    producer: trimField(info['Producer']),
    creationDate: trimField(info['CreationDate']),
    modificationDate: trimField(info['ModDate']),
  }
  return Object.values(meta).some(v => v !== undefined) ? meta : undefined
}

/**
 * Server-side PDF text extraction using pdf-parse v2 (PDFParse class API).
 * Safe to call ONLY from Node.js API routes (runtime = 'nodejs').
 * Do NOT import this in client components or Edge runtime.
 */
export async function extractPdfText(
  buffer: Buffer,
  fileName: string,
): Promise<ExtractedDocumentData> {
  const warnings: string[] = []
  let rawText = ''
  let pageCount: number | undefined
  let metadata: PdfMetadata | undefined

  try {
    // pdfjs-dist 5.x (via pdf-parse 2.x) requires DOMMatrix for coordinate transforms.
    // Node.js 24 does not expose it as a global; install our polyfill before requiring.
    ensureDOMMatrixPolyfill()

    // pdf-parse v2: exports a PDFParse class, not a function.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PDFParse } = require('pdf-parse') as PdfParseV2Module

    const parser = new PDFParse({ data: new Uint8Array(buffer) })

    try {
      // Sequential calls required: concurrent Promise.all on the same PDFParse instance
      // throws DataCloneError — pdfjs-dist transfers the ArrayBuffer to its worker on the
      // first call, making subsequent concurrent calls fail with a detached buffer.
      const textResult = await parser.getText()
      const infoResult = await parser.getInfo()

      rawText = textResult.text?.trim() ?? ''
      pageCount = infoResult.total || undefined
      metadata = buildMetadata(infoResult.info)
    } finally {
      await parser.destroy().catch(() => {})
    }

    // ── Text quality checks ──────────────────────────────────────────────

    if (rawText.length < DOCUMENT_CONFIG.minUsableTextLength) {
      warnings.push(
        'This PDF appears to contain little or no selectable text. It may be a scanned image PDF. Image OCR will be supported in a future phase.',
      )
      warnings.push(
        '该 PDF 似乎没有可选择文本，可能是扫描件或图片型 PDF。图片 OCR 将在后续阶段支持。',
      )
      if (!rawText) rawText = '[No extractable text found in PDF]'
    }

    if (pageCount && pageCount > DOCUMENT_CONFIG.maxPagesWarningThreshold) {
      warnings.push(
        `This PDF has ${pageCount} pages. The document is very long — only the first section will be used for AI analysis in this phase. / 该 PDF 共 ${pageCount} 页，文档较长，本阶段仅分析前半部分内容。`,
      )
    }

    // ── Length cap ───────────────────────────────────────────────────────

    if (rawText.length > DOCUMENT_CONFIG.maxExtractedTextLength) {
      rawText = rawText.slice(0, DOCUMENT_CONFIG.maxExtractedTextLength)
      warnings.push(
        `The document is long. Only the first ${DOCUMENT_CONFIG.maxExtractedTextLength.toLocaleString()} characters were extracted. / 文档较长，本阶段仅提取前 ${DOCUMENT_CONFIG.maxExtractedTextLength.toLocaleString()} 个字符。`,
      )
    }
  } catch (err) {
    console.error('[PDF Extract]', err instanceof Error ? err.message : String(err))
    warnings.push(
      'PDF parsing encountered an issue. The file may be password-protected, corrupted, or in an unsupported format.',
    )
    warnings.push('PDF 解析时遇到问题。文件可能已加密、损坏或格式不受支持。')
    rawText = '[PDF extraction failed]'
  }

  return {
    fileName,
    fileType: 'pdf',
    rawText,
    extractionMethod: 'pdf-parse',
    pageCount,
    metadata,
    warnings,
  }
}
