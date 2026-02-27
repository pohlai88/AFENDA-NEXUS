import { eq, and } from 'drizzle-orm';
import { ok, err, AppError } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { TenantTx } from '@afenda/db';
import { supplierRiskIndicators } from '@afenda/db';
import type { SupplierRiskIndicator } from '../entities/supplier-risk.js';
import type {
  ISupplierRiskRepo,
  CreateRiskIndicatorInput,
} from '../ports/supplier-risk-repo.js';

type RiskRow = typeof supplierRiskIndicators.$inferSelect;

function mapToDomain(row: RiskRow): SupplierRiskIndicator {
  return {
    id: row.id,
    tenantId: row.tenantId,
    supplierId: row.supplierId,
    riskRating: row.riskRating as SupplierRiskIndicator['riskRating'],
    riskCategory: row.riskCategory as SupplierRiskIndicator['riskCategory'],
    description: row.description,
    incidentDate: row.incidentDate ?? null,
    documentId: row.documentId ?? null,
    raisedBy: row.raisedBy,
    resolvedAt: row.resolvedAt ?? null,
    resolvedBy: row.resolvedBy ?? null,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleSupplierRiskRepo implements ISupplierRiskRepo {
  constructor(private readonly tx: TenantTx) {}

  async create(input: CreateRiskIndicatorInput): Promise<Result<SupplierRiskIndicator>> {
    const [row] = await this.tx
      .insert(supplierRiskIndicators)
      .values({
        tenantId: input.tenantId,
        supplierId: input.supplierId,
        riskRating: input.riskRating,
        riskCategory: input.riskCategory,
        description: input.description,
        incidentDate: input.incidentDate,
        documentId: input.documentId,
        raisedBy: input.raisedBy,
        isActive: true,
      })
      .returning();
    if (!row) return err(new AppError('INTERNAL', 'Failed to insert risk indicator'));
    return ok(mapToDomain(row));
  }

  async findBySupplierId(supplierId: string): Promise<readonly SupplierRiskIndicator[]> {
    const rows = await this.tx
      .select()
      .from(supplierRiskIndicators)
      .where(eq(supplierRiskIndicators.supplierId, supplierId));
    return rows.map(mapToDomain);
  }

  async findActiveBySupplierId(supplierId: string): Promise<readonly SupplierRiskIndicator[]> {
    const rows = await this.tx
      .select()
      .from(supplierRiskIndicators)
      .where(
        and(eq(supplierRiskIndicators.supplierId, supplierId), eq(supplierRiskIndicators.isActive, true))
      );
    return rows.map(mapToDomain);
  }

  async resolve(indicatorId: string, resolvedBy: string): Promise<Result<SupplierRiskIndicator>> {
    const [row] = await this.tx
      .update(supplierRiskIndicators)
      .set({ isActive: false, resolvedAt: new Date(), resolvedBy, updatedAt: new Date() })
      .where(eq(supplierRiskIndicators.id, indicatorId))
      .returning();

    if (!row) return err(new AppError('NOT_FOUND', 'Risk indicator not found'));
    return ok(mapToDomain(row));
  }
}
