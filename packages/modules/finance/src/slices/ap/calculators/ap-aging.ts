import type { ApInvoice } from '../entities/ap-invoice.js';

/**
 * AP-02: Supplier aging calculator.
 * Buckets outstanding AP invoices into current/30/60/90/90+ aging bands.
 * Pure calculator — no DB, no side effects.
 *
 * Uses raw bigint for internal arithmetic (via Money.amount),
 * matching the existing GL calculator pattern.
 */

export interface AgingBucket {
  readonly current: bigint;
  readonly days30: bigint;
  readonly days60: bigint;
  readonly days90: bigint;
  readonly over90: bigint;
  readonly total: bigint;
}

export interface SupplierAgingRow {
  readonly supplierId: string;
  readonly buckets: AgingBucket;
  readonly invoiceCount: number;
}

export interface AgingReport {
  readonly asOfDate: Date;
  readonly rows: readonly SupplierAgingRow[];
  readonly totals: AgingBucket;
}

function emptyBucket(): AgingBucket {
  return { current: 0n, days30: 0n, days60: 0n, days90: 0n, over90: 0n, total: 0n };
}

function addToBucket(bucket: AgingBucket, amount: bigint, daysOverdue: number): AgingBucket {
  if (daysOverdue <= 0)
    return { ...bucket, current: bucket.current + amount, total: bucket.total + amount };
  if (daysOverdue <= 30)
    return { ...bucket, days30: bucket.days30 + amount, total: bucket.total + amount };
  if (daysOverdue <= 60)
    return { ...bucket, days60: bucket.days60 + amount, total: bucket.total + amount };
  if (daysOverdue <= 90)
    return { ...bucket, days90: bucket.days90 + amount, total: bucket.total + amount };
  return { ...bucket, over90: bucket.over90 + amount, total: bucket.total + amount };
}

export function computeApAging(invoices: readonly ApInvoice[], asOfDate: Date): AgingReport {
  const supplierMap = new Map<string, { bucket: AgingBucket; count: number }>();

  for (const inv of invoices) {
    if (inv.status === 'CANCELLED' || inv.status === 'PAID' || inv.status === 'DRAFT') continue;

    const outstanding = inv.totalAmount.amount - inv.paidAmount.amount;
    if (outstanding <= 0n) continue;

    const daysOverdue = Math.floor(
      (asOfDate.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const entry = supplierMap.get(inv.supplierId) ?? { bucket: emptyBucket(), count: 0 };
    entry.bucket = addToBucket(entry.bucket, outstanding, daysOverdue);
    entry.count += 1;
    supplierMap.set(inv.supplierId, entry);
  }

  const rows: SupplierAgingRow[] = [];
  let totals = emptyBucket();

  for (const [supplierId, { bucket, count }] of supplierMap) {
    rows.push({ supplierId, buckets: bucket, invoiceCount: count });
    totals = {
      current: totals.current + bucket.current,
      days30: totals.days30 + bucket.days30,
      days60: totals.days60 + bucket.days60,
      days90: totals.days90 + bucket.days90,
      over90: totals.over90 + bucket.over90,
      total: totals.total + bucket.total,
    };
  }

  return { asOfDate, rows, totals };
}
