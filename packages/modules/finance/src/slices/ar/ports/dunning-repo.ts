import type { Result, PaginationParams, PaginatedResult } from '@afenda/core';
import type { DunningRun, DunningLetter } from '../entities/dunning.js';

export interface CreateDunningRunInput {
  readonly tenantId: string;
  readonly runDate: Date;
}

export interface AddDunningLetterInput {
  readonly customerId: string;
  readonly level: 1 | 2 | 3 | 4;
  readonly invoiceIds: readonly string[];
  readonly totalOverdue: bigint;
  readonly currencyCode: string;
}

export interface IDunningRepo {
  create(input: CreateDunningRunInput): Promise<Result<DunningRun>>;
  findById(id: string): Promise<Result<DunningRun>>;
  findAll(params?: PaginationParams): Promise<PaginatedResult<DunningRun>>;
  addLetter(runId: string, letter: AddDunningLetterInput): Promise<Result<DunningLetter>>;
  updateStatus(id: string, status: string): Promise<Result<DunningRun>>;
}
