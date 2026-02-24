import { eq, count } from "drizzle-orm";
import type { TenantTx } from "@afenda/db";
import { ledgers, currencies } from "@afenda/db";
import { ok, err, NotFoundError, type Result, type PaginationParams, type PaginatedResult } from "@afenda/core";
import type { Ledger } from "../entities/ledger.js";
import type { ILedgerRepo } from "../../../slices/gl/ports/ledger-repo.js";

export class DrizzleLedgerRepo implements ILedgerRepo {
  constructor(private readonly tx: TenantTx) { }

  async findById(id: string): Promise<Result<Ledger>> {
    const [row] = await this.tx
      .select({
        id: ledgers.id,
        companyId: ledgers.companyId,
        name: ledgers.name,
        currencyCode: currencies.code,
        isDefault: ledgers.isDefault,
        createdAt: ledgers.createdAt,
      })
      .from(ledgers)
      .innerJoin(currencies, eq(currencies.id, ledgers.currencyId))
      .where(eq(ledgers.id, id))
      .limit(1);

    if (!row) return err(new NotFoundError("Ledger", id));

    return ok({
      id: row.id!,
      companyId: row.companyId as never,
      name: row.name,
      baseCurrency: row.currencyCode,
      fiscalYearStart: 1,
      isDefault: row.isDefault,
      createdAt: row.createdAt,
    });
  }

  async findAll(pagination?: PaginationParams): Promise<Result<PaginatedResult<Ledger>>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const offset = (page - 1) * limit;

    const rows = await this.tx
      .select({
        id: ledgers.id,
        companyId: ledgers.companyId,
        name: ledgers.name,
        currencyCode: currencies.code,
        isDefault: ledgers.isDefault,
        createdAt: ledgers.createdAt,
      })
      .from(ledgers)
      .innerJoin(currencies, eq(currencies.id, ledgers.currencyId))
      .limit(limit)
      .offset(offset);

    const countRows = await this.tx.select({ total: count() }).from(ledgers);
    const total = countRows[0]?.total ?? 0;

    return ok({
      data: rows.map((row) => ({
        id: row.id!,
        companyId: row.companyId as never,
        name: row.name,
        baseCurrency: row.currencyCode,
        fiscalYearStart: 1,
        isDefault: row.isDefault,
        createdAt: row.createdAt,
      })),
      total,
      page,
      limit,
    });
  }
}
