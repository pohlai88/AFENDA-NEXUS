import { describe, it, expect } from 'vitest';
import {
  formatMyFormC,
  formatSgFormCs,
  formatIdPPh,
  formatThPP30,
  formatInGstr3b,
  formatUs1099Nec,
  formatEcSalesList,
} from '../country-tax-packs.js';

describe('formatMyFormC', () => {
  it('computes Malaysian corporate tax return', () => {
    const calc = formatMyFormC({
      companyName: 'Acme Sdn Bhd',
      tinNumber: 'C12345678',
      yearOfAssessment: 2025,
      grossIncome: 10_000_000n,
      allowableDeductions: 3_000_000n,
      capitalAllowances: 500_000n,
      adjustedIncome: 6_500_000n,
      chargeableIncome: 6_500_000n,
      taxPayable: 1_560_000n,
      taxCredits: 100_000n,
      instalmentsPaid: 1_200_000n,
      currencyCode: 'MYR',
      periodStart: '2025-01-01',
      periodEnd: '2025-12-31',
    });

    expect(calc.result.format).toBe('MY_FORM_C');
    expect(calc.result.countryCode).toBe('MY');
    expect(calc.result.totalTaxPayable).toBe(260_000n); // 1,560,000 - 100,000 - 1,200,000
    expect(calc.result.filingDeadline).toBe('2026-07-31');
    expect(calc.result.electronicFilingRequired).toBe(true);
    expect(calc.result.lines.length).toBeGreaterThanOrEqual(9);
  });
});

describe('formatSgFormCs', () => {
  it('computes Singapore simplified corporate tax return', () => {
    const calc = formatSgFormCs({
      companyName: 'Acme Pte Ltd',
      uenNumber: '202012345A',
      yearOfAssessment: 2025,
      revenue: 5_000_000n,
      adjustedProfit: 1_200_000n,
      chargeableIncome: 1_200_000n,
      taxPayable: 204_000n, // 17%
      taxCredits: 50_000n,
      currencyCode: 'SGD',
      periodStart: '2024-01-01',
      periodEnd: '2024-12-31',
    });

    expect(calc.result.format).toBe('SG_FORM_CS');
    expect(calc.result.countryCode).toBe('SG');
    expect(calc.result.totalTaxPayable).toBe(154_000n);
    expect(calc.result.filingDeadline).toBe('2025-11-30');
  });
});

describe('formatIdPPh', () => {
  it('computes Indonesia PPh 21 (employee tax)', () => {
    const calc = formatIdPPh({
      format: 'ID_PPH_21',
      npwpNumber: '01.234.567.8-901.000',
      taxPeriodMonth: 6,
      taxPeriodYear: 2025,
      grossAmount: 500_000_000n,
      taxableAmount: 400_000_000n,
      taxRateBps: 500,
      taxWithheld: 20_000_000n,
      numberOfRecipients: 50,
      currencyCode: 'IDR',
    });

    expect(calc.result.format).toBe('ID_PPH_21');
    expect(calc.result.countryCode).toBe('ID');
    expect(calc.result.totalTaxPayable).toBe(20_000_000n);
    expect(calc.result.formName).toContain('PPh 21');
  });

  it('computes Indonesia PPh 23 (WHT)', () => {
    const calc = formatIdPPh({
      format: 'ID_PPH_23',
      npwpNumber: '01.234.567.8-901.000',
      taxPeriodMonth: 3,
      taxPeriodYear: 2025,
      grossAmount: 100_000_000n,
      taxableAmount: 100_000_000n,
      taxRateBps: 200,
      taxWithheld: 2_000_000n,
      numberOfRecipients: 10,
      currencyCode: 'IDR',
    });

    expect(calc.result.format).toBe('ID_PPH_23');
    expect(calc.result.formName).toContain('PPh 23');
  });
});

describe('formatThPP30', () => {
  it('computes Thailand VAT return', () => {
    const calc = formatThPP30({
      tinNumber: '0105560000001',
      taxPeriodMonth: 6,
      taxPeriodYear: 2025,
      totalSales: 10_000_000n,
      totalPurchases: 6_000_000n,
      outputVat: 700_000n,
      inputVat: 420_000n,
      currencyCode: 'THB',
    });

    expect(calc.result.format).toBe('TH_PP30');
    expect(calc.result.countryCode).toBe('TH');
    expect(calc.result.totalTaxPayable).toBe(280_000n);
    expect(calc.result.formName).toContain('PP30');
  });
});

describe('formatInGstr3b', () => {
  it('computes India GSTR-3B summary return', () => {
    const calc = formatInGstr3b({
      gstinNumber: '22AAAAA0000A1Z5',
      taxPeriodMonth: 3,
      taxPeriodYear: 2025,
      outwardTaxableSupplies: 50_000_000n,
      outwardZeroRated: 5_000_000n,
      outwardExempt: 2_000_000n,
      inwardReverseCharge: 1_000_000n,
      igst: 4_500_000n,
      cgst: 2_250_000n,
      sgst: 2_250_000n,
      inputIgst: 3_000_000n,
      inputCgst: 1_500_000n,
      inputSgst: 1_500_000n,
      currencyCode: 'INR',
    });

    expect(calc.result.format).toBe('IN_GSTR3B');
    expect(calc.result.countryCode).toBe('IN');
    // Output: 9,000,000; Input: 6,000,000; Net: 3,000,000
    expect(calc.result.totalTaxPayable).toBe(3_000_000n);
    expect(calc.result.formName).toContain('GSTR-3B');
    expect(calc.result.lines.length).toBe(11);
  });
});

describe('formatUs1099Nec', () => {
  it('computes US 1099-NEC for contractors', () => {
    const calc = formatUs1099Nec({
      payerName: 'Acme Inc',
      payerTin: '12-3456789',
      taxYear: 2025,
      recipients: [
        {
          recipientName: 'Contractor A',
          recipientTin: '123-45-6789',
          nonEmployeeCompensation: 50_000_00n,
          federalTaxWithheld: 0n,
          stateTaxWithheld: 0n,
          stateCode: 'CA',
        },
        {
          recipientName: 'Contractor B',
          recipientTin: '987-65-4321',
          nonEmployeeCompensation: 30_000_00n,
          federalTaxWithheld: 6_000_00n,
          stateTaxWithheld: 0n,
          stateCode: 'NY',
        },
      ],
      currencyCode: 'USD',
    });

    expect(calc.result.format).toBe('US_1099_NEC');
    expect(calc.result.countryCode).toBe('US');
    expect(calc.result.lines[0]!.amount).toBe(80_000_00n); // total compensation
    expect(calc.result.lines[1]!.amount).toBe(6_000_00n); // total fed withholding
    expect(calc.result.filingDeadline).toBe('2026-01-31');
    expect(calc.result.electronicFilingRequired).toBe(false); // < 10 recipients
  });

  it('requires electronic filing for 10+ recipients', () => {
    const recipients = Array.from({ length: 10 }, (_, i) => ({
      recipientName: `Contractor ${i}`,
      recipientTin: `${i}00-00-0000`,
      nonEmployeeCompensation: 10_000_00n,
      federalTaxWithheld: 0n,
      stateTaxWithheld: 0n,
      stateCode: 'CA',
    }));

    const calc = formatUs1099Nec({
      payerName: 'Acme Inc',
      payerTin: '12-3456789',
      taxYear: 2025,
      recipients,
      currencyCode: 'USD',
    });

    expect(calc.result.electronicFilingRequired).toBe(true);
  });
});

describe('formatEcSalesList', () => {
  it('computes EU EC Sales List', () => {
    const calc = formatEcSalesList({
      vatNumber: 'DE123456789',
      memberState: 'DE',
      periodQuarter: 2,
      periodYear: 2025,
      entries: [
        {
          customerVatId: 'FR12345',
          customerCountry: 'FR',
          supplyType: 'GOODS',
          totalValue: 500_000n,
        },
        {
          customerVatId: 'NL67890',
          customerCountry: 'NL',
          supplyType: 'SERVICES',
          totalValue: 200_000n,
        },
        {
          customerVatId: 'IT11111',
          customerCountry: 'IT',
          supplyType: 'TRIANGULATION',
          totalValue: 100_000n,
        },
      ],
      currencyCode: 'EUR',
    });

    expect(calc.result.format).toBe('EU_EC_SALES_LIST');
    expect(calc.result.countryCode).toBe('DE');
    expect(calc.result.lines[0]!.amount).toBe(500_000n); // goods
    expect(calc.result.lines[1]!.amount).toBe(200_000n); // services
    expect(calc.result.lines[2]!.amount).toBe(100_000n); // triangulation
    expect(calc.result.totalTaxPayable).toBe(0n); // EC Sales List has no tax payable
  });
});
