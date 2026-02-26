/**
 * Provision movement entity — tracks utilisation, reversal, unwinding, remeasurement.
 */

export type ProvisionMovementType =
  | 'INITIAL_RECOGNITION'
  | 'UNWINDING_DISCOUNT'
  | 'UTILISATION'
  | 'REVERSAL'
  | 'REMEASUREMENT';

export interface ProvisionMovement {
  readonly id: string;
  readonly tenantId: string;
  readonly provisionId: string;
  readonly movementDate: Date;
  readonly movementType: ProvisionMovementType;
  readonly amount: bigint;
  readonly balanceAfter: bigint;
  readonly description: string;
  readonly journalId: string | null;
  readonly currencyCode: string;
  readonly createdBy: string;
  readonly createdAt: Date;
}
