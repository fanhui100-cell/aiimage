import type { OCRProvider, OCRInput, OCRResult } from './ocr-types'
import { DEMO_RAW_TEXT } from '../demo-text'

/**
 * Mock OCR provider — Phase 4C.
 * Returns the shared demo text with a simulated confidence score.
 * Used when no real Vision API is configured, ensuring the full
 * document-analysis pipeline can be exercised end-to-end.
 */
export class MockOCRProvider implements OCRProvider {
  readonly name = 'mock-ocr' as const

  async extractText(input: OCRInput): Promise<OCRResult> {
    return {
      rawText: DEMO_RAW_TEXT,
      confidence: 0.85,
      languageHints: ['en'],
      extractionMethod: 'mock-ocr',
      warnings: [
        `Mock OCR active — no Vision API is configured. Upload a clear image for real OCR results. (file: ${input.fileName})`,
        `演示 OCR 模式 — 未配置 Vision API，显示预加载示例文本。上传清晰图片以启用真实 OCR。`,
      ],
    }
  }
}
