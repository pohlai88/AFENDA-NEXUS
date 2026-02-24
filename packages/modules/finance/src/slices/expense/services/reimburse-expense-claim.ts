/**
 * EM-04: Reimbursement via AP run.
 * Links an approved expense claim to an AP payment run for reimbursement.
 */

import { err, ValidationError } from "@afenda/core";
import type { Result } from "@afenda/core";
import type { IExpenseClaimRepo } from "../ports/expense-claim-repo.js";
import type { IOutboxWriter } from "../../../shared/ports/outbox-writer.js";
import { FinanceEventType } from "../../../shared/events.js";

export interface ReimburseExpenseClaimInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly expenseClaimId: string;
  readonly paymentRunId: string;
}

export interface ReimburseExpenseClaimResult {
  readonly expenseClaimId: string;
  readonly paymentRunId: string;
  readonly reimbursedAmount: bigint;
  readonly currencyCode: string;
}

export async function reimburseExpenseClaim(
  input: ReimburseExpenseClaimInput,
  deps: { expenseClaimRepo: IExpenseClaimRepo; outboxWriter: IOutboxWriter },
): Promise<Result<ReimburseExpenseClaimResult>> {
  const claim = await deps.expenseClaimRepo.findById(input.expenseClaimId);
  if (!claim) return err(new ValidationError("Expense claim not found"));
  if (claim.status !== "APPROVED") return err(new ValidationError("Only approved claims can be reimbursed"));

  await deps.expenseClaimRepo.update(input.expenseClaimId, { status: "REIMBURSED" });

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.EXPENSE_CLAIM_REIMBURSED,
    payload: {
      expenseClaimId: input.expenseClaimId,
      paymentRunId: input.paymentRunId,
      amount: claim.totalAmount.toString(),
      userId: input.userId,
    },
  });

  return {
    ok: true,
    value: {
      expenseClaimId: input.expenseClaimId,
      paymentRunId: input.paymentRunId,
      reimbursedAmount: claim.totalAmount,
      currencyCode: claim.currencyCode,
    },
  };
}
