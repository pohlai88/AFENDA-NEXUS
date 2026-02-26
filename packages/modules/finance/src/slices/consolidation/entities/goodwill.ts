/**
 * Goodwill entity — IFRS 3 goodwill arising on acquisition.
 * Amount = consideration paid − share of fair-value net assets acquired.
 */

export type GoodwillStatus = 'ACTIVE' | 'IMPAIRED' | 'DERECOGNIZED';

export interface Goodwill {
  readonly id: string;
  readonly tenantId: string;
  readonly ownershipRecordId: string;
  readonly childEntityId: string;
  readonly acquisitionDate: Date;
  readonly considerationPaid: bigint;
  readonly fairValueNetAssets: bigint;
  readonly nciAtAcquisition: bigint;
  readonly goodwillAmount: bigint;
  readonly accumulatedImpairment: bigint;
  readonly carryingAmount: bigint;
  readonly currencyCode: string;
  readonly status: GoodwillStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
