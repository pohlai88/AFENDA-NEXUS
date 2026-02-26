/**
 * HA-01: Hedge relationship entity — IFRS 9 §6.
 */

export type HedgeType = 'FAIR_VALUE' | 'CASH_FLOW' | 'NET_INVESTMENT';
export type HedgeStatus = 'DESIGNATED' | 'ACTIVE' | 'DISCONTINUED' | 'REBALANCED';

export interface HedgeRelationship {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly hedgeType: HedgeType;
  readonly hedgingInstrumentId: string;
  readonly hedgedItemId: string;
  readonly hedgedRisk: string;
  readonly hedgeRatio: number;
  readonly designationDate: Date;
  readonly status: HedgeStatus;
  readonly discontinuationDate: Date | null;
  readonly discontinuationReason: string | null;
  readonly ociReserveBalance: bigint;
  readonly currencyCode: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
