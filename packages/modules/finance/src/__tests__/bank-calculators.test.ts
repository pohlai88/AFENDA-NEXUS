import { describe, it, expect } from 'vitest';
import { parseOfx, parseCsv } from '../slices/bank/calculators/statement-parser.js';
import { autoMatchLines, type GlCandidate } from '../slices/bank/calculators/auto-match.js';
import {
  computeOutstandingItems,
  type OutstandingItem,
} from '../slices/bank/calculators/outstanding-items.js';
import { classifyBankCharges } from '../slices/bank/calculators/bank-charges.js';
import { computeMultiCurrencyRecon } from '../slices/bank/calculators/multi-currency-recon.js';
import type { BankStatementLine } from '../slices/bank/entities/bank-statement-line.js';

const now = new Date('2025-06-15');

function makeLine(overrides: Partial<BankStatementLine> = {}): BankStatementLine {
  return {
    id: 'line-1',
    tenantId: 't-1',
    statementId: 'stmt-1',
    lineNumber: 1,
    transactionDate: now,
    valueDate: null,
    transactionType: 'DEBIT',
    amount: 10000n,
    currencyCode: 'USD',
    reference: 'REF-001',
    description: 'Payment to vendor',
    payeeOrPayer: 'Vendor Co',
    bankReference: null,
    matchStatus: 'UNMATCHED',
    matchId: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ─── BR-01: Statement Parser ───────────────────────────────────────────────

describe('parseOfx', () => {
  it('parses valid OFX with transactions', () => {
    const ofx = `
<OFX>
<BANKMSGSRSV1>
<STMTTRNRS>
<ACCTID>123456789
<CURDEF>USD
<BALAMT>50000
<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20250601<TRNAMT>-5000<NAME>Vendor Payment</STMTTRN>
<STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20250602<TRNAMT>10000<NAME>Customer Receipt</STMTTRN>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;
    const result = parseOfx(ofx);
    expect(result.isValid).toBe(true);
    expect(result.statement!.lines).toHaveLength(2);
    expect(result.statement!.lines[0]!.transactionType).toBe('DEBIT');
    expect(result.statement!.lines[0]!.amount).toBe(5000n);
    expect(result.statement!.lines[1]!.transactionType).toBe('CREDIT');
    expect(result.statement!.lines[1]!.amount).toBe(10000n);
    expect(result.statement!.currencyCode).toBe('USD');
  });

  it('rejects OFX missing ACCTID', () => {
    const result = parseOfx('<OFX><CURDEF>USD</OFX>');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Missing ACCTID');
  });
});

describe('parseCsv', () => {
  it('parses valid CSV', () => {
    const csv = `Date,Type,Amount,Reference,Description
2025-06-01,DEBIT,5000,REF-001,Vendor Payment
2025-06-02,CREDIT,10000,REF-002,Customer Receipt`;
    const result = parseCsv(csv, 'USD', 'ACC-001');
    expect(result.isValid).toBe(true);
    expect(result.statement!.lines).toHaveLength(2);
    expect(result.statement!.lines[0]!.amount).toBe(5000n);
    expect(result.statement!.currencyCode).toBe('USD');
  });

  it('rejects CSV with only header', () => {
    const result = parseCsv('Date,Type,Amount,Reference,Description', 'USD', 'ACC-001');
    expect(result.isValid).toBe(false);
  });
});

// ─── BR-02: Auto-Match ─────────────────────────────────────────────────────

describe('autoMatchLines', () => {
  it('matches by amount + date + reference', () => {
    const lines: BankStatementLine[] = [
      makeLine({ id: 'l1', amount: 5000n, reference: 'INV-100' }),
    ];
    const candidates: GlCandidate[] = [
      {
        id: 'c1',
        journalId: 'j1',
        transactionDate: now,
        amount: 5000n,
        currencyCode: 'USD',
        reference: 'INV-100',
        description: 'Invoice 100',
      },
    ];
    const result = autoMatchLines(lines, candidates);
    expect(result.matched).toHaveLength(1);
    expect(result.matched[0]!.score).toBe(100);
    expect(result.unmatched).toHaveLength(0);
    expect(result.matchRate).toBe(100);
  });

  it('matches by amount + date only (no reference)', () => {
    const lines: BankStatementLine[] = [
      makeLine({ id: 'l1', amount: 5000n, reference: null, description: 'Some payment' }),
    ];
    const candidates: GlCandidate[] = [
      {
        id: 'c1',
        journalId: 'j1',
        transactionDate: now,
        amount: 5000n,
        currencyCode: 'USD',
        reference: null,
        description: 'Other desc',
      },
    ];
    const result = autoMatchLines(lines, candidates);
    expect(result.matched).toHaveLength(1);
    expect(result.matched[0]!.score).toBe(80); // amount(50) + date(30)
  });

  it('leaves unmatched when no candidates', () => {
    const lines: BankStatementLine[] = [makeLine({ id: 'l1' })];
    const result = autoMatchLines(lines, []);
    expect(result.matched).toHaveLength(0);
    expect(result.unmatched).toEqual(['l1']);
  });

  it('skips already matched lines', () => {
    const lines: BankStatementLine[] = [makeLine({ id: 'l1', matchStatus: 'CONFIRMED' })];
    const candidates: GlCandidate[] = [
      {
        id: 'c1',
        journalId: 'j1',
        transactionDate: now,
        amount: 10000n,
        currencyCode: 'USD',
        reference: 'REF-001',
        description: 'Match',
      },
    ];
    const result = autoMatchLines(lines, candidates);
    expect(result.matched).toHaveLength(0);
    expect(result.totalLines).toBe(0);
  });

  it('does not double-match candidates', () => {
    const lines: BankStatementLine[] = [
      makeLine({ id: 'l1', amount: 5000n }),
      makeLine({ id: 'l2', amount: 5000n }),
    ];
    const candidates: GlCandidate[] = [
      {
        id: 'c1',
        journalId: 'j1',
        transactionDate: now,
        amount: 5000n,
        currencyCode: 'USD',
        reference: null,
        description: 'X',
      },
    ];
    const result = autoMatchLines(lines, candidates);
    expect(result.matched).toHaveLength(1);
    expect(result.unmatched).toHaveLength(1);
  });
});

// ─── BR-06: Outstanding Items ──────────────────────────────────────────────

describe('computeOutstandingItems', () => {
  it('adjusts bank balance for outstanding checks and deposits', () => {
    const items: OutstandingItem[] = [
      {
        id: 'chk1',
        documentRef: 'CHK-001',
        documentDate: now,
        amount: 5000n,
        currencyCode: 'USD',
        type: 'CHECK',
      },
      {
        id: 'chk2',
        documentRef: 'CHK-002',
        documentDate: now,
        amount: 3000n,
        currencyCode: 'USD',
        type: 'CHECK',
      },
      {
        id: 'dep1',
        documentRef: 'DEP-001',
        documentDate: now,
        amount: 10000n,
        currencyCode: 'USD',
        type: 'DEPOSIT',
      },
    ];
    const result = computeOutstandingItems(100000n, items);
    expect(result.totalOutstandingChecks).toBe(8000n);
    expect(result.totalDepositsInTransit).toBe(10000n);
    // 100,000 - 8,000 + 10,000 = 102,000
    expect(result.adjustedBankBalance).toBe(102000n);
    expect(result.outstandingChecks).toHaveLength(2);
    expect(result.depositsInTransit).toHaveLength(1);
  });

  it('handles empty items', () => {
    const result = computeOutstandingItems(50000n, []);
    expect(result.adjustedBankBalance).toBe(50000n);
    expect(result.totalOutstandingChecks).toBe(0n);
  });
});

// ─── BR-07: Bank Charges ───────────────────────────────────────────────────

describe('classifyBankCharges', () => {
  it('classifies known charge patterns', () => {
    const lines: BankStatementLine[] = [
      makeLine({ id: 'l1', description: 'Monthly service fee', amount: 500n }),
      makeLine({ id: 'l2', description: 'Wire transfer fee', amount: 2500n }),
      makeLine({ id: 'l3', description: 'Overdraft interest', amount: 1500n }),
    ];
    const result = classifyBankCharges(lines);
    expect(result.charges).toHaveLength(3);
    expect(result.charges[0]!.category).toBe('SERVICE_FEE');
    expect(result.charges[1]!.category).toBe('WIRE_FEE');
    expect(result.charges[2]!.category).toBe('OVERDRAFT_INTEREST');
    expect(result.totalCharges).toBe(4500n);
  });

  it('classifies unknown charges with low confidence', () => {
    const lines: BankStatementLine[] = [
      makeLine({ id: 'l1', description: 'Misc bank commission' }),
    ];
    const result = classifyBankCharges(lines);
    expect(result.charges).toHaveLength(1);
    expect(result.charges[0]!.category).toBe('UNKNOWN');
    expect(result.charges[0]!.confidence).toBe(40);
  });

  it('skips credit lines', () => {
    const lines: BankStatementLine[] = [
      makeLine({ id: 'l1', transactionType: 'CREDIT', description: 'Service fee refund' }),
    ];
    const result = classifyBankCharges(lines);
    expect(result.charges).toHaveLength(0);
  });
});

// ─── BR-08: Multi-Currency Reconciliation ──────────────────────────────────

describe('computeMultiCurrencyRecon', () => {
  it('converts both balances to base currency', () => {
    const result = computeMultiCurrencyRecon({
      statementBalance: 100000n,
      statementCurrency: 'EUR',
      glBalance: 110000n,
      glCurrency: 'USD',
      baseCurrency: 'USD',
      fxRates: [
        { fromCurrency: 'EUR', toCurrency: 'USD', rateBps: 11000 }, // 1 EUR = 1.10 USD
      ],
    });
    // Statement: 100,000 * 11000 / 10000 = 110,000
    // GL: 110,000 * 10000 / 10000 = 110,000 (same currency)
    expect(result.statementBalanceBase).toBe(110000n);
    expect(result.glBalanceBase).toBe(110000n);
    expect(result.fxDifference).toBe(0n);
  });

  it('detects FX difference', () => {
    const result = computeMultiCurrencyRecon({
      statementBalance: 100000n,
      statementCurrency: 'EUR',
      glBalance: 105000n,
      glCurrency: 'USD',
      baseCurrency: 'USD',
      fxRates: [{ fromCurrency: 'EUR', toCurrency: 'USD', rateBps: 11000 }],
    });
    // Statement base: 110,000; GL base: 105,000
    expect(result.fxDifference).toBe(5000n);
  });

  it('handles same currency (1:1)', () => {
    const result = computeMultiCurrencyRecon({
      statementBalance: 50000n,
      statementCurrency: 'USD',
      glBalance: 50000n,
      glCurrency: 'USD',
      baseCurrency: 'USD',
      fxRates: [],
    });
    expect(result.fxDifference).toBe(0n);
  });
});
