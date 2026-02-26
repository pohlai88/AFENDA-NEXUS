import { describe, it, expect } from 'vitest';
import {
  validatePaymentInstruction,
  validatePaymentInstructions,
} from '../validate-payment-instruction.js';

describe('validatePaymentInstruction()', () => {
  const valid = {
    paymentId: 'PAY-001',
    amount: 10000n,
    currencyCode: 'USD',
    creditorName: 'Supplier A',
    creditorIban: 'DE89370400440532013000',
    creditorBic: 'COBADEFFXXX',
  };

  it('returns no errors for valid instruction', () => {
    expect(validatePaymentInstruction(valid, 0)).toHaveLength(0);
  });

  it('rejects empty paymentId', () => {
    const errors = validatePaymentInstruction({ ...valid, paymentId: '' }, 0);
    expect(errors).toHaveLength(1);
    expect(errors[0]!.field).toContain('paymentId');
  });

  it('rejects zero amount', () => {
    const errors = validatePaymentInstruction({ ...valid, amount: 0n }, 0);
    expect(errors).toHaveLength(1);
    expect(errors[0]!.field).toContain('amount');
  });

  it('rejects negative amount', () => {
    const errors = validatePaymentInstruction({ ...valid, amount: -100n }, 0);
    expect(errors).toHaveLength(1);
    expect(errors[0]!.message).toContain('positive');
  });

  it('rejects invalid currency code', () => {
    const errors = validatePaymentInstruction({ ...valid, currencyCode: 'US' }, 0);
    expect(errors).toHaveLength(1);
    expect(errors[0]!.message).toContain('3-letter');
  });

  it('rejects empty creditorName', () => {
    const errors = validatePaymentInstruction({ ...valid, creditorName: '' }, 0);
    expect(errors).toHaveLength(1);
    expect(errors[0]!.field).toContain('creditorName');
  });

  it('rejects invalid IBAN format', () => {
    const errors = validatePaymentInstruction({ ...valid, creditorIban: '12345' }, 0);
    expect(errors).toHaveLength(1);
    expect(errors[0]!.message).toContain('Iban');
  });

  it('accepts valid IBAN with spaces', () => {
    const errors = validatePaymentInstruction(
      { ...valid, creditorIban: 'DE89 3704 0044 0532 0130 00' },
      0
    );
    expect(errors).toHaveLength(0);
  });

  it('rejects invalid BIC format', () => {
    const errors = validatePaymentInstruction({ ...valid, creditorBic: 'SHORT' }, 0);
    expect(errors).toHaveLength(1);
    expect(errors[0]!.message).toContain('SWIFT');
  });

  it('accumulates multiple errors', () => {
    const errors = validatePaymentInstruction(
      { paymentId: '', amount: -1n, currencyCode: '', creditorName: '' },
      0
    );
    expect(errors.length).toBeGreaterThanOrEqual(4);
  });
});

describe('validatePaymentInstructions()', () => {
  it('rejects empty array', () => {
    const errors = validatePaymentInstructions([]);
    expect(errors).toHaveLength(1);
    expect(errors[0]!.message).toContain('At least one');
  });

  it('validates all instructions and returns combined errors', () => {
    const errors = validatePaymentInstructions([
      { paymentId: 'P1', amount: 100n, currencyCode: 'EUR', creditorName: 'A' },
      { paymentId: '', amount: 0n, currencyCode: 'X', creditorName: '' },
    ]);
    // Second instruction has 4 errors (paymentId, amount, currency, creditorName)
    expect(errors.length).toBeGreaterThanOrEqual(4);
    expect(errors.every((e) => e.field.startsWith('instructions[1]'))).toBe(true);
  });
});
