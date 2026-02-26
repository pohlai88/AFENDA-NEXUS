import type { Result } from '@afenda/core';
import { ok } from '@afenda/core';
import {
  tagWithXbrl,
  type FinancialDataPoint,
  type XbrlTagMapping,
  type XbrlTaxonomy,
  type XbrlResult,
} from '../calculators/xbrl-tagger.js';
import type { FinanceContext } from '../../../shared/finance-context.js';

export interface GetXbrlTagsInput {
  readonly dataPoints: readonly FinancialDataPoint[];
  readonly mappings: readonly XbrlTagMapping[];
  readonly taxonomy: XbrlTaxonomy;
  readonly entityId: string;
}

/**
 * @see SR-05 — XBRL tagging for iXBRL filing (ACRA/SSM/SEC/HMRC)
 *
 * Wraps the pure tagWithXbrl calculator in a service layer.
 * Data points, mappings, and taxonomy are provided by the caller.
 */
export async function getXbrlTags(
  input: GetXbrlTagsInput,
  _ctx?: FinanceContext
): Promise<Result<XbrlResult>> {
  const { result } = tagWithXbrl(input.dataPoints, input.mappings, input.taxonomy, input.entityId);
  return ok(result);
}
