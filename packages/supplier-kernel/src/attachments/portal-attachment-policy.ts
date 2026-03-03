/**
 * SP-1007: Attachment Policy — file validation, size/type limits, checksumming.
 *
 * Pure validation logic. Actual storage is handled by @afenda/storage.
 */

// ─── Attachment Constraints ─────────────────────────────────────────────────

/**
 * Maximum file sizes per category (in bytes).
 */
export const ATTACHMENT_SIZE_LIMITS = {
  /** General document uploads (PDF, DOCX, etc.) */
  document: 25 * 1024 * 1024, // 25 MB
  /** Invoice attachments (PDF, XML, images) */
  invoice: 10 * 1024 * 1024, // 10 MB
  /** Profile images / logos */
  image: 5 * 1024 * 1024, // 5 MB
  /** Compliance certificates */
  compliance: 25 * 1024 * 1024, // 25 MB
  /** Bulk upload CSV/Excel */
  bulk_upload: 50 * 1024 * 1024, // 50 MB
} as const;

export type AttachmentCategory = keyof typeof ATTACHMENT_SIZE_LIMITS;

/**
 * Allowed MIME types per category.
 */
export const ATTACHMENT_ALLOWED_TYPES: Record<AttachmentCategory, readonly string[]> = {
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
    'image/webp',
    'text/plain',
  ],
  invoice: ['application/pdf', 'application/xml', 'text/xml', 'image/png', 'image/jpeg'],
  image: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
  compliance: [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  bulk_upload: [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
} as const;

// ─── Validation ─────────────────────────────────────────────────────────────

export interface AttachmentValidationInput {
  readonly fileName: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly category: AttachmentCategory;
}

export type AttachmentValidationResult =
  | { readonly valid: true }
  | { readonly valid: false; readonly reason: string };

/**
 * Validate an attachment against the policy for its category.
 * Pure function — no I/O.
 */
export function validateAttachment(input: AttachmentValidationInput): AttachmentValidationResult {
  const maxSize = ATTACHMENT_SIZE_LIMITS[input.category];
  if (input.sizeBytes > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      reason: `File size (${Math.round(input.sizeBytes / (1024 * 1024))}MB) exceeds limit (${maxMB}MB) for ${input.category} uploads.`,
    };
  }

  const allowedTypes = ATTACHMENT_ALLOWED_TYPES[input.category];
  if (!allowedTypes.includes(input.mimeType)) {
    return {
      valid: false,
      reason: `File type '${input.mimeType}' is not allowed for ${input.category} uploads.`,
    };
  }

  // Block potentially dangerous file extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.js', '.vbs', '.ps1', '.sh'];
  const ext = input.fileName.toLowerCase().slice(input.fileName.lastIndexOf('.'));
  if (dangerousExtensions.includes(ext)) {
    return {
      valid: false,
      reason: `File extension '${ext}' is not permitted.`,
    };
  }

  return { valid: true };
}

// ─── Checksum ───────────────────────────────────────────────────────────────

/**
 * Compute SHA-256 checksum for file content.
 * Used for integrity verification and deduplication.
 */
export async function computeFileChecksum(content: Uint8Array): Promise<string> {
  const { createHash } = await import('node:crypto');
  return createHash('sha256').update(content).digest('hex');
}
