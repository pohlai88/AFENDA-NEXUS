import { describe, it, expect } from 'vitest';
import { toPlainTitle } from '../kpi-plain-title';
import { getAllCatalogEntries } from '../kpi-catalog';

describe('toPlainTitle', () => {
  describe('jargon phrase replacement', () => {
    it.each([
      ['Accounts Payable', 'Money owed'],
      ['Accounts Receivable', 'Money to receive'],
      ['Total Payables', 'Money owed'],
      ['Total Receivables', 'Money to receive'],
      ['Cash Position', 'Cash in bank'],
      ['Bank Balance', 'Cash in bank'],
      ['Trial Balance', 'Debits & credits check'],
      ['Days Sales Outstanding', 'Days to collect payment'],
      ['Covenant Breaches', 'Loan rule violations'],
      ['Budget Variance', 'Over/under budget'],
      ['Goodwill Balance', 'Acquisition value'],
      ['Pending Eliminations', 'Internal adjustments pending'],
      ['Pending Approval', 'Awaiting approval'],
      ['Overdue Invoices', 'Bills past due'],
      ['Unreconciled Items', 'Unmatched bank items'],
      ['Unposted Journals', 'Entries not yet posted'],
      ['Open Claims', 'Expense claims open'],
      ['Open Provisions', 'Set-aside amounts'],
      ['Active Leases', 'Leases in effect'],
      ['Active Hedges', 'Risk protections'],
      ['Active Loans', 'Outstanding loans'],
      ['Active Projects', 'Projects in progress'],
      ['Balance Sheet', 'What we own & owe'],
      ['Income Statement', 'Revenue & expenses'],
      ['Cash Flow', 'Cash in & out'],
    ])('%s → %s', (input, expected) => {
      expect(toPlainTitle(input)).toBe(expected);
    });
  });

  describe('suffix cleanup', () => {
    it('replaces (MTD) with "this month"', () => {
      expect(toPlainTitle('Net Income (MTD)')).toBe('Profit this month');
    });

    it('replaces (30d) with "(30 days)"', () => {
      expect(toPlainTitle('Cash Forecast (30d)')).toBe('Cash forecast (30 days)');
    });

    it('handles (QTD)', () => {
      expect(toPlainTitle('Revenue (QTD)', 'Revenue for the quarter')).toBe('Revenue this quarter');
    });
  });

  describe('abbreviation expansion', () => {
    it('expands AP', () => {
      expect(toPlainTitle('AP Aging')).toContain('Payables');
    });

    it('expands AR', () => {
      expect(toPlainTitle('AR Aging')).toContain('Receivables');
    });

    it('expands IC', () => {
      expect(toPlainTitle('IC Aging')).toContain('Intercompany');
    });

    it('expands WHT', () => {
      expect(toPlainTitle('WHT Certificates')).toContain('Withholding Tax');
    });

    it('expands TP', () => {
      expect(toPlainTitle('TP Policies')).toContain('Transfer Pricing');
    });
  });

  describe('description fallback', () => {
    it('falls back to description when no rules match', () => {
      expect(toPlainTitle('Instruments', 'Financial instruments')).toBe('Financial instruments');
    });

    it('truncates long descriptions at clause boundary', () => {
      const result = toPlainTitle(
        'XYZ Widget',
        'A very specific custom metric that tracks complex organizational performance across regions'
      );
      expect(result.length).toBeLessThanOrEqual(40);
    });

    it('takes content before first comma', () => {
      expect(toPlainTitle('XYZ Widget', 'Short clause, then more details')).toBe('Short clause');
    });
  });

  describe('passthrough', () => {
    it('returns original title when no rules match and no description', () => {
      expect(toPlainTitle('Something Custom')).toBe('Something Custom');
    });
  });

  describe('suffix + abbreviation combination (regression)', () => {
    it('expands abbreviation when suffix is also present', () => {
      // Bug: suffix match used to cause early return, skipping abbreviation expansion
      expect(toPlainTitle('GL Summary (MTD)')).toBe('Ledger Summary this month');
    });

    it('expands AP abbreviation with YTD suffix', () => {
      expect(toPlainTitle('AP Overdue (YTD)')).toBe('Payables Overdue this year');
    });

    it('expands DSO with QTD suffix', () => {
      expect(toPlainTitle('DSO (QTD)')).toBe('Days to Collect this quarter');
    });
  });

  describe('all catalog titles produce non-empty results', () => {
    const catalog = getAllCatalogEntries();

    it.each(catalog.map((e) => [e.title, e.description, e.id] as const))(
      '"%s" produces a non-empty plain title (id: %s)',
      (title, desc) => {
        const result = toPlainTitle(title, desc);
        expect(result).toBeTruthy();
        expect(result.length).toBeGreaterThan(0);
      }
    );

    it.each(catalog.map((e) => [e.title, e.description, e.id] as const))(
      '"%s" differs from original (id: %s)',
      (title, desc) => {
        const result = toPlainTitle(title, desc);
        // Every catalog entry should get a transformation — either via
        // jargon, abbreviation, suffix, or description fallback
        expect(result).not.toBe(title);
      }
    );
  });
});
