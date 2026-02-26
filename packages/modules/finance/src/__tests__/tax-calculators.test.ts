import { describe, it, expect } from 'vitest';
import { lookupTaxCode, computeCompoundTax } from '../slices/tax/calculators/tax-code-hierarchy.js';
import type { TaxCode } from '../slices/tax/entities/tax-code.js';
import type { TaxRate } from '../slices/tax/entities/tax-rate.js';
import { computeVatNetting, type TaxEntry } from '../slices/tax/calculators/vat-netting.js';
import {
  buildSaftFile,
  validateSaftFile,
  type SaftHeader,
} from '../slices/tax/calculators/saft-export.js';
import { computeWhtWithTreaty, type TreatyRate } from '../slices/tax/calculators/wht-treaty.js';
import {
  computeDeferredTax,
  type TemporaryDifference,
} from '../slices/tax/calculators/deferred-tax.js';
import { computeTaxProvision } from '../slices/tax/calculators/tax-provision.js';
import {
  formatMySst,
  formatSgGst,
  formatGenericVat,
  formatTaxReturn,
  type TaxReturnData,
} from '../slices/tax/calculators/country-formats.js';
import { validateTransferPrice } from '../slices/tax/calculators/transfer-pricing.js';
import { computeInvoiceDiscounting } from '../slices/ar/calculators/invoice-discounting.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

const now = new Date('2025-06-15');

function makeTaxCode(overrides: Partial<TaxCode> = {}): TaxCode {
  return {
    id: 'tc-1',
    tenantId: 't-1',
    code: 'VAT-MY',
    name: 'Malaysia VAT',
    description: null,
    jurisdictionLevel: 'COUNTRY',
    countryCode: 'MY',
    stateCode: null,
    cityCode: null,
    parentId: null,
    isCompound: false,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeTaxRate(overrides: Partial<TaxRate> = {}): TaxRate {
  return {
    id: 'tr-1',
    tenantId: 't-1',
    taxCodeId: 'tc-1',
    name: 'Standard rate',
    ratePercent: 6,
    type: 'GST',
    jurisdictionCode: 'MY',
    effectiveFrom: new Date('2024-01-01'),
    effectiveTo: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ─── TX-02: Tax Code Hierarchy ──────────────────────────────────────────────

describe('lookupTaxCode', () => {
  it('resolves country-level tax code', () => {
    const codes = [makeTaxCode()];
    const rates = [makeTaxRate()];
    const result = lookupTaxCode({ countryCode: 'MY' }, codes, rates, now);
    expect(result).not.toBeNull();
    expect(result!.taxCode.code).toBe('VAT-MY');
    expect(result!.jurisdictionPath).toEqual(['MY']);
  });

  it('prefers state-level over country-level', () => {
    const codes = [
      makeTaxCode({ id: 'tc-c', jurisdictionLevel: 'COUNTRY' }),
      makeTaxCode({ id: 'tc-s', code: 'VAT-MY-KL', jurisdictionLevel: 'STATE', stateCode: 'KL' }),
    ];
    const rates = [
      makeTaxRate({ id: 'tr-c', taxCodeId: 'tc-c' }),
      makeTaxRate({ id: 'tr-s', taxCodeId: 'tc-s' }),
    ];
    const result = lookupTaxCode({ countryCode: 'MY', stateCode: 'KL' }, codes, rates, now);
    expect(result!.taxCode.id).toBe('tc-s');
    expect(result!.jurisdictionPath).toEqual(['MY', 'KL']);
  });

  it('returns null when no matching code', () => {
    const result = lookupTaxCode({ countryCode: 'XX' }, [], [], now);
    expect(result).toBeNull();
  });

  it('skips inactive codes', () => {
    const codes = [makeTaxCode({ isActive: false })];
    const rates = [makeTaxRate()];
    const result = lookupTaxCode({ countryCode: 'MY' }, codes, rates, now);
    expect(result).toBeNull();
  });
});

describe('computeCompoundTax', () => {
  it('sums stacked jurisdiction rates', () => {
    const result = computeCompoundTax(1000000n, [
      { jurisdictionCode: 'US-CA', rateBps: 725 },
      { jurisdictionCode: 'US-CA-LA', rateBps: 225 },
    ]);
    expect(result.totalRateBps).toBe(950);
    expect(result.taxAmount).toBe(95000n); // 9.50% of 1,000,000
  });

  it('returns zero for empty rates', () => {
    const result = computeCompoundTax(1000000n, []);
    expect(result.totalRateBps).toBe(0);
    expect(result.taxAmount).toBe(0n);
  });
});

// ─── TX-03: VAT Netting ────────────────────────────────────────────────────

describe('computeVatNetting', () => {
  const periodStart = new Date('2025-01-01');
  const periodEnd = new Date('2025-03-31');

  it('nets output tax against input tax per jurisdiction', () => {
    const entries: TaxEntry[] = [
      {
        documentId: 's1',
        documentType: 'SALES_INVOICE',
        taxCodeId: 'tc1',
        jurisdictionCode: 'MY',
        taxableAmount: 100000n,
        taxAmount: 6000n,
        currencyCode: 'MYR',
        documentDate: new Date('2025-02-01'),
      },
      {
        documentId: 'p1',
        documentType: 'PURCHASE_INVOICE',
        taxCodeId: 'tc1',
        jurisdictionCode: 'MY',
        taxableAmount: 50000n,
        taxAmount: 3000n,
        currencyCode: 'MYR',
        documentDate: new Date('2025-02-15'),
      },
    ];
    const result = computeVatNetting(entries, periodStart, periodEnd);
    expect(result.jurisdictions).toHaveLength(1);
    expect(result.jurisdictions[0]!.outputTax).toBe(6000n);
    expect(result.jurisdictions[0]!.inputTax).toBe(3000n);
    expect(result.jurisdictions[0]!.netPayable).toBe(3000n);
    expect(result.jurisdictions[0]!.isRefundable).toBe(false);
  });

  it('identifies refundable position when input > output', () => {
    const entries: TaxEntry[] = [
      {
        documentId: 's1',
        documentType: 'SALES_INVOICE',
        taxCodeId: 'tc1',
        jurisdictionCode: 'MY',
        taxableAmount: 10000n,
        taxAmount: 600n,
        currencyCode: 'MYR',
        documentDate: new Date('2025-02-01'),
      },
      {
        documentId: 'p1',
        documentType: 'PURCHASE_INVOICE',
        taxCodeId: 'tc1',
        jurisdictionCode: 'MY',
        taxableAmount: 50000n,
        taxAmount: 3000n,
        currencyCode: 'MYR',
        documentDate: new Date('2025-02-15'),
      },
    ];
    const result = computeVatNetting(entries, periodStart, periodEnd);
    expect(result.jurisdictions[0]!.isRefundable).toBe(true);
    expect(result.totalNetPayable).toBe(-2400n);
  });

  it('excludes entries outside period', () => {
    const entries: TaxEntry[] = [
      {
        documentId: 's1',
        documentType: 'SALES_INVOICE',
        taxCodeId: 'tc1',
        jurisdictionCode: 'MY',
        taxableAmount: 100000n,
        taxAmount: 6000n,
        currencyCode: 'MYR',
        documentDate: new Date('2024-12-01'),
      },
    ];
    const result = computeVatNetting(entries, periodStart, periodEnd);
    expect(result.jurisdictions).toHaveLength(0);
  });
});

// ─── TX-05: SAF-T Export ───────────────────────────────────────────────────

describe('buildSaftFile + validateSaftFile', () => {
  const header: SaftHeader = {
    auditFileVersion: '2.0',
    companyId: 'co-1',
    companyName: 'Test Co',
    taxRegistrationNumber: '123456',
    fiscalYear: 2025,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    currencyCode: 'MYR',
    generatedAt: now,
  };

  it('builds valid SAF-T file with balanced debits/credits', () => {
    const file = buildSaftFile(
      header,
      [],
      [
        {
          transactionId: 'tx1',
          transactionDate: now,
          description: 'Test',
          documentRef: 'J-001',
          lines: [
            {
              accountId: 'a1',
              debitAmount: 10000n,
              creditAmount: 0n,
              taxCode: null,
              taxAmount: 0n,
              currencyCode: 'MYR',
            },
            {
              accountId: 'a2',
              debitAmount: 0n,
              creditAmount: 10000n,
              taxCode: null,
              taxAmount: 0n,
              currencyCode: 'MYR',
            },
          ],
        },
      ],
      []
    );
    expect(file.transactionCount).toBe(1);
    expect(file.totalDebit).toBe(10000n);
    expect(file.totalCredit).toBe(10000n);

    const validation = validateSaftFile(file);
    expect(validation.isValid).toBe(true);
  });

  it('detects debit/credit mismatch', () => {
    const file = buildSaftFile(
      header,
      [],
      [
        {
          transactionId: 'tx1',
          transactionDate: now,
          description: 'Test',
          documentRef: 'J-001',
          lines: [
            {
              accountId: 'a1',
              debitAmount: 10000n,
              creditAmount: 0n,
              taxCode: null,
              taxAmount: 0n,
              currencyCode: 'MYR',
            },
          ],
        },
      ],
      []
    );
    const validation = validateSaftFile(file);
    expect(validation.isValid).toBe(false);
    expect(validation.errors[0]).toContain('mismatch');
  });
});

// ─── TX-06: WHT Treaty ─────────────────────────────────────────────────────

describe('computeWhtWithTreaty', () => {
  const treaties: TreatyRate[] = [
    {
      sourceCountry: 'MY',
      residenceCountry: 'SG',
      incomeType: 'ROYALTY',
      domesticRateBps: 1500,
      treatyRateBps: 800,
      treatyRef: 'MY-SG-DTA-2006',
      effectiveFrom: new Date('2006-01-01'),
      effectiveTo: null,
    },
  ];

  it('applies treaty rate when payee has TRC', () => {
    const result = computeWhtWithTreaty(
      {
        payeeId: 'p1',
        payeeCountry: 'SG',
        sourceCountry: 'MY',
        incomeType: 'ROYALTY',
        grossAmount: 1000000n,
        hasTaxResidencyCertificate: true,
      },
      treaties,
      now
    );
    expect(result.treatyApplied).toBe(true);
    expect(result.appliedRateBps).toBe(800);
    expect(result.whtAmount).toBe(80000n); // 8% of 1,000,000
    expect(result.treatyRef).toBe('MY-SG-DTA-2006');
  });

  it('falls back to domestic rate without TRC', () => {
    const result = computeWhtWithTreaty(
      {
        payeeId: 'p1',
        payeeCountry: 'SG',
        sourceCountry: 'MY',
        incomeType: 'ROYALTY',
        grossAmount: 1000000n,
        hasTaxResidencyCertificate: false,
      },
      treaties,
      now
    );
    expect(result.treatyApplied).toBe(false);
    expect(result.appliedRateBps).toBe(1500);
    expect(result.whtAmount).toBe(150000n);
  });

  it('returns zero when no treaty found', () => {
    const result = computeWhtWithTreaty(
      {
        payeeId: 'p1',
        payeeCountry: 'XX',
        sourceCountry: 'MY',
        incomeType: 'ROYALTY',
        grossAmount: 1000000n,
        hasTaxResidencyCertificate: true,
      },
      treaties,
      now
    );
    expect(result.appliedRateBps).toBe(0);
    expect(result.whtAmount).toBe(0n);
  });
});

// ─── TX-07: Deferred Tax ───────────────────────────────────────────────────

describe('computeDeferredTax', () => {
  it('computes DTA and DTL from temporary differences', () => {
    const diffs: TemporaryDifference[] = [
      {
        itemId: 'd1',
        description: 'Depreciation',
        accountingBase: 100000n,
        taxBase: 80000n,
        type: 'TAXABLE',
      },
      {
        itemId: 'd2',
        description: 'Provision',
        accountingBase: 50000n,
        taxBase: 70000n,
        type: 'DEDUCTIBLE',
      },
    ];
    const result = computeDeferredTax(diffs, 2500); // 25%
    expect(result.totalDtl).toBe(5000n); // 25% of 20,000
    expect(result.totalDta).toBe(5000n); // 25% of 20,000
    expect(result.netDeferredTax).toBe(0n);
  });

  it('handles all taxable differences', () => {
    const diffs: TemporaryDifference[] = [
      {
        itemId: 'd1',
        description: 'Accel depr',
        accountingBase: 200000n,
        taxBase: 100000n,
        type: 'TAXABLE',
      },
    ];
    const result = computeDeferredTax(diffs, 3000); // 30%
    expect(result.totalDtl).toBe(30000n); // 30% of 100,000
    expect(result.totalDta).toBe(0n);
    expect(result.netDeferredTax).toBe(30000n);
  });
});

// ─── TX-08: Tax Provision ──────────────────────────────────────────────────

describe('computeTaxProvision', () => {
  it('computes current + deferred tax expense', () => {
    const result = computeTaxProvision({
      pretaxIncome: 1000000n,
      permanentDifferences: 50000n,
      temporaryDifferencesChange: 20000n,
      statutoryRateBps: 2500,
      taxCredits: 10000n,
      priorYearAdjustment: 5000n,
      currencyCode: 'MYR',
    });
    // taxableIncome = 1,050,000
    // grossCurrentTax = 262,500
    // currentTax = 262,500 - 10,000 + 5,000 = 257,500
    // deferredTax = 5,000
    // totalTax = 262,500
    expect(result.taxableIncome).toBe(1050000n);
    expect(result.currentTaxExpense).toBe(257500n);
    expect(result.deferredTaxExpense).toBe(5000n);
    expect(result.totalTaxExpense).toBe(262500n);
  });
});

// ─── TX-09: Country Formats ────────────────────────────────────────────────

describe('country formats', () => {
  const data: TaxReturnData = {
    totalSales: 500000n,
    totalPurchases: 200000n,
    outputTax: 30000n,
    inputTax: 12000n,
    exemptSales: 50000n,
    zeroRatedSales: 100000n,
    importTax: 5000n,
    currencyCode: 'MYR',
    periodStart: new Date('2025-01-01'),
    periodEnd: new Date('2025-03-31'),
  };

  it('formats MY SST return', () => {
    const result = formatMySst(data);
    expect(result.format).toBe('MY_SST');
    expect(result.countryCode).toBe('MY');
    expect(result.totalTaxPayable).toBe(18000n);
    expect(result.lines).toHaveLength(5);
  });

  it('formats SG GST return', () => {
    const result = formatSgGst(data);
    expect(result.format).toBe('SG_GST');
    expect(result.countryCode).toBe('SG');
    expect(result.lines).toHaveLength(8);
  });

  it('formats generic VAT return', () => {
    const result = formatGenericVat(data, 'GB');
    expect(result.format).toBe('GENERIC_VAT');
    expect(result.countryCode).toBe('GB');
    expect(result.lines).toHaveLength(7);
  });

  it('formatTaxReturn dispatches correctly', () => {
    expect(formatTaxReturn(data, 'MY_SST').format).toBe('MY_SST');
    expect(formatTaxReturn(data, 'SG_GST').format).toBe('SG_GST');
    expect(formatTaxReturn(data, 'GENERIC_VAT', 'DE').countryCode).toBe('DE');
  });
});

// ─── TX-10: Transfer Pricing ───────────────────────────────────────────────

describe('validateTransferPrice', () => {
  it('marks within range when variance <= tolerance', () => {
    const result = validateTransferPrice({
      transactionId: 'tx-1',
      sellerCompanyId: 'co-A',
      buyerCompanyId: 'co-B',
      transactionAmount: 102000n,
      currencyCode: 'USD',
      method: 'CUP',
      benchmarkAmount: 100000n,
      toleranceBps: 500, // 5%
    });
    expect(result.status).toBe('WITHIN_RANGE');
    expect(result.adjustmentRequired).toBe(0n);
  });

  it('marks above range when over tolerance', () => {
    const result = validateTransferPrice({
      transactionId: 'tx-1',
      sellerCompanyId: 'co-A',
      buyerCompanyId: 'co-B',
      transactionAmount: 120000n,
      currencyCode: 'USD',
      method: 'CUP',
      benchmarkAmount: 100000n,
      toleranceBps: 500,
    });
    expect(result.status).toBe('ABOVE_RANGE');
    expect(result.varianceBps).toBe(2000); // 20%
    expect(result.adjustmentRequired).toBeGreaterThan(0n);
  });

  it('marks below range when under tolerance', () => {
    const result = validateTransferPrice({
      transactionId: 'tx-1',
      sellerCompanyId: 'co-A',
      buyerCompanyId: 'co-B',
      transactionAmount: 80000n,
      currencyCode: 'USD',
      method: 'RPM',
      benchmarkAmount: 100000n,
      toleranceBps: 500,
    });
    expect(result.status).toBe('BELOW_RANGE');
  });
});

// ─── AR-09: Invoice Discounting (verify CIG-02 compliance) ────────────────

describe('computeInvoiceDiscounting (bps)', () => {
  it('uses integer bps without float arithmetic', () => {
    const result = computeInvoiceDiscounting({
      invoiceId: 'inv-1',
      customerId: 'c1',
      faceValue: 1000000n,
      currencyCode: 'USD',
      dueDate: new Date('2025-06-01'),
      factoringDate: new Date('2025-03-01'),
      discountRateBps: 250,
      holdbackBps: 1000,
    });
    expect(result.holdbackAmount).toBe(100000n);
    expect(result.netProceeds).toBe(
      result.faceValue - result.discountCharge - result.holdbackAmount
    );
  });
});
