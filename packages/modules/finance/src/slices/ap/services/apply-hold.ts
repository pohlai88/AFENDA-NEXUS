import { err, ValidationError } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { ApHold, ApHoldType } from '../entities/ap-hold.js';
import type { IApHoldRepo } from '../ports/ap-hold-repo.js';
import type { IApInvoiceRepo } from '../ports/ap-invoice-repo.js';

export interface ApplyHoldInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly invoiceId: string;
  readonly holdType: ApHoldType;
  readonly holdReason: string;
}

export interface ApplyHoldDeps {
  readonly apHoldRepo: IApHoldRepo;
  readonly apInvoiceRepo: IApInvoiceRepo;
}

export async function applyHold(
  input: ApplyHoldInput,
  deps: ApplyHoldDeps
): Promise<Result<ApHold>> {
  const invoiceResult = await deps.apInvoiceRepo.findById(input.invoiceId);
  if (!invoiceResult.ok) return invoiceResult;

  const invoice = invoiceResult.value;
  if (invoice.status === 'CANCELLED' || invoice.status === 'PAID') {
    return err(new ValidationError(`Cannot hold invoice in status ${invoice.status}`));
  }

  const hold = await deps.apHoldRepo.create({
    tenantId: input.tenantId,
    invoiceId: input.invoiceId,
    holdType: input.holdType,
    holdReason: input.holdReason,
    createdBy: input.userId,
  });

  return hold;
}
