import { err, ValidationError } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { ApHold } from '../entities/ap-hold.js';
import type { IApHoldRepo } from '../ports/ap-hold-repo.js';

export interface ReleaseHoldInput {
  readonly holdId: string;
  readonly userId: string;
  readonly releaseReason: string;
}

export interface ReleaseHoldDeps {
  readonly apHoldRepo: IApHoldRepo;
}

export async function releaseHold(
  input: ReleaseHoldInput,
  deps: ReleaseHoldDeps
): Promise<Result<ApHold>> {
  const existing = await deps.apHoldRepo.findById(input.holdId);
  if (!existing.ok) return existing;

  if (existing.value.status !== 'ACTIVE') {
    return err(new ValidationError(`Hold is already ${existing.value.status}`));
  }

  return deps.apHoldRepo.release(input.holdId, {
    releasedBy: input.userId,
    releaseReason: input.releaseReason,
  });
}
