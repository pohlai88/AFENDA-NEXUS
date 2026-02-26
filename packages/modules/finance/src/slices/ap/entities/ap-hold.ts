export type ApHoldType =
  | 'DUPLICATE'
  | 'MATCH_EXCEPTION'
  | 'VALIDATION'
  | 'SUPPLIER'
  | 'FX_RATE'
  | 'MANUAL';

export type ApHoldStatus = 'ACTIVE' | 'RELEASED';

export interface ApHold {
  readonly id: string;
  readonly tenantId: string;
  readonly invoiceId: string;
  readonly holdType: ApHoldType;
  readonly holdReason: string;
  readonly holdDate: Date;
  readonly releaseDate: Date | null;
  readonly releasedBy: string | null;
  readonly releaseReason: string | null;
  readonly status: ApHoldStatus;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
