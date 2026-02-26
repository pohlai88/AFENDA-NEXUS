import { describe, it, expect } from 'vitest';
import { money } from '@afenda/core';
import { computeArAging } from '../slices/ar/calculators/ar-aging.js';
import { computeLateFee, computeLateFees } from '../slices/ar/calculators/late-fee.js';
import {
  computeDunningScore,
  computeDunningScores,
  computeDunningLevel,
} from '../slices/ar/calculators/dunning-score.js';
import { computeEclProvision } from '../slices/ar/calculators/ecl-provision.js';
import {
  allocatePaymentFifo,
  allocatePaymentSpecific,
} from '../slices/ar/calculators/payment-allocation.js';
import { checkCreditLimit } from '../slices/ar/calculators/credit-limit.js';
import { makeArInvoice } from './helpers.js';

// ─── AR Aging ──────────────────────────────────────────────────────────────

describe('computeArAging', () => {
  const asOf = new Date('2025-04-15');

  it('buckets current invoices (not yet due)', () => {
    const inv = makeArInvoice({ dueDate: new Date('2025-05-01'), status: 'POSTED' });
    const report = computeArAging([inv], asOf);
    expect(report.rows).toHaveLength(1);
    expect(report.totals.current).toBe(50000n);
    expect(report.totals.days30).toBe(0n);
  });

  it('buckets 1-30 days overdue', () => {
    const inv = makeArInvoice({ dueDate: new Date('2025-04-01'), status: 'POSTED' });
    const report = computeArAging([inv], asOf);
    expect(report.totals.days30).toBe(50000n);
  });

  it('buckets 31-60 days overdue', () => {
    const inv = makeArInvoice({ dueDate: new Date('2025-03-01'), status: 'POSTED' });
    const report = computeArAging([inv], asOf);
    expect(report.totals.days60).toBe(50000n);
  });

  it('buckets 61-90 days overdue', () => {
    const inv = makeArInvoice({ dueDate: new Date('2025-02-01'), status: 'POSTED' });
    const report = computeArAging([inv], asOf);
    expect(report.totals.days90).toBe(50000n);
  });

  it('buckets 90+ days overdue', () => {
    const inv = makeArInvoice({ dueDate: new Date('2025-01-01'), status: 'POSTED' });
    const report = computeArAging([inv], asOf);
    expect(report.totals.over90).toBe(50000n);
  });

  it('excludes PAID, CANCELLED, WRITTEN_OFF invoices', () => {
    const paid = makeArInvoice({ id: 'p1', status: 'PAID' });
    const cancelled = makeArInvoice({ id: 'p2', status: 'CANCELLED' });
    const writtenOff = makeArInvoice({ id: 'p3', status: 'WRITTEN_OFF' });
    const report = computeArAging([paid, cancelled, writtenOff], asOf);
    expect(report.rows).toHaveLength(0);
    expect(report.totals.total).toBe(0n);
  });

  it('groups by customer', () => {
    const inv1 = makeArInvoice({
      id: 'i1',
      customerId: 'c1',
      dueDate: new Date('2025-04-01'),
      status: 'POSTED',
    });
    const inv2 = makeArInvoice({
      id: 'i2',
      customerId: 'c2',
      dueDate: new Date('2025-04-01'),
      status: 'POSTED',
    });
    const report = computeArAging([inv1, inv2], asOf);
    expect(report.rows).toHaveLength(2);
  });

  it('subtracts paidAmount from outstanding', () => {
    const inv = makeArInvoice({
      dueDate: new Date('2025-04-01'),
      status: 'PARTIALLY_PAID',
      totalAmount: money(50000n, 'USD'),
      paidAmount: money(20000n, 'USD'),
    });
    const report = computeArAging([inv], asOf);
    expect(report.totals.days30).toBe(30000n);
  });
});

// ─── Late Fee ──────────────────────────────────────────────────────────────

describe('computeLateFee', () => {
  it('returns zero for non-overdue invoices', () => {
    const result = computeLateFee({
      invoiceId: 'inv-1',
      outstandingAmount: 100000n,
      dueDate: new Date('2025-05-01'),
      asOfDate: new Date('2025-04-15'),
      annualRatePercent: 12,
    });
    expect(result.daysOverdue).toBe(0);
    expect(result.interestAmount).toBe(0n);
  });

  it('computes simple interest for overdue invoices', () => {
    const result = computeLateFee({
      invoiceId: 'inv-1',
      outstandingAmount: 100000n, // $1000.00
      dueDate: new Date('2025-01-01'),
      asOfDate: new Date('2025-04-01'),
      annualRatePercent: 12,
    });
    expect(result.daysOverdue).toBe(90);
    // 100000 * 12 * 90 / (365 * 100) = 2958
    expect(result.interestAmount).toBe(2958n);
  });

  it('computeLateFees handles batch', () => {
    const results = computeLateFees([
      {
        invoiceId: 'a',
        outstandingAmount: 100000n,
        dueDate: new Date('2025-01-01'),
        asOfDate: new Date('2025-04-01'),
        annualRatePercent: 12,
      },
      {
        invoiceId: 'b',
        outstandingAmount: 50000n,
        dueDate: new Date('2025-05-01'),
        asOfDate: new Date('2025-04-01'),
        annualRatePercent: 12,
      },
    ]);
    expect(results).toHaveLength(2);
    expect(results[0]!.interestAmount).toBeGreaterThan(0n);
    expect(results[1]!.interestAmount).toBe(0n);
  });
});

// ─── Dunning Score ─────────────────────────────────────────────────────────

describe('computeDunningScore', () => {
  it('returns null for non-overdue invoices', () => {
    const result = computeDunningScore({
      customerId: 'c1',
      invoiceId: 'inv-1',
      outstandingAmount: 100000n,
      dueDate: new Date('2025-05-01'),
      asOfDate: new Date('2025-04-15'),
      previousDunningLevel: null,
    });
    expect(result).toBeNull();
  });

  it('assigns level 1 for 1-30 days overdue', () => {
    const result = computeDunningScore({
      customerId: 'c1',
      invoiceId: 'inv-1',
      outstandingAmount: 100000n,
      dueDate: new Date('2025-04-01'),
      asOfDate: new Date('2025-04-15'),
      previousDunningLevel: null,
    });
    expect(result!.level).toBe(1);
    expect(result!.escalated).toBe(false);
  });

  it('assigns level 4 for 90+ days overdue', () => {
    const result = computeDunningScore({
      customerId: 'c1',
      invoiceId: 'inv-1',
      outstandingAmount: 100000n,
      dueDate: new Date('2025-01-01'),
      asOfDate: new Date('2025-05-01'),
      previousDunningLevel: null,
    });
    expect(result!.level).toBe(4);
  });

  it('detects escalation', () => {
    const result = computeDunningScore({
      customerId: 'c1',
      invoiceId: 'inv-1',
      outstandingAmount: 100000n,
      dueDate: new Date('2025-01-01'),
      asOfDate: new Date('2025-05-01'),
      previousDunningLevel: 2,
    });
    expect(result!.escalated).toBe(true);
  });

  it('computeDunningLevel returns correct levels', () => {
    expect(computeDunningLevel(5)).toBe(1);
    expect(computeDunningLevel(30)).toBe(1);
    expect(computeDunningLevel(31)).toBe(2);
    expect(computeDunningLevel(60)).toBe(2);
    expect(computeDunningLevel(61)).toBe(3);
    expect(computeDunningLevel(90)).toBe(3);
    expect(computeDunningLevel(91)).toBe(4);
  });

  it('computeDunningScores filters nulls', () => {
    const results = computeDunningScores([
      {
        customerId: 'c1',
        invoiceId: 'i1',
        outstandingAmount: 100000n,
        dueDate: new Date('2025-04-01'),
        asOfDate: new Date('2025-04-15'),
        previousDunningLevel: null,
      },
      {
        customerId: 'c1',
        invoiceId: 'i2',
        outstandingAmount: 50000n,
        dueDate: new Date('2025-05-01'),
        asOfDate: new Date('2025-04-15'),
        previousDunningLevel: null,
      },
    ]);
    expect(results).toHaveLength(1);
  });
});

// ─── ECL Provision ─────────────────────────────────────────────────────────

describe('computeEclProvision', () => {
  it('computes provision using default matrix', () => {
    const result = computeEclProvision({
      current: 1000000n,
      days30: 500000n,
      days60: 200000n,
      days90: 100000n,
      over90: 50000n,
    });
    expect(result.totalGross).toBe(1850000n);
    expect(result.totalProvision).toBeGreaterThan(0n);
    expect(result.buckets).toHaveLength(5);
  });

  it('returns zero provision for zero balances', () => {
    const result = computeEclProvision({
      current: 0n,
      days30: 0n,
      days60: 0n,
      days90: 0n,
      over90: 0n,
    });
    expect(result.totalProvision).toBe(0n);
    expect(result.weightedLossRate).toBe(0);
  });

  it('applies custom matrix', () => {
    const result = computeEclProvision(
      { current: 100000n, days30: 0n, days60: 0n, days90: 0n, over90: 0n },
      { current: 10, days30: 0, days60: 0, days90: 0, over90: 0 }
    );
    // 100000 * 10% = 10000
    expect(result.buckets[0]!.provisionAmount).toBe(10000n);
  });

  it('over90 bucket has highest provision rate', () => {
    const result = computeEclProvision({
      current: 100000n,
      days30: 100000n,
      days60: 100000n,
      days90: 100000n,
      over90: 100000n,
    });
    const over90Bucket = result.buckets.find((b) => b.bucket === 'over90')!;
    const currentBucket = result.buckets.find((b) => b.bucket === 'current')!;
    expect(over90Bucket.provisionAmount).toBeGreaterThan(currentBucket.provisionAmount);
  });
});

// ─── Payment Allocation ────────────────────────────────────────────────────

describe('allocatePaymentFifo', () => {
  it('allocates to oldest invoice first', () => {
    const result = allocatePaymentFifo(30000n, [
      { invoiceId: 'new', outstandingAmount: 20000n, dueDate: new Date('2025-03-01') },
      { invoiceId: 'old', outstandingAmount: 20000n, dueDate: new Date('2025-01-01') },
    ]);
    expect(result.allocations[0]!.invoiceId).toBe('old');
    expect(result.allocations[0]!.allocatedAmount).toBe(20000n);
    expect(result.allocations[1]!.invoiceId).toBe('new');
    expect(result.allocations[1]!.allocatedAmount).toBe(10000n);
    expect(result.totalAllocated).toBe(30000n);
    expect(result.unallocatedRemainder).toBe(0n);
  });

  it('handles overpayment', () => {
    const result = allocatePaymentFifo(50000n, [
      { invoiceId: 'inv1', outstandingAmount: 20000n, dueDate: new Date('2025-01-01') },
    ]);
    expect(result.totalAllocated).toBe(20000n);
    expect(result.unallocatedRemainder).toBe(30000n);
  });

  it('handles underpayment', () => {
    const result = allocatePaymentFifo(5000n, [
      { invoiceId: 'inv1', outstandingAmount: 20000n, dueDate: new Date('2025-01-01') },
    ]);
    expect(result.totalAllocated).toBe(5000n);
    expect(result.allocations[0]!.remainingOnInvoice).toBe(15000n);
  });
});

describe('allocatePaymentSpecific', () => {
  it('allocates exact amounts to specified invoices', () => {
    const result = allocatePaymentSpecific(
      [{ invoiceId: 'inv2', amount: 10000n }],
      [
        { invoiceId: 'inv1', outstandingAmount: 20000n, dueDate: new Date('2025-01-01') },
        { invoiceId: 'inv2', outstandingAmount: 30000n, dueDate: new Date('2025-02-01') },
      ]
    );
    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0]!.invoiceId).toBe('inv2');
    expect(result.allocations[0]!.allocatedAmount).toBe(10000n);
    expect(result.totalAllocated).toBe(10000n);
  });

  it('caps allocation at outstanding amount', () => {
    const result = allocatePaymentSpecific(
      [{ invoiceId: 'inv1', amount: 50000n }],
      [{ invoiceId: 'inv1', outstandingAmount: 20000n, dueDate: new Date('2025-01-01') }]
    );
    expect(result.allocations[0]!.allocatedAmount).toBe(20000n);
  });
});

// ─── Credit Limit ──────────────────────────────────────────────────────────

describe('checkCreditLimit', () => {
  it('returns withinLimit=true when under limit', () => {
    const result = checkCreditLimit({
      customerId: 'c1',
      creditLimit: 100000n,
      currentOutstanding: 30000n,
      newInvoiceAmount: 20000n,
    });
    expect(result.withinLimit).toBe(true);
    expect(result.overLimitAmount).toBe(0n);
    expect(result.availableCredit).toBe(70000n);
  });

  it('returns withinLimit=false when over limit', () => {
    const result = checkCreditLimit({
      customerId: 'c1',
      creditLimit: 100000n,
      currentOutstanding: 80000n,
      newInvoiceAmount: 30000n,
    });
    expect(result.withinLimit).toBe(false);
    expect(result.overLimitAmount).toBe(10000n);
    expect(result.projectedOutstanding).toBe(110000n);
  });

  it('returns withinLimit=true at exact limit', () => {
    const result = checkCreditLimit({
      customerId: 'c1',
      creditLimit: 100000n,
      currentOutstanding: 80000n,
      newInvoiceAmount: 20000n,
    });
    expect(result.withinLimit).toBe(true);
    expect(result.overLimitAmount).toBe(0n);
  });
});
