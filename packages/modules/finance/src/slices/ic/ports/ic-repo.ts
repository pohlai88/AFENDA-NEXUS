import type { Result, PaginationParams, PaginatedResult } from '@afenda/core';
import type { IntercompanyRelationship, IntercompanyDocument } from '../entities/intercompany.js';

export interface IIcAgreementRepo {
  findById(id: string): Promise<Result<IntercompanyRelationship>>;
  findByCompanyPair(
    sellerCompanyId: string,
    buyerCompanyId: string
  ): Promise<Result<IntercompanyRelationship>>;
  findAll(
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<IntercompanyRelationship>>>;
}

export interface CreateIcDocumentInput {
  readonly tenantId: string;
  readonly relationshipId: string;
  readonly sourceCompanyId: string;
  readonly mirrorCompanyId: string;
  readonly sourceJournalId: string;
  readonly mirrorJournalId: string;
  readonly amount: bigint;
  readonly currency: string;
}

export interface IIcTransactionRepo {
  create(input: CreateIcDocumentInput): Promise<Result<IntercompanyDocument>>;
  findById(id: string): Promise<Result<IntercompanyDocument>>;
  findAll(pagination?: PaginationParams): Promise<Result<PaginatedResult<IntercompanyDocument>>>;
}
