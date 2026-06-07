/**
 * Image OCR provider — Phase 4C.
 *
 * Pipeline:
 *   1. Try a Vision OCR provider (Gemini / OpenAI) if AI_PROVIDER is configured.
 *   2. If the provider throws (not implemented, API error, or not configured), fall
 *      back to MockOCRProvider so the pipeline never crashes.
 *   3. Map OCRResult → ExtractedDocumentData and apply confidence warnings.
 *
 * Safe to call ONLY from Node.js API routes (runtime = 'nodejs').
 */

import type { ExtractedDocumentData } from '@/types/document'
import { DOCUMENT_CONFIG } from '../document-config'
import type { OCRInput } from './ocr-types'
import { MockOCRProvider } from './mock-ocr-provider'
import { createVisionOCRProvider } from './vision-ocr-provider'

export async function extractImageText(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<ExtractedDocumentData> {
  const input: OCRInput = {
    fileName,
    fileType: 'image',
    mimeType,
    buffer,
    languageHints: ['en', 'zh'],
  }

  const mock = new MockOCRProvider()
  const visionProvider = createVisionOCRProvider()

  const ocrResult = await (async () => {
    if (visionProvider) {
      try {
        return await visionProvider.extractText(input)
      } catch (err) {
        console.error(
          '[OCR Vision]',
          err instanceof Error ? err.message : String(err),
        )
        // Fall through to mock
      }
    }
    return mock.extractText(input)
  })()

  const warnings = [...ocrResult.warnings]

  // Low-confidence warning
  if (
    ocrResult.confidence !== undefined &&
    ocrResult.confidence < DOCUMENT_CONFIG.ocrConfidenceWarningThreshold
  ) {
    warnings.push(
      `OCR confidence is low (${Math.round(ocrResult.confidence * 100)}%). Results may contain errors. Try a higher-resolution image. / OCR 置信度偏低，结果可能有误，建议使用更清晰的图片。`,
    )
  }

  // General image quality reminder
  warnings.push(
    'Image OCR quality depends on image clarity, lighting, and text layout. / 图片 OCR 质量取决于图片清晰度、光线和文字排版。',
  )

  // Map to pipeline type — reuse ExtractionMethod via cast since OCRExtractionMethod
  // values 'mock-ocr' and 'vision-ocr-*' are valid ExtractionMethod variants in Phase 4C.
  const extractionMethod = (
    ocrResult.extractionMethod === 'vision-ocr-gemini' ||
    ocrResult.extractionMethod === 'vision-ocr-openai'
      ? 'vision-ocr'
      : 'mock-ocr'
  ) as ExtractedDocumentData['extractionMethod']

  const rawText =
    ocrResult.rawText.length > DOCUMENT_CONFIG.maxExtractedTextLength
      ? ocrResult.rawText.slice(0, DOCUMENT_CONFIG.maxExtractedTextLength)
      : ocrResult.rawText

  return {
    fileName,
    fileType: 'image',
    rawText,
    extractionMethod,
    confidence: ocrResult.confidence,
    warnings,
  }
}
