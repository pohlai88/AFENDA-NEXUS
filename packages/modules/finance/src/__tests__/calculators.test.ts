import { describe, it, expect } from 'vitest';
import { money } from '@afenda/core';
import { validateJournalBalance } from '../slices/gl/calculators/journal-balance.js';
import {
  computeTrialBalance,
  classifyByAccountType,
} from '../slices/gl/calculators/trial-balance.js';
import { convertAmountPrecise, computeGainLoss } from '../slices/fx/calculators/fx-convert.js';
import {
  classifyBalanceSheet,
  classifyIncomeStatement,
  classifyCashFlow,
} from '../slices/reporting/calculators/report-classifier.js';
import { normalBalanceFor } from '../slices/gl/entities/account.js';

describe('validateJournalBalance', () => {
  it('returns balanced=true when debits equal credits', () => {
    const result = validateJournalBalance([
      { debit: money(10000n, 'USD'), credit: money(0n, 'USD') },
      { debit: money(0n, 'USD'), credit: money(10000n, 'USD') },
    ]);
    expect(result.result.balanced).toBe(true);
    expect(result.result.totalDebits).toBe(10000n);
    expect(result.result.totalCredits).toBe(10000n);
    expect(result.explanation).toContain('balanced');
  });

  it('returns balanced=false when debits != credits', () => {
    const result = validateJournalBalance([
      { debit: money(10000n, 'USD'), credit: money(0n, 'USD') },
      { debit: money(0n, 'USD'), credit: money(5000n, 'USD') },
    ]);
    expect(result.result.balanced).toBe(false);
    expect(result.explanation).toContain('UNBALANCED');
  });

  it('throws on fewer than 2 lines', () => {
    expect(() =>
      validateJournalBalance([{ debit: money(100n, 'USD'), credit: money(0n, 'USD') }])
    ).toThrow('at least 2 lines');
  });

  it('throws on negative debit', () => {
    expect(() =>
      validateJournalBalance([
        { debit: money(-1n, 'USD'), credit: money(0n, 'USD') },
        { debit: money(0n, 'USD'), credit: money(100n, 'USD') },
      ])
    ).toThrow('non-negative');
  });

  it('handles multi-line balanced journal', () => {
    const result = validateJournalBalance([
      { debit: money(5000n, 'USD'), credit: money(0n, 'USD') },
      { debit: money(3000n, 'USD'), credit: money(0n, 'USD') },
      { debit: money(0n, 'USD'), credit: money(8000n, 'USD') },
    ]);
    expect(result.result.balanced).toBe(true);
    expect(result.result.totalDebits).toBe(8000n);
  });
});

describe('computeTrialBalance', () => {
  it('computes balanced trial balance', () => {
    const result = computeTrialBalance(
      [
        {
          accountCode: '1000',
          accountName: 'Cash',
          accountType: 'ASSET',
          debitTotal: money(10000n, 'USD'),
          creditTotal: money(0n, 'USD'),
        },
        {
          accountCode: '2000',
          accountName: 'AP',
          accountType: 'LIABILITY',
          debitTotal: money(0n, 'USD'),
          creditTotal: money(10000n, 'USD'),
        },
      ],
      'USD'
    );
    expect(result.result.isBalanced).toBe(true);
    expect(result.result.rows).toHaveLength(2);
    expect(result.result.rows[0].netBalance.amount).toBe(10000n);
    expect(result.result.rows[1].netBalance.amount).toBe(-10000n);
    expect(result.result.currency).toBe('USD');
  });

  it('detects unbalanced trial balance', () => {
    const result = computeTrialBalance(
      [
        {
          accountCode: '1000',
          accountName: 'Cash',
          accountType: 'ASSET',
          debitTotal: money(10000n, 'USD'),
          creditTotal: money(0n, 'USD'),
        },
        {
          accountCode: '2000',
          accountName: 'AP',
          accountType: 'LIABILITY',
          debitTotal: money(0n, 'USD'),
          creditTotal: money(5000n, 'USD'),
        },
      ],
      'USD'
    );
    expect(result.result.isBalanced).toBe(false);
    expect(result.explanation).toContain('UNBALANCED');
  });
});

describe('classifyByAccountType', () => {
  it('classifies rows by account type', () => {
    const rows = [
      {
        accountCode: '1000',
        accountName: 'Cash',
        accountType: 'ASSET' as const,
        debitTotal: money(10000n, 'USD'),
        creditTotal: money(0n, 'USD'),
        netBalance: money(10000n, 'USD'),
      },
      {
        accountCode: '2000',
        accountName: 'AP',
        accountType: 'LIABILITY' as const,
        debitTotal: money(0n, 'USD'),
        creditTotal: money(5000n, 'USD'),
        netBalance: money(-5000n, 'USD'),
      },
      {
        accountCode: '3000',
        accountName: 'Equity',
        accountType: 'EQUITY' as const,
        debitTotal: money(0n, 'USD'),
        creditTotal: money(3000n, 'USD'),
        netBalance: money(-3000n, 'USD'),
      },
      {
        accountCode: '4000',
        accountName: 'Revenue',
        accountType: 'REVENUE' as const,
        debitTotal: money(0n, 'USD'),
        creditTotal: money(1000n, 'USD'),
        netBalance: money(-1000n, 'USD'),
      },
      {
        accountCode: '5000',
        accountName: 'Expense',
        accountType: 'EXPENSE' as const,
        debitTotal: money(500n, 'USD'),
        creditTotal: money(0n, 'USD'),
        netBalance: money(500n, 'USD'),
      },
    ];
    const classified = classifyByAccountType(rows);
    expect(classified.assets).toHaveLength(1);
    expect(classified.liabilities).toHaveLength(1);
    expect(classified.equity).toHaveLength(1);
    expect(classified.revenue).toHaveLength(1);
    expect(classified.expenses).toHaveLength(1);
  });
});

describe('convertAmountPrecise', () => {
  it('converts with high precision', () => {
    const result = convertAmountPrecise(10000n, 1.3456, 'USD', 'EUR');
    expect(result.result.toAmount).toBe(13456n);
    expect(result.result.fromCurrency).toBe('USD');
    expect(result.result.toCurrency).toBe('EUR');
  });

  it('returns same amount for same currency', () => {
    const result = convertAmountPrecise(10000n, 1.5, 'USD', 'USD');
    expect(result.result.toAmount).toBe(10000n);
    expect(result.result.rate).toBe(1);
  });

  it('throws on negative amount', () => {
    expect(() => convertAmountPrecise(-1n, 1.5, 'USD', 'EUR')).toThrow('non-negative');
  });

  it('throws on zero rate', () => {
    expect(() => convertAmountPrecise(100n, 0, 'USD', 'EUR')).toThrow('finite and > 0');
  });

  it('handles fractional rates correctly', () => {
    // 100 USD at 0.85 EUR/USD = 85 EUR
    const result = convertAmountPrecise(100n, 0.85, 'USD', 'EUR');
    expect(result.result.toAmount).toBe(85n);
  });

  it('handles large amounts without overflow', () => {
    // 1 billion minor units at rate 1.5
    const result = convertAmountPrecise(1_000_000_000n, 1.5, 'USD', 'EUR');
    expect(result.result.toAmount).toBe(1_500_000_000n);
  });
});

describe('computeGainLoss', () => {
  it('computes gain when revalued > original', () => {
    const result = computeGainLoss(10000n, 10500n);
    expect(result.result.isGain).toBe(true);
    expect(result.result.gainLossAmount).toBe(500n);
  });

  it('computes loss when revalued < original', () => {
    const result = computeGainLoss(10000n, 9500n);
    expect(result.result.isGain).toBe(false);
    expect(result.result.gainLossAmount).toBe(500n);
  });

  it('returns zero for no change', () => {
    const result = computeGainLoss(10000n, 10000n);
    expect(result.result.gainLossAmount).toBe(0n);
    expect(result.result.isGain).toBe(true);
  });
});

describe('classifyBalanceSheet', () => {
  it('classifies by account type instead of charAt(0)', () => {
    const rows = [
      {
        accountCode: '1000',
        accountName: 'Cash',
        accountType: 'ASSET' as const,
        netBalance: 10000n,
      },
      {
        accountCode: '2000',
        accountName: 'AP',
        accountType: 'LIABILITY' as const,
        netBalance: -5000n,
      },
      {
        accountCode: '3000',
        accountName: 'Equity',
        accountType: 'EQUITY' as const,
        netBalance: -5000n,
      },
      {
        accountCode: '4000',
        accountName: 'Revenue',
        accountType: 'REVENUE' as const,
        netBalance: -1000n,
      },
    ];
    const result = classifyBalanceSheet(rows, 'USD');
    expect(result.result.assets.rows).toHaveLength(1);
    expect(result.result.liabilities.rows).toHaveLength(1);
    expect(result.result.equity.rows).toHaveLength(1);
    // Revenue is excluded from balance sheet
    expect(result.result.assets.total.amount).toBe(10000n);
    expect(result.result.liabilities.total.amount).toBe(5000n);
    expect(result.result.equity.total.amount).toBe(5000n);
    expect(result.result.isBalanced).toBe(true);
  });

  it('works with non-standard account codes', () => {
    // Account code 9999 is an ASSET — old charAt(0) would miss this
    const rows = [
      {
        accountCode: '9999',
        accountName: 'Special Asset',
        accountType: 'ASSET' as const,
        netBalance: 5000n,
      },
      {
        accountCode: '8888',
        accountName: 'Special Liability',
        accountType: 'LIABILITY' as const,
        netBalance: -5000n,
      },
    ];
    const result = classifyBalanceSheet(rows, 'MYR');
    expect(result.result.assets.rows).toHaveLength(1);
    expect(result.result.assets.rows[0].accountCode).toBe('9999');
    expect(result.result.assets.total.currency).toBe('MYR');
  });
});

describe('classifyIncomeStatement', () => {
  it('classifies revenue and expenses by account type', () => {
    const rows = [
      {
        accountCode: '4000',
        accountName: 'Sales',
        accountType: 'REVENUE' as const,
        netBalance: -50000n,
      },
      {
        accountCode: '5000',
        accountName: 'COGS',
        accountType: 'EXPENSE' as const,
        netBalance: 30000n,
      },
      {
        accountCode: '1000',
        accountName: 'Cash',
        accountType: 'ASSET' as const,
        netBalance: 20000n,
      },
    ];
    const result = classifyIncomeStatement(rows, 'USD');
    expect(result.result.revenue.rows).toHaveLength(1);
    expect(result.result.expenses.rows).toHaveLength(1);
    expect(result.result.netIncome.amount).toBe(50000n - 30000n);
  });
});

describe('classifyCashFlow', () => {
  it('classifies by account type and excludes cash accounts', () => {
    const rows = [
      {
        accountCode: '1000',
        accountName: 'Cash',
        accountType: 'ASSET' as const,
        netBalance: 5000n,
      },
      {
        accountCode: '1200',
        accountName: 'Equipment',
        accountType: 'ASSET' as const,
        netBalance: 10000n,
      },
      {
        accountCode: '2000',
        accountName: 'AP',
        accountType: 'LIABILITY' as const,
        netBalance: -3000n,
      },
      {
        accountCode: '4000',
        accountName: 'Revenue',
        accountType: 'REVENUE' as const,
        netBalance: -8000n,
      },
      {
        accountCode: '5000',
        accountName: 'Expense',
        accountType: 'EXPENSE' as const,
        netBalance: 6000n,
      },
    ];
    const result = classifyCashFlow(rows, 'USD');
    // Cash (1000) excluded
    // Equipment (ASSET) → investing: -10000
    // AP (LIABILITY) → financing: -3000
    // Revenue + Expense (P&L) → operating: -8000 + 6000 = -2000
    expect(result.result.investingActivities.amount).toBe(-10000n);
    expect(result.result.financingActivities.amount).toBe(-3000n);
    expect(result.result.operatingActivities.amount).toBe(-8000n + 6000n);
  });
});

describe('normalBalanceFor', () => {
  it('returns DEBIT for assets', () => expect(normalBalanceFor('ASSET')).toBe('DEBIT'));
  it('returns DEBIT for expenses', () => expect(normalBalanceFor('EXPENSE')).toBe('DEBIT'));
  it('returns CREDIT for liabilities', () => expect(normalBalanceFor('LIABILITY')).toBe('CREDIT'));
  it('returns CREDIT for equity', () => expect(normalBalanceFor('EQUITY')).toBe('CREDIT'));
  it('returns CREDIT for revenue', () => expect(normalBalanceFor('REVENUE')).toBe('CREDIT'));
});
