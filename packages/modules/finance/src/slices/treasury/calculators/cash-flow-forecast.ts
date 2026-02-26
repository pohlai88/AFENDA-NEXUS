/**
 * TR-01: Cash flow forecast calculator.
 * Aggregates forecast items into a projected cash position over time.
 * Pure calculator — no DB, no side effects.
 */

export interface ForecastItem {
  readonly forecastDate: Date;
  readonly forecastType: 'RECEIPTS' | 'PAYMENTS' | 'FINANCING' | 'INVESTING';
  readonly amount: bigint;
  readonly probability: number;
  readonly currencyCode: string;
}

export interface ForecastPeriod {
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly expectedReceipts: bigint;
  readonly expectedPayments: bigint;
  readonly netCashFlow: bigint;
  readonly openingBalance: bigint;
  readonly closingBalance: bigint;
}

export interface CashFlowForecastResult {
  readonly periods: readonly ForecastPeriod[];
  readonly totalExpectedReceipts: bigint;
  readonly totalExpectedPayments: bigint;
  readonly totalNetCashFlow: bigint;
  readonly currencyCode: string;
}

export function computeCashFlowForecast(
  items: readonly ForecastItem[],
  openingBalance: bigint,
  periodDays: number,
  currencyCode: string
): CashFlowForecastResult {
  if (items.length === 0) {
    return {
      periods: [],
      totalExpectedReceipts: 0n,
      totalExpectedPayments: 0n,
      totalNetCashFlow: 0n,
      currencyCode,
    };
  }

  const sorted = [...items].sort((a, b) => a.forecastDate.getTime() - b.forecastDate.getTime());
  const startDate = sorted[0]!.forecastDate;
  const endDate = sorted[sorted.length - 1]!.forecastDate;

  const periods: ForecastPeriod[] = [];
  let currentStart = new Date(startDate);
  let runningBalance = openingBalance;
  let totalReceipts = 0n;
  let totalPayments = 0n;

  while (currentStart <= endDate) {
    const periodEnd = new Date(currentStart);
    periodEnd.setDate(periodEnd.getDate() + periodDays);

    const periodItems = sorted.filter(
      (i) => i.forecastDate >= currentStart && i.forecastDate < periodEnd
    );

    let receipts = 0n;
    let payments = 0n;

    for (const item of periodItems) {
      const weighted = (item.amount * BigInt(item.probability)) / 100n;
      if (item.forecastType === 'RECEIPTS' || item.forecastType === 'FINANCING') {
        receipts += weighted;
      } else {
        payments += weighted;
      }
    }

    const netCashFlow = receipts - payments;
    const closingBalance = runningBalance + netCashFlow;

    periods.push({
      periodStart: new Date(currentStart),
      periodEnd: new Date(periodEnd),
      expectedReceipts: receipts,
      expectedPayments: payments,
      netCashFlow,
      openingBalance: runningBalance,
      closingBalance,
    });

    totalReceipts += receipts;
    totalPayments += payments;
    runningBalance = closingBalance;
    currentStart = periodEnd;
  }

  return {
    periods,
    totalExpectedReceipts: totalReceipts,
    totalExpectedPayments: totalPayments,
    totalNetCashFlow: totalReceipts - totalPayments,
    currencyCode,
  };
}
