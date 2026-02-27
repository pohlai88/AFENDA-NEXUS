import { eq } from 'drizzle-orm';
import { ok, err, AppError } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { TenantTx } from '@afenda/db';
import { supplierTaxRegistrations } from '@afenda/db';
import type { SupplierTaxRegistration } from '../entities/supplier-tax.js';
import type {
  ISupplierTaxRepo,
  CreateSupplierTaxRegistrationInput,
} from '../ports/supplier-tax-repo.js';

type TaxRow = typeof supplierTaxRegistrations.$inferSelect;

function mapToDomain(row: TaxRow): SupplierTaxRegistration {
  return {
    id: row.id,
    tenantId: row.tenantId,
    supplierId: row.supplierId,
    taxType: row.taxType as SupplierTaxRegistration['taxType'],
    registrationNumber: row.registrationNumber,
    issuingCountry: row.issuingCountry,
    validFrom: row.validFrom ?? null,
    validUntil: row.validUntil ?? null,
    isVerified: row.isVerified,
    verifiedBy: row.verifiedBy ?? null,
    verifiedAt: row.verifiedAt ?? null,
    isPrimary: row.isPrimary,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleSupplierTaxRepo implements ISupplierTaxRepo {
  constructor(private readonly tx: TenantTx) { }

  async create(input: CreateSupplierTaxRegistrationInput): Promise<Result<SupplierTaxRegistration>> {
    const [row] = await this.tx
      .insert(supplierTaxRegistrations)
      .values({
        tenantId: input.tenantId,
        supplierId: input.supplierId,
        taxType: input.taxType,
        registrationNumber: input.registrationNumber,
        issuingCountry: input.issuingCountry,
        validFrom: input.validFrom,
        validUntil: input.validUntil,
        isPrimary: input.isPrimary,
      })
      .returning();
    if (!row) return err(new AppError('INTERNAL', 'Failed to insert tax registration'));
    return ok(mapToDomain(row));
  }

  async findBySupplierId(supplierId: string): Promise<readonly SupplierTaxRegistration[]> {
    const rows = await this.tx
      .select()
      .from(supplierTaxRegistrations)
      .where(eq(supplierTaxRegistrations.supplierId, supplierId));
    return rows.map(mapToDomain);
  }

  async verify(registrationId: string, verifiedBy: string): Promise<Result<SupplierTaxRegistration>> {
    const [row] = await this.tx
      .update(supplierTaxRegistrations)
      .set({ isVerified: true, verifiedBy, verifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(supplierTaxRegistrations.id, registrationId))
      .returning();

    if (!row) return err(new AppError('NOT_FOUND', 'Tax registration not found'));
    return ok(mapToDomain(row));
  }
}
