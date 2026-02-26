import { eq } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { goodwills } from '@afenda/db';
import type { Goodwill } from '../entities/goodwill.js';
import type { IGoodwillRepo, CreateGoodwillInput } from '../ports/goodwill-repo.js';

type Row = typeof goodwills.$inferSelect;

function mapToDomain(row: Row): Goodwill {
  return {
    id: row.id,
    tenantId: row.tenantId,
    ownershipRecordId: row.ownershipRecordId,
    childEntityId: row.childEntityId,
    acquisitionDate: row.acquisitionDate,
    considerationPaid: BigInt(row.considerationPaid),
    fairValueNetAssets: BigInt(row.fairValueNetAssets),
    nciAtAcquisition: BigInt(row.nciAtAcquisition),
    goodwillAmount: BigInt(row.goodwillAmount),
    accumulatedImpairment: BigInt(row.accumulatedImpairment),
    carryingAmount: BigInt(row.carryingAmount),
    currencyCode: row.currencyCode,
    status: row.status as Goodwill['status'],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleGoodwillRepo implements IGoodwillRepo {
  constructor(private readonly db: TenantTx) {}

  async findById(id: string): Promise<Goodwill | null> {
    const rows = await this.db.select().from(goodwills).where(eq(goodwills.id, id)).limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findByChild(childEntityId: string): Promise<Goodwill | null> {
    const rows = await this.db
      .select()
      .from(goodwills)
      .where(eq(goodwills.childEntityId, childEntityId))
      .limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findAll(): Promise<readonly Goodwill[]> {
    const rows = await this.db.select().from(goodwills);
    return rows.map(mapToDomain);
  }

  async create(tenantId: string, input: CreateGoodwillInput): Promise<Goodwill> {
    const [row] = await this.db
      .insert(goodwills)
      .values({
        tenantId,
        ownershipRecordId: input.ownershipRecordId,
        childEntityId: input.childEntityId,
        acquisitionDate: input.acquisitionDate,
        considerationPaid: input.considerationPaid,
        fairValueNetAssets: input.fairValueNetAssets,
        nciAtAcquisition: input.nciAtAcquisition,
        goodwillAmount: input.goodwillAmount,
        accumulatedImpairment: 0n,
        carryingAmount: input.goodwillAmount,
        currencyCode: input.currencyCode,
      })
      .returning();
    return mapToDomain(row!);
  }

  async update(
    id: string,
    input: Partial<{
      accumulatedImpairment: bigint;
      carryingAmount: bigint;
      status: Goodwill['status'];
    }>
  ): Promise<Goodwill> {
    const values: Record<string, unknown> = {};
    if (input.accumulatedImpairment !== undefined)
      values.accumulatedImpairment = input.accumulatedImpairment;
    if (input.carryingAmount !== undefined) values.carryingAmount = input.carryingAmount;
    if (input.status !== undefined) values.status = input.status;
    const [row] = await this.db
      .update(goodwills)
      .set(values)
      .where(eq(goodwills.id, id))
      .returning();
    return mapToDomain(row!);
  }
}
