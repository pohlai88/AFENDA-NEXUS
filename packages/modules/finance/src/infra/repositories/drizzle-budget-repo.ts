import { eq, and, count, asc, sql } from "drizzle-orm";
import type { TenantTx } from "@afenda/db";
import { budgetEntries, accounts } from "@afenda/db";
import type { PaginationParams, PaginatedResult } from "@afenda/core";
import type { BudgetEntry } from "../../domain/index.js";
import type { IBudgetRepo, UpsertBudgetEntryInput } from "../../app/ports/budget-repo.js";

function mapRow(
  row: typeof budgetEntries.$inferSelect,
  accountCode?: string,
): BudgetEntry {
  return {
    id: row.id!,
    companyId: row.companyId as never,
    ledgerId: row.ledgerId as never,
    accountId: row.accountId,
    accountCode: accountCode ?? "",
    periodId: row.periodId,
    budgetAmount: { amount: row.budgetAmount, currency: "USD", scale: 2 },
    version: row.version ?? 1,
    versionNote: row.versionNote ?? undefined,
    createdAt: row.createdAt,
  };
}

export class DrizzleBudgetRepo implements IBudgetRepo {
  constructor(private readonly tx: TenantTx) { }

  async upsert(input: UpsertBudgetEntryInput): Promise<BudgetEntry> {
    const [row] = await this.tx
      .insert(budgetEntries)
      .values({
        tenantId: input.tenantId,
        companyId: input.companyId,
        ledgerId: input.ledgerId,
        accountId: input.accountId,
        periodId: input.periodId,
        budgetAmount: input.budgetAmount,
      })
      .onConflictDoUpdate({
        target: [
          budgetEntries.tenantId,
          budgetEntries.ledgerId,
          budgetEntries.accountId,
          budgetEntries.periodId,
        ],
        set: {
          budgetAmount: input.budgetAmount,
          version: sql`${budgetEntries.version} + 1`,
          versionNote: input.versionNote ?? null,
        },
      })
      .returning();

    return mapRow(row!);
  }

  async findByLedgerAndPeriod(
    ledgerId: string,
    periodId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<BudgetEntry>> {
    const page = params.page;
    const limit = params.limit;
    const offset = (page - 1) * limit;

    const [rows, [{ total }]] = await Promise.all([
      this.tx
        .select({
          budget: budgetEntries,
          accountCode: accounts.code,
        })
        .from(budgetEntries)
        .leftJoin(accounts, eq(budgetEntries.accountId, accounts.id))
        .where(
          and(
            eq(budgetEntries.ledgerId, ledgerId),
            eq(budgetEntries.periodId, periodId),
          ),
        )
        .orderBy(asc(accounts.code))
        .limit(limit)
        .offset(offset),
      this.tx
        .select({ total: count() })
        .from(budgetEntries)
        .where(
          and(
            eq(budgetEntries.ledgerId, ledgerId),
            eq(budgetEntries.periodId, periodId),
          ),
        ),
    ]);

    return {
      data: rows.map((r) => mapRow(r.budget, r.accountCode ?? "")),
      total,
      page,
      limit,
    };
  }
}
