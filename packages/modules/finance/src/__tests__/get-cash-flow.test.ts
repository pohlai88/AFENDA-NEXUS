import { describe, it, expect, vi } from 'vitest';
import { ok, money } from '@afenda/core';
import type { AccountType } from '../slices/gl/entities/account.js';
import { getCashFlow } from '../slices/reporting/services/get-cash-flow.js';

const LEDGER_ID = 'ledger-1';
const FROM_PERIOD = 'period-1';
const TO_PERIOD = 'period-2';
const CURRENCY = 'USD';

function mockLedgerRepo(baseCurrency = CURRENCY) {
  return {
    findById: vi.fn().mockResolvedValue(ok({ id: LEDGER_ID, baseCurrency })),
    findAll: vi.fn(),
  };
}

function mockBalanceRepo(
  rows: Array<{
    accountCode: string;
    accountName: string;
    accountType: AccountType;
    debit: bigint;
    credit: bigint;
  }>
) {
  return {
    getTrialBalance: vi.fn().mockResolvedValue(
      ok({
        rows: rows.map((r) => ({
          accountCode: r.accountCode,
          accountName: r.accountName,
          accountType: r.accountType,
          debitTotal: money(r.debit, CURRENCY),
          creditTotal: money(r.credit, CURRENCY),
        })),
      })
    ),
    upsertBalances: vi.fn(),
  };
}

describe('getCashFlow', () => {
  it('classifies revenue/expense as operating activities', async () => {
    const balanceRepo = mockBalanceRepo([
      {
        accountCode: '4000',
        accountName: 'Revenue',
        accountType: 'REVENUE' as const,
        debit: 0n,
        credit: 5000n,
      },
      {
        accountCode: '5000',
        accountName: 'COGS',
        accountType: 'EXPENSE' as const,
        debit: 2000n,
        credit: 0n,
      },
    ]);

    const result = await getCashFlow(
      { ledgerId: LEDGER_ID, fromPeriodId: FROM_PERIOD, toPeriodId: TO_PERIOD },
      { balanceRepo, ledgerRepo: mockLedgerRepo() }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Revenue: 0 - 5000 = -5000 (credit net), COGS: 2000 - 0 = 2000
      // Operating = -5000 + 2000 = -3000
      expect(result.value.operatingActivities.amount).toBe(-3000n);
      expect(result.value.investingActivities.amount).toBe(0n);
      expect(result.value.financingActivities.amount).toBe(0n);
      expect(result.value.netCashFlow.amount).toBe(-3000n);
    }
  });

  it('classifies non-cash assets as investing activities', async () => {
    const balanceRepo = mockBalanceRepo([
      {
        accountCode: '1100',
        accountName: 'Accounts Receivable',
        accountType: 'ASSET' as const,
        debit: 3000n,
        credit: 0n,
      },
    ]);

    const result = await getCashFlow(
      { ledgerId: LEDGER_ID, fromPeriodId: FROM_PERIOD, toPeriodId: TO_PERIOD },
      { balanceRepo, ledgerRepo: mockLedgerRepo() }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      // AR debit 3000 → net = 3000, investing = -3000 (asset increase = cash outflow)
      expect(result.value.investingActivities.amount).toBe(-3000n);
    }
  });

  it('classifies liabilities/equity as financing activities', async () => {
    const balanceRepo = mockBalanceRepo([
      {
        accountCode: '2000',
        accountName: 'Accounts Payable',
        accountType: 'LIABILITY' as const,
        debit: 0n,
        credit: 4000n,
      },
      {
        accountCode: '3000',
        accountName: 'Retained Earnings',
        accountType: 'EQUITY' as const,
        debit: 0n,
        credit: 1000n,
      },
    ]);

    const result = await getCashFlow(
      { ledgerId: LEDGER_ID, fromPeriodId: FROM_PERIOD, toPeriodId: TO_PERIOD },
      { balanceRepo, ledgerRepo: mockLedgerRepo() }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      // AP: 0 - 4000 = -4000, RE: 0 - 1000 = -1000 → financing = -5000
      expect(result.value.financingActivities.amount).toBe(-5000n);
    }
  });

  it('excludes cash account (1000) from all categories', async () => {
    const balanceRepo = mockBalanceRepo([
      {
        accountCode: '1000',
        accountName: 'Cash',
        accountType: 'ASSET' as const,
        debit: 10000n,
        credit: 0n,
      },
      {
        accountCode: '4000',
        accountName: 'Revenue',
        accountType: 'REVENUE' as const,
        debit: 0n,
        credit: 10000n,
      },
    ]);

    const result = await getCashFlow(
      { ledgerId: LEDGER_ID, fromPeriodId: FROM_PERIOD, toPeriodId: TO_PERIOD },
      { balanceRepo, ledgerRepo: mockLedgerRepo() }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Cash excluded, only revenue counted as operating
      expect(result.value.operatingActivities.amount).toBe(-10000n);
      expect(result.value.investingActivities.amount).toBe(0n);
      expect(result.value.financingActivities.amount).toBe(0n);
    }
  });

  it('computes correct netCashFlow across all categories', async () => {
    const balanceRepo = mockBalanceRepo([
      {
        accountCode: '4000',
        accountName: 'Revenue',
        accountType: 'REVENUE' as const,
        debit: 0n,
        credit: 10000n,
      },
      {
        accountCode: '5000',
        accountName: 'Expenses',
        accountType: 'EXPENSE' as const,
        debit: 3000n,
        credit: 0n,
      },
      {
        accountCode: '1100',
        accountName: 'AR',
        accountType: 'ASSET' as const,
        debit: 2000n,
        credit: 0n,
      },
      {
        accountCode: '2000',
        accountName: 'AP',
        accountType: 'LIABILITY' as const,
        debit: 0n,
        credit: 1000n,
      },
    ]);

    const result = await getCashFlow(
      { ledgerId: LEDGER_ID, fromPeriodId: FROM_PERIOD, toPeriodId: TO_PERIOD },
      { balanceRepo, ledgerRepo: mockLedgerRepo() }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Operating: (-10000 + 3000) = -7000
      // Investing: -(2000) = -2000
      // Financing: (-1000) = -1000
      // Net: -7000 + -2000 + -1000 = -10000
      expect(result.value.netCashFlow.amount).toBe(
        result.value.operatingActivities.amount +
          result.value.investingActivities.amount +
          result.value.financingActivities.amount
      );
    }
  });
});
