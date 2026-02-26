/**
 * CO-04: Ownership % change service.
 * Records ownership changes over time, closes old records, creates new ones.
 */

import { err, NotFoundError, ValidationError } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { IOwnershipRecordRepo } from '../ports/ownership-record-repo.js';
import type { IGroupEntityRepo } from '../ports/group-entity-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import type { OwnershipRecord } from '../entities/ownership-record.js';
import { FinanceEventType } from '../../../shared/events.js';

export interface UpdateOwnershipInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly parentEntityId: string;
  readonly childEntityId: string;
  readonly newOwnershipPctBps: number;
  readonly newVotingPctBps: number;
  readonly effectiveDate: Date;
  readonly acquisitionCost: bigint;
  readonly currencyCode: string;
}

export interface UpdateOwnershipResult {
  readonly closedRecord: OwnershipRecord | null;
  readonly newRecord: OwnershipRecord;
  readonly previousPctBps: number;
  readonly newPctBps: number;
}

export async function updateOwnership(
  input: UpdateOwnershipInput,
  deps: {
    ownershipRecordRepo: IOwnershipRecordRepo;
    groupEntityRepo: IGroupEntityRepo;
    outboxWriter: IOutboxWriter;
  }
): Promise<Result<UpdateOwnershipResult>> {
  if (input.newOwnershipPctBps < 0 || input.newOwnershipPctBps > 10000) {
    return err(new ValidationError('Ownership BPS must be between 0 and 10000'));
  }

  const parent = await deps.groupEntityRepo.findById(input.parentEntityId);
  if (!parent) return err(new NotFoundError('GroupEntity', input.parentEntityId));

  const child = await deps.groupEntityRepo.findById(input.childEntityId);
  if (!child) return err(new NotFoundError('GroupEntity', input.childEntityId));

  if (parent.id === child.id) {
    return err(new ValidationError('Parent and child entity must differ'));
  }

  // Close existing active ownership record if any
  const existingRecords = await deps.ownershipRecordRepo.findByParent(input.parentEntityId);
  const activeRecord = existingRecords.find(
    (r) => r.childEntityId === input.childEntityId && r.effectiveTo === null
  );

  let closedRecord: OwnershipRecord | null = null;
  const previousPctBps = activeRecord?.ownershipPctBps ?? 0;

  if (activeRecord) {
    closedRecord = await deps.ownershipRecordRepo.update(activeRecord.id, {
      effectiveTo: input.effectiveDate,
    });
  }

  // Create new ownership record
  const newRecord = await deps.ownershipRecordRepo.create(input.tenantId, {
    parentEntityId: input.parentEntityId,
    childEntityId: input.childEntityId,
    ownershipPctBps: input.newOwnershipPctBps,
    votingPctBps: input.newVotingPctBps,
    effectiveFrom: input.effectiveDate,
    effectiveTo: null,
    acquisitionDate: input.effectiveDate,
    acquisitionCost: input.acquisitionCost,
    currencyCode: input.currencyCode,
  });

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.OWNERSHIP_CHANGED,
    payload: {
      parentEntityId: input.parentEntityId,
      childEntityId: input.childEntityId,
      previousPctBps,
      newPctBps: input.newOwnershipPctBps,
      effectiveDate: input.effectiveDate.toISOString(),
      userId: input.userId,
    },
  });

  return {
    ok: true,
    value: {
      closedRecord,
      newRecord,
      previousPctBps,
      newPctBps: input.newOwnershipPctBps,
    },
  };
}
