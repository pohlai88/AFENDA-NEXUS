/**
 * EM-01: Expense claim submission service.
 * Submits a draft claim for approval after policy validation.
 */

import { err, ValidationError } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { IExpenseClaimRepo } from '../ports/expense-claim-repo.js';
import type { IExpensePolicyRepo } from '../ports/expense-policy-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import type { ExpenseClaim } from '../entities/expense-claim.js';
import { enforceExpensePolicy, type PolicyCheckLine } from '../calculators/policy-enforcement.js';
import { FinanceEventType } from '../../../shared/events.js';

export interface SubmitExpenseClaimInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly claimId: string;
}

export async function submitExpenseClaim(
  input: SubmitExpenseClaimInput,
  deps: {
    expenseClaimRepo: IExpenseClaimRepo;
    expensePolicyRepo: IExpensePolicyRepo;
    outboxWriter: IOutboxWriter;
  }
): Promise<Result<ExpenseClaim>> {
  const claim = await deps.expenseClaimRepo.findById(input.claimId);
  if (!claim) return err(new ValidationError('Expense claim not found'));
  if (claim.status !== 'DRAFT')
    return err(new ValidationError('Only draft claims can be submitted'));

  const lines = await deps.expenseClaimRepo.findLinesByClaim(input.claimId);
  if (lines.length === 0) return err(new ValidationError('Claim has no lines'));

  const policies = await deps.expensePolicyRepo.findByCompany(claim.companyId);

  const checkLines: PolicyCheckLine[] = lines.map((l) => ({
    lineNumber: l.lineNumber,
    category: l.category,
    amount: l.amount,
    currencyCode: l.currencyCode,
    hasReceipt: l.receiptRef !== null,
    description: l.description,
  }));

  const policyResult = enforceExpensePolicy(checkLines, policies, claim.currencyCode);
  if (!policyResult.isCompliant) {
    const errorMessages = policyResult.violations
      .filter((v) => v.severity === 'ERROR')
      .map((v) => v.message)
      .join('; ');
    return err(new ValidationError(`Policy violations: ${errorMessages}`));
  }

  const updated = await deps.expenseClaimRepo.update(input.claimId, {
    status: 'SUBMITTED',
    submittedAt: new Date(),
  });

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.EXPENSE_CLAIM_SUBMITTED,
    payload: {
      claimId: updated.id,
      employeeId: updated.employeeId,
      totalAmount: String(updated.totalAmount),
      userId: input.userId,
    },
  });

  return { ok: true, value: updated };
}
