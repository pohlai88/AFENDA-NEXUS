/**
 * TR-02: Cash pooling / notional pooling calculator.
 * Computes net position across multiple accounts for interest optimization.
 * Pure calculator — no DB, no side effects.
 */

export interface PoolAccount {
  readonly accountId: string;
  readonly companyId: string;
  readonly balance: bigint;
  readonly currencyCode: string;
}

export interface CashPoolingResult {
  readonly netPosition: bigint;
  readonly totalPositive: bigint;
  readonly totalNegative: bigint;
  readonly interestSavingBps: number;
  readonly accounts: readonly PoolAccount[];
  readonly currencyCode: string;
}

export function computeCashPooling(
  accounts: readonly PoolAccount[],
  currencyCode: string
): CashPoolingResult {
  let totalPositive = 0n;
  let totalNegative = 0n;

  for (const acc of accounts) {
    if (acc.balance > 0n) {
      totalPositive += acc.balance;
    } else {
      totalNegative += acc.balance;
    }
  }

  const netPosition = totalPositive + totalNegative;

  // Interest saving estimate: spread between debit and credit rates
  // Notional pooling avoids physical transfers, saving ~50-100bps
  const interestSavingBps = totalNegative < 0n ? 75 : 0;

  return {
    netPosition,
    totalPositive,
    totalNegative,
    interestSavingBps,
    accounts,
    currencyCode,
  };
}
