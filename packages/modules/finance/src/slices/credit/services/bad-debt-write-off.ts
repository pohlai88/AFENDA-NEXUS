/**
 * CM-05: Bad debt write-off service.
 * Writes off uncollectable receivables, posts journal entry to GL.
 */

import { err, ValidationError } from "@afenda/core";
import type { Result } from "@afenda/core";
import type { ICreditLimitRepo } from "../ports/credit-limit-repo.js";
import type { IOutboxWriter } from "../../../shared/ports/outbox-writer.js";
import { FinanceEventType } from "../../../shared/events.js";

export interface BadDebtWriteOffInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly creditLimitId: string;
  readonly customerId: string;
  readonly writeOffAmount: bigint;
  readonly currencyCode: string;
  readonly reason: string;
}

export interface BadDebtWriteOffResult {
  readonly creditLimitId: string;
  readonly customerId: string;
  readonly writeOffAmount: bigint;
  readonly currencyCode: string;
}

export async function writeOffBadDebt(
  input: BadDebtWriteOffInput,
  deps: { creditLimitRepo: ICreditLimitRepo; outboxWriter: IOutboxWriter },
): Promise<Result<BadDebtWriteOffResult>> {
  if (input.writeOffAmount <= 0n) return err(new ValidationError("Write-off amount must be positive"));
  if (!input.reason || input.reason.trim().length === 0) return err(new ValidationError("Reason is required for bad debt write-off"));

  const creditLimit = await deps.creditLimitRepo.findById(input.creditLimitId);
  if (!creditLimit) return err(new ValidationError("Credit limit not found"));
  if (creditLimit.customerId !== input.customerId) return err(new ValidationError("Customer mismatch"));

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.BAD_DEBT_WRITTEN_OFF,
    payload: {
      creditLimitId: input.creditLimitId,
      customerId: input.customerId,
      writeOffAmount: input.writeOffAmount.toString(),
      reason: input.reason,
      userId: input.userId,
    },
  });

  return {
    ok: true,
    value: {
      creditLimitId: input.creditLimitId,
      customerId: input.customerId,
      writeOffAmount: input.writeOffAmount,
      currencyCode: input.currencyCode,
    },
  };
}
