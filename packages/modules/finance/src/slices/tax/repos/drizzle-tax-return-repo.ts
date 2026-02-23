import { eq, and } from "drizzle-orm";
import type { TenantTx } from "@afenda/db";
import { taxReturnPeriods } from "@afenda/db";
import type { TaxReturnPeriod } from "../entities/tax-return.js";
import type { ITaxReturnRepo, CreateTaxReturnInput } from "../ports/tax-return-repo.js";

type Row = typeof taxReturnPeriods.$inferSelect;

function mapToDomain(row: Row): TaxReturnPeriod {
  return {
    id: row.id,
    tenantId: row.tenantId,
    taxType: row.taxType,
    jurisdictionCode: row.jurisdictionCode,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    outputTax: row.outputTax,
    inputTax: row.inputTax,
    netPayable: row.netPayable,
    currencyCode: row.currencyCode,
    status: row.status as TaxReturnPeriod["status"],
    filedAt: row.filedAt,
    filedBy: row.filedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleTaxReturnRepo implements ITaxReturnRepo {
  constructor(private readonly db: TenantTx) { }

  async findById(id: string): Promise<TaxReturnPeriod | null> {
    const rows = await this.db.select().from(taxReturnPeriods).where(eq(taxReturnPeriods.id, id)).limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findByPeriod(jurisdictionCode: string, periodStart: Date, periodEnd: Date): Promise<TaxReturnPeriod | null> {
    const rows = await this.db.select().from(taxReturnPeriods).where(
      and(
        eq(taxReturnPeriods.jurisdictionCode, jurisdictionCode),
        eq(taxReturnPeriods.periodStart, periodStart),
        eq(taxReturnPeriods.periodEnd, periodEnd),
      ),
    ).limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findAll(): Promise<readonly TaxReturnPeriod[]> {
    const rows = await this.db.select().from(taxReturnPeriods);
    return rows.map(mapToDomain);
  }

  async create(tenantId: string, input: CreateTaxReturnInput): Promise<TaxReturnPeriod> {
    const [row] = await this.db.insert(taxReturnPeriods).values({
      tenantId,
      taxType: input.taxType,
      jurisdictionCode: input.jurisdictionCode,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      outputTax: input.outputTax,
      inputTax: input.inputTax,
      netPayable: input.netPayable,
      currencyCode: input.currencyCode,
    }).returning();
    return mapToDomain(row!);
  }

  async updateStatus(id: string, status: TaxReturnPeriod["status"], filedBy?: string): Promise<TaxReturnPeriod> {
    const updates: Record<string, unknown> = { status };
    if (status === "FILED") {
      updates.filedAt = new Date();
      if (filedBy) updates.filedBy = filedBy;
    }
    const [row] = await this.db.update(taxReturnPeriods).set(updates).where(eq(taxReturnPeriods.id, id)).returning();
    return mapToDomain(row!);
  }
}
