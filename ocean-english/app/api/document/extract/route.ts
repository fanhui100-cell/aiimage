import { NextRequest, NextResponse } from 'next/server'
import { validateUploadedFile, getDocumentType } from '@/lib/document/document-validation'
import { extractDocumentText } from '@/lib/document/document-extraction'
import { DOCUMENT_CONFIG } from '@/lib/document/document-config'
import { checkRateLimit, getClientIP, RATE_LIMITS, rateLimitKey } from '@/lib/ai/ai-rate-limit'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // Rate limit
  const ip = getClientIP(req)
  if (!checkRateLimit(rateLimitKey('document-extract', ip), RATE_LIMITS['document-extract'])) {
    return NextResponse.json(
      { ok: false, error: { code: 'rate_limit', message: 'Too many uploads. Please wait a moment.' } },
      { status: 429 },
    )
  }

  // Parse FormData
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: 'invalid_request', message: 'Could not parse multipart form data.' } },
      { status: 400 },
    )
  }

  const fileEntry = formData.get('file')
  if (!fileEntry || typeof fileEntry === 'string') {
    return NextResponse.json(
      { ok: false, error: { code: 'invalid_request', message: 'No file found. Upload a file with field name "file".' } },
      { status: 400 },
    )
  }

  const file = fileEntry as File

  // Validate type + size
  const validationError = validateUploadedFile(file.size, file.type, file.name)
  if (validationError) {
    const status = validationError.code === 'file_too_large' ? 413 : 400
    return NextResponse.json(
      { ok: false, error: { code: validationError.code, message: validationError.userMessage } },
      { status },
    )
  }

  const fileType = getDocumentType(file.type)!

  // Read file into buffer
  let buffer: Buffer
  try {
    buffer = Buffer.from(await file.arrayBuffer())
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: 'extraction_failed', message: 'Could not read file data.' } },
      { status: 500 },
    )
  }

  // Extract text via the appropriate provider
  const result = await extractDocumentText({ fileName: file.name, fileType, mimeType: file.type, buffer })

  // Hard extraction failure: provider caught an unrecoverable error (e.g. corrupted PDF, bad password).
  // Return an explicit error instead of ok:true so callers never treat '[PDF extraction failed]'
  // as real text and silently continue to AI analysis.
  if (result.rawText === '[PDF extraction failed]') {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'extraction_failed',
          message:
            result.warnings.find(w => !w.includes('该 PDF')) ??
            'PDF parsing failed. The file may be password-protected, corrupted, or in an unsupported format.',
        },
      },
      { status: 422 },
    )
  }

  // Safety cap: ensure rawText never exceeds maxExtractedTextLength
  // (providers should already enforce this, but belt-and-suspenders)
  const rawText =
    result.rawText.length > DOCUMENT_CONFIG.maxExtractedTextLength
      ? result.rawText.slice(0, DOCUMENT_CONFIG.maxExtractedTextLength)
      : result.rawText

  // Return full extracted text to client.
  // The scan page applies maxRawTextForAnalysis truncation before calling /api/ai/document-analysis.
  return NextResponse.json({
    ok: true,
    data: {
      fileName: result.fileName,
      fileType: result.fileType,
      rawText,
      extractionMethod: result.extractionMethod,
      pageCount: result.pageCount ?? null,
      metadata: result.metadata ?? null,
      confidence: result.confidence ?? null,
      warnings: result.warnings,
    },
  })
}
