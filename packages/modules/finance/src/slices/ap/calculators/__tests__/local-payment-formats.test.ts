import { describe, it, expect } from 'vitest';
import {
  buildSwiftMt101,
  buildDuitNow,
  buildSgFast,
  buildIdRtgs,
  buildThPromptPay,
  type LocalPaymentInstruction,
} from '../local-payment-formats.js';

const sampleInstruction: LocalPaymentInstruction = {
  paymentId: 'PAY-001',
  debtorName: 'Acme Corp',
  debtorAccountNumber: '1234567890',
  debtorBankCode: 'MAYBANK',
  creditorName: 'Supplier One',
  creditorAccountNumber: '0987654321',
  creditorBankCode: 'CIMB',
  amount: 1_500_000n, // 15,000.00
  currencyCode: 'MYR',
  remittanceInfo: 'Invoice INV-2025-001',
  executionDate: new Date('2025-12-15'),
};

describe('buildSwiftMt101', () => {
  it('generates SWIFT MT101 message', () => {
    const result = buildSwiftMt101('MSG-001', 'MAYBBIC', 'CIMBBIC', [sampleInstruction]);

    expect(result.format).toBe('SWIFT_MT101');
    expect(result.numberOfTransactions).toBe(1);
    expect(result.controlSum).toBe(1_500_000n);
    expect(result.content).toContain('F01');
    expect(result.content).toContain('PAY-001');
    expect(result.content).toContain('Supplier One');
  });

  it('handles multiple instructions', () => {
    const instr2: LocalPaymentInstruction = {
      ...sampleInstruction,
      paymentId: 'PAY-002',
      creditorName: 'Supplier Two',
      amount: 500_000n,
    };
    const result = buildSwiftMt101('MSG-002', 'MYBIC', 'RCVBIC', [sampleInstruction, instr2]);

    expect(result.numberOfTransactions).toBe(2);
    expect(result.controlSum).toBe(2_000_000n);
  });
});

describe('buildDuitNow', () => {
  it('generates DuitNow payment file', () => {
    const result = buildDuitNow('DN-001', [sampleInstruction]);

    expect(result.format).toBe('MY_DUITNOW');
    expect(result.numberOfTransactions).toBe(1);
    expect(result.controlSum).toBe(1_500_000n);
    expect(result.content).toContain('H|DN-001');
    expect(result.content).toContain('D|PAY-001');
    expect(result.content).toContain('T|1|');
  });
});

describe('buildSgFast', () => {
  it('generates SG FAST payment file', () => {
    const sgInstruction: LocalPaymentInstruction = {
      ...sampleInstruction,
      currencyCode: 'SGD',
    };
    const result = buildSgFast('FAST-001', [sgInstruction]);

    expect(result.format).toBe('SG_FAST');
    expect(result.numberOfTransactions).toBe(1);
    expect(result.content).toContain('01|FAST-001|FAST');
    expect(result.content).toContain('02|PAY-001');
    expect(result.content).toContain('99|1|');
  });
});

describe('buildIdRtgs', () => {
  it('generates Indonesia RTGS payment file', () => {
    const idInstruction: LocalPaymentInstruction = {
      ...sampleInstruction,
      currencyCode: 'IDR',
      amount: 150_000_000n,
    };
    const result = buildIdRtgs('RTGS-001', [idInstruction]);

    expect(result.format).toBe('ID_RTGS');
    expect(result.numberOfTransactions).toBe(1);
    expect(result.controlSum).toBe(150_000_000n);
    expect(result.content).toContain('HDR|RTGS-001|RTGS');
    expect(result.content).toContain('TXN|PAY-001');
    expect(result.content).toContain('TRL|1|');
  });
});

describe('buildThPromptPay', () => {
  it('generates Thailand PromptPay payment file', () => {
    const thInstruction: LocalPaymentInstruction = {
      ...sampleInstruction,
      currencyCode: 'THB',
      creditorIdType: 'MOBILE',
      creditorIdNumber: '0812345678',
    };
    const result = buildThPromptPay('PP-001', [thInstruction]);

    expect(result.format).toBe('TH_PROMPTPAY');
    expect(result.numberOfTransactions).toBe(1);
    expect(result.content).toContain('H|PP-001|PROMPTPAY');
    expect(result.content).toContain('P|PAY-001|MOBILE|0812345678');
    expect(result.content).toContain('T|1|');
  });
});
