/**
 * Optional server-side MIME sniffing for high-risk types (Plan §7).
 * Detects content by magic bytes; rejects when declared type mismatches detected type.
 */
import { fileTypeFromBuffer } from 'file-type';

/** MIME types considered high-risk when mismatched with declared type. */
const HIGH_RISK_MIMES = new Set([
  'application/x-msdownload', // .exe
  'application/x-msi',
  'application/x-executable',
  'application/x-sharedlib',
  'application/x-pie-executable',
  'application/javascript',
  'application/x-javascript',
  'text/javascript',
  'text/x-python',
  'application/x-python',
  'application/x-php',
  'application/x-perl',
  'application/x-ruby',
  'application/x-sh',
  'application/x-bat',
  'application/x-csh',
  'application/vnd.microsoft.portable-executable',
]);

/**
 * Sniff buffer for MIME type. Returns detected mime or null if unknown.
 */
export async function sniffMimeFromBuffer(
  buffer: Buffer | Uint8Array
): Promise<{ mime: string; ext?: string } | null> {
  const result = await fileTypeFromBuffer(buffer);
  return result ? { mime: result.mime, ext: result.ext } : null;
}

/**
 * Validate that declared MIME matches sniffed content for high-risk types.
 * When sniffing detects a high-risk type that doesn't match declared, returns error.
 */
export async function validateMimeAgainstSniff(
  buffer: Buffer | Uint8Array,
  declaredMime: string
): Promise<{ ok: true } | { ok: false; detected: string }> {
  const detected = await sniffMimeFromBuffer(buffer);
  if (!detected) return { ok: true };

  const declared = declaredMime?.toLowerCase().split(';')[0]?.trim() ?? '';
  const detectedNorm = detected.mime.toLowerCase();

  if (!HIGH_RISK_MIMES.has(detectedNorm)) return { ok: true };
  if (declared === detectedNorm) return { ok: true };

  return { ok: false, detected: detected.mime };
}
