/**
 * SP-4004: Bulk Upload Fingerprint — deterministic row fingerprint for dedup.
 *
 * SP-DB-12: fingerprint = SHA256(supplier_id + invoice_number + invoice_date + amount + currency + vendor_reference)
 * SP-DB-13: Dedupe policy is per-upload, not global.
 */

// ─── Dedupe Policy ──────────────────────────────────────────────────────────

export const DEDUPE_POLICIES = ['SKIP_DUPLICATES', 'UPDATE_DRAFT', 'REJECT_CONFLICTS'] as const;

export type DedupePolicy = (typeof DEDUPE_POLICIES)[number];

// ─── Row Fingerprint ────────────────────────────────────────────────────────

export interface BulkUploadRow {
  readonly supplierId: string;
  readonly invoiceNumber: string;
  readonly invoiceDate: string;
  readonly amount: string;
  readonly currency: string;
  readonly vendorReference: string;
}

/**
 * Compute the deterministic fingerprint input for a bulk upload row.
 * Pure function — no I/O.
 *
 * Same invoice re-uploaded → same fingerprint.
 */
export function computeRowFingerprintInput(row: BulkUploadRow): string {
  return [
    row.supplierId,
    row.invoiceNumber,
    row.invoiceDate,
    row.amount,
    row.currency,
    row.vendorReference,
  ].join('|');
}

/**
 * Compute SHA-256 fingerprint for a bulk upload row.
 * Async because it uses crypto.
 */
export async function computeRowFingerprint(row: BulkUploadRow): Promise<string> {
  const input = computeRowFingerprintInput(row);
  const { createHash } = await import('node:crypto');
  return createHash('sha256').update(input).digest('hex');
}

// ─── Dedupe Result ──────────────────────────────────────────────────────────

export interface DedupeCheckResult {
  readonly fingerprint: string;
  readonly isDuplicate: boolean;
  readonly existingId?: string;
  readonly action: 'INSERT' | 'SKIP' | 'UPDATE' | 'REJECT';
}
