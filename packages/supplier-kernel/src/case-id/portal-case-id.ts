/**
 * SP-1008: Case ID Generator — auto-generate CASE-{TENANT}-{YYYY}-{SEQ} ticket numbers.
 *
 * The generator uses a database sequence per tenant + year for uniqueness.
 * This module defines the format and the PORT — implementation in module repos.
 */

// ─── Case ID Format ─────────────────────────────────────────────────────────

/**
 * Format: CASE-{TENANT_SHORT}-{YYYY}-{SEQ}
 * Example: CASE-AFD-2026-00142
 *
 * - TENANT_SHORT: 3-letter tenant abbreviation (from tenant config)
 * - YYYY: 4-digit year
 * - SEQ: 5-digit zero-padded sequential number, resets per tenant per year
 */
export function formatCaseId(tenantShort: string, year: number, sequence: number): string {
  const paddedSeq = String(sequence).padStart(5, '0');
  return `CASE-${tenantShort.toUpperCase()}-${year}-${paddedSeq}`;
}

/**
 * Parse a case ID back into components.
 * Returns null if the format is invalid.
 */
export function parseCaseId(
  caseId: string
): { tenantShort: string; year: number; sequence: number } | null {
  const match = /^CASE-([A-Z]{2,5})-(\d{4})-(\d{5})$/.exec(caseId);
  if (!match) return null;

  return {
    tenantShort: match[1]!,
    year: parseInt(match[2]!, 10),
    sequence: parseInt(match[3]!, 10),
  };
}

// ─── Case ID Generator Port ────────────────────────────────────────────────

/**
 * Port for generating case IDs.
 *
 * Implementation should use a database sequence (or advisory lock + counter)
 * to guarantee uniqueness. Must be called within the same transaction as
 * case creation.
 */
export interface ICaseIdGenerator {
  /**
   * Generate the next case ID for a tenant.
   *
   * @param tenantId Full tenant UUID.
   * @param tenantShort 3-letter tenant abbreviation.
   * @param tx Database transaction handle — REQUIRED.
   * @returns The next case ID string (e.g., 'CASE-AFD-2026-00142').
   */
  next(tenantId: string, tenantShort: string, tx: unknown): Promise<string>;
}
