import { describe, it, expect } from 'vitest';
import { validateOpeningBalances, type OpeningBalanceInput } from '../opening-balance-import.js';

const baseInput: OpeningBalanceInput = {
  ledgerId: 'ledger-1',
  periodId: 'period-1',
  postingDate: '2026-01-01',
  retainedEarningsAccountCode: '3100',
  lines: [
    { accountCode: '1000', accountName: 'Cash', debit: 500_000n, credit: 0n },
    { accountCode: '1100', accountName: 'Receivables', debit: 200_000n, credit: 0n },
    { accountCode: '2000', accountName: 'Payables', debit: 0n, credit: 300_000n },
    { accountCode: '3000', accountName: 'Equity', debit: 0n, credit: 400_000n },
  ],
};

describe('validateOpeningBalances', () => {
  it('validates a balanced trial balance', () => {
    const { result } = validateOpeningBalances(baseInput);

    expect(result.isBalanced).toBe(true);
    expect(result.totalDebits).toBe(700_000n);
    expect(result.totalCredits).toBe(700_000n);
    expect(result.autoBalanceAmount).toBe(0n);
    expect(result.autoBalanceSide).toBe('NONE');
    expect(result.lineCount).toBe(4);
    expect(result.warnings).toHaveLength(0);
  });

  it('auto-balances to retained earnings when debits > credits', () => {
    const unbalanced: OpeningBalanceInput = {
      ...baseInput,
      lines: [
        { accountCode: '1000', accountName: 'Cash', debit: 500_000n, credit: 0n },
        { accountCode: '2000', accountName: 'Payables', debit: 0n, credit: 300_000n },
      ],
    };

    const { result } = validateOpeningBalances(unbalanced);

    expect(result.isBalanced).toBe(true); // balanced after auto-entry
    expect(result.autoBalanceAmount).toBe(200_000n);
    expect(result.autoBalanceSide).toBe('CREDIT');
    // Should have added a retained earnings line
    const autoLine = result.journalLines.find((l) => l.isAutoBalance);
    expect(autoLine).toBeDefined();
    expect(autoLine!.accountCode).toBe('3100');
    expect(autoLine!.credit).toBe(200_000n);
    expect(result.warnings.some((w) => w.includes('Auto-balance'))).toBe(true);
  });

  it('auto-balances when credits > debits', () => {
    const unbalanced: OpeningBalanceInput = {
      ...baseInput,
      lines: [
        { accountCode: '1000', accountName: 'Cash', debit: 100_000n, credit: 0n },
        { accountCode: '2000', accountName: 'Payables', debit: 0n, credit: 300_000n },
      ],
    };

    const { result } = validateOpeningBalances(unbalanced);

    expect(result.autoBalanceAmount).toBe(200_000n);
    expect(result.autoBalanceSide).toBe('DEBIT');
    const autoLine = result.journalLines.find((l) => l.isAutoBalance);
    expect(autoLine!.debit).toBe(200_000n);
  });

  it('skips zero-amount lines with warning', () => {
    const withZero: OpeningBalanceInput = {
      ...baseInput,
      lines: [
        ...baseInput.lines,
        { accountCode: '9999', accountName: 'Empty', debit: 0n, credit: 0n },
      ],
    };

    const { result } = validateOpeningBalances(withZero);

    expect(result.lineCount).toBe(4); // zero line skipped
    expect(result.warnings.some((w) => w.includes('Skipped zero'))).toBe(true);
  });

  it('warns on duplicate account codes', () => {
    const withDup: OpeningBalanceInput = {
      ...baseInput,
      lines: [
        { accountCode: '1000', accountName: 'Cash - Bank A', debit: 300_000n, credit: 0n },
        { accountCode: '1000', accountName: 'Cash - Bank B', debit: 200_000n, credit: 0n },
        { accountCode: '2000', accountName: 'Payables', debit: 0n, credit: 500_000n },
      ],
    };

    const { result } = validateOpeningBalances(withDup);

    expect(result.warnings.some((w) => w.includes('Duplicate account code'))).toBe(true);
    expect(result.lineCount).toBe(3);
  });

  it('preserves source system references', () => {
    const withRef: OpeningBalanceInput = {
      ...baseInput,
      lines: [
        {
          accountCode: '1000',
          accountName: 'Cash',
          debit: 500_000n,
          credit: 0n,
          sourceSystemRef: 'SAP-GL-1000',
        },
        {
          accountCode: '2000',
          accountName: 'Payables',
          debit: 0n,
          credit: 500_000n,
          sourceSystemRef: 'SAP-GL-2000',
        },
      ],
    };

    const { result } = validateOpeningBalances(withRef);

    expect(result.journalLines[0]!.sourceSystemRef).toBe('SAP-GL-1000');
    expect(result.journalLines[1]!.sourceSystemRef).toBe('SAP-GL-2000');
  });

  it('throws on both debit and credit non-zero', () => {
    const invalid: OpeningBalanceInput = {
      ...baseInput,
      lines: [{ accountCode: '1000', accountName: 'Cash', debit: 100n, credit: 50n }],
    };

    expect(() => validateOpeningBalances(invalid)).toThrow('both debit');
  });

  it('throws on negative amounts', () => {
    const invalid: OpeningBalanceInput = {
      ...baseInput,
      lines: [{ accountCode: '1000', accountName: 'Cash', debit: -100n, credit: 0n }],
    };

    expect(() => validateOpeningBalances(invalid)).toThrow('negative amount');
  });

  it('throws on empty lines', () => {
    expect(() => validateOpeningBalances({ ...baseInput, lines: [] })).toThrow('at least one line');
  });

  it('provides audit explanation', () => {
    const calc = validateOpeningBalances(baseInput);
    expect(calc.explanation).toContain('Opening balance');
    expect(calc.explanation).toContain('4 lines');
    expect(calc.inputs.sourceSystem).toBe('manual');
  });

  it('includes source system in inputs', () => {
    const calc = validateOpeningBalances({
      ...baseInput,
      sourceSystem: 'SAP ECC 6.0',
    });
    expect(calc.inputs.sourceSystem).toBe('SAP ECC 6.0');
  });
});
