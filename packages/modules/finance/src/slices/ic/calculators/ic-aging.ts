/**
 * @see IC-04 — Settlement tracking
 * @see AIS A-23 — IC open-items aging report
 *
 * Pure calculator — no I/O, no side effects.
 * Computes aging buckets for open intercompany items based on their age in days.
 */
import type { Money } from "@afenda/core";
import { money } from "@afenda/core";
import type { CalculatorResult } from "../../gl/calculators/journal-balance.js";

export interface IcOpenItem {
  readonly transactionId: string;
  readonly sourceCompanyId: string;
  readonly mirrorCompanyId: string;
  readonly amount: Money;
  readonly createdAt: Date;
  readonly status: "PENDING" | "PAIRED" | "RECONCILED";
}

export type AgingBucket = "CURRENT" | "30_DAYS" | "60_DAYS" | "90_DAYS" | "OVER_90";

export interface AgingBucketSummary {
  readonly bucket: AgingBucket;
  readonly itemCount: number;
  readonly totalAmount: Money;
}

export interface IcAgingReport {
  readonly asOfDate: Date;
  readonly buckets: readonly AgingBucketSummary[];
  readonly totalOpen: Money;
  readonly totalItems: number;
  readonly oldestItemDays: number;
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function toBucket(days: number): AgingBucket {
  if (days <= 30) return "CURRENT";
  if (days <= 60) return "30_DAYS";
  if (days <= 90) return "60_DAYS";
  if (days <= 120) return "90_DAYS";
  return "OVER_90";
}

const BUCKET_ORDER: AgingBucket[] = ["CURRENT", "30_DAYS", "60_DAYS", "90_DAYS", "OVER_90"];

export function computeIcAging(
  items: readonly IcOpenItem[],
  asOfDate: Date,
  currency: string,
): CalculatorResult<IcAgingReport> {
  const openItems = items.filter((i) => i.status !== "RECONCILED");

  const bucketMap = new Map<AgingBucket, { count: number; total: bigint }>();
  for (const b of BUCKET_ORDER) {
    bucketMap.set(b, { count: 0, total: 0n });
  }

  let oldestDays = 0;

  for (const item of openItems) {
    const days = daysBetween(item.createdAt, asOfDate);
    const bucket = toBucket(days);
    const entry = bucketMap.get(bucket)!;
    entry.count += 1;
    entry.total += item.amount.amount < 0n ? -item.amount.amount : item.amount.amount;
    if (days > oldestDays) oldestDays = days;
  }

  const buckets: AgingBucketSummary[] = BUCKET_ORDER.map((b) => {
    const entry = bucketMap.get(b)!;
    return { bucket: b, itemCount: entry.count, totalAmount: money(entry.total, currency) };
  });

  const totalOpen = money(
    buckets.reduce((sum, b) => sum + b.totalAmount.amount, 0n),
    currency,
  );

  return {
    result: {
      asOfDate,
      buckets,
      totalOpen,
      totalItems: openItems.length,
      oldestItemDays: oldestDays,
    },
    inputs: { itemCount: items.length, asOfDate: asOfDate.toISOString(), currency },
    explanation: `IC aging: ${openItems.length} open items, oldest ${oldestDays} days, total ${totalOpen.amount}`,
  };
}
