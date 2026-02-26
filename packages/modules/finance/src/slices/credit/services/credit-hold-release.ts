/**
 * CM-03: Credit hold / release workflow.
 * Places a customer on credit hold or releases them.
 */

import { err, ValidationError } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { ICreditLimitRepo } from '../ports/credit-limit-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import type { CreditLimit } from '../entities/credit-limit.js';
import { FinanceEventType } from '../../../shared/events.js';

export interface CreditHoldInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly customerId: string;
  readonly reason: string;
}

export interface CreditReleaseInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly customerId: string;
  readonly reason: string;
}

export async function placeCreditHold(
  input: CreditHoldInput,
  deps: { creditLimitRepo: ICreditLimitRepo; outboxWriter: IOutboxWriter }
): Promise<Result<CreditLimit>> {
  const limit = await deps.creditLimitRepo.findByCustomer(input.customerId);
  if (!limit) return err(new ValidationError('No credit limit found for customer'));
  if (limit.status === 'ON_HOLD') return err(new ValidationError('Customer already on hold'));
  if (limit.status === 'SUSPENDED') return err(new ValidationError('Customer is suspended'));

  const updated = await deps.creditLimitRepo.update(limit.id, { status: 'ON_HOLD' });

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.CREDIT_HOLD_PLACED,
    payload: { customerId: input.customerId, reason: input.reason, userId: input.userId },
  });

  return { ok: true, value: updated };
}

export async function releaseCreditHold(
  input: CreditReleaseInput,
  deps: { creditLimitRepo: ICreditLimitRepo; outboxWriter: IOutboxWriter }
): Promise<Result<CreditLimit>> {
  const limit = await deps.creditLimitRepo.findByCustomer(input.customerId);
  if (!limit) return err(new ValidationError('No credit limit found for customer'));
  if (limit.status !== 'ON_HOLD') return err(new ValidationError('Customer is not on hold'));

  const updated = await deps.creditLimitRepo.update(limit.id, { status: 'ACTIVE' });

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.CREDIT_HOLD_RELEASED,
    payload: { customerId: input.customerId, reason: input.reason, userId: input.userId },
  });

  return { ok: true, value: updated };
}
