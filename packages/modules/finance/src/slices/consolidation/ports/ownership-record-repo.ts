import type { OwnershipRecord } from '../entities/ownership-record.js';

export interface CreateOwnershipRecordInput {
  readonly parentEntityId: string;
  readonly childEntityId: string;
  readonly ownershipPctBps: number;
  readonly votingPctBps: number;
  readonly effectiveFrom: Date;
  readonly effectiveTo: Date | null;
  readonly acquisitionDate: Date;
  readonly acquisitionCost: bigint;
  readonly currencyCode: string;
}

export interface IOwnershipRecordRepo {
  findById(id: string): Promise<OwnershipRecord | null>;
  findByParent(parentEntityId: string): Promise<readonly OwnershipRecord[]>;
  findByChild(childEntityId: string): Promise<readonly OwnershipRecord[]>;
  findActiveAsOf(date: Date): Promise<readonly OwnershipRecord[]>;
  findAll(): Promise<readonly OwnershipRecord[]>;
  create(tenantId: string, input: CreateOwnershipRecordInput): Promise<OwnershipRecord>;
  update(id: string, input: Partial<CreateOwnershipRecordInput>): Promise<OwnershipRecord>;
}
