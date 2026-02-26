/**
 * TR-06 service: Manage intercompany loans — create, repay, accrue interest.
 */

import { err, NotFoundError, ValidationError } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { IIcLoanRepo } from '../ports/ic-loan-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import type { IcLoan } from '../entities/ic-loan.js';
import { FinanceEventType } from '../../../shared/events.js';

// ---------- Create ----------

export interface CreateIcLoanInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly lenderCompanyId: string;
  readonly borrowerCompanyId: string;
  readonly loanNumber: string;
  readonly description: string;
  readonly principalAmount: bigint;
  readonly interestRateBps: number;
  readonly currencyCode: string;
  readonly startDate: Date;
  readonly maturityDate: Date;
  readonly icAgreementId: string | null;
}

export async function createIcLoan(
  input: CreateIcLoanInput,
  deps: { icLoanRepo: IIcLoanRepo; outboxWriter: IOutboxWriter }
): Promise<Result<IcLoan>> {
  if (input.lenderCompanyId === input.borrowerCompanyId)
    return err(new ValidationError('Lender and borrower must differ'));
  if (input.principalAmount <= 0n)
    return err(new ValidationError('Principal amount must be positive'));
  if (input.maturityDate <= input.startDate)
    return err(new ValidationError('Maturity date must be after start date'));

  const loan = await deps.icLoanRepo.create(input.tenantId, {
    lenderCompanyId: input.lenderCompanyId,
    borrowerCompanyId: input.borrowerCompanyId,
    loanNumber: input.loanNumber,
    description: input.description,
    principalAmount: input.principalAmount,
    outstandingBalance: input.principalAmount,
    interestRateBps: input.interestRateBps,
    currencyCode: input.currencyCode,
    startDate: input.startDate,
    maturityDate: input.maturityDate,
    icAgreementId: input.icAgreementId,
  });

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.IC_LOAN_CREATED,
    payload: {
      loanId: loan.id,
      loanNumber: loan.loanNumber,
      principalAmount: loan.principalAmount.toString(),
      userId: input.userId,
    },
  });

  return { ok: true, value: loan };
}

// ---------- Repay ----------

export interface RepayIcLoanInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly loanId: string;
  readonly repaymentAmount: bigint;
}

export interface RepayIcLoanResult {
  readonly loanId: string;
  readonly repaymentAmount: bigint;
  readonly previousBalance: bigint;
  readonly newBalance: bigint;
  readonly isFullyRepaid: boolean;
}

export async function repayIcLoan(
  input: RepayIcLoanInput,
  deps: { icLoanRepo: IIcLoanRepo; outboxWriter: IOutboxWriter }
): Promise<Result<RepayIcLoanResult>> {
  const loan = await deps.icLoanRepo.findById(input.loanId);
  if (!loan) return err(new NotFoundError('IcLoan', input.loanId));
  if (loan.status !== 'ACTIVE')
    return err(new ValidationError(`Loan status must be ACTIVE, got ${loan.status}`));
  if (input.repaymentAmount <= 0n)
    return err(new ValidationError('Repayment amount must be positive'));
  if (input.repaymentAmount > loan.outstandingBalance)
    return err(new ValidationError('Repayment exceeds outstanding balance'));

  const newBalance = loan.outstandingBalance - input.repaymentAmount;
  const isFullyRepaid = newBalance === 0n;

  await deps.icLoanRepo.updateBalance(loan.id, newBalance);
  if (isFullyRepaid) {
    await deps.icLoanRepo.updateStatus(loan.id, 'REPAID');
  }

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.IC_LOAN_REPAID,
    payload: {
      loanId: loan.id,
      repaymentAmount: input.repaymentAmount.toString(),
      newBalance: newBalance.toString(),
      isFullyRepaid,
      userId: input.userId,
    },
  });

  return {
    ok: true,
    value: {
      loanId: loan.id,
      repaymentAmount: input.repaymentAmount,
      previousBalance: loan.outstandingBalance,
      newBalance,
      isFullyRepaid,
    },
  };
}

// ---------- Accrue interest (pure computation helper) ----------

export interface AccrueInterestInput {
  readonly outstandingBalance: bigint;
  readonly interestRateBps: number;
  readonly daysInPeriod: number;
  readonly daysInYear: number;
}

export interface AccrueInterestResult {
  readonly interestAmount: bigint;
}

/**
 * Pure computation — calculates interest accrual for a period.
 * interest = balance * rateBps / 10000 * daysInPeriod / daysInYear  (BigInt integer division)
 */
export function computeInterestAccrual(input: AccrueInterestInput): AccrueInterestResult {
  if (input.daysInYear <= 0) throw new Error('daysInYear must be positive');
  if (input.daysInPeriod < 0) throw new Error('daysInPeriod must be non-negative');

  const interestAmount =
    (input.outstandingBalance * BigInt(input.interestRateBps) * BigInt(input.daysInPeriod)) /
    (10000n * BigInt(input.daysInYear));

  return { interestAmount };
}
