/**
 * Enterprise filename utilities for document upload/download.
 * Safe across browsers, stable for audits, RFC 6266 + RFC 5987 compliant.
 *
 * @see packages/modules/finance/src/slices/document/docs/DOCUMENT-NAMING.md
 */

const MAX_FILENAME_LENGTH = 255;
const MAX_HEADER_FILENAME_LENGTH = 200; // conservative for proxy limits
const FALLBACK_NAME = 'document';

/** Windows reserved base names (case-insensitive) */
const RESERVED_NAMES = new Set([
  'con',
  'prn',
  'aux',
  'nul',
  ...Array.from({ length: 9 }, (_, i) => `com${i + 1}`),
  ...Array.from({ length: 9 }, (_, i) => `lpt${i + 1}`),
]);

/** ASCII control chars: \u0000-\u001F and \u007F */
const ASCII_CONTROL = /[\u0000-\u001F\u007F]/g;

/** Bidi control characters (can spoof filenames visually) */
const BIDI_CONTROLS = /[\u200E\u200F\u202A\u202B\u202C\u202D\u202E\u2066\u2067\u2068\u2069]/g;

/** Path separators and null */
const PATH_CHARS = /[/\\\0]/g;

/** Repeated whitespace */
const WHITESPACE_RUNS = /\s+/g;

/** MIME → extension mapping (server-decided, not user input) */
const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/tiff': '.tiff',
  'image/bmp': '.bmp',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'text/plain': '.txt',
  'text/csv': '.csv',
  'application/json': '.json',
  'application/xml': '.xml',
  'text/xml': '.xml',
  'application/zip': '.zip',
  'application/x-zip-compressed': '.zip',
};

export interface SanitizeResult {
  /** Original input, length-capped (for audit) */
  original: string;
  /** Sanitized name safe for storage and display */
  safe: string;
  /** ASCII-only fallback for legacy filename parameter */
  asciiFallback: string;
}

/**
 * Sanitize filename for storage. Deterministic, safe across browsers.
 * Use for both upload persistence and download display name.
 */
export function sanitizeFilenameForStorage(name: string): SanitizeResult {
  const raw = String(name ?? '');
  const original = raw.slice(0, MAX_FILENAME_LENGTH);

  let s = raw
    .normalize('NFC')
    .replace(PATH_CHARS, '')
    .replace(ASCII_CONTROL, '')
    .replace(BIDI_CONTROLS, '')
    .replace(/\r|\n/g, '')
    .replace(WHITESPACE_RUNS, ' ')
    .trim()
    .replace(/[\s.]+$/g, '') // trailing dot and spaces (Windows)
    .replace(/^[\s.]+/g, ''); // leading dot and spaces

  if (!s) {
    return { original, safe: FALLBACK_NAME, asciiFallback: FALLBACK_NAME };
  }

  // Reserved Windows names: rewrite base name
  const lastDot = s.lastIndexOf('.');
  const base = lastDot >= 0 ? s.slice(0, lastDot) : s;
  const ext = lastDot >= 0 ? s.slice(lastDot) : '';
  const baseLower = base.toLowerCase();
  const rewrittenBase = RESERVED_NAMES.has(baseLower) ? `file_${base}` : base;
  s = rewrittenBase + ext;

  // Truncate preserving extension
  if (s.length > MAX_FILENAME_LENGTH) {
    const extLen = ext.length;
    const maxBase = MAX_FILENAME_LENGTH - extLen;
    s = s.slice(0, maxBase) + ext;
  }

  const asciiFallback = s.replace(/[^\x00-\x7F]/g, '_') || FALLBACK_NAME;

  return { original, safe: s, asciiFallback };
}

/**
 * Build Content-Disposition header value. Always attachment.
 * RFC 6266 + RFC 5987. Re-sanitizes for header context (escape quotes, strip CR/LF).
 */
export function buildContentDisposition(safeName: string): string {
  let s = String(safeName ?? '')
    .replace(/\r|\n/g, '')
    .replace(/;/g, '')
    .replace(/"/g, '\\"');

  if (!s) s = FALLBACK_NAME;

  // Cap length for header (truncate preserving extension)
  if (s.length > MAX_HEADER_FILENAME_LENGTH) {
    const lastDot = s.lastIndexOf('.');
    const ext = lastDot >= 0 ? s.slice(lastDot) : '';
    const maxBase = MAX_HEADER_FILENAME_LENGTH - ext.length;
    s = s.slice(0, Math.max(1, maxBase)) + ext;
  }

  const asciiFallback = s.replace(/[^\x00-\x7F]/g, '_') || FALLBACK_NAME;
  const hasNonAscii = /[^\x00-\x7F]/.test(s);

  const filenameParam = `filename="${asciiFallback}"`;
  const filenameStarParam = hasNonAscii ? `; filename*=UTF-8''${encodeURIComponent(s)}` : '';

  return `attachment; ${filenameParam}${filenameStarParam}`;
}

/**
 * Derive extension from MIME type. Server-decided, not from user filename.
 * Returns .bin if MIME cannot be confidently mapped.
 */
export function extFromMime(mime: string | null | undefined): string {
  if (!mime || typeof mime !== 'string') return '.bin';
  const part = mime.toLowerCase().split(';')[0];
  const normalized = (part ?? '').trim();
  return MIME_TO_EXT[normalized] ?? '.bin';
}
