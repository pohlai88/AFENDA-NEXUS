/**
 * Ownership record — tracks ownership percentage between group entities over time.
 * ownershipPctBps is in basis points (e.g., 10000 = 100%).
 */

export interface OwnershipRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly parentEntityId: string;
  readonly childEntityId: string;
  readonly ownershipPctBps: number;
  readonly votingPctBps: number;
  readonly effectiveFrom: Date;
  readonly effectiveTo: Date | null;
  readonly acquisitionDate: Date;
  readonly acquisitionCost: bigint;
  readonly currencyCode: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
