import type { Result, PaginationParams, PaginatedResult } from '@afenda/core';
import type { Journal } from '../entities/journal.js';

export interface CreateJournalInput {
  readonly tenantId: string;
  readonly ledgerId: string;
  readonly fiscalPeriodId: string;
  readonly journalNumber: string;
  readonly description: string;
  readonly postingDate: Date;
  readonly lines: readonly {
    readonly accountId: string;
    readonly description?: string;
    readonly debit: bigint;
    readonly credit: bigint;
  }[];
}

export interface IJournalRepo {
  findById(id: string): Promise<Result<Journal>>;
  save(journal: Journal): Promise<Result<Journal>>;
  create(input: CreateJournalInput): Promise<Result<Journal>>;
  findByPeriod(
    periodId?: string,
    status?: Journal['status'],
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Journal>>>;
}
