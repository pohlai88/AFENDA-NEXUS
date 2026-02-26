/**
 * SR-08: Going concern assessment calculator (ISA 570 / IAS 1 §25–26).
 * Pure calculator — aggregates cash flow adequacy, debt maturity,
 * working capital, and covenant compliance into a single assessment.
 *
 * All monetary inputs are bigint (minor units).
 */
import type { CalculatorResult } from '../../../shared/types.js';

export interface GoingConcernInput {
  /** Projected net cash flow for the next 12 months (positive = inflow). */
  readonly projectedCashFlow12m: bigint;
  /** Total debt maturing within the next 12 months. */
  readonly debtMaturingWithin12m: bigint;
  /** Cash and cash equivalents at assessment date. */
  readonly cashAndEquivalents: bigint;
  /** Undrawn committed credit facilities. */
  readonly undrawnFacilities: bigint;
  /** Current assets at assessment date. */
  readonly currentAssets: bigint;
  /** Current liabilities at assessment date. */
  readonly currentLiabilities: bigint;
  /** Net profit/loss for the most recent period. */
  readonly netProfitLoss: bigint;
  /** Accumulated losses (negative retained earnings), if any. 0 if positive. */
  readonly accumulatedLosses: bigint;
  /** Total equity at assessment date. */
  readonly totalEquity: bigint;
  /** Total assets at assessment date. */
  readonly totalAssets: bigint;
  /** Covenant test results — each true if covenant is breached. */
  readonly covenantBreaches?: readonly CovenantBreach[];
  /** Material subsequent events affecting going concern. */
  readonly subsequentEvents?: readonly SubsequentEvent[];
}

export interface CovenantBreach {
  readonly covenantName: string;
  readonly isBreached: boolean;
  /** Whether a waiver has been obtained from the lender. */
  readonly waiverObtained: boolean;
}

export interface SubsequentEvent {
  readonly description: string;
  readonly impactSeverity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export type GoingConcernConclusion =
  | 'NO_MATERIAL_UNCERTAINTY'
  | 'MATERIAL_UNCERTAINTY_EXISTS'
  | 'GOING_CONCERN_DOUBT';

export interface GoingConcernResult {
  readonly conclusion: GoingConcernConclusion;
  readonly indicators: readonly GoingConcernIndicator[];
  readonly cashFlowAdequacy: CashFlowAdequacy;
  readonly workingCapitalPosition: WorkingCapitalPosition;
  readonly covenantSummary: CovenantSummary;
  readonly riskScore: number;
}

export interface GoingConcernIndicator {
  readonly category: 'FINANCIAL' | 'OPERATING' | 'OTHER';
  readonly description: string;
  readonly severity: 'HIGH' | 'MEDIUM' | 'LOW';
  readonly isTriggered: boolean;
}

export interface CashFlowAdequacy {
  /** Projected cash + facilities - debt maturing = net liquidity headroom. */
  readonly netLiquidityHeadroom: bigint;
  /** True if projected cash flow covers maturing debt. */
  readonly isAdequate: boolean;
  /** Coverage ratio: (Cash + Facilities + Projected CF) / Debt Maturing (×10000). */
  readonly coverageRatio: bigint;
}

export interface WorkingCapitalPosition {
  readonly netWorkingCapital: bigint;
  readonly currentRatio: bigint;
  readonly isPositive: boolean;
}

export interface CovenantSummary {
  readonly totalCovenants: number;
  readonly breachedCount: number;
  readonly waivedCount: number;
  readonly unresolved: number;
}

function safeDiv(num: bigint, den: bigint, scale = 10000n): bigint {
  if (den === 0n) return 0n;
  return (num * scale) / den;
}

/**
 * Assesses going concern per ISA 570.
 *
 * Risk scoring (0–100):
 * - 0–25: No material uncertainty
 * - 26–50: Low-level indicators present, monitor closely
 * - 51–75: Material uncertainty may exist
 * - 76–100: Significant doubt about going concern
 */
export function assessGoingConcern(input: GoingConcernInput): CalculatorResult<GoingConcernResult> {
  const indicators: GoingConcernIndicator[] = [];
  let riskScore = 0;

  // ── Financial indicators ────────────────────────────────────────────────

  // 1. Net current liability position
  const nwc = input.currentAssets - input.currentLiabilities;
  if (nwc < 0n) {
    indicators.push({
      category: 'FINANCIAL',
      description: 'Net current liability position (working capital deficit)',
      severity: 'HIGH',
      isTriggered: true,
    });
    riskScore += 15;
  }

  // 2. Operating loss
  if (input.netProfitLoss < 0n) {
    indicators.push({
      category: 'FINANCIAL',
      description: 'Net loss for the period',
      severity: 'MEDIUM',
      isTriggered: true,
    });
    riskScore += 10;
  }

  // 3. Accumulated losses exceeding equity
  if (input.accumulatedLosses > 0n && input.accumulatedLosses >= input.totalEquity) {
    indicators.push({
      category: 'FINANCIAL',
      description: 'Accumulated losses exceed total equity (negative net worth)',
      severity: 'HIGH',
      isTriggered: true,
    });
    riskScore += 20;
  }

  // 4. Cash flow inadequacy
  const totalLiquidity =
    input.cashAndEquivalents + input.undrawnFacilities + input.projectedCashFlow12m;
  const netHeadroom = totalLiquidity - input.debtMaturingWithin12m;
  const coverageRatio = safeDiv(totalLiquidity, input.debtMaturingWithin12m);
  const cashAdequate = netHeadroom > 0n;

  if (!cashAdequate) {
    indicators.push({
      category: 'FINANCIAL',
      description: 'Insufficient liquidity to cover debt maturing within 12 months',
      severity: 'HIGH',
      isTriggered: true,
    });
    riskScore += 25;
  } else if (coverageRatio < 12000n) {
    // Coverage < 1.2x — tight
    indicators.push({
      category: 'FINANCIAL',
      description: 'Liquidity coverage ratio below 1.2x for maturing debt',
      severity: 'MEDIUM',
      isTriggered: true,
    });
    riskScore += 10;
  }

  // 5. Negative equity
  if (input.totalEquity <= 0n) {
    indicators.push({
      category: 'FINANCIAL',
      description: 'Negative total equity',
      severity: 'HIGH',
      isTriggered: true,
    });
    riskScore += 20;
  }

  // ── Covenant indicators ─────────────────────────────────────────────────

  const covenants = input.covenantBreaches ?? [];
  const breachedCount = covenants.filter((c) => c.isBreached).length;
  const waivedCount = covenants.filter((c) => c.isBreached && c.waiverObtained).length;
  const unresolvedBreaches = breachedCount - waivedCount;

  if (unresolvedBreaches > 0) {
    indicators.push({
      category: 'FINANCIAL',
      description: `${unresolvedBreaches} unresolved covenant breach(es) — lender may call debt`,
      severity: 'HIGH',
      isTriggered: true,
    });
    riskScore += 15 * unresolvedBreaches;
  }

  // ── Subsequent events ───────────────────────────────────────────────────

  const events = input.subsequentEvents ?? [];
  for (const event of events) {
    indicators.push({
      category: 'OTHER',
      description: `Subsequent event: ${event.description}`,
      severity: event.impactSeverity,
      isTriggered: true,
    });
    riskScore += event.impactSeverity === 'HIGH' ? 15 : event.impactSeverity === 'MEDIUM' ? 8 : 3;
  }

  // Cap risk score at 100
  riskScore = Math.min(riskScore, 100);

  // ── Conclusion ──────────────────────────────────────────────────────────

  let conclusion: GoingConcernConclusion;
  if (riskScore >= 51) {
    conclusion = riskScore >= 76 ? 'GOING_CONCERN_DOUBT' : 'MATERIAL_UNCERTAINTY_EXISTS';
  } else {
    conclusion = 'NO_MATERIAL_UNCERTAINTY';
  }

  const currentRatio = safeDiv(input.currentAssets, input.currentLiabilities);

  return {
    result: {
      conclusion,
      indicators,
      cashFlowAdequacy: {
        netLiquidityHeadroom: netHeadroom,
        isAdequate: cashAdequate,
        coverageRatio,
      },
      workingCapitalPosition: {
        netWorkingCapital: nwc,
        currentRatio,
        isPositive: nwc > 0n,
      },
      covenantSummary: {
        totalCovenants: covenants.length,
        breachedCount,
        waivedCount,
        unresolved: unresolvedBreaches,
      },
      riskScore,
    },
    inputs: {
      cashAndEquivalents: input.cashAndEquivalents.toString(),
      projectedCashFlow12m: input.projectedCashFlow12m.toString(),
      debtMaturingWithin12m: input.debtMaturingWithin12m.toString(),
      totalEquity: input.totalEquity.toString(),
    },
    explanation:
      `Going concern: ${conclusion}, risk score ${riskScore}/100, ` +
      `${indicators.filter((i) => i.isTriggered).length} indicators triggered, ` +
      `liquidity headroom=${netHeadroom}, NWC=${nwc}`,
  };
}
