/**
 * TX-02: Tax code hierarchy lookup.
 * Resolves the applicable tax rate by walking the jurisdiction tree
 * (country → state → city), returning the most specific match.
 * Pure calculator — no DB, no side effects.
 */

import type { TaxCode } from '../entities/tax-code.js';
import type { TaxRate } from '../entities/tax-rate.js';

export interface TaxLookupAddress {
  readonly countryCode: string;
  readonly stateCode?: string | null;
  readonly cityCode?: string | null;
}

export interface TaxLookupResult {
  readonly taxCode: TaxCode;
  readonly taxRate: TaxRate;
  readonly jurisdictionPath: readonly string[];
}

/**
 * Find the most specific tax code + rate for a given address.
 * Walks city → state → country, returning the first match.
 */
export function lookupTaxCode(
  address: TaxLookupAddress,
  codes: readonly TaxCode[],
  rates: readonly TaxRate[],
  asOfDate: Date = new Date()
): TaxLookupResult | null {
  const activeCodes = codes.filter((c) => c.isActive);

  // Try city-level first
  if (address.cityCode) {
    const cityCode = activeCodes.find(
      (c) =>
        c.countryCode === address.countryCode &&
        c.stateCode === address.stateCode &&
        c.cityCode === address.cityCode
    );
    if (cityCode) {
      const rate = findActiveRate(cityCode.id, rates, asOfDate);
      if (rate) {
        return {
          taxCode: cityCode,
          taxRate: rate,
          jurisdictionPath: [address.countryCode, address.stateCode!, address.cityCode],
        };
      }
    }
  }

  // Try state-level
  if (address.stateCode) {
    const stateCode = activeCodes.find(
      (c) =>
        c.countryCode === address.countryCode &&
        c.stateCode === address.stateCode &&
        c.jurisdictionLevel === 'STATE'
    );
    if (stateCode) {
      const rate = findActiveRate(stateCode.id, rates, asOfDate);
      if (rate) {
        return {
          taxCode: stateCode,
          taxRate: rate,
          jurisdictionPath: [address.countryCode, address.stateCode],
        };
      }
    }
  }

  // Fall back to country-level
  const countryCode = activeCodes.find(
    (c) => c.countryCode === address.countryCode && c.jurisdictionLevel === 'COUNTRY'
  );
  if (countryCode) {
    const rate = findActiveRate(countryCode.id, rates, asOfDate);
    if (rate) {
      return {
        taxCode: countryCode,
        taxRate: rate,
        jurisdictionPath: [address.countryCode],
      };
    }
  }

  return null;
}

function findActiveRate(
  taxCodeId: string,
  rates: readonly TaxRate[],
  asOfDate: Date
): TaxRate | null {
  return (
    rates.find(
      (r) =>
        r.taxCodeId === taxCodeId &&
        r.isActive &&
        r.effectiveFrom <= asOfDate &&
        (r.effectiveTo === null || r.effectiveTo >= asOfDate)
    ) ?? null
  );
}

/**
 * Compute compound tax for jurisdictions with stacked rates (e.g. US state + city).
 * Returns total effective rate and per-jurisdiction breakdown.
 */
export interface CompoundTaxResult {
  /** Total rate in basis points (e.g. 750 = 7.50%). */
  readonly totalRateBps: number;
  readonly breakdown: readonly { jurisdictionCode: string; rateBps: number }[];
  readonly taxAmount: bigint;
}

/**
 * Compute compound tax for stacked jurisdiction rates.
 * All rates are integer basis points — no float arithmetic on money.
 */
export function computeCompoundTax(
  taxableAmount: bigint,
  applicableRates: readonly { jurisdictionCode: string; rateBps: number }[]
): CompoundTaxResult {
  let totalRateBps = 0;
  for (const r of applicableRates) {
    totalRateBps += r.rateBps;
  }

  const taxAmount = (taxableAmount * BigInt(totalRateBps)) / 10000n;

  return {
    totalRateBps,
    breakdown: applicableRates,
    taxAmount,
  };
}
