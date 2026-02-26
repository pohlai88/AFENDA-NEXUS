/**
 * Asset movement entity — tracks lifecycle events (acquisition, transfer, disposal, revaluation, impairment).
 */

export type MovementType =
  | 'ACQUISITION'
  | 'DEPRECIATION'
  | 'REVALUATION'
  | 'IMPAIRMENT'
  | 'DISPOSAL'
  | 'TRANSFER'
  | 'CAPITALIZATION';

export interface AssetMovement {
  readonly id: string;
  readonly tenantId: string;
  readonly assetId: string;
  readonly movementType: MovementType;
  readonly movementDate: Date;
  readonly amount: bigint;
  readonly currencyCode: string;
  readonly description: string | null;
  readonly fromCompanyId: string | null;
  readonly toCompanyId: string | null;
  readonly journalId: string | null;
  readonly createdBy: string;
  readonly createdAt: Date;
}
