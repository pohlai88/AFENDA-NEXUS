/**
 * TX-03: Input vs output tax netting (VAT/GST).
 * Computes net VAT/GST payable or refundable by netting
 * output tax (collected on sales) against input tax (paid on purchases).
 * Pure calculator — no DB, no side effects.
 *
 * Uses raw bigint for amounts (minor units).
 */

export interface TaxEntry {
  readonly documentId: string;
  readonly documentType: "SALES_INVOICE" | "PURCHASE_INVOICE" | "CREDIT_NOTE" | "DEBIT_NOTE";
  readonly taxCodeId: string;
  readonly jurisdictionCode: string;
  readonly taxableAmount: bigint;
  readonly taxAmount: bigint;
  readonly currencyCode: string;
  readonly documentDate: Date;
}

export interface VatNettingResult {
  readonly jurisdictionCode: string;
  readonly currencyCode: string;
  readonly outputTax: bigint;
  readonly inputTax: bigint;
  readonly netPayable: bigint;
  readonly isRefundable: boolean;
  readonly outputEntryCount: number;
  readonly inputEntryCount: number;
}

export interface VatNettingSummary {
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly jurisdictions: readonly VatNettingResult[];
  readonly totalOutputTax: bigint;
  readonly totalInputTax: bigint;
  readonly totalNetPayable: bigint;
}

/**
 * Net input tax against output tax per jurisdiction.
 * Output tax: from SALES_INVOICE, DEBIT_NOTE
 * Input tax: from PURCHASE_INVOICE, CREDIT_NOTE
 */
export function computeVatNetting(
  entries: readonly TaxEntry[],
  periodStart: Date,
  periodEnd: Date,
): VatNettingSummary {
  const periodEntries = entries.filter(
    (e) => e.documentDate >= periodStart && e.documentDate <= periodEnd,
  );

  const byJurisdiction = new Map<string, {
    outputTax: bigint;
    inputTax: bigint;
    currencyCode: string;
    outputCount: number;
    inputCount: number;
  }>();

  for (const entry of periodEntries) {
    const key = entry.jurisdictionCode;
    const existing = byJurisdiction.get(key) ?? {
      outputTax: 0n,
      inputTax: 0n,
      currencyCode: entry.currencyCode,
      outputCount: 0,
      inputCount: 0,
    };

    if (entry.documentType === "SALES_INVOICE" || entry.documentType === "DEBIT_NOTE") {
      existing.outputTax += entry.taxAmount;
      existing.outputCount += 1;
    } else {
      existing.inputTax += entry.taxAmount;
      existing.inputCount += 1;
    }

    byJurisdiction.set(key, existing);
  }

  const jurisdictions: VatNettingResult[] = [];
  let totalOutputTax = 0n;
  let totalInputTax = 0n;

  for (const [jurisdictionCode, data] of byJurisdiction) {
    const netPayable = data.outputTax - data.inputTax;
    jurisdictions.push({
      jurisdictionCode,
      currencyCode: data.currencyCode,
      outputTax: data.outputTax,
      inputTax: data.inputTax,
      netPayable,
      isRefundable: netPayable < 0n,
      outputEntryCount: data.outputCount,
      inputEntryCount: data.inputCount,
    });
    totalOutputTax += data.outputTax;
    totalInputTax += data.inputTax;
  }

  return {
    periodStart,
    periodEnd,
    jurisdictions,
    totalOutputTax,
    totalInputTax,
    totalNetPayable: totalOutputTax - totalInputTax,
  };
}
