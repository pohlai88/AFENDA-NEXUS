import { describe, it, expect } from 'vitest';
import { computeFinancialRatios, type RatioInput } from '../financial-ratios.js';

const baseInput: RatioInput = {
  currentAssets: 500_000n,
  currentLiabilities: 250_000n,
  inventory: 100_000n,
  cash: 80_000n,
  totalAssets: 1_000_000n,
  totalLiabilities: 400_000n,
  totalEquity: 600_000n,
  tradeReceivables: 120_000n,
  tradePayables: 80_000n,
  revenue: 2_000_000n,
  costOfSales: 1_200_000n,
  grossProfit: 800_000n,
  operatingProfit: 300_000n,
  netProfit: 200_000n,
  interestExpense: 50_000n,
  depreciation: 100_000n,
  daysInPeriod: 365,
};

describe('computeFinancialRatios', () => {
  it('computes liquidity ratios', () => {
    const { result } = computeFinancialRatios(baseInput);

    // Current ratio: 500,000 / 250,000 = 2.0 → 20000
    expect(result.liquidity.currentRatio).toBe(20000n);
    // Quick ratio: (500,000 - 100,000) / 250,000 = 1.6 → 16000
    expect(result.liquidity.quickRatio).toBe(16000n);
    // Cash ratio: 80,000 / 250,000 = 0.32 → 3200
    expect(result.liquidity.cashRatio).toBe(3200n);
  });

  it('computes profitability ratios', () => {
    const { result } = computeFinancialRatios(baseInput);

    // Gross margin: 800,000 / 2,000,000 = 0.4 → 4000
    expect(result.profitability.grossMargin).toBe(4000n);
    // Operating margin: 300,000 / 2,000,000 = 0.15 → 1500
    expect(result.profitability.operatingMargin).toBe(1500n);
    // Net margin: 200,000 / 2,000,000 = 0.1 → 1000
    expect(result.profitability.netMargin).toBe(1000n);
    // ROA: 200,000 / 1,000,000 = 0.2 → 2000
    expect(result.profitability.returnOnAssets).toBe(2000n);
    // ROE: 200,000 / 600,000 = 0.3333 → 3333
    expect(result.profitability.returnOnEquity).toBe(3333n);
    // ROCE: 300,000 / (1,000,000 - 250,000) = 0.4 → 4000
    expect(result.profitability.returnOnCapitalEmployed).toBe(4000n);
  });

  it('computes leverage ratios', () => {
    const { result } = computeFinancialRatios(baseInput);

    // D/E: 400,000 / 600,000 = 0.6667 → 6666
    expect(result.leverage.debtToEquity).toBe(6666n);
    // Interest coverage: 300,000 / 50,000 = 6.0 → 60000
    expect(result.leverage.interestCoverage).toBe(60000n);
    // DSCR: (300,000 + 100,000) / 50,000 = 8.0 → 80000
    expect(result.leverage.debtServiceCoverage).toBe(80000n);
  });

  it('computes efficiency ratios in days', () => {
    const { result } = computeFinancialRatios(baseInput);

    // Receivable days: (120,000 × 365) / 2,000,000 = 21
    expect(result.efficiency.receivableDays).toBe(21n);
    // Payable days: (80,000 × 365) / 1,200,000 = 24
    expect(result.efficiency.payableDays).toBe(24n);
    // Inventory days: (100,000 × 365) / 1,200,000 = 30
    expect(result.efficiency.inventoryDays).toBe(30n);
    // CCC: 21 + 30 - 24 = 27
    expect(result.efficiency.cashConversionCycle).toBe(27n);
  });

  it('computes Altman Z-Score', () => {
    const { result } = computeFinancialRatios(baseInput);

    // Z-Score should be non-null for valid inputs
    expect(result.altmanZScore).not.toBeNull();
    // With these inputs, Z should be well above 2.99 (safe zone)
    // Z ≈ 1.2×(250k/1M) + 1.4×(600k/1M) + 3.3×(300k/1M) + 0.6×(600k/400k) + 1.0×(2M/1M)
    // ≈ 1.2×0.25 + 1.4×0.6 + 3.3×0.3 + 0.6×1.5 + 1.0×2.0
    // ≈ 0.3 + 0.84 + 0.99 + 0.9 + 2.0 = 5.03 → ~50300 in basis points
    expect(result.altmanZScore!).toBeGreaterThan(40000n); // Z > 4.0
  });

  it('handles zero denominators gracefully', () => {
    const zeroInput: RatioInput = {
      ...baseInput,
      currentLiabilities: 0n,
      revenue: 0n,
      totalEquity: 0n,
      interestExpense: 0n,
      costOfSales: 0n,
    };

    const { result } = computeFinancialRatios(zeroInput);

    expect(result.liquidity.currentRatio).toBe(0n);
    expect(result.profitability.grossMargin).toBe(0n);
    expect(result.profitability.returnOnEquity).toBe(0n);
    expect(result.leverage.interestCoverage).toBe(0n);
    expect(result.efficiency.receivableDays).toBe(0n);
    expect(result.efficiency.payableDays).toBe(0n);
  });

  it('handles negative working capital (CCC can be negative)', () => {
    const negWcInput: RatioInput = {
      ...baseInput,
      currentAssets: 100_000n,
      currentLiabilities: 300_000n,
      tradePayables: 200_000n,
      tradeReceivables: 30_000n,
      inventory: 20_000n,
    };

    const { result } = computeFinancialRatios(negWcInput);

    // CCC should be negative (company collects fast, pays slow)
    expect(result.efficiency.cashConversionCycle).toBeLessThan(0n);
  });

  it('uses 365 days when daysInPeriod not specified', () => {
    const { result } = computeFinancialRatios({ ...baseInput, daysInPeriod: undefined });

    // Should produce same result as explicit 365
    const { result: result365 } = computeFinancialRatios(baseInput);
    expect(result.efficiency.receivableDays).toBe(result365.efficiency.receivableDays);
  });

  it('provides audit explanation', () => {
    const calc = computeFinancialRatios(baseInput);
    expect(calc.explanation).toContain('Financial ratios');
    expect(calc.explanation).toContain('current=');
    expect(calc.explanation).toContain('ROE=');
    expect(calc.explanation).toContain('D/E=');
    expect(calc.explanation).toContain('CCC=');
    expect(calc.explanation).toContain('Z-score=');
  });
});
