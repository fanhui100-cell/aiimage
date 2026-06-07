export const DOCUMENT_CONFIG = {
  maxFileSizeBytes: 10 * 1024 * 1024, // 10 MB
  maxFileSizeMB: 10,

  // Chars of rawText sent to AI — keep well under model context limits
  maxRawTextForAnalysis: 6_000,

  // Hard cap on text extracted from document (preview + storage)
  maxExtractedTextLength: 20_000,

  // Fewer chars than this → likely a scanned/image PDF with no selectable text
  minUsableTextLength: 50,

  // Page counts above this trigger a "document is long" warning
  maxPagesWarningThreshold: 100,

  // Chars shown in the raw text preview panel (collapsible)
  maxTextPreviewLength: 1_000,

  allowedMimeTypes: [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
  ] as const,

  allowedExtensions: ['.pdf', '.png', '.jpg', '.jpeg', '.webp'] as const,

  displayFormats: 'PDF, PNG, JPG, JPEG, WEBP',
  displayMaxSize: '10 MB',

  // OCR confidence below this threshold triggers a "low confidence" warning.
  ocrConfidenceWarningThreshold: 0.6,
} as const
