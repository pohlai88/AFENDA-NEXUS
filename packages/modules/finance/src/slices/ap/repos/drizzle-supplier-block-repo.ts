import { eq, and, sql } from 'drizzle-orm';
import { ok, err, AppError } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { TenantTx } from '@afenda/db';
import { supplierBlocks, supplierBlockHistory, supplierBlacklists } from '@afenda/db';
import type {
  SupplierBlock,
  SupplierBlockHistoryEntry,
  SupplierBlacklist,
} from '../entities/supplier-block.js';
import type {
  ISupplierBlockRepo,
  CreateSupplierBlockInput,
  CreateSupplierBlacklistInput,
  ReverseBlacklistInput,
} from '../ports/supplier-block-repo.js';
import type { SupplierBlockType } from '../entities/supplier-block.js';

type BlockRow = typeof supplierBlocks.$inferSelect;
type HistoryRow = typeof supplierBlockHistory.$inferSelect;
type BlacklistRow = typeof supplierBlacklists.$inferSelect;

function mapBlockToDomain(row: BlockRow): SupplierBlock {
  return {
    id: row.id,
    tenantId: row.tenantId,
    supplierId: row.supplierId,
    blockType: row.blockType as SupplierBlock['blockType'],
    scope: row.scope as SupplierBlock['scope'],
    companyId: row.companyId ?? null,
    siteId: row.siteId ?? null,
    reasonCode: row.reasonCode,
    reason: row.reason,
    effectiveFrom: row.effectiveFrom,
    effectiveUntil: row.effectiveUntil ?? null,
    blockedBy: row.blockedBy,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapHistoryToDomain(row: HistoryRow): SupplierBlockHistoryEntry {
  return {
    id: row.id,
    tenantId: row.tenantId,
    supplierId: row.supplierId,
    blockId: row.blockId,
    action: row.action as SupplierBlockHistoryEntry['action'],
    blockType: row.blockType as SupplierBlockHistoryEntry['blockType'],
    scope: row.scope as SupplierBlockHistoryEntry['scope'],
    companyId: row.companyId ?? null,
    siteId: row.siteId ?? null,
    reason: row.reason,
    performedBy: row.performedBy,
    performedAt: row.performedAt,
  };
}

function mapBlacklistToDomain(row: BlacklistRow): SupplierBlacklist {
  return {
    id: row.id,
    tenantId: row.tenantId,
    supplierId: row.supplierId,
    justification: row.justification,
    blacklistedBy: row.blacklistedBy,
    blacklistedAt: row.blacklistedAt,
    validFrom: row.validFrom,
    validUntil: row.validUntil ?? null,
    reversalApprovedBy: row.reversalApprovedBy ?? null,
    reversalApprovedAt: row.reversalApprovedAt ?? null,
    reversalReason: row.reversalReason ?? null,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleSupplierBlockRepo implements ISupplierBlockRepo {
  constructor(private readonly tx: TenantTx) { }

  async createBlock(input: CreateSupplierBlockInput): Promise<Result<SupplierBlock>> {
    const [row] = await this.tx
      .insert(supplierBlocks)
      .values({
        tenantId: input.tenantId,
        supplierId: input.supplierId,
        blockType: input.blockType,
        scope: input.scope,
        companyId: input.companyId,
        siteId: input.siteId,
        reasonCode: input.reasonCode,
        reason: input.reason,
        effectiveFrom: input.effectiveFrom,
        effectiveUntil: input.effectiveUntil,
        blockedBy: input.blockedBy,
        isActive: true,
      })
      .returning();
    if (!row) return err(new AppError('INTERNAL', 'Failed to insert block'));

    await this.tx.insert(supplierBlockHistory).values({
      tenantId: input.tenantId,
      supplierId: input.supplierId,
      blockId: row.id,
      action: 'BLOCKED',
      blockType: input.blockType,
      scope: input.scope,
      companyId: input.companyId,
      siteId: input.siteId,
      reason: input.reason,
      performedBy: input.blockedBy,
    });

    return ok(mapBlockToDomain(row));
  }

  async deactivateBlock(blockId: string, performedBy: string, reason: string): Promise<Result<void>> {
    const [row] = await this.tx
      .update(supplierBlocks)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(supplierBlocks.id, blockId))
      .returning();

    if (!row) return err(new AppError('NOT_FOUND', 'Block not found'));

    await this.tx.insert(supplierBlockHistory).values({
      tenantId: row.tenantId,
      supplierId: row.supplierId,
      blockId: row.id,
      action: 'UNBLOCKED',
      blockType: row.blockType,
      scope: row.scope,
      companyId: row.companyId,
      siteId: row.siteId,
      reason,
      performedBy,
    });

    return ok(undefined);
  }

  async findActiveBlocks(supplierId: string): Promise<readonly SupplierBlock[]> {
    const rows = await this.tx
      .select()
      .from(supplierBlocks)
      .where(and(eq(supplierBlocks.supplierId, supplierId), eq(supplierBlocks.isActive, true)));
    return rows.map(mapBlockToDomain);
  }

  async findActiveBlocksByType(
    supplierId: string,
    blockType: SupplierBlockType,
    companyId?: string
  ): Promise<readonly SupplierBlock[]> {
    const conditions = [
      eq(supplierBlocks.supplierId, supplierId),
      eq(supplierBlocks.isActive, true),
      eq(supplierBlocks.blockType, blockType),
    ];
    if (companyId) {
      conditions.push(
        sql`(${supplierBlocks.scope} = 'ALL_COMPANIES' OR ${supplierBlocks.companyId} = ${companyId})`
      );
    }
    const rows = await this.tx.select().from(supplierBlocks).where(and(...conditions));
    return rows.map(mapBlockToDomain);
  }

  async getBlockHistory(supplierId: string): Promise<readonly SupplierBlockHistoryEntry[]> {
    const rows = await this.tx
      .select()
      .from(supplierBlockHistory)
      .where(eq(supplierBlockHistory.supplierId, supplierId))
      .orderBy(sql`${supplierBlockHistory.performedAt} DESC`);
    return rows.map(mapHistoryToDomain);
  }

  async createBlacklist(input: CreateSupplierBlacklistInput): Promise<Result<SupplierBlacklist>> {
    const [row] = await this.tx
      .insert(supplierBlacklists)
      .values({
        tenantId: input.tenantId,
        supplierId: input.supplierId,
        justification: input.justification,
        blacklistedBy: input.blacklistedBy,
        validFrom: input.validFrom,
        validUntil: input.validUntil,
        isActive: true,
      })
      .returning();
    if (!row) return err(new AppError('INTERNAL', 'Failed to insert blacklist'));
    return ok(mapBlacklistToDomain(row));
  }

  async reverseBlacklist(
    blacklistId: string,
    input: ReverseBlacklistInput
  ): Promise<Result<SupplierBlacklist>> {
    const [row] = await this.tx
      .update(supplierBlacklists)
      .set({
        isActive: false,
        reversalApprovedBy: input.reversalApprovedBy,
        reversalApprovedAt: new Date(),
        reversalReason: input.reversalReason,
        updatedAt: new Date(),
      })
      .where(eq(supplierBlacklists.id, blacklistId))
      .returning();

    if (!row) return err(new AppError('NOT_FOUND', 'Blacklist entry not found'));
    return ok(mapBlacklistToDomain(row));
  }

  async findActiveBlacklist(supplierId: string): Promise<SupplierBlacklist | null> {
    const rows = await this.tx
      .select()
      .from(supplierBlacklists)
      .where(and(eq(supplierBlacklists.supplierId, supplierId), eq(supplierBlacklists.isActive, true)))
      .limit(1);
    return rows[0] ? mapBlacklistToDomain(rows[0]) : null;
  }
}
