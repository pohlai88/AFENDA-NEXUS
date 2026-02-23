/**
 * BR-08: Multi-currency reconciliation calculator.
 * Converts foreign-currency statement balances to base currency using FX rates.
 * Pure calculator — no DB, no side effects.
 * Uses integer basis points for rates (CIG-02 compliant).
 */

export interface FxRateEntry {
  readonly fromCurrency: string;
  readonly toCurrency: string;
  /** Rate in basis points: 1 unit of fromCurrency = rateBps/10000 units of toCurrency */
  readonly rateBps: number;
}

export interface MultiCurrencyReconInput {
  readonly statementBalance: bigint;
  readonly statementCurrency: string;
  readonly glBalance: bigint;
  readonly glCurrency: string;
  readonly baseCurrency: string;
  readonly fxRates: readonly FxRateEntry[];
}

export interface MultiCurrencyReconResult {
  readonly statementBalanceBase: bigint;
  readonly glBalanceBase: bigint;
  readonly fxDifference: bigint;
  readonly baseCurrency: string;
  readonly statementRateUsed: number;
  readonly glRateUsed: number;
}

/**
 * Convert both statement and GL balances to base currency and compute FX difference.
 */
export function computeMultiCurrencyRecon(input: MultiCurrencyReconInput): MultiCurrencyReconResult {
  const stmtRate = findRate(input.fxRates, input.statementCurrency, input.baseCurrency);
  const glRate = findRate(input.fxRates, input.glCurrency, input.baseCurrency);

  const statementBalanceBase = convertAmount(input.statementBalance, stmtRate);
  const glBalanceBase = convertAmount(input.glBalance, glRate);

  return {
    statementBalanceBase,
    glBalanceBase,
    fxDifference: statementBalanceBase - glBalanceBase,
    baseCurrency: input.baseCurrency,
    statementRateUsed: stmtRate,
    glRateUsed: glRate,
  };
}

function findRate(rates: readonly FxRateEntry[], from: string, to: string): number {
  if (from === to) return 10000; // 1:1
  const direct = rates.find((r) => r.fromCurrency === from && r.toCurrency === to);
  if (direct) return direct.rateBps;
  // Try inverse
  const inverse = rates.find((r) => r.fromCurrency === to && r.toCurrency === from);
  if (inverse && inverse.rateBps !== 0) return Math.round(10000 * 10000 / inverse.rateBps);
  return 10000; // fallback 1:1
}

function convertAmount(amount: bigint, rateBps: number): bigint {
  return (amount * BigInt(rateBps)) / 10000n;
}
