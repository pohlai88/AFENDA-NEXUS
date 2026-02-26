import { describe, it, expect } from 'vitest';
import { generateAuditPackage, type AuditPackageInput } from '../audit-package.js';

const baseInput: AuditPackageInput = {
  companyName: 'Acme Corp Sdn Bhd',
  fiscalYearEnd: '2025-12-31',
  reportingCurrency: 'MYR',
  materialityThreshold: 500_000n,
  trivialThreshold: 25_000n,
  leadScheduleItems: [
    {
      accountCode: '1000',
      accountName: 'Cash',
      classification: 'BS',
      subClassification: 'CURRENT_ASSET',
      openingBalance: 1_000_000n,
      debits: 5_000_000n,
      credits: 4_500_000n,
      closingBalance: 1_500_000n,
      priorYearBalance: 1_000_000n,
      variance: 500_000n,
      variancePct: 5000n,
    },
    {
      accountCode: '2000',
      accountName: 'Accounts Payable',
      classification: 'BS',
      subClassification: 'CURRENT_LIABILITY',
      openingBalance: 800_000n,
      debits: 3_000_000n,
      credits: 3_200_000n,
      closingBalance: 1_000_000n,
      priorYearBalance: 800_000n,
      variance: 200_000n,
      variancePct: 2500n,
    },
    {
      accountCode: '3000',
      accountName: 'Share Capital',
      classification: 'BS',
      subClassification: 'EQUITY',
      openingBalance: 500_000n,
      debits: 0n,
      credits: 0n,
      closingBalance: 500_000n,
      priorYearBalance: 500_000n,
      variance: 0n,
      variancePct: 0n,
    },
    {
      accountCode: '4000',
      accountName: 'Revenue',
      classification: 'IS',
      subClassification: 'REVENUE',
      openingBalance: 0n,
      debits: 0n,
      credits: 10_000_000n,
      closingBalance: 10_000_000n,
      priorYearBalance: 8_000_000n,
      variance: 2_000_000n,
      variancePct: 2500n,
    },
    {
      accountCode: '5000',
      accountName: 'Cost of Sales',
      classification: 'IS',
      subClassification: 'EXPENSE',
      openingBalance: 0n,
      debits: 6_000_000n,
      credits: 0n,
      closingBalance: 6_000_000n,
      priorYearBalance: 5_000_000n,
      variance: 1_000_000n,
      variancePct: 2000n,
    },
  ],
  journalEntries: [
    {
      journalId: 'JE-001',
      postingDate: '2025-06-15',
      description: 'Monthly salary',
      totalAmount: 300_000n,
      lineCount: 4,
      postedBy: 'user-1',
      isManual: false,
      isReversing: false,
      isYearEnd: false,
    },
    {
      journalId: 'JE-002',
      postingDate: '2025-12-31',
      description: 'Year-end accrual',
      totalAmount: 750_000n,
      lineCount: 2,
      postedBy: 'user-2',
      isManual: true,
      isReversing: false,
      isYearEnd: true,
    },
    {
      journalId: 'JE-003',
      postingDate: '2025-12-31',
      description: 'Reversal of prior accrual',
      totalAmount: 200_000n,
      lineCount: 2,
      postedBy: 'user-1',
      isManual: true,
      isReversing: true,
      isYearEnd: true,
    },
  ],
  relatedPartyTransactions: [
    {
      partyId: 'RP-001',
      partyName: 'Acme Holdings',
      relationship: 'Parent Company',
      transactionType: 'Management Fee',
      amount: 1_200_000n,
      outstandingBalance: 300_000n,
      currencyCode: 'MYR',
    },
  ],
  subsequentEvents: [
    {
      eventDate: '2026-01-15',
      description: 'Settlement of major lawsuit',
      eventType: 'ADJUSTING',
      financialImpact: 500_000n,
      isDisclosed: true,
    },
    {
      eventDate: '2026-02-01',
      description: 'New factory construction commenced',
      eventType: 'NON_ADJUSTING',
      financialImpact: 5_000_000n,
      isDisclosed: true,
    },
  ],
};

describe('generateAuditPackage', () => {
  it('separates BS and IS lead schedules', () => {
    const { result } = generateAuditPackage(baseInput);

    expect(result.bsLeadSchedule).toHaveLength(3);
    expect(result.isLeadSchedule).toHaveLength(2);
  });

  it('aggregates BS totals by sub-classification', () => {
    const { result } = generateAuditPackage(baseInput);

    expect(result.totalBsAssets).toBe(1_500_000n);
    expect(result.totalBsLiabilities).toBe(1_000_000n);
    expect(result.totalBsEquity).toBe(500_000n);
  });

  it('aggregates IS totals', () => {
    const { result } = generateAuditPackage(baseInput);

    expect(result.totalIsRevenue).toBe(10_000_000n);
    expect(result.totalIsExpenses).toBe(6_000_000n);
  });

  it('analyzes journal entries correctly', () => {
    const { result } = generateAuditPackage(baseInput);

    expect(result.totalJournals).toBe(3);
    expect(result.manualJournals).toBe(2);
    expect(result.reversingJournals).toBe(1);
    expect(result.yearEndJournals).toBe(2);
  });

  it('identifies journals above materiality', () => {
    const { result } = generateAuditPackage(baseInput);

    expect(result.journalsAboveMateriality).toHaveLength(1);
    expect(result.journalsAboveMateriality[0]!.journalId).toBe('JE-002');
  });

  it('aggregates related party data', () => {
    const { result } = generateAuditPackage(baseInput);

    expect(result.relatedPartyCount).toBe(1);
    expect(result.relatedPartyTotalAmount).toBe(1_200_000n);
    expect(result.relatedPartyOutstandingBalance).toBe(300_000n);
  });

  it('separates adjusting and non-adjusting subsequent events', () => {
    const { result } = generateAuditPackage(baseInput);

    expect(result.adjustingEvents).toHaveLength(1);
    expect(result.nonAdjustingEvents).toHaveLength(1);
    expect(result.subsequentEventsTotalImpact).toBe(5_500_000n);
  });

  it('generates completeness flags', () => {
    const { result } = generateAuditPackage(baseInput);

    expect(result.completenessFlags.length).toBeGreaterThanOrEqual(4);
    const leadScheduleFlag = result.completenessFlags.find((f) => f.area === 'Lead Schedules');
    expect(leadScheduleFlag?.status).toBe('COMPLETE');
  });

  it('flags incomplete areas when data is missing', () => {
    const { result } = generateAuditPackage({
      ...baseInput,
      leadScheduleItems: [],
    });

    const flag = result.completenessFlags.find((f) => f.area === 'Lead Schedules');
    expect(flag?.status).toBe('INCOMPLETE');
  });

  it('includes materiality thresholds in result', () => {
    const { result } = generateAuditPackage(baseInput);

    expect(result.materialityThreshold).toBe(500_000n);
    expect(result.trivialThreshold).toBe(25_000n);
  });

  it('provides audit explanation', () => {
    const calc = generateAuditPackage(baseInput);

    expect(calc.explanation).toContain('Audit package');
    expect(calc.explanation).toContain('Acme Corp');
    expect(calc.explanation).toContain('BS items');
    expect(calc.explanation).toContain('IS items');
  });

  it('computes journal total amount', () => {
    const { result } = generateAuditPackage(baseInput);

    expect(result.journalsTotalAmount).toBe(1_250_000n);
  });
});
