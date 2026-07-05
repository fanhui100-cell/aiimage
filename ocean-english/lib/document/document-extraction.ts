import type { ExtractedDocumentData, UploadedDocumentType } from '@/types/document'
import { extractPdfText } from './providers/pdf-text-provider'
import { extractImageText } from './providers/image-ocr-provider'
import { buildMockExtraction } from './providers/mock-document-provider'

export interface DocumentExtractionInput {
  fileName: string
  fileType: UploadedDocumentType
  /** MIME type of the uploaded file — required by image OCR providers. */
  mimeType: string
  buffer: Buffer
  useMock?: boolean
}

/**
 * Routes the extraction request to the appropriate provider.
 * All provider errors are caught internally; callers always receive an ExtractedDocumentData.
 */
export async function extractDocumentText(
  input: DocumentExtractionInput,
): Promise<ExtractedDocumentData> {
  if (input.useMock) {
    return buildMockExtraction(input.fileName, input.fileType)
  }

  if (input.fileType === 'pdf') {
    return extractPdfText(input.buffer, input.fileName)
  }

  if (input.fileType === 'image') {
    return extractImageText(input.buffer, input.fileName, input.mimeType)
  }

  // Fallback for any future types
  return buildMockExtraction(input.fileName, input.fileType)
}
