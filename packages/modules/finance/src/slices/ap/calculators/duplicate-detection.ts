/**
 * AP-09: Duplicate invoice detection.
 * Flags potential duplicates by matching supplier + ref + amount + date.
 * Pure calculator — no DB, no side effects.
 *
 * Uses raw bigint for amounts (minor units).
 */

export interface InvoiceFingerprint {
  readonly invoiceId: string;
  readonly supplierId: string;
  readonly supplierRef: string;
  readonly totalAmount: bigint;
  readonly invoiceDate: Date;
}

export interface DuplicateGroup {
  readonly fingerprint: string;
  readonly invoices: readonly InvoiceFingerprint[];
}

function makeKey(fp: InvoiceFingerprint): string {
  const dateStr = fp.invoiceDate.toISOString().slice(0, 10);
  return `${fp.supplierId}|${fp.supplierRef}|${fp.totalAmount}|${dateStr}`;
}

/**
 * Detect potential duplicate invoices.
 * Returns groups of invoices that share the same supplier + ref + amount + date.
 * Single invoices (no duplicates) are excluded from the result.
 */
export function detectDuplicates(invoices: readonly InvoiceFingerprint[]): readonly DuplicateGroup[] {
  const groups = new Map<string, InvoiceFingerprint[]>();

  for (const inv of invoices) {
    if (!inv.supplierRef) continue;
    const key = makeKey(inv);
    const group = groups.get(key) ?? [];
    group.push(inv);
    groups.set(key, group);
  }

  const result: DuplicateGroup[] = [];
  for (const [fingerprint, invs] of groups) {
    if (invs.length > 1) {
      result.push({ fingerprint, invoices: invs });
    }
  }

  return result;
}
