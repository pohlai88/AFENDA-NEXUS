import { describe, it, expect } from 'vitest';
import {
  computeParallelLedgerAdjustments,
  type ParallelLedgerInput,
  type LedgerMappingRule,
  type ParallelLedgerEntry,
} from '../parallel-ledger.js';

const makeEntry = (overrides: Partial<ParallelLedgerEntry> = {}): ParallelLedgerEntry => ({
  journalId: 'JE-001',
  accountCode: '1500',
  amount: 1_000_000n,
  isDebit: true,
  ledgerPurpose: 'PRIMARY',
  periodId: '2025-12',
  description: 'PPE Depreciation',
  ...overrides,
});

const makeRule = (overrides: Partial<LedgerMappingRule> = {}): LedgerMappingRule => ({
  ruleId: 'R-001',
  sourceAccountCode: '1500',
  targetAccountCode: '1510',
  sourceLedgerPurpose: 'PRIMARY',
  targetLedgerPurpose: 'STATUTORY',
  adjustmentType: 'TIMING',
  adjustmentBps: 2000, // 20%
  description: 'IFRS depreciation adjustment',
  ...overrides,
});

describe('computeParallelLedgerAdjustments', () => {
  it('generates balanced adjustment entries', () => {
    const input: ParallelLedgerInput = {
      sourceEntries: [makeEntry()],
      mappingRules: [makeRule()],
      targetLedgerPurpose: 'STATUTORY',
    };

    const { result } = computeParallelLedgerAdjustments(input);

    expect(result.isBalanced).toBe(true);
    expect(result.adjustmentEntries).toHaveLength(2); // debit + credit
    expect(result.totalDebitAdjustments).toBe(result.totalCreditAdjustments);
  });

  it('computes adjustment amount from basis points', () => {
    const input: ParallelLedgerInput = {
      sourceEntries: [makeEntry({ amount: 1_000_000n })],
      mappingRules: [makeRule({ adjustmentBps: 2000 })], // 20%
      targetLedgerPurpose: 'STATUTORY',
    };

    const { result } = computeParallelLedgerAdjustments(input);

    // 1,000,000 × 20% = 200,000
    expect(result.adjustmentEntries[0]!.amount).toBe(200_000n);
  });

  it('tracks unmapped entries', () => {
    const input: ParallelLedgerInput = {
      sourceEntries: [
        makeEntry({ accountCode: '1500' }),
        makeEntry({ accountCode: '9999' }), // no rule for this
      ],
      mappingRules: [makeRule({ sourceAccountCode: '1500' })],
      targetLedgerPurpose: 'STATUTORY',
    };

    const { result } = computeParallelLedgerAdjustments(input);

    expect(result.unmappedEntries).toBe(1);
  });

  it('applies multiple rules to same entry', () => {
    const input: ParallelLedgerInput = {
      sourceEntries: [makeEntry()],
      mappingRules: [
        makeRule({ ruleId: 'R-001', adjustmentBps: 1000 }),
        makeRule({ ruleId: 'R-002', targetAccountCode: '1520', adjustmentBps: 500 }),
      ],
      targetLedgerPurpose: 'STATUTORY',
    };

    const { result } = computeParallelLedgerAdjustments(input);

    // 2 rules × 2 entries each = 4
    expect(result.adjustmentEntries).toHaveLength(4);
    expect(result.ruleApplicationCount['R-001']).toBe(1);
    expect(result.ruleApplicationCount['R-002']).toBe(1);
  });

  it('skips rules for wrong target ledger', () => {
    const input: ParallelLedgerInput = {
      sourceEntries: [makeEntry()],
      mappingRules: [makeRule({ targetLedgerPurpose: 'TAX' })],
      targetLedgerPurpose: 'STATUTORY',
    };

    const { result } = computeParallelLedgerAdjustments(input);

    expect(result.adjustmentEntries).toHaveLength(0);
    expect(result.unmappedEntries).toBe(1);
  });

  it('handles 100% adjustment', () => {
    const input: ParallelLedgerInput = {
      sourceEntries: [makeEntry({ amount: 500_000n })],
      mappingRules: [makeRule({ adjustmentBps: 10000 })], // 100%
      targetLedgerPurpose: 'STATUTORY',
    };

    const { result } = computeParallelLedgerAdjustments(input);

    expect(result.adjustmentEntries[0]!.amount).toBe(500_000n);
  });

  it('skips zero adjustments', () => {
    const input: ParallelLedgerInput = {
      sourceEntries: [makeEntry({ amount: 500_000n })],
      mappingRules: [makeRule({ adjustmentBps: 0 })],
      targetLedgerPurpose: 'STATUTORY',
    };

    const { result } = computeParallelLedgerAdjustments(input);

    expect(result.adjustmentEntries).toHaveLength(0);
  });

  it('throws on empty source entries', () => {
    expect(() =>
      computeParallelLedgerAdjustments({
        sourceEntries: [],
        mappingRules: [makeRule()],
        targetLedgerPurpose: 'STATUTORY',
      })
    ).toThrow('At least one source entry');
  });

  it('provides audit explanation', () => {
    const calc = computeParallelLedgerAdjustments({
      sourceEntries: [makeEntry()],
      mappingRules: [makeRule()],
      targetLedgerPurpose: 'STATUTORY',
    });

    expect(calc.explanation).toContain('Parallel ledger');
    expect(calc.explanation).toContain('STATUTORY');
    expect(calc.explanation).toContain('balanced');
  });

  it('handles TAX ledger adjustments', () => {
    const input: ParallelLedgerInput = {
      sourceEntries: [makeEntry()],
      mappingRules: [makeRule({ targetLedgerPurpose: 'TAX', adjustmentBps: 5000 })],
      targetLedgerPurpose: 'TAX',
    };

    const { result } = computeParallelLedgerAdjustments(input);

    expect(result.targetLedgerPurpose).toBe('TAX');
    expect(result.adjustmentEntries[0]!.amount).toBe(500_000n);
  });
});
