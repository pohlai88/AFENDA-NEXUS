/**
 * GAP-F2: Hyperinflation Accounting (IAS 29) calculator.
 * Pure calculator — restates financial statements using a general
 * price index for entities operating in hyperinflationary economies.
 *
 * IAS 29 applies when cumulative inflation over 3 years approaches or
 * exceeds 100% (plus qualitative indicators).
 *
 * All monetary values are bigint (minor units).
 */
import type { CalculatorResult } from '../../../shared/types.js';

export interface PriceIndex {
  readonly periodId: string;
  readonly periodLabel: string;
  /** General price index value at period end (×10000 for precision). */
  readonly indexValue: bigint;
}

export interface HyperinflationLineItem {
  readonly accountCode: string;
  readonly accountName: string;
  readonly classification: 'MONETARY' | 'NON_MONETARY';
  /** Original historical cost in local currency (minor units). */
  readonly historicalAmount: bigint;
  /** Period when the item was originally recognized. */
  readonly originPeriodId: string;
}

export interface HyperinflationInput {
  readonly entityId: string;
  readonly entityName: string;
  readonly localCurrency: string;
  readonly reportingCurrency: string;
  /** Price index at the current reporting date. */
  readonly currentPriceIndex: bigint;
  /** Price index series for conversion factors. */
  readonly priceIndices: readonly PriceIndex[];
  readonly lineItems: readonly HyperinflationLineItem[];
  /** True if the economy qualifies as hyperinflationary per IAS 29.3. */
  readonly isHyperinflationaryEconomy: boolean;
  /** 3-year cumulative inflation rate in basis points (×10000). */
  readonly cumulativeInflationBps: bigint;
}

export interface RestatedLineItem {
  readonly accountCode: string;
  readonly accountName: string;
  readonly classification: 'MONETARY' | 'NON_MONETARY';
  readonly historicalAmount: bigint;
  readonly conversionFactor: bigint;
  readonly restatedAmount: bigint;
  readonly gainLossOnRestatement: bigint;
}

export interface HyperinflationResult {
  readonly entityId: string;
  readonly entityName: string;
  readonly isHyperinflationaryEconomy: boolean;
  readonly cumulativeInflationBps: bigint;
  readonly currentPriceIndex: bigint;
  readonly restatedItems: readonly RestatedLineItem[];
  readonly totalHistoricalAmount: bigint;
  readonly totalRestatedAmount: bigint;
  readonly totalGainLoss: bigint;
  readonly monetaryItemCount: number;
  readonly nonMonetaryItemCount: number;
  /** Net monetary position gain/loss (IAS 29.28). */
  readonly netMonetaryGainLoss: bigint;
}

/**
 * Restates financial statement items per IAS 29.
 *
 * Rules:
 * - Monetary items (cash, receivables, payables) are NOT restated —
 *   they are already expressed in current purchasing power.
 * - Non-monetary items (PPE, inventory at cost, equity, revenue, expenses)
 *   are restated by applying the conversion factor:
 *   Restated = Historical × (Current Index / Origin Index)
 * - The gain/loss on net monetary position is recognized in profit or loss.
 */
export function restateForHyperinflation(
  input: HyperinflationInput
): CalculatorResult<HyperinflationResult> {
  if (input.lineItems.length === 0) {
    throw new Error('At least one line item required for hyperinflation restatement');
  }

  if (!input.isHyperinflationaryEconomy) {
    // IAS 29 does not apply — return items unchanged
    const restatedItems: RestatedLineItem[] = input.lineItems.map((item) => ({
      accountCode: item.accountCode,
      accountName: item.accountName,
      classification: item.classification,
      historicalAmount: item.historicalAmount,
      conversionFactor: 10000n,
      restatedAmount: item.historicalAmount,
      gainLossOnRestatement: 0n,
    }));

    return {
      result: {
        entityId: input.entityId,
        entityName: input.entityName,
        isHyperinflationaryEconomy: false,
        cumulativeInflationBps: input.cumulativeInflationBps,
        currentPriceIndex: input.currentPriceIndex,
        restatedItems,
        totalHistoricalAmount: input.lineItems.reduce((s, i) => s + i.historicalAmount, 0n),
        totalRestatedAmount: input.lineItems.reduce((s, i) => s + i.historicalAmount, 0n),
        totalGainLoss: 0n,
        monetaryItemCount: input.lineItems.filter((i) => i.classification === 'MONETARY').length,
        nonMonetaryItemCount: input.lineItems.filter((i) => i.classification === 'NON_MONETARY')
          .length,
        netMonetaryGainLoss: 0n,
      },
      inputs: { entityId: input.entityId, isHyperinflationaryEconomy: false },
      explanation: `Hyperinflation: ${input.entityName} — NOT a hyperinflationary economy, no restatement applied`,
    };
  }

  // Build index lookup
  const indexMap = new Map<string, bigint>();
  for (const idx of input.priceIndices) {
    indexMap.set(idx.periodId, idx.indexValue);
  }

  const restatedItems: RestatedLineItem[] = [];
  let totalHistorical = 0n;
  let totalRestated = 0n;
  let totalGainLoss = 0n;
  let monetaryGainLoss = 0n;

  for (const item of input.lineItems) {
    totalHistorical += item.historicalAmount;

    if (item.classification === 'MONETARY') {
      // Monetary items are not restated
      restatedItems.push({
        accountCode: item.accountCode,
        accountName: item.accountName,
        classification: 'MONETARY',
        historicalAmount: item.historicalAmount,
        conversionFactor: 10000n,
        restatedAmount: item.historicalAmount,
        gainLossOnRestatement: 0n,
      });
      totalRestated += item.historicalAmount;
      // Monetary items lose purchasing power during inflation
      const originIndex = indexMap.get(item.originPeriodId);
      if (originIndex && originIndex > 0n) {
        const wouldBeRestated = (item.historicalAmount * input.currentPriceIndex) / originIndex;
        monetaryGainLoss += item.historicalAmount - wouldBeRestated;
      }
    } else {
      // Non-monetary: restate using price index ratio
      const originIndex = indexMap.get(item.originPeriodId);
      let conversionFactor = 10000n;
      let restatedAmount = item.historicalAmount;

      if (originIndex && originIndex > 0n) {
        // Conversion factor = Current Index / Origin Index (×10000)
        conversionFactor = (input.currentPriceIndex * 10000n) / originIndex;
        restatedAmount = (item.historicalAmount * input.currentPriceIndex) / originIndex;
      }

      const gainLoss = restatedAmount - item.historicalAmount;
      totalGainLoss += gainLoss;
      totalRestated += restatedAmount;

      restatedItems.push({
        accountCode: item.accountCode,
        accountName: item.accountName,
        classification: 'NON_MONETARY',
        historicalAmount: item.historicalAmount,
        conversionFactor,
        restatedAmount,
        gainLossOnRestatement: gainLoss,
      });
    }
  }

  const monetaryCount = input.lineItems.filter((i) => i.classification === 'MONETARY').length;
  const nonMonetaryCount = input.lineItems.filter(
    (i) => i.classification === 'NON_MONETARY'
  ).length;

  return {
    result: {
      entityId: input.entityId,
      entityName: input.entityName,
      isHyperinflationaryEconomy: true,
      cumulativeInflationBps: input.cumulativeInflationBps,
      currentPriceIndex: input.currentPriceIndex,
      restatedItems,
      totalHistoricalAmount: totalHistorical,
      totalRestatedAmount: totalRestated,
      totalGainLoss,
      monetaryItemCount: monetaryCount,
      nonMonetaryItemCount: nonMonetaryCount,
      netMonetaryGainLoss: monetaryGainLoss,
    },
    inputs: {
      entityId: input.entityId,
      lineItemCount: input.lineItems.length,
      currentPriceIndex: input.currentPriceIndex.toString(),
      cumulativeInflationBps: input.cumulativeInflationBps.toString(),
    },
    explanation:
      `Hyperinflation (IAS 29): ${input.entityName}, ` +
      `${nonMonetaryCount} non-monetary items restated, ${monetaryCount} monetary items unchanged, ` +
      `total gain/loss on restatement=${totalGainLoss}, net monetary gain/loss=${monetaryGainLoss}`,
  };
}
