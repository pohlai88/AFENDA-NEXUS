import type { Result } from '@afenda/core';
import type {
  SupplierBlock,
  SupplierBlockHistoryEntry,
  SupplierBlacklist,
  SupplierBlockType,
  SupplierBlockScope,
} from '../entities/supplier-block.js';

export interface CreateSupplierBlockInput {
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
}

export interface CreateSupplierBlacklistInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly justification: string;
  readonly blacklistedBy: string;
  readonly validFrom: Date;
  readonly validUntil: Date | null;
}

export interface ReverseBlacklistInput {
  readonly reversalApprovedBy: string;
  readonly reversalReason: string;
}

export interface ISupplierBlockRepo {
  createBlock(input: CreateSupplierBlockInput): Promise<Result<SupplierBlock>>;
  deactivateBlock(blockId: string, performedBy: string, reason: string): Promise<Result<void>>;
  findActiveBlocks(supplierId: string): Promise<readonly SupplierBlock[]>;
  findActiveBlocksByType(
    supplierId: string,
    blockType: SupplierBlockType,
    companyId?: string
  ): Promise<readonly SupplierBlock[]>;
  getBlockHistory(supplierId: string): Promise<readonly SupplierBlockHistoryEntry[]>;

  createBlacklist(input: CreateSupplierBlacklistInput): Promise<Result<SupplierBlacklist>>;
  reverseBlacklist(
    blacklistId: string,
    input: ReverseBlacklistInput
  ): Promise<Result<SupplierBlacklist>>;
  findActiveBlacklist(supplierId: string): Promise<SupplierBlacklist | null>;
}
