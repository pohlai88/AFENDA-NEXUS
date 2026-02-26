/**
 * BR-09: Reconciliation sign-off with evidence.
 * Signs off a completed bank reconciliation after verifying zero difference.
 */

import { err, ValidationError } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { IBankReconciliationRepo } from '../ports/bank-reconciliation-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import type { BankReconciliation } from '../entities/bank-reconciliation.js';
import { FinanceEventType } from '../../../shared/events.js';

export interface SignOffReconciliationInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly reconciliationId: string;
}

export async function signOffReconciliation(
  input: SignOffReconciliationInput,
  deps: { bankReconciliationRepo: IBankReconciliationRepo; outboxWriter: IOutboxWriter }
): Promise<Result<BankReconciliation>> {
  const recon = await deps.bankReconciliationRepo.findById(input.reconciliationId);
  if (!recon) return err(new ValidationError('Reconciliation not found'));
  if (recon.status === 'SIGNED_OFF') return err(new ValidationError('Already signed off'));
  if (recon.difference !== 0n)
    return err(new ValidationError('Cannot sign off with non-zero difference'));
  if (recon.unmatchedCount > 0)
    return err(new ValidationError('Cannot sign off with unmatched items'));

  const signed = await deps.bankReconciliationRepo.signOff(input.reconciliationId, input.userId);

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.BANK_RECONCILIATION_SIGNED_OFF,
    payload: {
      reconciliationId: signed.id,
      bankAccountId: signed.bankAccountId,
      userId: input.userId,
    },
  });

  return { ok: true, value: signed };
}
