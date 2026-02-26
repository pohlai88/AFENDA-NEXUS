/**
 * BR-10: Intraday balance monitoring calculator.
 * Computes running balance from statement lines within a day.
 * Pure calculator — no DB, no side effects.
 */

export interface IntradayTransaction {
  readonly lineId: string;
  readonly transactionDate: Date;
  readonly transactionType: 'DEBIT' | 'CREDIT';
  readonly amount: bigint;
  readonly description: string;
  readonly reference: string | null;
}

export interface IntradayBalancePoint {
  readonly lineId: string;
  readonly runningBalance: bigint;
  readonly transactionAmount: bigint;
  readonly direction: 'DEBIT' | 'CREDIT';
  readonly description: string;
}

export interface IntradayBalanceResult {
  readonly bankAccountId: string;
  readonly date: Date;
  readonly openingBalance: bigint;
  readonly closingBalance: bigint;
  readonly highWaterMark: bigint;
  readonly lowWaterMark: bigint;
  readonly points: readonly IntradayBalancePoint[];
  readonly currencyCode: string;
}

export function computeIntradayBalance(
  bankAccountId: string,
  date: Date,
  openingBalance: bigint,
  transactions: readonly IntradayTransaction[],
  currencyCode: string
): IntradayBalanceResult {
  let running = openingBalance;
  let high = openingBalance;
  let low = openingBalance;
  const points: IntradayBalancePoint[] = [];

  for (const tx of transactions) {
    const delta = tx.transactionType === 'CREDIT' ? tx.amount : -tx.amount;
    running += delta;
    if (running > high) high = running;
    if (running < low) low = running;
    points.push({
      lineId: tx.lineId,
      runningBalance: running,
      transactionAmount: tx.amount,
      direction: tx.transactionType,
      description: tx.description,
    });
  }

  return {
    bankAccountId,
    date,
    openingBalance,
    closingBalance: running,
    highWaterMark: high,
    lowWaterMark: low,
    points,
    currencyCode,
  };
}
