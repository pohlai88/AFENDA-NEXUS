/**
 * @see FX-02 — Rate sourcing & effective dating
 * @see AIS A-21 — FX rate approval workflow for manual overrides
 *
 * When an FX rate is sourced manually (not from an automated feed),
 * it must go through an approval workflow before it can be used for posting.
 */

export type RateSource = 'FEED' | 'MANUAL' | 'TRIANGULATED';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface FxRateApproval {
  readonly rateId: string;
  readonly source: RateSource;
  readonly status: ApprovalStatus;
  readonly submittedBy: string;
  readonly submittedAt: Date;
  readonly reviewedBy?: string;
  readonly reviewedAt?: Date;
  readonly rejectionReason?: string;
}

export interface RateApprovalPolicy {
  readonly requireApprovalForManual: boolean;
  readonly requireApprovalForTriangulated: boolean;
  readonly maxSpreadPercent?: number;
}

export const DEFAULT_RATE_APPROVAL_POLICY: RateApprovalPolicy = {
  requireApprovalForManual: true,
  requireApprovalForTriangulated: false,
};

/**
 * Determines whether a rate requires approval before use.
 */
export function requiresApproval(
  source: RateSource,
  policy: RateApprovalPolicy = DEFAULT_RATE_APPROVAL_POLICY
): boolean {
  if (source === 'FEED') return false;
  if (source === 'MANUAL') return policy.requireApprovalForManual;
  if (source === 'TRIANGULATED') return policy.requireApprovalForTriangulated;
  return false;
}

/**
 * Validates whether a rate can be used for posting based on its approval status.
 * Returns an error message if the rate cannot be used, or null if it's OK.
 */
export function validateRateForPosting(
  approval: FxRateApproval,
  policy: RateApprovalPolicy = DEFAULT_RATE_APPROVAL_POLICY
): string | null {
  if (!requiresApproval(approval.source, policy)) return null;
  if (approval.status === 'APPROVED') return null;
  if (approval.status === 'REJECTED') {
    return `Rate ${approval.rateId} was rejected: ${approval.rejectionReason ?? 'no reason given'}`;
  }
  return `Rate ${approval.rateId} is pending approval and cannot be used for posting`;
}

/**
 * Validates that a manual rate's spread from the reference rate is within policy limits.
 * Returns an error message if the spread exceeds the policy limit, or null if OK.
 */
export function validateRateSpread(
  manualRate: number,
  referenceRate: number,
  policy: RateApprovalPolicy
): string | null {
  if (!policy.maxSpreadPercent || referenceRate === 0) return null;
  const spread = Math.abs((manualRate - referenceRate) / referenceRate) * 100;
  if (spread > policy.maxSpreadPercent) {
    return `Manual rate spread ${spread.toFixed(2)}% exceeds policy limit of ${policy.maxSpreadPercent}%`;
  }
  return null;
}
