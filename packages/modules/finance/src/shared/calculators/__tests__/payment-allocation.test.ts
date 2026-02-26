import { describe, it, expect } from 'vitest';
import { computePaymentAllocation } from '../payment-allocation.js';

describe('computePaymentAllocation()', () => {
  it('returns PAID when payment completes the invoice', () => {
    const result = computePaymentAllocation({
      currentPaidAmount: 5000n,
      paymentAmount: 5000n,
      totalAmount: 10000n,
    });
    expect(result.newPaidAmount).toBe(10000n);
    expect(result.status).toBe('PAID');
  });

  it('returns PARTIALLY_PAID for partial payment', () => {
    const result = computePaymentAllocation({
      currentPaidAmount: 0n,
      paymentAmount: 3000n,
      totalAmount: 10000n,
    });
    expect(result.newPaidAmount).toBe(3000n);
    expect(result.status).toBe('PARTIALLY_PAID');
  });

  it('returns PAID when first payment equals total', () => {
    const result = computePaymentAllocation({
      currentPaidAmount: 0n,
      paymentAmount: 10000n,
      totalAmount: 10000n,
    });
    expect(result.newPaidAmount).toBe(10000n);
    expect(result.status).toBe('PAID');
  });

  it('throws when payment exceeds total', () => {
    expect(() =>
      computePaymentAllocation({
        currentPaidAmount: 8000n,
        paymentAmount: 5000n,
        totalAmount: 10000n,
      })
    ).toThrow('exceed total');
  });

  it('throws when payment amount is zero', () => {
    expect(() =>
      computePaymentAllocation({
        currentPaidAmount: 0n,
        paymentAmount: 0n,
        totalAmount: 10000n,
      })
    ).toThrow('positive');
  });

  it('throws when payment amount is negative', () => {
    expect(() =>
      computePaymentAllocation({
        currentPaidAmount: 0n,
        paymentAmount: -100n,
        totalAmount: 10000n,
      })
    ).toThrow('positive');
  });

  it('handles multiple partial payments leading to PAID', () => {
    const first = computePaymentAllocation({
      currentPaidAmount: 0n,
      paymentAmount: 4000n,
      totalAmount: 10000n,
    });
    expect(first.status).toBe('PARTIALLY_PAID');

    const second = computePaymentAllocation({
      currentPaidAmount: first.newPaidAmount,
      paymentAmount: 6000n,
      totalAmount: 10000n,
    });
    expect(second.status).toBe('PAID');
    expect(second.newPaidAmount).toBe(10000n);
  });
});
