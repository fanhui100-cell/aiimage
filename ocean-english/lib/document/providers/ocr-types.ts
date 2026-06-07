/**
 * OCR provider types — Phase 4C.
 * Separate from ExtractedDocumentData to allow providers to be composed
 * and swapped without changing the document pipeline contract.
 */

export type OCRExtractionMethod =
  | 'mock-ocr'
  | 'vision-ocr-gemini'
  | 'vision-ocr-openai'
  | 'not-implemented'

export interface OCRResult {
  rawText: string
  /** Confidence score 0–1, if the provider supplies one. */
  confidence?: number
  /** ISO 639-1 language hints detected or configured. */
  languageHints?: string[]
  extractionMethod: OCRExtractionMethod
  warnings: string[]
}

export interface OCRInput {
  fileName: string
  fileType: 'image'
  /** MIME type of the image, e.g. 'image/png'. Needed by Vision APIs. */
  mimeType: string
  buffer: Buffer
  /** Optional caller-supplied language hints, e.g. ['en', 'zh']. */
  languageHints?: string[]
}

export interface OCRProvider {
  readonly name: OCRExtractionMethod
  extractText(input: OCRInput): Promise<OCRResult>
}
