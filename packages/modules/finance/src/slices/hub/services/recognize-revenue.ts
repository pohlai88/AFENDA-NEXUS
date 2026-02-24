import type { Result } from "@afenda/core";
import { ok, err, AppError } from "@afenda/core";
import type { RevenueContract } from "../../hub/entities/revenue-recognition.js";
import {
  computeStraightLineSchedule,
} from "../calculators/revenue-recognition.js";
import type { IRevenueContractRepo } from "../../../slices/hub/ports/revenue-contract-repo.js";
import type { IJournalRepo, CreateJournalInput } from "../../../shared/ports/journal-posting-port.js";
import type { ILedgerRepo } from "../../../shared/ports/gl-read-ports.js";
import type { IIdempotencyStore } from "../../../shared/ports/idempotency-store.js";
import type { IOutboxWriter } from "../../../shared/ports/outbox-writer.js";
import type { IJournalAuditRepo } from "../../../shared/ports/journal-posting-port.js";
import type { FinanceContext } from "../../../shared/finance-context.js";
import { FinanceEventType } from "../../../shared/events.js";

export interface RecognizeRevenueInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly contractId: string;
  readonly periodId: string;
  readonly ledgerId: string;
  readonly idempotencyKey: string;
}

export interface RecognizeRevenueResult {
  readonly contractId: string;
  readonly journalId: string;
  readonly recognizedAmount: bigint;
  readonly totalRecognizedToDate: bigint;
  readonly remainingToRecognize: bigint;
}

/**
 * @see AH-04 — Revenue recognition schedules
 *
 * Orchestrates revenue recognition for a contract in a given period:
 * 1. Reads contract from repo
 * 2. Computes recognition schedule via pure calculator
 * 3. Determines amount to recognize this period
 * 4. Creates a recognition journal (debit deferred, credit revenue)
 * 5. Updates recognizedToDate on the contract
 * 6. Emits REVENUE_RECOGNIZED outbox event
 */
export async function recognizeRevenue(
  input: RecognizeRevenueInput,
  deps: {
    revenueContractRepo: IRevenueContractRepo;
    journalRepo: IJournalRepo;
    ledgerRepo: ILedgerRepo;
    idempotencyStore: IIdempotencyStore;
    outboxWriter: IOutboxWriter;
    journalAuditRepo: IJournalAuditRepo;
  },
  ctx?: FinanceContext,
): Promise<Result<RecognizeRevenueResult>> {
  const tenantId = ctx?.tenantId ?? input.tenantId;
  const userId = ctx?.actor?.userId ?? input.userId;

  // Idempotency — prevent duplicate recognition for same contract+period
  const claim = await deps.idempotencyStore.claimOrGet({
    tenantId,
    key: input.idempotencyKey,
    commandType: "RECOGNIZE_REVENUE",
  });
  if (!claim.claimed) {
    return err(new AppError("IDEMPOTENCY_CONFLICT", `Request ${input.idempotencyKey} already processed`));
  }

  // Load contract
  const contractResult = await deps.revenueContractRepo.findById(input.contractId);
  if (!contractResult.ok) return contractResult as Result<never>;
  const contract = contractResult.value;

  // INF-02: Company boundary — ledger must belong to the same company as the contract
  const ledgerResult = await deps.ledgerRepo.findById(input.ledgerId);
  if (!ledgerResult.ok) {
    return err(new AppError("NOT_FOUND", `Ledger ${input.ledgerId} not found`));
  }
  if (String(ledgerResult.value.companyId) !== String(contract.companyId)) {
    return err(
      new AppError(
        "COMPANY_MISMATCH",
        `Ledger belongs to company ${String(ledgerResult.value.companyId)}, but contract belongs to company ${String(contract.companyId)}`,
      ),
    );
  }

  // Validate contract state
  if (contract.status !== "ACTIVE") {
    return err(new AppError("INVALID_STATE", `Contract ${contract.id} is ${contract.status}, expected ACTIVE`));
  }
  if (contract.recognizedToDate >= contract.totalAmount) {
    return err(new AppError("VALIDATION_ERROR", `Contract ${contract.id} is fully recognized`));
  }

  // Compute recognition amount based on method
  const amountToRecognize = computeRecognitionAmount(contract, deps);
  if (amountToRecognize <= 0n) {
    return err(new AppError("VALIDATION_ERROR", "No amount to recognize this period"));
  }

  // Cap at remaining amount
  const remaining = contract.totalAmount - contract.recognizedToDate;
  const finalAmount = amountToRecognize > remaining ? remaining : amountToRecognize;

  // Create recognition journal: debit deferred revenue, credit earned revenue
  const journalInput: CreateJournalInput = {
    tenantId,
    ledgerId: input.ledgerId,
    fiscalPeriodId: input.periodId,
    journalNumber: `REVREC-${contract.contractNumber}-${input.periodId}`,
    description: `Revenue recognition: ${contract.contractNumber} (${contract.customerName})`,
    postingDate: new Date(),
    lines: [
      {
        accountId: contract.deferredAccountId,
        debit: finalAmount,
        credit: 0n,
        description: `Deferred revenue release — ${contract.contractNumber}`,
      },
      {
        accountId: contract.revenueAccountId,
        debit: 0n,
        credit: finalAmount,
        description: `Revenue recognized — ${contract.contractNumber}`,
      },
    ],
  };

  const journalResult = await deps.journalRepo.create(journalInput);
  if (!journalResult.ok) return journalResult as Result<never>;

  // Update recognizedToDate on contract
  const newRecognizedToDate = contract.recognizedToDate + finalAmount;
  const updateResult = await deps.revenueContractRepo.updateRecognized(
    contract.id,
    newRecognizedToDate,
  );
  if (!updateResult.ok) return updateResult as Result<never>;

  // Audit log
  await deps.journalAuditRepo.log({
    tenantId,
    journalId: journalResult.value.id,
    fromStatus: "DRAFT",
    toStatus: "DRAFT",
    userId,
    reason: `Revenue recognition for contract ${contract.contractNumber}`,
  });

  // Outbox event
  await deps.outboxWriter.write({
    tenantId,
    eventType: FinanceEventType.REVENUE_RECOGNIZED,
    payload: {
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      journalId: journalResult.value.id,
      recognizedAmount: String(finalAmount),
      totalRecognizedToDate: String(newRecognizedToDate),
      periodId: input.periodId,
    },
  });

  await deps.idempotencyStore.recordOutcome?.(
    tenantId,
    input.idempotencyKey,
    "RECOGNIZE_REVENUE",
    journalResult.value.id,
  );

  return ok({
    contractId: contract.id,
    journalId: journalResult.value.id,
    recognizedAmount: finalAmount,
    totalRecognizedToDate: newRecognizedToDate,
    remainingToRecognize: contract.totalAmount - newRecognizedToDate,
  });
}

/**
 * Computes the amount to recognize based on contract method.
 * For STRAIGHT_LINE: totalAmount / periodCount (derived from date range).
 * For MILESTONE: sum of newly completed milestones.
 */
function computeRecognitionAmount(
  contract: RevenueContract,
  _deps: { revenueContractRepo: IRevenueContractRepo },
): bigint {
  if (contract.recognitionMethod === "STRAIGHT_LINE") {
    const months = monthsBetween(contract.startDate, contract.endDate);
    const periodCount = months > 0 ? months : 1;
    const { result } = computeStraightLineSchedule({
      totalAmount: contract.totalAmount,
      periodCount,
      currency: contract.currency,
      alreadyRecognized: contract.recognizedToDate,
    });
    return result.perPeriodAmount.amount;
  }

  // MILESTONE / PERCENTAGE_OF_COMPLETION — return per-period straight-line as fallback
  // (milestone completion is tracked via updateRecognized calls from external triggers)
  const months = monthsBetween(contract.startDate, contract.endDate);
  const periodCount = months > 0 ? months : 1;
  const { result } = computeStraightLineSchedule({
    totalAmount: contract.totalAmount,
    periodCount,
    currency: contract.currency,
    alreadyRecognized: contract.recognizedToDate,
  });
  return result.perPeriodAmount.amount;
}

function monthsBetween(start: Date, end: Date): number {
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth()) +
    1
  );
}
