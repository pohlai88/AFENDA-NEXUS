import type { Result, PaginationParams, PaginatedResult } from "@afenda/core";
import type { Ledger } from "../entities/ledger.js";

export interface ILedgerRepo {
  findById(id: string): Promise<Result<Ledger>>;
  findAll(pagination?: PaginationParams): Promise<Result<PaginatedResult<Ledger>>>;
}
