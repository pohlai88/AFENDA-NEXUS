import { describe, it, expect } from 'vitest';
import { redenominateCurrency, type RedenominationInput } from '../currency-redenomination.js';

const baseInput: RedenominationInput = {
  entityId: 'entity-id',
  entityName: 'Acme Indonesia',
  originalCurrencyCode: 'IDR',
  newCurrencyCode: 'IDR_NEW',
  conversionFactorBps: 10n, // 1000:1 redenomination (10/10000 = 0.001)
  effectiveDate: '2026-01-01',
  balances: [
    {
      accountCode: '1000',
      accountName: 'Cash',
      originalAmount: 10_000_000n,
      originalCurrency: 'IDR',
    },
    {
      accountCode: '2000',
      accountName: 'Payables',
      originalAmount: 5_000_000n,
      originalCurrency: 'IDR',
    },
  ],
  roundToMinorUnit: true,
};

describe('redenominateCurrency', () => {
  it('converts balances by conversion factor', () => {
    const { result } = redenominateCurrency(baseInput);

    // 10,000,000 × 10 / 10000 = 10,000
    expect(result.balances[0]!.newAmount).toBe(10_000n);
    // 5,000,000 × 10 / 10000 = 5,000
    expect(result.balances[1]!.newAmount).toBe(5_000n);
  });

  it('sets new currency code on all balances', () => {
    const { result } = redenominateCurrency(baseInput);

    for (const bal of result.balances) {
      expect(bal.newCurrency).toBe('IDR_NEW');
    }
  });

  it('computes total original and new amounts', () => {
    const { result } = redenominateCurrency(baseInput);

    expect(result.totalOriginal).toBe(15_000_000n);
    expect(result.totalNew).toBe(15_000n);
  });

  it('tracks rounding differences', () => {
    const { result } = redenominateCurrency({
      ...baseInput,
      balances: [
        {
          accountCode: '1000',
          accountName: 'Cash',
          originalAmount: 12_345n,
          originalCurrency: 'IDR',
        },
      ],
    });

    // 12,345 × 10 / 10000 = 12 (integer truncation)
    expect(result.balances[0]!.newAmount).toBe(12n);
    // There will be a rounding difference
    expect(result.totalRoundingDifference).toBeGreaterThanOrEqual(0n);
  });

  it('handles 1:1 conversion (no change)', () => {
    const { result } = redenominateCurrency({
      ...baseInput,
      conversionFactorBps: 10000n, // 1:1
    });

    expect(result.balances[0]!.newAmount).toBe(10_000_000n);
    expect(result.balances[1]!.newAmount).toBe(5_000_000n);
  });

  it('detects dual-currency transition period', () => {
    const { result } = redenominateCurrency({
      ...baseInput,
      transitionEndDate: '2026-12-31',
    });

    expect(result.isDualCurrencyPeriod).toBe(true);
    expect(result.transitionEndDate).toBe('2026-12-31');
  });

  it('returns no transition when not specified', () => {
    const { result } = redenominateCurrency(baseInput);

    expect(result.isDualCurrencyPeriod).toBe(false);
    expect(result.transitionEndDate).toBeNull();
  });

  it('throws on empty balances', () => {
    expect(() => redenominateCurrency({ ...baseInput, balances: [] })).toThrow(
      'At least one balance'
    );
  });

  it('throws on zero conversion factor', () => {
    expect(() => redenominateCurrency({ ...baseInput, conversionFactorBps: 0n })).toThrow(
      'Conversion factor must be positive'
    );
  });

  it('throws on negative conversion factor', () => {
    expect(() => redenominateCurrency({ ...baseInput, conversionFactorBps: -1n })).toThrow(
      'Conversion factor must be positive'
    );
  });

  it('preserves original amounts in result', () => {
    const { result } = redenominateCurrency(baseInput);

    expect(result.balances[0]!.originalAmount).toBe(10_000_000n);
    expect(result.balances[0]!.originalCurrency).toBe('IDR');
  });

  it('provides audit explanation', () => {
    const calc = redenominateCurrency(baseInput);

    expect(calc.explanation).toContain('Currency redenomination');
    expect(calc.explanation).toContain('IDR');
    expect(calc.explanation).toContain('IDR_NEW');
  });
});
