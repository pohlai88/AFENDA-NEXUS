import { eq } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { taxCodes } from '@afenda/db';
import type { TaxCode } from '../entities/tax-code.js';
import type { ITaxCodeRepo, CreateTaxCodeInput } from '../ports/tax-code-repo.js';

type Row = typeof taxCodes.$inferSelect;

function mapToDomain(row: Row): TaxCode {
  return {
    id: row.id,
    tenantId: row.tenantId,
    code: row.code,
    name: row.name,
    description: row.description,
    jurisdictionLevel: row.jurisdictionLevel as TaxCode['jurisdictionLevel'],
    countryCode: row.countryCode,
    stateCode: row.stateCode,
    cityCode: row.cityCode,
    parentId: row.parentId,
    isCompound: row.isCompound,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleTaxCodeRepo implements ITaxCodeRepo {
  constructor(private readonly db: TenantTx) {}

  async findById(id: string): Promise<TaxCode | null> {
    const rows = await this.db.select().from(taxCodes).where(eq(taxCodes.id, id)).limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findByCode(code: string): Promise<TaxCode | null> {
    const rows = await this.db.select().from(taxCodes).where(eq(taxCodes.code, code)).limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findByCountry(countryCode: string): Promise<readonly TaxCode[]> {
    const rows = await this.db.select().from(taxCodes).where(eq(taxCodes.countryCode, countryCode));
    return rows.map(mapToDomain);
  }

  async findAll(): Promise<readonly TaxCode[]> {
    const rows = await this.db.select().from(taxCodes);
    return rows.map(mapToDomain);
  }

  async create(tenantId: string, input: CreateTaxCodeInput): Promise<TaxCode> {
    const [row] = await this.db
      .insert(taxCodes)
      .values({
        tenantId,
        code: input.code,
        name: input.name,
        description: input.description,
        jurisdictionLevel: input.jurisdictionLevel,
        countryCode: input.countryCode,
        stateCode: input.stateCode,
        cityCode: input.cityCode,
        parentId: input.parentId,
        isCompound: input.isCompound,
      })
      .returning();
    return mapToDomain(row!);
  }

  async update(id: string, input: Partial<CreateTaxCodeInput>): Promise<TaxCode> {
    const [row] = await this.db.update(taxCodes).set(input).where(eq(taxCodes.id, id)).returning();
    return mapToDomain(row!);
  }
}
