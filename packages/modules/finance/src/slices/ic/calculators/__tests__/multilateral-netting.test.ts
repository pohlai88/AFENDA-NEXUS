import { describe, it, expect } from 'vitest';
import { computeMultilateralNetting, type IcNettingInput } from '../multilateral-netting.js';

const baseInput: IcNettingInput = {
  nettingDate: '2025-12-31',
  currencyCode: 'USD',
  pairs: [
    { fromEntityId: 'A', toEntityId: 'B', grossAmount: 1_000_000n, currencyCode: 'USD' },
    { fromEntityId: 'B', toEntityId: 'C', grossAmount: 600_000n, currencyCode: 'USD' },
    { fromEntityId: 'C', toEntityId: 'A', grossAmount: 400_000n, currencyCode: 'USD' },
  ],
};

describe('computeMultilateralNetting', () => {
  it('computes net positions for 3 entities', () => {
    const { result } = computeMultilateralNetting(baseInput);

    expect(result.entityCount).toBe(3);
    expect(result.grossPairCount).toBe(3);

    // A: pays B 1M, receives from C 400K → net = 400K - 1M = -600K → PAY 600K
    const a = result.settlements.find((s) => s.entityId === 'A');
    expect(a?.settlementDirection).toBe('PAY');
    expect(a?.settlementAmount).toBe(600_000n);

    // B: receives from A 1M, pays C 600K → net = 1M - 600K = 400K → RECEIVE 400K
    const b = result.settlements.find((s) => s.entityId === 'B');
    expect(b?.settlementDirection).toBe('RECEIVE');
    expect(b?.settlementAmount).toBe(400_000n);

    // C: receives from B 600K, pays A 400K → net = 600K - 400K = 200K → RECEIVE 200K
    const c = result.settlements.find((s) => s.entityId === 'C');
    expect(c?.settlementDirection).toBe('RECEIVE');
    expect(c?.settlementAmount).toBe(200_000n);
  });

  it('reduces total gross payments to net', () => {
    const { result } = computeMultilateralNetting(baseInput);

    expect(result.totalGrossPayments).toBe(2_000_000n);
    expect(result.totalNetPayments).toBe(600_000n);
    expect(result.paymentReduction).toBe(1_400_000n);
  });

  it('computes reduction percentage', () => {
    const { result } = computeMultilateralNetting(baseInput);

    // 1,400,000 / 2,000,000 = 0.7 → 7000 bps
    expect(result.reductionPctBps).toBe(7000n);
  });

  it('handles balanced bilateral pair (net zero)', () => {
    const { result } = computeMultilateralNetting({
      nettingDate: '2025-12-31',
      currencyCode: 'USD',
      pairs: [
        { fromEntityId: 'A', toEntityId: 'B', grossAmount: 500_000n, currencyCode: 'USD' },
        { fromEntityId: 'B', toEntityId: 'A', grossAmount: 500_000n, currencyCode: 'USD' },
      ],
    });

    for (const s of result.settlements) {
      expect(s.settlementDirection).toBe('ZERO');
      expect(s.settlementAmount).toBe(0n);
    }
    expect(result.totalNetPayments).toBe(0n);
  });

  it('handles single pair (no netting benefit)', () => {
    const { result } = computeMultilateralNetting({
      nettingDate: '2025-12-31',
      currencyCode: 'USD',
      pairs: [{ fromEntityId: 'A', toEntityId: 'B', grossAmount: 1_000_000n, currencyCode: 'USD' }],
    });

    expect(result.entityCount).toBe(2);
    expect(result.totalGrossPayments).toBe(1_000_000n);
    expect(result.totalNetPayments).toBe(1_000_000n);
    expect(result.paymentReduction).toBe(0n);
  });

  it('counts net payment entities correctly', () => {
    const { result } = computeMultilateralNetting(baseInput);

    // All 3 entities have non-zero settlement
    expect(result.netPaymentCount).toBe(3);
  });

  it('throws on empty pairs', () => {
    expect(() =>
      computeMultilateralNetting({
        nettingDate: '2025-12-31',
        currencyCode: 'USD',
        pairs: [],
      })
    ).toThrow('At least one IC pair');
  });

  it('provides audit explanation', () => {
    const calc = computeMultilateralNetting(baseInput);

    expect(calc.explanation).toContain('Multilateral netting');
    expect(calc.explanation).toContain('3 entities');
    expect(calc.explanation).toContain('reduction');
  });

  it('handles 4+ entity complex netting', () => {
    const { result } = computeMultilateralNetting({
      nettingDate: '2025-12-31',
      currencyCode: 'USD',
      pairs: [
        { fromEntityId: 'A', toEntityId: 'B', grossAmount: 100n, currencyCode: 'USD' },
        { fromEntityId: 'B', toEntityId: 'C', grossAmount: 200n, currencyCode: 'USD' },
        { fromEntityId: 'C', toEntityId: 'D', grossAmount: 300n, currencyCode: 'USD' },
        { fromEntityId: 'D', toEntityId: 'A', grossAmount: 150n, currencyCode: 'USD' },
        { fromEntityId: 'A', toEntityId: 'C', grossAmount: 50n, currencyCode: 'USD' },
      ],
    });

    expect(result.entityCount).toBe(4);
    expect(result.totalGrossPayments).toBe(800n);
    expect(result.totalNetPayments).toBeLessThan(800n);
  });
});
