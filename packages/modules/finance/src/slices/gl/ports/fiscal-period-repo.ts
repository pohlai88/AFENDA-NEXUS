import type { Result, PaginationParams, PaginatedResult } from "@afenda/core";
import type { FiscalPeriod } from "../../../domain/index.js";

export interface IFiscalPeriodRepo {
  findById(id: string): Promise<Result<FiscalPeriod>>;
  findOpenByDate(companyId: string, date: Date): Promise<Result<FiscalPeriod>>;
  close(id: string): Promise<Result<FiscalPeriod>>;
  reopen(id: string): Promise<Result<FiscalPeriod>>;
  lock(id: string): Promise<Result<FiscalPeriod>>;
  findAll(pagination?: PaginationParams): Promise<Result<PaginatedResult<FiscalPeriod>>>;
  /** GAP-14: Batch load periods by IDs — avoids N+1 queries in close-year */
  findByIds(ids: readonly string[]): Promise<Result<FiscalPeriod[]>>;
  /** GAP-12: Ledger-scoped period lookup */
  findByLedger(ledgerId: string, pagination?: PaginationParams): Promise<Result<PaginatedResult<FiscalPeriod>>>;
}
