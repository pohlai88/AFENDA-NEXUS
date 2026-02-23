/**
 * PA-03: Earned Value Management (EVM) calculator.
 * Computes EV, PV, AC, SPI, CPI, EAC, ETC, VAC.
 * Pure calculator — no DB, no side effects.
 */

export interface EarnedValueInput {
  readonly projectId: string;
  readonly budgetAtCompletion: bigint;
  readonly plannedValuePct: number;
  readonly completionPct: number;
  readonly actualCost: bigint;
  readonly currencyCode: string;
}

export interface EarnedValueResult {
  readonly projectId: string;
  readonly budgetAtCompletion: bigint;
  readonly plannedValue: bigint;
  readonly earnedValue: bigint;
  readonly actualCost: bigint;
  readonly scheduleVariance: bigint;
  readonly costVariance: bigint;
  /** Schedule Performance Index × 100 (integer) */
  readonly spiPct: number;
  /** Cost Performance Index × 100 (integer) */
  readonly cpiPct: number;
  readonly estimateAtCompletion: bigint;
  readonly estimateToComplete: bigint;
  readonly varianceAtCompletion: bigint;
  readonly currencyCode: string;
}

export function computeEarnedValue(input: EarnedValueInput): EarnedValueResult {
  const bac = input.budgetAtCompletion;
  const pv = (bac * BigInt(input.plannedValuePct)) / 100n;
  const ev = (bac * BigInt(input.completionPct)) / 100n;
  const ac = input.actualCost;

  const sv = ev - pv;
  const cv = ev - ac;

  const spiPct = pv > 0n ? Number((ev * 100n) / pv) : 0;
  const cpiPct = ac > 0n ? Number((ev * 100n) / ac) : 0;

  const eac = cpiPct > 0 ? (bac * 100n) / BigInt(cpiPct) : bac;
  const etc = eac > ac ? eac - ac : 0n;
  const vac = bac - eac;

  return {
    projectId: input.projectId,
    budgetAtCompletion: bac,
    plannedValue: pv,
    earnedValue: ev,
    actualCost: ac,
    scheduleVariance: sv,
    costVariance: cv,
    spiPct,
    cpiPct,
    estimateAtCompletion: eac,
    estimateToComplete: etc,
    varianceAtCompletion: vac,
    currencyCode: input.currencyCode,
  };
}
