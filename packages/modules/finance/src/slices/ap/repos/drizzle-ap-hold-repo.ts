import { eq, and, count, desc } from 'drizzle-orm';
import { ok, err, NotFoundError } from '@afenda/core';
import type { Result, PaginationParams, PaginatedResult } from '@afenda/core';
import type { TenantTx } from '@afenda/db';
import { apHolds } from '@afenda/db';
import type { ApHold } from '../entities/ap-hold.js';
import type { IApHoldRepo, CreateApHoldInput, ReleaseApHoldInput } from '../ports/ap-hold-repo.js';

type HoldRow = typeof apHolds.$inferSelect;

function mapToDomain(row: HoldRow): ApHold {
  return {
    id: row.id,
    tenantId: row.tenantId,
    invoiceId: row.invoiceId,
    holdType: row.holdType as ApHold['holdType'],
    holdReason: row.holdReason,
    holdDate: row.holdDate,
    releaseDate: row.releaseDate ?? null,
    releasedBy: row.releasedBy ?? null,
    releaseReason: row.releaseReason ?? null,
    status: row.status as ApHold['status'],
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleApHoldRepo implements IApHoldRepo {
  constructor(private readonly tx: TenantTx) {}

  async create(input: CreateApHoldInput): Promise<Result<ApHold>> {
    const [row] = await this.tx
      .insert(apHolds)
      .values({
        tenantId: input.tenantId,
        invoiceId: input.invoiceId,
        holdType: input.holdType as typeof apHolds.$inferSelect.holdType,
        holdReason: input.holdReason,
        createdBy: input.createdBy,
      })
      .returning();

    if (!row) return err(new NotFoundError('ApHold', 'new'));
    return ok(mapToDomain(row));
  }

  async findById(id: string): Promise<Result<ApHold>> {
    const row = await this.tx.query.apHolds.findFirst({
      where: eq(apHolds.id, id),
    });
    if (!row) return err(new NotFoundError('ApHold', id));
    return ok(mapToDomain(row));
  }

  async findByInvoice(invoiceId: string): Promise<ApHold[]> {
    const rows = await this.tx.query.apHolds.findMany({
      where: eq(apHolds.invoiceId, invoiceId),
      orderBy: [desc(apHolds.createdAt)],
    });
    return rows.map(mapToDomain);
  }

  async findActiveByInvoice(invoiceId: string): Promise<ApHold[]> {
    const rows = await this.tx.query.apHolds.findMany({
      where: and(eq(apHolds.invoiceId, invoiceId), eq(apHolds.status, 'ACTIVE')),
      orderBy: [desc(apHolds.createdAt)],
    });
    return rows.map(mapToDomain);
  }

  async findAll(
    params?: PaginationParams & { status?: string; holdType?: string; supplierId?: string }
  ): Promise<PaginatedResult<ApHold>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (params?.status) {
      conditions.push(eq(apHolds.status, params.status as typeof apHolds.$inferSelect.status));
    }
    if (params?.holdType) {
      conditions.push(
        eq(apHolds.holdType, params.holdType as typeof apHolds.$inferSelect.holdType)
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countRows] = await Promise.all([
      this.tx.query.apHolds.findMany({
        where,
        orderBy: [desc(apHolds.createdAt), desc(apHolds.id)],
        limit,
        offset,
      }),
      where
        ? this.tx.select({ total: count() }).from(apHolds).where(where)
        : this.tx.select({ total: count() }).from(apHolds),
    ]);
    const total = countRows[0]?.total ?? 0;

    return { data: rows.map(mapToDomain), total, page, limit };
  }

  async release(id: string, input: ReleaseApHoldInput): Promise<Result<ApHold>> {
    const existing = await this.tx.query.apHolds.findFirst({
      where: eq(apHolds.id, id),
    });
    if (!existing) return err(new NotFoundError('ApHold', id));
    if (existing.status !== 'ACTIVE') {
      return err(new NotFoundError('ApHold (active)', id));
    }

    await this.tx
      .update(apHolds)
      .set({
        status: 'RELEASED',
        releaseDate: new Date(),
        releasedBy: input.releasedBy,
        releaseReason: input.releaseReason,
        updatedAt: new Date(),
      })
      .where(eq(apHolds.id, id));

    return this.findById(id);
  }

  async hasActiveHolds(invoiceId: string): Promise<boolean> {
    const rows = await this.tx
      .select({ total: count() })
      .from(apHolds)
      .where(and(eq(apHolds.invoiceId, invoiceId), eq(apHolds.status, 'ACTIVE')));
    return (rows[0]?.total ?? 0) > 0;
  }
}
