import { eq } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { deferredTaxItems } from '@afenda/db';
import type { DeferredTaxItem } from '../entities/deferred-tax-item.js';
import type {
  IDeferredTaxItemRepo,
  CreateDeferredTaxItemInput,
} from '../ports/deferred-tax-item-repo.js';

type Row = typeof deferredTaxItems.$inferSelect;

function mapToDomain(row: Row): DeferredTaxItem {
  return {
    id: row.id,
    tenantId: row.tenantId,
    companyId: row.companyId,
    itemName: row.itemName,
    origin: row.origin,
    carryingAmount: row.carryingAmount,
    taxBase: row.taxBase,
    temporaryDifference: row.temporaryDifference,
    taxRateBps: row.taxRateBps,
    deferredTaxAsset: row.deferredTaxAsset,
    deferredTaxLiability: row.deferredTaxLiability,
    isRecognized: row.isRecognized,
    currencyCode: row.currencyCode,
    periodId: row.periodId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleDeferredTaxItemRepo implements IDeferredTaxItemRepo {
  constructor(private readonly db: TenantTx) {}

  async findById(id: string): Promise<DeferredTaxItem | null> {
    const rows = await this.db
      .select()
      .from(deferredTaxItems)
      .where(eq(deferredTaxItems.id, id))
      .limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findAll(): Promise<readonly DeferredTaxItem[]> {
    const rows = await this.db.select().from(deferredTaxItems);
    return rows.map(mapToDomain);
  }

  async findByCompany(companyId: string): Promise<readonly DeferredTaxItem[]> {
    const rows = await this.db
      .select()
      .from(deferredTaxItems)
      .where(eq(deferredTaxItems.companyId, companyId));
    return rows.map(mapToDomain);
  }

  async findByPeriod(periodId: string): Promise<readonly DeferredTaxItem[]> {
    const rows = await this.db
      .select()
      .from(deferredTaxItems)
      .where(eq(deferredTaxItems.periodId, periodId));
    return rows.map(mapToDomain);
  }

  async create(tenantId: string, input: CreateDeferredTaxItemInput): Promise<DeferredTaxItem> {
    const [row] = await this.db
      .insert(deferredTaxItems)
      .values({ tenantId, ...input })
      .returning();
    return mapToDomain(row!);
  }

  async updateRecognition(id: string, isRecognized: boolean): Promise<DeferredTaxItem> {
    const [row] = await this.db
      .update(deferredTaxItems)
      .set({ isRecognized })
      .where(eq(deferredTaxItems.id, id))
      .returning();
    return mapToDomain(row!);
  }
}
