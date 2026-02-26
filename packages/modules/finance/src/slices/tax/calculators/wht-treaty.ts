/**
 * TX-06: WHT per payee + treaty rates.
 * Extends AP-07 with full treaty rate lookup and certificate generation data.
 * Pure calculator — no DB, no side effects.
 *
 * All rates are integer basis points — no float arithmetic on money.
 */

export interface TreatyRate {
  readonly sourceCountry: string;
  readonly residenceCountry: string;
  readonly incomeType: string;
  /** Domestic WHT rate in basis points (e.g. 1500 = 15.00%). */
  readonly domesticRateBps: number;
  /** Treaty-reduced rate in basis points (e.g. 1000 = 10.00%). */
  readonly treatyRateBps: number;
  readonly treatyRef: string;
  readonly effectiveFrom: Date;
  readonly effectiveTo: Date | null;
}

export interface WhtTreatyInput {
  readonly payeeId: string;
  readonly payeeCountry: string;
  readonly sourceCountry: string;
  readonly incomeType: string;
  readonly grossAmount: bigint;
  readonly hasTaxResidencyCertificate: boolean;
}

export interface WhtTreatyResult {
  readonly payeeId: string;
  readonly domesticRateBps: number;
  readonly treatyRateBps: number | null;
  readonly appliedRateBps: number;
  readonly whtAmount: bigint;
  readonly netPayable: bigint;
  readonly treatyApplied: boolean;
  readonly treatyRef: string | null;
}

/**
 * Compute WHT with treaty rate lookup.
 * Treaty rate applies only if payee has a valid tax residency certificate.
 */
export function computeWhtWithTreaty(
  input: WhtTreatyInput,
  treaties: readonly TreatyRate[],
  asOfDate: Date = new Date()
): WhtTreatyResult {
  const treaty = treaties.find(
    (t) =>
      t.sourceCountry === input.sourceCountry &&
      t.residenceCountry === input.payeeCountry &&
      t.incomeType === input.incomeType &&
      t.effectiveFrom <= asOfDate &&
      (t.effectiveTo === null || t.effectiveTo >= asOfDate)
  );

  const domesticRateBps = treaty?.domesticRateBps ?? 0;
  const treatyRateBps = treaty?.treatyRateBps ?? null;

  const treatyApplied = treatyRateBps !== null && input.hasTaxResidencyCertificate;
  const appliedRateBps = treatyApplied ? treatyRateBps! : domesticRateBps;

  const whtAmount = (input.grossAmount * BigInt(appliedRateBps)) / 10000n;
  const netPayable = input.grossAmount - whtAmount;

  return {
    payeeId: input.payeeId,
    domesticRateBps,
    treatyRateBps,
    appliedRateBps,
    whtAmount,
    netPayable,
    treatyApplied,
    treatyRef: treatyApplied && treaty ? treaty.treatyRef : null,
  };
}

/**
 * Batch compute WHT for multiple payees.
 */
export function computeBatchWht(
  inputs: readonly WhtTreatyInput[],
  treaties: readonly TreatyRate[],
  asOfDate?: Date
): readonly WhtTreatyResult[] {
  return inputs.map((input) => computeWhtWithTreaty(input, treaties, asOfDate));
}
