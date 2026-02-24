/**
 * TR-04: Covenant monitoring calculator.
 * Tests financial covenants and determines compliance status.
 * Pure calculator — no DB, no side effects.
 */

export interface CovenantTestInput {
  readonly covenantId: string;
  readonly covenantType: string;
  readonly thresholdValue: number;
  readonly currentValue: number;
  readonly isMinimumThreshold: boolean;
}

export type CovenantComplianceStatus = "COMPLIANT" | "WARNING" | "BREACHED";

export interface CovenantTestResult {
  readonly covenantId: string;
  readonly status: CovenantComplianceStatus;
  readonly headroom: number;
  readonly headroomPct: number;
  readonly breachAmount: number;
}

const WARNING_THRESHOLD_PCT = 10;

export function testCovenant(input: CovenantTestInput): CovenantTestResult {
  const diff = input.isMinimumThreshold
    ? input.currentValue - input.thresholdValue
    : input.thresholdValue - input.currentValue;

  const headroomPct = input.thresholdValue !== 0
    ? (diff / input.thresholdValue) * 100
    : 0;

  let status: CovenantComplianceStatus;
  if (diff < 0) {
    status = "BREACHED";
  } else if (headroomPct < WARNING_THRESHOLD_PCT) {
    status = "WARNING";
  } else {
    status = "COMPLIANT";
  }

  return {
    covenantId: input.covenantId,
    status,
    headroom: diff,
    headroomPct,
    breachAmount: diff < 0 ? -diff : 0,
  };
}
