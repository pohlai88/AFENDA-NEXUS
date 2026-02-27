import { eq, and } from 'drizzle-orm';
import { ok, err, AppError } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { TenantTx } from '@afenda/db';
import { supplierCompanyOverrides } from '@afenda/db';
import type { SupplierCompanyOverride } from '../entities/supplier-company-override.js';
import type {
  ISupplierCompanyOverrideRepo,
  UpsertCompanyOverrideInput,
} from '../ports/supplier-company-override-repo.js';

type OverrideRow = typeof supplierCompanyOverrides.$inferSelect;

function mapToDomain(row: OverrideRow): SupplierCompanyOverride {
  return {
    id: row.id,
    tenantId: row.tenantId,
    supplierId: row.supplierId,
    companyId: row.companyId,
    defaultPaymentTermsId: row.defaultPaymentTermsId ?? null,
    defaultPaymentMethod: (row.defaultPaymentMethod as SupplierCompanyOverride['defaultPaymentMethod']) ?? null,
    defaultCurrencyId: row.defaultCurrencyId ?? null,
    tolerancePercent: row.tolerancePercent ?? null,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleSupplierCompanyOverrideRepo implements ISupplierCompanyOverrideRepo {
  constructor(private readonly tx: TenantTx) {}

  async upsert(input: UpsertCompanyOverrideInput): Promise<Result<SupplierCompanyOverride>> {
    const [row] = await this.tx
      .insert(supplierCompanyOverrides)
      .values({
        tenantId: input.tenantId,
        supplierId: input.supplierId,
        companyId: input.companyId,
        defaultPaymentTermsId: input.defaultPaymentTermsId,
        defaultPaymentMethod: input.defaultPaymentMethod,
        defaultCurrencyId: input.defaultCurrencyId,
        tolerancePercent: input.tolerancePercent,
        isActive: input.isActive,
      })
      .onConflictDoUpdate({
        target: [
          supplierCompanyOverrides.tenantId,
          supplierCompanyOverrides.supplierId,
          supplierCompanyOverrides.companyId,
        ],
        set: {
          defaultPaymentTermsId: input.defaultPaymentTermsId,
          defaultPaymentMethod: input.defaultPaymentMethod,
          defaultCurrencyId: input.defaultCurrencyId,
          tolerancePercent: input.tolerancePercent,
          isActive: input.isActive,
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!row) return err(new AppError('INTERNAL', 'Failed to upsert company override'));
    return ok(mapToDomain(row));
  }

  async findBySupplierId(supplierId: string): Promise<readonly SupplierCompanyOverride[]> {
    const rows = await this.tx
      .select()
      .from(supplierCompanyOverrides)
      .where(eq(supplierCompanyOverrides.supplierId, supplierId));
    return rows.map(mapToDomain);
  }

  async findBySupplierAndCompany(
    supplierId: string,
    companyId: string
  ): Promise<SupplierCompanyOverride | null> {
    const rows = await this.tx
      .select()
      .from(supplierCompanyOverrides)
      .where(
        and(
          eq(supplierCompanyOverrides.supplierId, supplierId),
          eq(supplierCompanyOverrides.companyId, companyId)
        )
      )
      .limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }
}
