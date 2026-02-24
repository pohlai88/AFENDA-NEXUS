import type { Goodwill } from "../entities/goodwill.js";

export interface CreateGoodwillInput {
  readonly ownershipRecordId: string;
  readonly childEntityId: string;
  readonly acquisitionDate: Date;
  readonly considerationPaid: bigint;
  readonly fairValueNetAssets: bigint;
  readonly nciAtAcquisition: bigint;
  readonly goodwillAmount: bigint;
  readonly currencyCode: string;
}

export interface IGoodwillRepo {
  findById(id: string): Promise<Goodwill | null>;
  findByChild(childEntityId: string): Promise<Goodwill | null>;
  findAll(): Promise<readonly Goodwill[]>;
  create(tenantId: string, input: CreateGoodwillInput): Promise<Goodwill>;
  update(id: string, input: Partial<{
    accumulatedImpairment: bigint;
    carryingAmount: bigint;
    status: Goodwill["status"];
  }>): Promise<Goodwill>;
}
