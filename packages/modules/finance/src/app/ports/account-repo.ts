import type { Result, PaginationParams, PaginatedResult } from "@afenda/core";
import type { Account } from "../../domain/index.js";

export interface IAccountRepo {
  findByCode(companyId: string, code: string): Promise<Result<Account>>;
  findById(id: string): Promise<Result<Account>>;
  findAll(pagination?: PaginationParams): Promise<Result<PaginatedResult<Account>>>;
  /** A-17: Find active accounts with no parent (potential COA orphans) */
  findOrphans?(): Promise<Result<Account[]>>;
}
