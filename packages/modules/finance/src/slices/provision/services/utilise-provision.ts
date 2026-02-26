/**
 * PR-03: Provision utilisation / reversal tracking service.
 * Records utilisation or reversal movements against a provision.
 */

import { err, ValidationError } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { IProvisionRepo } from '../ports/provision-repo.js';
import type { IProvisionMovementRepo } from '../ports/provision-movement-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import type { ProvisionMovement } from '../entities/provision-movement.js';
import { FinanceEventType } from '../../../shared/events.js';

export interface UtiliseProvisionInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly provisionId: string;
  readonly movementDate: Date;
  readonly movementType: 'UTILISATION' | 'REVERSAL';
  readonly amount: bigint;
  readonly description: string;
  readonly journalId: string | null;
  readonly currencyCode: string;
}

export async function utiliseProvision(
  input: UtiliseProvisionInput,
  deps: {
    provisionRepo: IProvisionRepo;
    provisionMovementRepo: IProvisionMovementRepo;
    outboxWriter: IOutboxWriter;
  }
): Promise<Result<ProvisionMovement>> {
  if (input.amount <= 0n) return err(new ValidationError('Amount must be positive'));

  const provision = await deps.provisionRepo.findById(input.provisionId);
  if (!provision) return err(new ValidationError('Provision not found'));
  if (provision.status === 'FULLY_UTILISED' || provision.status === 'REVERSED') {
    return err(new ValidationError('Provision is already closed'));
  }

  if (input.movementType === 'UTILISATION' && input.amount > provision.currentAmount) {
    return err(new ValidationError('Utilisation amount exceeds current provision balance'));
  }

  const balanceAfter =
    input.movementType === 'UTILISATION'
      ? provision.currentAmount - input.amount
      : provision.currentAmount - input.amount;

  const movement = await deps.provisionMovementRepo.create(input.tenantId, {
    provisionId: input.provisionId,
    movementDate: input.movementDate,
    movementType: input.movementType,
    amount: input.amount,
    balanceAfter,
    description: input.description,
    journalId: input.journalId,
    currencyCode: input.currencyCode,
    createdBy: input.userId,
  });

  await deps.provisionRepo.updateAmount(input.provisionId, balanceAfter);

  const newStatus =
    balanceAfter <= 0n
      ? input.movementType === 'REVERSAL'
        ? ('REVERSED' as const)
        : ('FULLY_UTILISED' as const)
      : ('PARTIALLY_UTILISED' as const);
  await deps.provisionRepo.updateStatus(input.provisionId, newStatus);

  const eventType =
    input.movementType === 'UTILISATION'
      ? FinanceEventType.PROVISION_UTILISED
      : FinanceEventType.PROVISION_REVERSED;

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType,
    payload: {
      provisionId: input.provisionId,
      movementId: movement.id,
      amount: input.amount.toString(),
      balanceAfter: balanceAfter.toString(),
      userId: input.userId,
    },
  });

  return { ok: true, value: movement };
}
