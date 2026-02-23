/**
 * @see FX-03 — FX triangulation: derive cross rates via common base
 * @see FX-04 — Rate source audit: validate rate freshness and spread
 *
 * Pure calculator — no I/O, no side effects.
 * Computes cross rates by triangulating through a common base currency
 * when a direct rate is unavailable.
 */
import type { CalculatorResult } from "./journal-balance.js";

export interface RateEntry {
  readonly fromCurrency: string;
  readonly toCurrency: string;
  readonly rate: number;
  readonly rateDate: string;
  readonly source: string;
}

export interface TriangulatedRate {
  readonly fromCurrency: string;
  readonly toCurrency: string;
  readonly rate: number;
  readonly method: "direct" | "triangulated" | "inverse";
  readonly baseCurrency?: string;
  readonly leg1Rate?: number;
  readonly leg2Rate?: number;
}

export interface TriangulationResult {
  readonly rate: TriangulatedRate;
  readonly confidence: "high" | "medium" | "low";
}

/**
 * Finds a rate between two currencies, trying in order:
 * 1. Direct rate (FROM → TO)
 * 2. Inverse rate (TO → FROM, inverted)
 * 3. Triangulation via base currency (FROM → BASE → TO)
 */
export function triangulateRate(
  fromCurrency: string,
  toCurrency: string,
  availableRates: readonly RateEntry[],
  baseCurrency: string = "USD",
): CalculatorResult<TriangulationResult> {
  if (fromCurrency === toCurrency) {
    return {
      result: {
        rate: {
          fromCurrency,
          toCurrency,
          rate: 1.0,
          method: "direct",
        },
        confidence: "high",
      },
      inputs: { fromCurrency, toCurrency, baseCurrency },
      explanation: `Same currency ${fromCurrency} → ${toCurrency}: rate = 1.0`,
    };
  }

  // 1. Try direct rate
  const direct = availableRates.find(
    (r) => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency,
  );
  if (direct) {
    return {
      result: {
        rate: {
          fromCurrency,
          toCurrency,
          rate: direct.rate,
          method: "direct",
        },
        confidence: "high",
      },
      inputs: { fromCurrency, toCurrency, source: direct.source },
      explanation: `Direct rate ${fromCurrency} → ${toCurrency}: ${direct.rate} (source: ${direct.source})`,
    };
  }

  // 2. Try inverse rate
  const inverse = availableRates.find(
    (r) => r.fromCurrency === toCurrency && r.toCurrency === fromCurrency,
  );
  if (inverse && inverse.rate > 0) {
    const invertedRate = 1 / inverse.rate;
    return {
      result: {
        rate: {
          fromCurrency,
          toCurrency,
          rate: invertedRate,
          method: "inverse",
        },
        confidence: "medium",
      },
      inputs: { fromCurrency, toCurrency, inverseRate: inverse.rate },
      explanation: `Inverse rate ${toCurrency} → ${fromCurrency}: ${inverse.rate}, inverted to ${invertedRate}`,
    };
  }

  // 3. Try triangulation via base currency
  const leg1 = availableRates.find(
    (r) => r.fromCurrency === fromCurrency && r.toCurrency === baseCurrency,
  ) ?? availableRates.find(
    (r) => r.fromCurrency === baseCurrency && r.toCurrency === fromCurrency,
  );

  const leg2 = availableRates.find(
    (r) => r.fromCurrency === baseCurrency && r.toCurrency === toCurrency,
  ) ?? availableRates.find(
    (r) => r.fromCurrency === toCurrency && r.toCurrency === baseCurrency,
  );

  if (leg1 && leg2) {
    // Normalize legs to FROM→BASE and BASE→TO
    const leg1Rate =
      leg1.fromCurrency === fromCurrency ? leg1.rate : 1 / leg1.rate;
    const leg2Rate =
      leg2.fromCurrency === baseCurrency ? leg2.rate : 1 / leg2.rate;

    const crossRate = leg1Rate * leg2Rate;

    return {
      result: {
        rate: {
          fromCurrency,
          toCurrency,
          rate: crossRate,
          method: "triangulated",
          baseCurrency,
          leg1Rate,
          leg2Rate,
        },
        confidence: "low",
      },
      inputs: { fromCurrency, toCurrency, baseCurrency, leg1Rate, leg2Rate },
      explanation: `Triangulated ${fromCurrency} → ${baseCurrency} → ${toCurrency}: ${leg1Rate} × ${leg2Rate} = ${crossRate}`,
    };
  }

  throw new Error(
    `No rate path found for ${fromCurrency} → ${toCurrency} (tried direct, inverse, triangulation via ${baseCurrency})`,
  );
}

// ── Rate Source Audit ────────────────────────────────────────────────

export interface RateAuditIssue {
  readonly rateEntry: RateEntry;
  readonly issue: "stale" | "wide_spread" | "zero_rate" | "negative_rate" | "duplicate";
  readonly detail: string;
}

export interface RateAuditResult {
  readonly totalRates: number;
  readonly issues: readonly RateAuditIssue[];
  readonly isClean: boolean;
}

/**
 * Audits a set of FX rates for common issues:
 * - Stale rates (older than maxAgeDays)
 * - Zero or negative rates
 * - Wide spreads between duplicate pairs
 * - Duplicate rate entries for same pair
 */
export function auditRateSources(
  rates: readonly RateEntry[],
  referenceDate: string,
  maxAgeDays: number = 7,
  maxSpreadPct: number = 5,
): CalculatorResult<RateAuditResult> {
  const issues: RateAuditIssue[] = [];
  const refDate = new Date(referenceDate).getTime();
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

  const pairMap = new Map<string, RateEntry[]>();

  for (const rate of rates) {
    // Zero/negative check
    if (rate.rate <= 0) {
      issues.push({
        rateEntry: rate,
        issue: rate.rate === 0 ? "zero_rate" : "negative_rate",
        detail: `Rate ${rate.fromCurrency}→${rate.toCurrency} is ${rate.rate}`,
      });
      continue;
    }

    // Staleness check
    const rateDate = new Date(rate.rateDate).getTime();
    if (refDate - rateDate > maxAgeMs) {
      const ageDays = Math.round((refDate - rateDate) / (24 * 60 * 60 * 1000));
      issues.push({
        rateEntry: rate,
        issue: "stale",
        detail: `Rate ${rate.fromCurrency}→${rate.toCurrency} is ${ageDays} days old (max: ${maxAgeDays})`,
      });
    }

    // Track duplicates
    const pairKey = `${rate.fromCurrency}→${rate.toCurrency}`;
    const existing = pairMap.get(pairKey);
    if (existing) {
      existing.push(rate);
    } else {
      pairMap.set(pairKey, [rate]);
    }
  }

  // Check duplicates and spreads
  for (const [pairKey, entries] of pairMap) {
    if (entries.length > 1) {
      issues.push({
        rateEntry: entries[1],
        issue: "duplicate",
        detail: `${pairKey} has ${entries.length} entries`,
      });

      // Check spread between entries
      const rateValues = entries.map((e) => e.rate);
      const minRate = Math.min(...rateValues);
      const maxRate = Math.max(...rateValues);
      if (minRate > 0) {
        const spreadPct = ((maxRate - minRate) / minRate) * 100;
        if (spreadPct > maxSpreadPct) {
          issues.push({
            rateEntry: entries[0],
            issue: "wide_spread",
            detail: `${pairKey} spread is ${spreadPct.toFixed(2)}% (max: ${maxSpreadPct}%)`,
          });
        }
      }
    }
  }

  return {
    result: {
      totalRates: rates.length,
      issues,
      isClean: issues.length === 0,
    },
    inputs: { totalRates: rates.length, referenceDate, maxAgeDays, maxSpreadPct },
    explanation: `Rate audit: ${rates.length} rates, ${issues.length} issues found`,
  };
}
