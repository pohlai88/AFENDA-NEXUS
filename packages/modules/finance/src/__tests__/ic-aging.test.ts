import { describe, it, expect } from 'vitest';
import { money } from '@afenda/core';
import { computeIcAging } from '../slices/ic/calculators/ic-aging.js';
import type { IcOpenItem } from '../slices/ic/calculators/ic-aging.js';

function makeItem(overrides: Partial<IcOpenItem> & { daysAgo: number; amt: bigint }): IcOpenItem {
  const asOf = new Date('2025-06-01');
  const created = new Date(asOf.getTime() - overrides.daysAgo * 86400000);
  return {
    transactionId: overrides.transactionId ?? `tx-${overrides.daysAgo}`,
    sourceCompanyId: overrides.sourceCompanyId ?? 'co-1',
    mirrorCompanyId: overrides.mirrorCompanyId ?? 'co-2',
    amount: money(overrides.amt, 'USD'),
    createdAt: created,
    status: overrides.status ?? 'PENDING',
  };
}

const AS_OF = new Date('2025-06-01');

describe('computeIcAging (A-23)', () => {
  it('returns empty buckets for no items', () => {
    const { result } = computeIcAging([], AS_OF, 'USD');
    expect(result.totalItems).toBe(0);
    expect(result.totalOpen.amount).toBe(0n);
    expect(result.buckets).toHaveLength(5);
  });

  it('places items in CURRENT bucket (<=30 days)', () => {
    const items = [makeItem({ daysAgo: 10, amt: 5000n })];
    const { result } = computeIcAging(items, AS_OF, 'USD');
    const current = result.buckets.find((b) => b.bucket === 'CURRENT')!;
    expect(current.itemCount).toBe(1);
    expect(current.totalAmount.amount).toBe(5000n);
  });

  it('places items in 30_DAYS bucket (31-60 days)', () => {
    const items = [makeItem({ daysAgo: 45, amt: 3000n })];
    const { result } = computeIcAging(items, AS_OF, 'USD');
    const bucket = result.buckets.find((b) => b.bucket === '30_DAYS')!;
    expect(bucket.itemCount).toBe(1);
    expect(bucket.totalAmount.amount).toBe(3000n);
  });

  it('places items in OVER_90 bucket (>120 days)', () => {
    const items = [makeItem({ daysAgo: 150, amt: 10000n })];
    const { result } = computeIcAging(items, AS_OF, 'USD');
    const bucket = result.buckets.find((b) => b.bucket === 'OVER_90')!;
    expect(bucket.itemCount).toBe(1);
    expect(result.oldestItemDays).toBe(150);
  });

  it('excludes RECONCILED items', () => {
    const items = [
      makeItem({ daysAgo: 10, amt: 5000n, status: 'RECONCILED' }),
      makeItem({ daysAgo: 20, amt: 3000n, status: 'PENDING' }),
    ];
    const { result } = computeIcAging(items, AS_OF, 'USD');
    expect(result.totalItems).toBe(1);
    expect(result.totalOpen.amount).toBe(3000n);
  });

  it('distributes multiple items across buckets', () => {
    const items = [
      makeItem({ daysAgo: 5, amt: 1000n }),
      makeItem({ daysAgo: 40, amt: 2000n }),
      makeItem({ daysAgo: 75, amt: 3000n }),
      makeItem({ daysAgo: 100, amt: 4000n }),
      makeItem({ daysAgo: 200, amt: 5000n }),
    ];
    const { result } = computeIcAging(items, AS_OF, 'USD');
    expect(result.totalItems).toBe(5);
    expect(result.totalOpen.amount).toBe(15000n);
    expect(result.oldestItemDays).toBe(200);

    const counts = Object.fromEntries(result.buckets.map((b) => [b.bucket, b.itemCount]));
    expect(counts['CURRENT']).toBe(1);
    expect(counts['30_DAYS']).toBe(1);
    expect(counts['60_DAYS']).toBe(1);
    expect(counts['90_DAYS']).toBe(1);
    expect(counts['OVER_90']).toBe(1);
  });
});
