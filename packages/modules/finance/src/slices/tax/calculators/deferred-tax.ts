/**
 * TX-07: Deferred tax temporary differences (IAS 12).
 * Computes deferred tax assets (DTA) and liabilities (DTL) from
 * temporary differences between accounting and tax bases.
 * Pure calculator — no DB, no side effects.
 *
 * All rates are integer basis points — no float arithmetic on money.
 * Uses raw bigint for amounts (minor units).
 */

export type TemporaryDifferenceType = "TAXABLE" | "DEDUCTIBLE";

export interface TemporaryDifference {
  readonly itemId: string;
  readonly description: string;
  readonly accountingBase: bigint;
  readonly taxBase: bigint;
  readonly type: TemporaryDifferenceType;
}

export interface DeferredTaxResult {
  readonly items: readonly DeferredTaxItem[];
  readonly totalDta: bigint;
  readonly totalDtl: bigint;
  readonly netDeferredTax: bigint;
}

export interface DeferredTaxItem {
  readonly itemId: string;
  readonly description: string;
  readonly temporaryDifference: bigint;
  readonly type: TemporaryDifferenceType;
  readonly deferredTaxAmount: bigint;
}

/**
 * Compute deferred tax from temporary differences.
 *
 * Taxable differences → DTL (accounting base > tax base)
 * Deductible differences → DTA (tax base > accounting base)
 *
 * @param taxRateBps Applicable tax rate in basis points (e.g. 2500 = 25.00%)
 */
export function computeDeferredTax(
  differences: readonly TemporaryDifference[],
  taxRateBps: number,
): DeferredTaxResult {
  const items: DeferredTaxItem[] = [];
  let totalDta = 0n;
  let totalDtl = 0n;

  for (const diff of differences) {
    const tempDiff = diff.accountingBase - diff.taxBase;
    const absDiff = tempDiff < 0n ? -tempDiff : tempDiff;
    const deferredTaxAmount = (absDiff * BigInt(taxRateBps)) / 10000n;

    const type: TemporaryDifferenceType = tempDiff > 0n ? "TAXABLE" : "DEDUCTIBLE";

    items.push({
      itemId: diff.itemId,
      description: diff.description,
      temporaryDifference: tempDiff,
      type,
      deferredTaxAmount,
    });

    if (type === "TAXABLE") {
      totalDtl += deferredTaxAmount;
    } else {
      totalDta += deferredTaxAmount;
    }
  }

  return {
    items,
    totalDta,
    totalDtl,
    netDeferredTax: totalDtl - totalDta,
  };
}
