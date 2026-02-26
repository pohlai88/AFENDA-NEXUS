/**
 * GAP-10: Currency precision registry.
 *
 * Maps ISO 4217 currency codes to their decimal precision (minor unit exponent)
 * and rounding rule. This ensures amounts are stored and computed with the
 * correct number of decimal places per currency.
 *
 * Examples:
 * - USD/EUR/GBP → 2 decimals (cents)
 * - JPY/KRW → 0 decimals (no minor unit)
 * - BHD/KWD/OMR → 3 decimals (fils)
 */

export interface CurrencyConfig {
  readonly code: string;
  readonly precision: number;
  readonly rounding: 'HALF_UP' | 'HALF_EVEN' | 'FLOOR' | 'CEIL';
}

const REGISTRY: ReadonlyMap<string, CurrencyConfig> = new Map([
  // 0-decimal currencies
  ['BIF', { code: 'BIF', precision: 0, rounding: 'HALF_UP' }],
  ['CLP', { code: 'CLP', precision: 0, rounding: 'HALF_UP' }],
  ['DJF', { code: 'DJF', precision: 0, rounding: 'HALF_UP' }],
  ['GNF', { code: 'GNF', precision: 0, rounding: 'HALF_UP' }],
  ['ISK', { code: 'ISK', precision: 0, rounding: 'HALF_UP' }],
  ['JPY', { code: 'JPY', precision: 0, rounding: 'HALF_UP' }],
  ['KMF', { code: 'KMF', precision: 0, rounding: 'HALF_UP' }],
  ['KRW', { code: 'KRW', precision: 0, rounding: 'HALF_UP' }],
  ['PYG', { code: 'PYG', precision: 0, rounding: 'HALF_UP' }],
  ['RWF', { code: 'RWF', precision: 0, rounding: 'HALF_UP' }],
  ['UGX', { code: 'UGX', precision: 0, rounding: 'HALF_UP' }],
  ['VND', { code: 'VND', precision: 0, rounding: 'HALF_UP' }],
  ['VUV', { code: 'VUV', precision: 0, rounding: 'HALF_UP' }],
  ['XAF', { code: 'XAF', precision: 0, rounding: 'HALF_UP' }],
  ['XOF', { code: 'XOF', precision: 0, rounding: 'HALF_UP' }],
  ['XPF', { code: 'XPF', precision: 0, rounding: 'HALF_UP' }],

  // 3-decimal currencies
  ['BHD', { code: 'BHD', precision: 3, rounding: 'HALF_UP' }],
  ['IQD', { code: 'IQD', precision: 3, rounding: 'HALF_UP' }],
  ['JOD', { code: 'JOD', precision: 3, rounding: 'HALF_UP' }],
  ['KWD', { code: 'KWD', precision: 3, rounding: 'HALF_UP' }],
  ['LYD', { code: 'LYD', precision: 3, rounding: 'HALF_UP' }],
  ['OMR', { code: 'OMR', precision: 3, rounding: 'HALF_UP' }],
  ['TND', { code: 'TND', precision: 3, rounding: 'HALF_UP' }],
]);

const DEFAULT_CONFIG: CurrencyConfig = { code: 'USD', precision: 2, rounding: 'HALF_UP' };

/**
 * Returns the precision config for a given ISO 4217 currency code.
 * Defaults to 2 decimal places (standard for most currencies).
 */
export function getCurrencyConfig(code: string): CurrencyConfig {
  return REGISTRY.get(code) ?? { ...DEFAULT_CONFIG, code };
}

/**
 * Returns the minor-unit multiplier for a currency.
 * e.g. USD → 100, JPY → 1, BHD → 1000
 */
export function getMinorUnitMultiplier(code: string): bigint {
  const config = getCurrencyConfig(code);
  return 10n ** BigInt(config.precision);
}
