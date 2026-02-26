/**
 * TP-04: Country-by-Country Reporting (CbCR) calculator — OECD BEPS Action 13.
 * Pure calculator — aggregates entity-level data by tax jurisdiction
 * to produce CbCR Table 1 output.
 */
import type { CalculatorResult } from '../../../shared/types.js';

export interface CbcrEntityInput {
  readonly entityId: string;
  readonly entityName: string;
  readonly taxJurisdiction: string;
  readonly revenue: bigint;
  readonly relatedPartyRevenue: bigint;
  readonly unrelatedPartyRevenue: bigint;
  readonly profitBeforeTax: bigint;
  readonly incomeTaxPaid: bigint;
  readonly incomeTaxAccrued: bigint;
  readonly statedCapital: bigint;
  readonly accumulatedEarnings: bigint;
  readonly numberOfEmployees: number;
  readonly tangibleAssets: bigint;
  readonly currencyCode: string;
}

export interface CbcrJurisdictionRow {
  readonly jurisdiction: string;
  readonly entities: readonly string[];
  readonly totalRevenue: bigint;
  readonly relatedPartyRevenue: bigint;
  readonly unrelatedPartyRevenue: bigint;
  readonly profitBeforeTax: bigint;
  readonly incomeTaxPaid: bigint;
  readonly incomeTaxAccrued: bigint;
  readonly statedCapital: bigint;
  readonly accumulatedEarnings: bigint;
  readonly numberOfEmployees: number;
  readonly tangibleAssets: bigint;
}

export interface CbcrResult {
  readonly jurisdictions: readonly CbcrJurisdictionRow[];
  readonly totalEntities: number;
  readonly totalJurisdictions: number;
}

/**
 * Aggregates entity-level data by tax jurisdiction for CbCR Table 1.
 */
export function computeCbcr(inputs: readonly CbcrEntityInput[]): CalculatorResult<CbcrResult> {
  if (inputs.length === 0) {
    throw new Error('At least one entity required');
  }

  const byJurisdiction = new Map<string, CbcrEntityInput[]>();
  for (const entity of inputs) {
    const list = byJurisdiction.get(entity.taxJurisdiction) ?? [];
    list.push(entity);
    byJurisdiction.set(entity.taxJurisdiction, list);
  }

  const jurisdictions: CbcrJurisdictionRow[] = [];
  for (const [jurisdiction, entities] of byJurisdiction) {
    jurisdictions.push({
      jurisdiction,
      entities: entities.map((e) => e.entityName),
      totalRevenue: entities.reduce((s, e) => s + e.revenue, 0n),
      relatedPartyRevenue: entities.reduce((s, e) => s + e.relatedPartyRevenue, 0n),
      unrelatedPartyRevenue: entities.reduce((s, e) => s + e.unrelatedPartyRevenue, 0n),
      profitBeforeTax: entities.reduce((s, e) => s + e.profitBeforeTax, 0n),
      incomeTaxPaid: entities.reduce((s, e) => s + e.incomeTaxPaid, 0n),
      incomeTaxAccrued: entities.reduce((s, e) => s + e.incomeTaxAccrued, 0n),
      statedCapital: entities.reduce((s, e) => s + e.statedCapital, 0n),
      accumulatedEarnings: entities.reduce((s, e) => s + e.accumulatedEarnings, 0n),
      numberOfEmployees: entities.reduce((s, e) => s + e.numberOfEmployees, 0),
      tangibleAssets: entities.reduce((s, e) => s + e.tangibleAssets, 0n),
    });
  }

  return {
    result: {
      jurisdictions,
      totalEntities: inputs.length,
      totalJurisdictions: jurisdictions.length,
    },
    inputs: { count: inputs.length },
    explanation: `CbCR: ${inputs.length} entities across ${jurisdictions.length} jurisdictions`,
  };
}
