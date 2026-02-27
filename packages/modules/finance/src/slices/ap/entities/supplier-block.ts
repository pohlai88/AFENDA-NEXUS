export type SupplierBlockType =
  | 'PURCHASING_BLOCK'
  | 'POSTING_BLOCK'
  | 'PAYMENT_BLOCK'
  | 'FULL_BLOCK';

export type SupplierBlockScope = 'ALL_COMPANIES' | 'SPECIFIC_COMPANY' | 'SPECIFIC_SITE';

export type SupplierBlockAction = 'BLOCKED' | 'UNBLOCKED';

export interface SupplierBlock {
  readonly id: string;
  readonly tenantId: string;
  readonly supplierId: string;
  readonly blockType: SupplierBlockType;
  readonly scope: SupplierBlockScope;
  readonly companyId: string | null;
  readonly siteId: string | null;
  readonly reasonCode: string;
  readonly reason: string;
  readonly effectiveFrom: Date;
  readonly effectiveUntil: Date | null;
  readonly blockedBy: string;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface SupplierBlockHistoryEntry {
  readonly id: string;
  readonly tenantId: string;
  readonly supplierId: string;
  readonly blockId: string;
  readonly action: SupplierBlockAction;
  readonly blockType: SupplierBlockType;
  readonly scope: SupplierBlockScope;
  readonly companyId: string | null;
  readonly siteId: string | null;
  readonly reason: string;
  readonly performedBy: string;
  readonly performedAt: Date;
}

export interface SupplierBlacklist {
  readonly id: string;
  readonly tenantId: string;
  readonly supplierId: string;
  readonly justification: string;
  readonly blacklistedBy: string;
  readonly blacklistedAt: Date;
  readonly validFrom: Date;
  readonly validUntil: Date | null;
  readonly reversalApprovedBy: string | null;
  readonly reversalApprovedAt: Date | null;
  readonly reversalReason: string | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
