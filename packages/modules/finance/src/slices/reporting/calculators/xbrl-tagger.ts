/**
 * SR-05: XBRL tagging calculator.
 * Pure calculator — maps financial data to XBRL taxonomy elements
 * and produces tagged XML fragments for iXBRL filing.
 */
import type { CalculatorResult } from '../../../shared/types.js';

export type XbrlTaxonomy = 'IFRS_FULL' | 'IFRS_SME' | 'US_GAAP';

export interface XbrlTagMapping {
  readonly accountId: string;
  readonly xbrlElement: string;
  readonly xbrlNamespace: string;
  readonly periodType: 'instant' | 'duration';
  readonly balanceType: 'debit' | 'credit' | 'none';
}

export interface FinancialDataPoint {
  readonly accountId: string;
  readonly label: string;
  readonly value: bigint;
  readonly currencyCode: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly isInstant: boolean;
}

export interface XbrlTaggedFact {
  readonly xbrlElement: string;
  readonly xbrlNamespace: string;
  readonly contextRef: string;
  readonly unitRef: string;
  readonly value: string;
  readonly decimals: string;
  readonly label: string;
  readonly xmlFragment: string;
}

export interface XbrlResult {
  readonly facts: readonly XbrlTaggedFact[];
  readonly unmappedAccounts: readonly string[];
  readonly taxonomy: XbrlTaxonomy;
}

/**
 * Tags financial data points with XBRL elements.
 * Produces XML fragments suitable for iXBRL inline filing.
 */
export function tagWithXbrl(
  dataPoints: readonly FinancialDataPoint[],
  mappings: readonly XbrlTagMapping[],
  taxonomy: XbrlTaxonomy,
  entityId: string
): CalculatorResult<XbrlResult> {
  if (dataPoints.length === 0) {
    throw new Error('At least one data point required');
  }

  const mappingMap = new Map(mappings.map((m) => [m.accountId, m]));
  const facts: XbrlTaggedFact[] = [];
  const unmappedAccounts: string[] = [];

  for (const dp of dataPoints) {
    const mapping = mappingMap.get(dp.accountId);
    if (!mapping) {
      unmappedAccounts.push(dp.accountId);
      continue;
    }

    const contextRef = dp.isInstant
      ? `ctx_${dp.periodEnd}`
      : `ctx_${dp.periodStart}_${dp.periodEnd}`;
    const unitRef = `u_${dp.currencyCode}`;
    const valueStr = dp.value.toString();

    const xmlFragment = dp.isInstant
      ? `<${mapping.xbrlNamespace}:${mapping.xbrlElement} contextRef="${contextRef}" unitRef="${unitRef}" decimals="0">${valueStr}</${mapping.xbrlNamespace}:${mapping.xbrlElement}>`
      : `<${mapping.xbrlNamespace}:${mapping.xbrlElement} contextRef="${contextRef}" unitRef="${unitRef}" decimals="0">${valueStr}</${mapping.xbrlNamespace}:${mapping.xbrlElement}>`;

    facts.push({
      xbrlElement: mapping.xbrlElement,
      xbrlNamespace: mapping.xbrlNamespace,
      contextRef,
      unitRef,
      value: valueStr,
      decimals: '0',
      label: dp.label,
      xmlFragment,
    });
  }

  return {
    result: { facts, unmappedAccounts, taxonomy },
    inputs: { dataPointCount: dataPoints.length, mappingCount: mappings.length, entityId },
    explanation: `XBRL tagging: ${facts.length}/${dataPoints.length} facts tagged, ${unmappedAccounts.length} unmapped`,
  };
}
