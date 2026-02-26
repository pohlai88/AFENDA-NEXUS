/**
 * DT-01: Temporary difference identification — IAS 12.
 * Pure calculator — identifies taxable and deductible temporary differences
 * between carrying amount and tax base.
 */
import type { CalculatorResult } from '../../../shared/types.js';

export type TempDiffType = 'TAXABLE' | 'DEDUCTIBLE';
export type TempDiffOrigin =
  | 'DEPRECIATION'
  | 'PROVISIONS'
  | 'UNREALIZED_GAINS'
  | 'LEASE_LIABILITY'
  | 'INTANGIBLES'
  | 'FAIR_VALUE_ADJUSTMENT'
  | 'TAX_LOSSES'
  | 'OTHER';

export interface TempDiffInput {
  readonly itemId: string;
  readonly itemName: string;
  readonly origin: TempDiffOrigin;
  readonly carryingAmount: bigint;
  readonly taxBase: bigint;
  readonly currencyCode: string;
}

export interface TempDiffResult {
  readonly itemId: string;
  readonly itemName: string;
  readonly origin: TempDiffOrigin;
  readonly difference: bigint;
  readonly type: TempDiffType;
  readonly absDifference: bigint;
}

/**
 * IAS 12 temporary differences:
 * - Carrying > Tax base → Taxable (future tax payable)
 * - Carrying < Tax base → Deductible (future tax relief)
 */
export function identifyTemporaryDifferences(
  inputs: readonly TempDiffInput[]
): CalculatorResult<readonly TempDiffResult[]> {
  if (inputs.length === 0) {
    throw new Error('At least one item required');
  }

  const results: TempDiffResult[] = inputs.map((input) => {
    const difference = input.carryingAmount - input.taxBase;
    const type: TempDiffType = difference >= 0n ? 'TAXABLE' : 'DEDUCTIBLE';
    const absDifference = difference < 0n ? -difference : difference;

    return {
      itemId: input.itemId,
      itemName: input.itemName,
      origin: input.origin,
      difference,
      type,
      absDifference,
    };
  });

  const taxable = results.filter((r) => r.type === 'TAXABLE');
  const deductible = results.filter((r) => r.type === 'DEDUCTIBLE');

  return {
    result: results,
    inputs: { count: inputs.length },
    explanation: `Temp diffs: ${taxable.length} taxable, ${deductible.length} deductible`,
  };
}
