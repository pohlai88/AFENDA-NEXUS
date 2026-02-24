import { eq, and, lte, gte, or, isNull } from "drizzle-orm";
import type { TenantTx } from "@afenda/db";
import { ownershipRecords } from "@afenda/db";
import type { OwnershipRecord } from "../entities/ownership-record.js";
import type { IOwnershipRecordRepo, CreateOwnershipRecordInput } from "../ports/ownership-record-repo.js";

type Row = typeof ownershipRecords.$inferSelect;

function mapToDomain(row: Row): OwnershipRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    parentEntityId: row.parentEntityId,
    childEntityId: row.childEntityId,
    ownershipPctBps: row.ownershipPctBps,
    votingPctBps: row.votingPctBps,
    effectiveFrom: row.effectiveFrom,
    effectiveTo: row.effectiveTo,
    acquisitionDate: row.acquisitionDate,
    acquisitionCost: BigInt(row.acquisitionCost),
    currencyCode: row.currencyCode,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleOwnershipRecordRepo implements IOwnershipRecordRepo {
  constructor(private readonly db: TenantTx) { }

  async findById(id: string): Promise<OwnershipRecord | null> {
    const rows = await this.db.select().from(ownershipRecords).where(eq(ownershipRecords.id, id)).limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findByParent(parentEntityId: string): Promise<readonly OwnershipRecord[]> {
    const rows = await this.db.select().from(ownershipRecords).where(eq(ownershipRecords.parentEntityId, parentEntityId));
    return rows.map(mapToDomain);
  }

  async findByChild(childEntityId: string): Promise<readonly OwnershipRecord[]> {
    const rows = await this.db.select().from(ownershipRecords).where(eq(ownershipRecords.childEntityId, childEntityId));
    return rows.map(mapToDomain);
  }

  async findActiveAsOf(date: Date): Promise<readonly OwnershipRecord[]> {
    const rows = await this.db.select().from(ownershipRecords).where(
      and(
        lte(ownershipRecords.effectiveFrom, date),
        or(
          isNull(ownershipRecords.effectiveTo),
          gte(ownershipRecords.effectiveTo, date),
        ),
      ),
    );
    return rows.map(mapToDomain);
  }

  async findAll(): Promise<readonly OwnershipRecord[]> {
    const rows = await this.db.select().from(ownershipRecords);
    return rows.map(mapToDomain);
  }

  async create(tenantId: string, input: CreateOwnershipRecordInput): Promise<OwnershipRecord> {
    const [row] = await this.db.insert(ownershipRecords).values({
      tenantId,
      parentEntityId: input.parentEntityId,
      childEntityId: input.childEntityId,
      ownershipPctBps: input.ownershipPctBps,
      votingPctBps: input.votingPctBps,
      effectiveFrom: input.effectiveFrom,
      effectiveTo: input.effectiveTo,
      acquisitionDate: input.acquisitionDate,
      acquisitionCost: input.acquisitionCost,
      currencyCode: input.currencyCode,
    }).returning();
    return mapToDomain(row!);
  }

  async update(id: string, input: Partial<CreateOwnershipRecordInput>): Promise<OwnershipRecord> {
    const values: Record<string, unknown> = { ...input };
    const [row] = await this.db.update(ownershipRecords).set(values).where(eq(ownershipRecords.id, id)).returning();
    return mapToDomain(row!);
  }
}
