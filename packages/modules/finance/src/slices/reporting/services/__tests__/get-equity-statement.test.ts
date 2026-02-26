import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, money } from '@afenda/core';
import { getEquityStatement } from '../get-equity-statement.js';
import type { EquityMovement } from '../../calculators/equity-statement.js';

const m = (amount: bigint) => money(amount, 'MYR');

const mockLedgerRepo = {
  findById: vi.fn(),
};

beforeEach(() => {
  mockLedgerRepo.findById.mockResolvedValue(
    ok({
      id: 'ledger-1',
      tenantId: 't1',
      companyId: 'c1',
      name: 'Primary Ledger',
      baseCurrency: 'MYR',
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );
});

const movements: EquityMovement[] = [
  {
    component: 'RETAINED_EARNINGS',
    openingBalance: 500000n,
    profitOrLoss: 100000n,
    otherComprehensiveIncome: 0n,
    dividendsDeclared: 20000n,
    sharesIssued: 0n,
    sharesRepurchased: 0n,
    transfersBetweenReserves: 0n,
    otherMovements: 0n,
  },
  {
    component: 'SHARE_CAPITAL',
    openingBalance: 200000n,
    profitOrLoss: 0n,
    otherComprehensiveIncome: 0n,
    dividendsDeclared: 0n,
    sharesIssued: 50000n,
    sharesRepurchased: 0n,
    transfersBetweenReserves: 0n,
    otherMovements: 0n,
  },
];

describe('getEquityStatement', () => {
  it('returns equity statement with Money-typed values', async () => {
    const result = await getEquityStatement(
      { ledgerId: 'ledger-1', periodId: 'period-1', movements },
      { ledgerRepo: mockLedgerRepo as never }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.periodId).toBe('period-1');
    expect(result.value.rows).toHaveLength(2);

    const re = result.value.rows.find((r) => r.component === 'RETAINED_EARNINGS')!;
    expect(re.openingBalance).toEqual(m(500000n));
    expect(re.closingBalance).toEqual(m(580000n));
    expect(re.totalMovements).toEqual(m(80000n));
    expect(re.movements.profitOrLoss).toEqual(m(100000n));
    expect(re.movements.dividends).toEqual(m(20000n));

    const sc = result.value.rows.find((r) => r.component === 'SHARE_CAPITAL')!;
    expect(sc.closingBalance).toEqual(m(250000n));

    expect(result.value.totalOpeningEquity).toEqual(m(700000n));
    expect(result.value.totalClosingEquity).toEqual(m(830000n));
    expect(result.value.totalComprehensiveIncome).toEqual(m(100000n));
  });

  it('propagates ledger repo errors', async () => {
    const failingRepo = {
      findById: vi.fn().mockResolvedValue({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Ledger not found' },
      }),
    };

    const result = await getEquityStatement(
      { ledgerId: 'bad-ledger', periodId: 'period-1', movements },
      { ledgerRepo: failingRepo as never }
    );

    expect(result.ok).toBe(false);
  });

  it('handles single component with OCI', async () => {
    const ociMovements: EquityMovement[] = [
      {
        component: 'OCI_RESERVE',
        openingBalance: 10000n,
        profitOrLoss: 0n,
        otherComprehensiveIncome: 5000n,
        dividendsDeclared: 0n,
        sharesIssued: 0n,
        sharesRepurchased: 0n,
        transfersBetweenReserves: -2000n,
        otherMovements: 0n,
      },
    ];

    const result = await getEquityStatement(
      { ledgerId: 'ledger-1', periodId: 'period-1', movements: ociMovements },
      { ledgerRepo: mockLedgerRepo as never }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.rows[0]!.closingBalance).toEqual(m(13000n));
    expect(result.value.rows[0]!.movements.oci).toEqual(m(5000n));
    expect(result.value.totalComprehensiveIncome).toEqual(m(5000n));
  });
});
