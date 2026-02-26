import { eq, count, isNull, and } from 'drizzle-orm';
import { ok, err, NotFoundError } from '@afenda/core';
import type { Result, PaginationParams, PaginatedResult } from '@afenda/core';
import type { TenantTx } from '@afenda/db';
import { accounts } from '@afenda/db';
import type { Account } from '../entities/account.js';
import type { IAccountRepo } from '../../../slices/gl/ports/account-repo.js';
import { mapAccountToDomain } from '../../../shared/mappers/account-mapper.js';

export class DrizzleAccountRepo implements IAccountRepo {
  constructor(private readonly tx: TenantTx) {}

  async findByCode(companyId: string, code: string): Promise<Result<Account>> {
    void companyId; // accounts are tenant-scoped in DB, not company-scoped
    const row = await this.tx.query.accounts.findFirst({
      where: eq(accounts.code, code),
    });
    if (!row) return err(new NotFoundError('Account', code));
    return ok(mapAccountToDomain(row));
  }

  async findById(id: string): Promise<Result<Account>> {
    const row = await this.tx.query.accounts.findFirst({
      where: eq(accounts.id, id),
    });
    if (!row) return err(new NotFoundError('Account', id));
    return ok(mapAccountToDomain(row));
  }

  async findAll(pagination?: PaginationParams): Promise<Result<PaginatedResult<Account>>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const offset = (page - 1) * limit;

    const [rows, countRows] = await Promise.all([
      this.tx.query.accounts.findMany({ limit, offset }),
      this.tx.select({ total: count() }).from(accounts),
    ]);
    const total = countRows[0]?.total ?? 0;

    return ok({ data: rows.map(mapAccountToDomain), total, page, limit });
  }

  async findOrphans(): Promise<Result<Account[]>> {
    const rows = await this.tx.query.accounts.findMany({
      where: and(isNull(accounts.parentId), eq(accounts.isActive, true)),
    });
    return ok(rows.map(mapAccountToDomain));
  }
}
