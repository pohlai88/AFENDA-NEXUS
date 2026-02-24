import { eq, and, lte, gte, count, inArray } from "drizzle-orm";
import { ok, err, NotFoundError } from "@afenda/core";
import type { Result, PaginationParams, PaginatedResult } from "@afenda/core";
import type { TenantTx } from "@afenda/db";
import { fiscalPeriods } from "@afenda/db";
import type { FiscalPeriod } from "../entities/fiscal-period.js";
import type { IFiscalPeriodRepo } from "../../../slices/gl/ports/fiscal-period-repo.js";
import { mapPeriodToDomain } from "../../../shared/mappers/period-mapper.js";

export class DrizzlePeriodRepo implements IFiscalPeriodRepo {
  constructor(private readonly tx: TenantTx) { }

  async findById(id: string): Promise<Result<FiscalPeriod>> {
    const row = await this.tx.query.fiscalPeriods.findFirst({
      where: eq(fiscalPeriods.id, id),
    });
    if (!row) return err(new NotFoundError("FiscalPeriod", id));
    return ok(mapPeriodToDomain(row));
  }

  async findOpenByDate(companyId: string, date: Date): Promise<Result<FiscalPeriod>> {
    void companyId; // periods are tenant-scoped in DB
    const row = await this.tx.query.fiscalPeriods.findFirst({
      where: and(
        eq(fiscalPeriods.status, "OPEN"),
        lte(fiscalPeriods.startDate, date),
        gte(fiscalPeriods.endDate, date),
      ),
    });
    if (!row) return err(new NotFoundError("FiscalPeriod", `open for date ${date.toISOString()}`));
    return ok(mapPeriodToDomain(row));
  }

  async close(id: string): Promise<Result<FiscalPeriod>> {
    const [updated] = await this.tx
      .update(fiscalPeriods)
      .set({ status: "CLOSED", updatedAt: new Date() })
      .where(and(eq(fiscalPeriods.id, id), eq(fiscalPeriods.status, "OPEN")))
      .returning();
    if (!updated) return err(new NotFoundError("FiscalPeriod", id));
    return ok(mapPeriodToDomain(updated));
  }

  async reopen(id: string): Promise<Result<FiscalPeriod>> {
    const [updated] = await this.tx
      .update(fiscalPeriods)
      .set({ status: "OPEN", updatedAt: new Date() })
      .where(and(eq(fiscalPeriods.id, id), eq(fiscalPeriods.status, "CLOSED")))
      .returning();
    if (!updated) return err(new NotFoundError("FiscalPeriod", id));
    return ok(mapPeriodToDomain(updated));
  }

  async lock(id: string): Promise<Result<FiscalPeriod>> {
    const [updated] = await this.tx
      .update(fiscalPeriods)
      .set({ status: "LOCKED", updatedAt: new Date() })
      .where(and(eq(fiscalPeriods.id, id), eq(fiscalPeriods.status, "CLOSED")))
      .returning();
    if (!updated) return err(new NotFoundError("FiscalPeriod", id));
    return ok(mapPeriodToDomain(updated));
  }

  async findAll(pagination?: PaginationParams): Promise<Result<PaginatedResult<FiscalPeriod>>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const offset = (page - 1) * limit;

    const [rows, countRows] = await Promise.all([
      this.tx.query.fiscalPeriods.findMany({ limit, offset }),
      this.tx.select({ total: count() }).from(fiscalPeriods),
    ]);
    const total = countRows[0]?.total ?? 0;

    return ok({ data: rows.map(mapPeriodToDomain), total, page, limit });
  }

  /** GAP-14: Batch load periods by IDs — avoids N+1 queries in close-year */
  async findByIds(ids: readonly string[]): Promise<Result<FiscalPeriod[]>> {
    if (ids.length === 0) return ok([]);
    const rows = await this.tx.query.fiscalPeriods.findMany({
      where: inArray(fiscalPeriods.id, [...ids]),
    });
    return ok(rows.map(mapPeriodToDomain));
  }

  /** GAP-12: Ledger-scoped period lookup.
   * Note: In the current schema, fiscal periods are tenant-scoped (not ledger-scoped).
   * The ledgerId parameter is accepted for forward-compatibility but currently
   * returns all tenant periods. When the schema adds a ledger FK on fiscal_period,
   * this implementation should filter by it.
   */
  async findByLedger(_ledgerId: string, pagination?: PaginationParams): Promise<Result<PaginatedResult<FiscalPeriod>>> {
    return this.findAll(pagination);
  }
}
