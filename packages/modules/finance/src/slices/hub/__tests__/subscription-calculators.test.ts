import { describe, it, expect } from 'vitest';
import { computeSubscriptionProration } from '../calculators/subscription-proration.js';
import { computeUsageCharge } from '../calculators/usage-metering.js';
import { computeChurnMrr } from '../calculators/churn-mrr.js';

// ── Subscription Proration ────────────────────────────────────────────

describe('computeSubscriptionProration', () => {
  it('prorates an upgrade mid-cycle', () => {
    const result = computeSubscriptionProration([
      {
        subscriptionId: 'sub-1',
        changeType: 'UPGRADE',
        oldPlanAmount: 3000n, // $30/month
        newPlanAmount: 5000n, // $50/month
        billingCycleStartDate: '2025-01-01',
        billingCycleEndDate: '2025-01-31',
        changeDate: '2025-01-16',
        currencyCode: 'USD',
      },
    ]);
    expect(result.result.lines).toHaveLength(1);
    const line = result.result.lines[0]!;
    expect(line.changeType).toBe('UPGRADE');
    expect(line.daysUsedOldPlan).toBe(15);
    expect(line.daysRemainingNewPlan).toBe(15);
    // Credit: (3000/30)*15 = 100*15 = 1500, Charge: (5000/30)*15 = 166*15 = 2490 (BigInt truncation)
    expect(line.creditAmount).toBe(1500n);
    expect(line.chargeAmount).toBe(2490n);
    expect(line.netAmount).toBe(990n);
  });

  it('prorates a cancellation (credit only)', () => {
    const result = computeSubscriptionProration([
      {
        subscriptionId: 'sub-2',
        changeType: 'CANCELLATION',
        oldPlanAmount: 6000n,
        newPlanAmount: 0n,
        billingCycleStartDate: '2025-01-01',
        billingCycleEndDate: '2025-01-31',
        changeDate: '2025-01-21',
        currencyCode: 'USD',
      },
    ]);
    const line = result.result.lines[0]!;
    expect(line.chargeAmount).toBe(0n);
    // Credit for 10 unused days: (6000/30)*10 = 2000
    expect(line.creditAmount).toBe(2000n);
    expect(line.netAmount).toBe(-2000n);
  });

  it('handles no-proration method', () => {
    const result = computeSubscriptionProration(
      [
        {
          subscriptionId: 'sub-3',
          changeType: 'UPGRADE',
          oldPlanAmount: 3000n,
          newPlanAmount: 5000n,
          billingCycleStartDate: '2025-01-01',
          billingCycleEndDate: '2025-01-31',
          changeDate: '2025-01-16',
          currencyCode: 'USD',
        },
      ],
      'NONE'
    );
    const line = result.result.lines[0]!;
    expect(line.creditAmount).toBe(0n);
    expect(line.chargeAmount).toBe(5000n);
  });

  it('throws on empty changes', () => {
    expect(() => computeSubscriptionProration([])).toThrow('At least one subscription change');
  });
});

// ── Usage Metering ────────────────────────────────────────────────────

describe('computeUsageCharge', () => {
  it('computes tiered usage charges', () => {
    const result = computeUsageCharge({
      subscriptionId: 'sub-1',
      metricName: 'API Calls',
      usageQuantity: 15000n,
      includedAllowance: 5000n,
      tiers: [
        { fromUnits: 0n, toUnits: 5000n, pricePerUnit: 10n },
        { fromUnits: 5000n, toUnits: 10000n, pricePerUnit: 8n },
        { fromUnits: 10000n, toUnits: null, pricePerUnit: 5n },
      ],
      currencyCode: 'USD',
    });
    expect(result.result.totalUsage).toBe(15000n);
    expect(result.result.billableUsage).toBe(10000n);
    expect(result.result.tierBreakdown).toHaveLength(2);
    // First 5000 billable at 10 = 50000, next 5000 at 8 = 40000
    expect(result.result.tierBreakdown[0]!.tierCharge).toBe(50000n);
    expect(result.result.tierBreakdown[1]!.tierCharge).toBe(40000n);
    expect(result.result.totalCharge).toBe(90000n);
  });

  it('handles usage within included allowance', () => {
    const result = computeUsageCharge({
      subscriptionId: 'sub-1',
      metricName: 'Storage GB',
      usageQuantity: 3000n,
      includedAllowance: 5000n,
      tiers: [{ fromUnits: 0n, toUnits: null, pricePerUnit: 100n }],
      currencyCode: 'USD',
    });
    expect(result.result.billableUsage).toBe(0n);
    expect(result.result.totalCharge).toBe(0n);
  });

  it('handles single flat-rate tier', () => {
    const result = computeUsageCharge({
      subscriptionId: 'sub-1',
      metricName: 'Emails',
      usageQuantity: 1000n,
      includedAllowance: 0n,
      tiers: [{ fromUnits: 0n, toUnits: null, pricePerUnit: 5n }],
      currencyCode: 'USD',
    });
    expect(result.result.totalCharge).toBe(5000n);
  });

  it('throws on empty tiers', () => {
    expect(() =>
      computeUsageCharge({
        subscriptionId: 's',
        metricName: 'm',
        usageQuantity: 100n,
        includedAllowance: 0n,
        tiers: [],
        currencyCode: 'USD',
      })
    ).toThrow('At least one pricing tier');
  });

  it('throws on negative usage', () => {
    expect(() =>
      computeUsageCharge({
        subscriptionId: 's',
        metricName: 'm',
        usageQuantity: -1n,
        includedAllowance: 0n,
        tiers: [{ fromUnits: 0n, toUnits: null, pricePerUnit: 1n }],
        currencyCode: 'USD',
      })
    ).toThrow('Usage quantity cannot be negative');
  });
});

// ── Churn & MRR ───────────────────────────────────────────────────────

describe('computeChurnMrr', () => {
  it('computes MRR movements', () => {
    const result = computeChurnMrr({
      events: [
        {
          subscriptionId: 's1',
          eventType: 'NEW',
          amount: 5000n,
          currencyCode: 'USD',
          eventDate: '2025-01-05',
        },
        {
          subscriptionId: 's2',
          eventType: 'EXPANSION',
          amount: 2000n,
          currencyCode: 'USD',
          eventDate: '2025-01-10',
        },
        {
          subscriptionId: 's3',
          eventType: 'CHURN',
          amount: 3000n,
          currencyCode: 'USD',
          eventDate: '2025-01-15',
        },
        {
          subscriptionId: 's4',
          eventType: 'CONTRACTION',
          amount: 1000n,
          currencyCode: 'USD',
          eventDate: '2025-01-20',
        },
      ],
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      openingMrr: 100000n,
      currencyCode: 'USD',
    });
    expect(result.result.newMrr).toBe(5000n);
    expect(result.result.expansionMrr).toBe(2000n);
    expect(result.result.churnMrr).toBe(3000n);
    expect(result.result.contractionMrr).toBe(1000n);
    // Net new = 5000 + 2000 - 1000 - 3000 = 3000
    expect(result.result.netNewMrr).toBe(3000n);
    expect(result.result.closingMrr).toBe(103000n);
    expect(result.result.eventCount).toBe(4);
  });

  it('computes churn rates', () => {
    const result = computeChurnMrr({
      events: [
        {
          subscriptionId: 's1',
          eventType: 'CHURN',
          amount: 5000n,
          currencyCode: 'USD',
          eventDate: '2025-01-15',
        },
      ],
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      openingMrr: 100000n,
      currencyCode: 'USD',
    });
    // Gross churn = 5000/100000 = 5% = 500 bps
    expect(result.result.grossChurnRateBps).toBe(500);
  });

  it('handles zero opening MRR', () => {
    const result = computeChurnMrr({
      events: [
        {
          subscriptionId: 's1',
          eventType: 'NEW',
          amount: 1000n,
          currencyCode: 'USD',
          eventDate: '2025-01-01',
        },
      ],
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      openingMrr: 0n,
      currencyCode: 'USD',
    });
    expect(result.result.closingMrr).toBe(1000n);
    expect(result.result.grossChurnRateBps).toBe(0);
  });

  it('handles reactivation events', () => {
    const result = computeChurnMrr({
      events: [
        {
          subscriptionId: 's1',
          eventType: 'REACTIVATION',
          amount: 3000n,
          currencyCode: 'USD',
          eventDate: '2025-01-10',
        },
      ],
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      openingMrr: 50000n,
      currencyCode: 'USD',
    });
    expect(result.result.reactivationMrr).toBe(3000n);
    expect(result.result.closingMrr).toBe(53000n);
  });

  it('throws on negative opening MRR', () => {
    expect(() =>
      computeChurnMrr({
        events: [],
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31',
        openingMrr: -1n,
        currencyCode: 'USD',
      })
    ).toThrow('Opening MRR cannot be negative');
  });
});
