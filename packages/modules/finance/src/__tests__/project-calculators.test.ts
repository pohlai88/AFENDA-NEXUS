import { describe, it, expect } from 'vitest';
import { computeEarnedValue } from '../slices/project/calculators/earned-value.js';
import { computePctCompletion } from '../slices/project/calculators/pct-completion.js';
import { computeProjectProfitability } from '../slices/project/calculators/project-profitability.js';

// ─── PA-03: Earned Value Management ────────────────────────────────────────

describe('computeEarnedValue', () => {
  it('computes EVM metrics for on-track project', () => {
    const result = computeEarnedValue({
      projectId: 'p1',
      budgetAtCompletion: 1000000n,
      plannedValuePct: 50,
      completionPct: 50,
      actualCost: 500000n,
      currencyCode: 'USD',
    });
    expect(result.plannedValue).toBe(500000n);
    expect(result.earnedValue).toBe(500000n);
    expect(result.scheduleVariance).toBe(0n);
    expect(result.costVariance).toBe(0n);
    expect(result.spiPct).toBe(100);
    expect(result.cpiPct).toBe(100);
    expect(result.estimateAtCompletion).toBe(1000000n);
  });

  it('detects over-budget project', () => {
    const result = computeEarnedValue({
      projectId: 'p1',
      budgetAtCompletion: 1000000n,
      plannedValuePct: 50,
      completionPct: 50,
      actualCost: 600000n,
      currencyCode: 'USD',
    });
    expect(result.earnedValue).toBe(500000n);
    expect(result.costVariance).toBe(-100000n);
    expect(result.cpiPct).toBe(83); // 500000/600000 * 100
    // EAC = BAC * 100 / CPI = 1000000 * 100 / 83 = 1204819
    expect(result.estimateAtCompletion).toBe(1204819n);
  });

  it('detects behind-schedule project', () => {
    const result = computeEarnedValue({
      projectId: 'p1',
      budgetAtCompletion: 1000000n,
      plannedValuePct: 60,
      completionPct: 40,
      actualCost: 400000n,
      currencyCode: 'USD',
    });
    expect(result.plannedValue).toBe(600000n);
    expect(result.earnedValue).toBe(400000n);
    expect(result.scheduleVariance).toBe(-200000n);
    expect(result.spiPct).toBe(66); // 400000/600000 * 100
  });

  it('handles zero actual cost', () => {
    const result = computeEarnedValue({
      projectId: 'p1',
      budgetAtCompletion: 1000000n,
      plannedValuePct: 10,
      completionPct: 0,
      actualCost: 0n,
      currencyCode: 'USD',
    });
    expect(result.cpiPct).toBe(0);
    expect(result.earnedValue).toBe(0n);
  });
});

// ─── PA-04: Percentage-of-Completion ───────────────────────────────────────

describe('computePctCompletion', () => {
  it('computes revenue recognition at 50% completion', () => {
    const result = computePctCompletion({
      projectId: 'p1',
      contractValue: 2000000n,
      totalEstimatedCost: 1600000n,
      actualCostToDate: 800000n,
      previouslyRecognizedRevenue: 0n,
      currencyCode: 'USD',
    });
    expect(result.completionPct).toBe(50);
    // Revenue to date = 2,000,000 * 800,000 / 1,600,000 = 1,000,000
    expect(result.totalRevenueToDate).toBe(1000000n);
    expect(result.revenueToRecognize).toBe(1000000n);
    expect(result.grossProfitToDate).toBe(200000n);
    expect(result.estimatedTotalProfit).toBe(400000n);
  });

  it('computes incremental revenue recognition', () => {
    const result = computePctCompletion({
      projectId: 'p1',
      contractValue: 2000000n,
      totalEstimatedCost: 1600000n,
      actualCostToDate: 1200000n,
      previouslyRecognizedRevenue: 1000000n,
      currencyCode: 'USD',
    });
    expect(result.completionPct).toBe(75);
    // Revenue to date = 2,000,000 * 1,200,000 / 1,600,000 = 1,500,000
    expect(result.totalRevenueToDate).toBe(1500000n);
    expect(result.revenueToRecognize).toBe(500000n);
  });

  it('handles zero estimated cost', () => {
    const result = computePctCompletion({
      projectId: 'p1',
      contractValue: 100000n,
      totalEstimatedCost: 0n,
      actualCostToDate: 0n,
      previouslyRecognizedRevenue: 0n,
      currencyCode: 'USD',
    });
    expect(result.completionPct).toBe(0);
    expect(result.totalRevenueToDate).toBe(0n);
  });

  it('detects loss-making project', () => {
    const result = computePctCompletion({
      projectId: 'p1',
      contractValue: 500000n,
      totalEstimatedCost: 600000n,
      actualCostToDate: 300000n,
      previouslyRecognizedRevenue: 0n,
      currencyCode: 'USD',
    });
    expect(result.estimatedTotalProfit).toBe(-100000n);
  });
});

// ─── PA-07: Project Profitability ──────────────────────────────────────────

describe('computeProjectProfitability', () => {
  it('computes profitability metrics', () => {
    const result = computeProjectProfitability({
      projectId: 'p1',
      totalRevenue: 1000000n,
      totalCost: 750000n,
      budgetAmount: 800000n,
      currencyCode: 'USD',
    });
    expect(result.grossProfit).toBe(250000n);
    expect(result.marginPct).toBe(25);
    expect(result.markupPct).toBe(33); // 250000/750000 * 100
    expect(result.budgetVariance).toBe(50000n);
    expect(result.budgetUtilizationPct).toBe(93); // 750000/800000 * 100
  });

  it('handles zero revenue', () => {
    const result = computeProjectProfitability({
      projectId: 'p1',
      totalRevenue: 0n,
      totalCost: 100000n,
      budgetAmount: 200000n,
      currencyCode: 'USD',
    });
    expect(result.marginPct).toBe(0);
    expect(result.grossProfit).toBe(-100000n);
  });

  it('handles over-budget project', () => {
    const result = computeProjectProfitability({
      projectId: 'p1',
      totalRevenue: 500000n,
      totalCost: 600000n,
      budgetAmount: 500000n,
      currencyCode: 'USD',
    });
    expect(result.budgetVariance).toBe(-100000n);
    expect(result.budgetUtilizationPct).toBe(120);
  });
});
