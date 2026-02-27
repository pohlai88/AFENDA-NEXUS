import { eq, and } from 'drizzle-orm';
import { ok, err, AppError } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { TenantTx } from '@afenda/db';
import { supplierDuplicateSuspects } from '@afenda/db';
import type { SupplierDuplicateSuspect } from '../entities/supplier-duplicate.js';
import type {
  ISupplierDuplicateRepo,
  CreateDuplicateSuspectInput,
} from '../ports/supplier-duplicate-repo.js';

type DupRow = typeof supplierDuplicateSuspects.$inferSelect;

function mapToDomain(row: DupRow): SupplierDuplicateSuspect {
  return {
    id: row.id,
    tenantId: row.tenantId,
    supplierAId: row.supplierAId,
    supplierBId: row.supplierBId,
    matchType: row.matchType as SupplierDuplicateSuspect['matchType'],
    confidence: row.confidence,
    status: row.status as SupplierDuplicateSuspect['status'],
    mergedIntoId: row.mergedIntoId ?? null,
    reviewedBy: row.reviewedBy ?? null,
    reviewedAt: row.reviewedAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleSupplierDuplicateRepo implements ISupplierDuplicateRepo {
  constructor(private readonly tx: TenantTx) {}

  async create(input: CreateDuplicateSuspectInput): Promise<Result<SupplierDuplicateSuspect>> {
    const [row] = await this.tx
      .insert(supplierDuplicateSuspects)
      .values({
        tenantId: input.tenantId,
        supplierAId: input.supplierAId,
        supplierBId: input.supplierBId,
        matchType: input.matchType,
        confidence: input.confidence,
        status: 'OPEN',
      })
      .returning();
    if (!row) return err(new AppError('INTERNAL', 'Failed to insert duplicate suspect'));
    return ok(mapToDomain(row));
  }

  async findOpen(tenantId: string): Promise<readonly SupplierDuplicateSuspect[]> {
    const rows = await this.tx
      .select()
      .from(supplierDuplicateSuspects)
      .where(
        and(
          eq(supplierDuplicateSuspects.tenantId, tenantId),
          eq(supplierDuplicateSuspects.status, 'OPEN')
        )
      );
    return rows.map(mapToDomain);
  }

  async dismiss(suspectId: string, reviewedBy: string): Promise<Result<SupplierDuplicateSuspect>> {
    const [row] = await this.tx
      .update(supplierDuplicateSuspects)
      .set({ status: 'DISMISSED', reviewedBy, reviewedAt: new Date(), updatedAt: new Date() })
      .where(eq(supplierDuplicateSuspects.id, suspectId))
      .returning();

    if (!row) return err(new AppError('NOT_FOUND', 'Duplicate suspect not found'));
    return ok(mapToDomain(row));
  }

  async markMerged(
    suspectId: string,
    mergedIntoId: string,
    reviewedBy: string
  ): Promise<Result<SupplierDuplicateSuspect>> {
    const [row] = await this.tx
      .update(supplierDuplicateSuspects)
      .set({
        status: 'MERGED',
        mergedIntoId,
        reviewedBy,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(supplierDuplicateSuspects.id, suspectId))
      .returning();

    if (!row) return err(new AppError('NOT_FOUND', 'Duplicate suspect not found'));
    return ok(mapToDomain(row));
  }
}
