import { eq, and, lte, or, isNull, gte } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { taxRates } from '@afenda/db';
import type { TaxRate } from '../entities/tax-rate.js';
import type { ITaxRateRepo, CreateTaxRateInput } from '../ports/tax-rate-repo.js';

type Row = typeof taxRates.$inferSelect;

function mapToDomain(row: Row): TaxRate {
  return {
    id: row.id,
    tenantId: row.tenantId,
    taxCodeId: row.taxCodeId,
    name: row.name,
    ratePercent: row.ratePercent,
    type: row.type as TaxRate['type'],
    jurisdictionCode: row.jurisdictionCode,
    effectiveFrom: row.effectiveFrom,
    effectiveTo: row.effectiveTo,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleTaxRateRepo implements ITaxRateRepo {
  constructor(private readonly db: TenantTx) {}

  async findById(id: string): Promise<TaxRate | null> {
    const rows = await this.db.select().from(taxRates).where(eq(taxRates.id, id)).limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findByTaxCode(taxCodeId: string): Promise<readonly TaxRate[]> {
    const rows = await this.db.select().from(taxRates).where(eq(taxRates.taxCodeId, taxCodeId));
    return rows.map(mapToDomain);
  }

  async findByJurisdiction(jurisdictionCode: string): Promise<readonly TaxRate[]> {
    const rows = await this.db
      .select()
      .from(taxRates)
      .where(eq(taxRates.jurisdictionCode, jurisdictionCode));
    return rows.map(mapToDomain);
  }

  async findActive(asOfDate: Date): Promise<readonly TaxRate[]> {
    const rows = await this.db
      .select()
      .from(taxRates)
      .where(
        and(
          eq(taxRates.isActive, true),
          lte(taxRates.effectiveFrom, asOfDate),
          or(isNull(taxRates.effectiveTo), gte(taxRates.effectiveTo, asOfDate))
        )
      );
    return rows.map(mapToDomain);
  }

  async findAll(): Promise<readonly TaxRate[]> {
    const rows = await this.db.select().from(taxRates);
    return rows.map(mapToDomain);
  }

  async create(tenantId: string, input: CreateTaxRateInput): Promise<TaxRate> {
    const [row] = await this.db
      .insert(taxRates)
      .values({
        tenantId,
        taxCodeId: input.taxCodeId,
        name: input.name,
        ratePercent: input.ratePercent,
        type: input.type,
        jurisdictionCode: input.jurisdictionCode,
        effectiveFrom: input.effectiveFrom,
        effectiveTo: input.effectiveTo,
      })
      .returning();
    return mapToDomain(row!);
  }

  async update(id: string, input: Partial<CreateTaxRateInput>): Promise<TaxRate> {
    const [row] = await this.db.update(taxRates).set(input).where(eq(taxRates.id, id)).returning();
    return mapToDomain(row!);
  }
}
