/**
 * TX-09: Country-specific tax formats.
 * Pluggable formatters for Malaysia SST, Singapore GST, and generic VAT returns.
 * Pure calculator — no DB, no side effects.
 *
 * Uses raw bigint for amounts (minor units).
 */

export type CountryFormatType = 'MY_SST' | 'SG_GST' | 'GENERIC_VAT';

export interface TaxReturnLine {
  readonly boxNumber: string;
  readonly label: string;
  readonly amount: bigint;
  readonly currencyCode: string;
}

export interface FormattedTaxReturn {
  readonly format: CountryFormatType;
  readonly countryCode: string;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly lines: readonly TaxReturnLine[];
  readonly totalTaxPayable: bigint;
  readonly currencyCode: string;
}

export interface TaxReturnData {
  readonly totalSales: bigint;
  readonly totalPurchases: bigint;
  readonly outputTax: bigint;
  readonly inputTax: bigint;
  readonly exemptSales: bigint;
  readonly zeroRatedSales: bigint;
  readonly importTax: bigint;
  readonly currencyCode: string;
  readonly periodStart: Date;
  readonly periodEnd: Date;
}

/**
 * Format tax return for Malaysia SST (Sales and Service Tax).
 * SST-02 return format.
 */
export function formatMySst(data: TaxReturnData): FormattedTaxReturn {
  const netPayable = data.outputTax - data.inputTax;
  return {
    format: 'MY_SST',
    countryCode: 'MY',
    periodStart: data.periodStart,
    periodEnd: data.periodEnd,
    currencyCode: data.currencyCode,
    totalTaxPayable: netPayable,
    lines: [
      {
        boxNumber: '1',
        label: 'Total value of taxable sales',
        amount: data.totalSales,
        currencyCode: data.currencyCode,
      },
      {
        boxNumber: '2',
        label: 'Total value of exempt sales',
        amount: data.exemptSales,
        currencyCode: data.currencyCode,
      },
      {
        boxNumber: '3',
        label: 'Total sales tax due',
        amount: data.outputTax,
        currencyCode: data.currencyCode,
      },
      {
        boxNumber: '4',
        label: 'Total service tax due',
        amount: 0n,
        currencyCode: data.currencyCode,
      },
      {
        boxNumber: '5',
        label: 'Total tax payable',
        amount: netPayable,
        currencyCode: data.currencyCode,
      },
    ],
  };
}

/**
 * Format tax return for Singapore GST (GST F5 return).
 */
export function formatSgGst(data: TaxReturnData): FormattedTaxReturn {
  const netPayable = data.outputTax - data.inputTax;
  return {
    format: 'SG_GST',
    countryCode: 'SG',
    periodStart: data.periodStart,
    periodEnd: data.periodEnd,
    currencyCode: data.currencyCode,
    totalTaxPayable: netPayable,
    lines: [
      {
        boxNumber: '1',
        label: 'Total value of standard-rated supplies',
        amount: data.totalSales,
        currencyCode: data.currencyCode,
      },
      {
        boxNumber: '2',
        label: 'Total value of zero-rated supplies',
        amount: data.zeroRatedSales,
        currencyCode: data.currencyCode,
      },
      {
        boxNumber: '3',
        label: 'Total value of exempt supplies',
        amount: data.exemptSales,
        currencyCode: data.currencyCode,
      },
      {
        boxNumber: '4',
        label: 'Total value of taxable purchases',
        amount: data.totalPurchases,
        currencyCode: data.currencyCode,
      },
      {
        boxNumber: '5',
        label: 'Total value of imports',
        amount: data.importTax,
        currencyCode: data.currencyCode,
      },
      {
        boxNumber: '6',
        label: 'Output tax due',
        amount: data.outputTax,
        currencyCode: data.currencyCode,
      },
      {
        boxNumber: '7',
        label: 'Input tax and refunds claimed',
        amount: data.inputTax,
        currencyCode: data.currencyCode,
      },
      {
        boxNumber: '8',
        label: 'Net GST payable / (refundable)',
        amount: netPayable,
        currencyCode: data.currencyCode,
      },
    ],
  };
}

/**
 * Format generic VAT return.
 */
export function formatGenericVat(data: TaxReturnData, countryCode: string): FormattedTaxReturn {
  const netPayable = data.outputTax - data.inputTax;
  return {
    format: 'GENERIC_VAT',
    countryCode,
    periodStart: data.periodStart,
    periodEnd: data.periodEnd,
    currencyCode: data.currencyCode,
    totalTaxPayable: netPayable,
    lines: [
      {
        boxNumber: '1',
        label: 'Total taxable sales',
        amount: data.totalSales,
        currencyCode: data.currencyCode,
      },
      {
        boxNumber: '2',
        label: 'Total zero-rated sales',
        amount: data.zeroRatedSales,
        currencyCode: data.currencyCode,
      },
      {
        boxNumber: '3',
        label: 'Total exempt sales',
        amount: data.exemptSales,
        currencyCode: data.currencyCode,
      },
      {
        boxNumber: '4',
        label: 'Total taxable purchases',
        amount: data.totalPurchases,
        currencyCode: data.currencyCode,
      },
      {
        boxNumber: '5',
        label: 'Output VAT',
        amount: data.outputTax,
        currencyCode: data.currencyCode,
      },
      {
        boxNumber: '6',
        label: 'Input VAT',
        amount: data.inputTax,
        currencyCode: data.currencyCode,
      },
      {
        boxNumber: '7',
        label: 'Net VAT payable / (refundable)',
        amount: netPayable,
        currencyCode: data.currencyCode,
      },
    ],
  };
}

/**
 * Format tax return using the appropriate country formatter.
 */
export function formatTaxReturn(
  data: TaxReturnData,
  format: CountryFormatType,
  countryCode?: string
): FormattedTaxReturn {
  switch (format) {
    case 'MY_SST':
      return formatMySst(data);
    case 'SG_GST':
      return formatSgGst(data);
    case 'GENERIC_VAT':
      return formatGenericVat(data, countryCode ?? 'XX');
  }
}
