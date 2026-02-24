/**
 * TR-05: FX exposure reporting calculator.
 * Aggregates foreign currency exposures across entities.
 * Pure calculator — no DB, no side effects.
 */

export interface FxExposureItem {
  readonly companyId: string;
  readonly currencyCode: string;
  readonly receivables: bigint;
  readonly payables: bigint;
  readonly forecasts: bigint;
}

export interface CurrencyExposure {
  readonly currencyCode: string;
  readonly grossLong: bigint;
  readonly grossShort: bigint;
  readonly netExposure: bigint;
}

export interface FxExposureResult {
  readonly exposures: readonly CurrencyExposure[];
  readonly baseCurrencyCode: string;
  readonly totalNetExposure: bigint;
}

export function computeFxExposure(
  items: readonly FxExposureItem[],
  baseCurrencyCode: string,
): FxExposureResult {
  const byCurrency = new Map<string, { long: bigint; short: bigint }>();

  for (const item of items) {
    if (item.currencyCode === baseCurrencyCode) continue;

    const existing = byCurrency.get(item.currencyCode) ?? { long: 0n, short: 0n };
    existing.long += item.receivables + (item.forecasts > 0n ? item.forecasts : 0n);
    existing.short += item.payables + (item.forecasts < 0n ? -item.forecasts : 0n);
    byCurrency.set(item.currencyCode, existing);
  }

  const exposures: CurrencyExposure[] = [];
  let totalNet = 0n;

  for (const [currencyCode, { long: grossLong, short: grossShort }] of byCurrency) {
    const netExposure = grossLong - grossShort;
    exposures.push({ currencyCode, grossLong, grossShort, netExposure });
    totalNet += netExposure > 0n ? netExposure : -netExposure;
  }

  return {
    exposures,
    baseCurrencyCode,
    totalNetExposure: totalNet,
  };
}
