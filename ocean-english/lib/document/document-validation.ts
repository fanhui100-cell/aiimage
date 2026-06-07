import { DOCUMENT_CONFIG } from './document-config'
import type { UploadedDocumentType, DocumentProcessingError } from '@/types/document'

// Derive allowed image MIME types from the single source of truth in DOCUMENT_CONFIG.
const ALLOWED_IMAGE_MIME_TYPES: ReadonlySet<string> = new Set(
  DOCUMENT_CONFIG.allowedMimeTypes.filter(m => m.startsWith('image/')),
)

export function getDocumentType(mimeType: string): UploadedDocumentType | null {
  if (mimeType === 'application/pdf') return 'pdf'
  // Only accept MIME types explicitly listed in DOCUMENT_CONFIG.allowedMimeTypes.
  // Rejecting image/gif, image/svg+xml, etc. that are not in the whitelist.
  if (ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) return 'image'
  return null
}

export function validateUploadedFile(
  size: number,
  mimeType: string,
  name: string,
): DocumentProcessingError | null {
  if (size === 0) {
    return {
      code: 'empty_file',
      message: 'File is empty',
      userMessage: 'The selected file appears to be empty. Please choose a valid document.',
    }
  }

  if (size > DOCUMENT_CONFIG.maxFileSizeBytes) {
    return {
      code: 'file_too_large',
      message: `File size ${size} exceeds ${DOCUMENT_CONFIG.maxFileSizeBytes}`,
      userMessage: `File too large. Maximum allowed size is ${DOCUMENT_CONFIG.displayMaxSize}.`,
    }
  }

  // Extension-based guard: prevents drag-and-drop bypassing the file picker's `accept` attribute.
  const dotExt = name.includes('.')
    ? ('.' + name.split('.').pop()!.toLowerCase())
    : ''
  const allowedExts: readonly string[] = DOCUMENT_CONFIG.allowedExtensions
  if (!dotExt || !allowedExts.includes(dotExt)) {
    return {
      code: 'unsupported_type',
      message: `Unsupported file extension: "${dotExt}" (file: ${name})`,
      userMessage: `Unsupported file type. Please upload: ${DOCUMENT_CONFIG.displayFormats}.`,
    }
  }

  const docType = getDocumentType(mimeType)
  if (!docType) {
    return {
      code: 'unsupported_type',
      message: `Unsupported MIME type: ${mimeType} (file: ${name})`,
      userMessage: `Unsupported file type. Please upload: ${DOCUMENT_CONFIG.displayFormats}.`,
    }
  }

  return null
}

/** Client-side validation using the File object (browser). */
export function validateFileClient(file: File): DocumentProcessingError | null {
  return validateUploadedFile(file.size, file.type, file.name)
}
