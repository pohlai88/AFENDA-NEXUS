/**
 * AR-03: Customer aging report calculator.
 * Buckets outstanding AR invoices by days overdue: current, 30, 60, 90, 90+.
 * Pure calculator — no DB, no side effects.
 */
import type { ArInvoice } from "../entities/ar-invoice.js";

export interface AgingBucketTotals {
  readonly current: bigint;
  readonly days30: bigint;
  readonly days60: bigint;
  readonly days90: bigint;
  readonly over90: bigint;
  readonly total: bigint;
}

export interface ArAgingRow {
  readonly customerId: string;
  readonly current: bigint;
  readonly days30: bigint;
  readonly days60: bigint;
  readonly days90: bigint;
  readonly over90: bigint;
  readonly total: bigint;
}

export interface ArAgingReport {
  readonly asOfDate: Date;
  readonly rows: readonly ArAgingRow[];
  readonly totals: AgingBucketTotals;
}

export function computeArAging(invoices: readonly ArInvoice[], asOfDate: Date): ArAgingReport {
  const excluded: ArInvoice["status"][] = ["PAID", "CANCELLED", "WRITTEN_OFF"];
  const open = invoices.filter((inv) => !excluded.includes(inv.status));

  const byCustomer = new Map<string, ArAgingRow>();

  for (const inv of open) {
    const outstanding = inv.totalAmount.amount - inv.paidAmount.amount;
    if (outstanding <= 0n) continue;

    const daysOverdue = Math.floor((asOfDate.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24));

    const existing = byCustomer.get(inv.customerId) ?? {
      customerId: inv.customerId,
      current: 0n, days30: 0n, days60: 0n, days90: 0n, over90: 0n, total: 0n,
    };

    let row: ArAgingRow;
    if (daysOverdue <= 0) {
      row = { ...existing, current: existing.current + outstanding, total: existing.total + outstanding };
    } else if (daysOverdue <= 30) {
      row = { ...existing, days30: existing.days30 + outstanding, total: existing.total + outstanding };
    } else if (daysOverdue <= 60) {
      row = { ...existing, days60: existing.days60 + outstanding, total: existing.total + outstanding };
    } else if (daysOverdue <= 90) {
      row = { ...existing, days90: existing.days90 + outstanding, total: existing.total + outstanding };
    } else {
      row = { ...existing, over90: existing.over90 + outstanding, total: existing.total + outstanding };
    }

    byCustomer.set(inv.customerId, row);
  }

  const rows = [...byCustomer.values()];
  const totals: AgingBucketTotals = {
    current: rows.reduce((s, r) => s + r.current, 0n),
    days30: rows.reduce((s, r) => s + r.days30, 0n),
    days60: rows.reduce((s, r) => s + r.days60, 0n),
    days90: rows.reduce((s, r) => s + r.days90, 0n),
    over90: rows.reduce((s, r) => s + r.over90, 0n),
    total: rows.reduce((s, r) => s + r.total, 0n),
  };

  return { asOfDate, rows, totals };
}
