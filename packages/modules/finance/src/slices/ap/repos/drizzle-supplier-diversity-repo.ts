import { eq } from 'drizzle-orm';
import { ok, err, AppError } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { TenantTx } from '@afenda/db';
import { supplierDiversities } from '@afenda/db';
import type { SupplierDiversity } from '../entities/supplier-diversity.js';
import type {
  ISupplierDiversityRepo,
  CreateSupplierDiversityInput,
} from '../ports/supplier-diversity-repo.js';

type DiversityRow = typeof supplierDiversities.$inferSelect;

function mapToDomain(row: DiversityRow): SupplierDiversity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    supplierId: row.supplierId,
    diversityCode: row.diversityCode as SupplierDiversity['diversityCode'],
    certificateNumber: row.certificateNumber ?? null,
    validFrom: row.validFrom ?? null,
    validUntil: row.validUntil ?? null,
    documentId: row.documentId ?? null,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleSupplierDiversityRepo implements ISupplierDiversityRepo {
  constructor(private readonly tx: TenantTx) {}

  async create(input: CreateSupplierDiversityInput): Promise<Result<SupplierDiversity>> {
    const [row] = await this.tx
      .insert(supplierDiversities)
      .values({
        tenantId: input.tenantId,
        supplierId: input.supplierId,
        diversityCode: input.diversityCode,
        certificateNumber: input.certificateNumber,
        validFrom: input.validFrom,
        validUntil: input.validUntil,
        documentId: input.documentId,
        isActive: true,
      })
      .returning();
    if (!row) return err(new AppError('INTERNAL', 'Failed to insert diversity'));
    return ok(mapToDomain(row));
  }

  async findBySupplierId(supplierId: string): Promise<readonly SupplierDiversity[]> {
    const rows = await this.tx
      .select()
      .from(supplierDiversities)
      .where(eq(supplierDiversities.supplierId, supplierId));
    return rows.map(mapToDomain);
  }
}
