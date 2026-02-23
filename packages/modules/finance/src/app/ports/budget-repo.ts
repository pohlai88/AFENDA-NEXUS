import type { PaginatedResult, PaginationParams } from "@afenda/core";
import type { BudgetEntry } from "../../domain/index.js";

export interface UpsertBudgetEntryInput {
  readonly tenantId: string;
  readonly companyId: string;
  readonly ledgerId: string;
  readonly accountId: string;
  readonly periodId: string;
  readonly budgetAmount: bigint;
  readonly versionNote?: string;
}

export interface IBudgetRepo {
  upsert(input: UpsertBudgetEntryInput): Promise<BudgetEntry>;
  findByLedgerAndPeriod(
    ledgerId: string,
    periodId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<BudgetEntry>>;
}
