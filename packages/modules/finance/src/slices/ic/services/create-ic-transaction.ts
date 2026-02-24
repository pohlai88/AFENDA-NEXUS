import type { Result } from "@afenda/core";
import { err, AppError } from "@afenda/core";
import type { IntercompanyDocument } from "../entities/intercompany.js";
import type { IIcAgreementRepo, IIcTransactionRepo } from "../../../slices/ic/ports/ic-repo.js";
import type { IJournalRepo, CreateJournalInput } from "../../../shared/ports/journal-posting-port.js";
import type { IOutboxWriter } from "../../../shared/ports/outbox-writer.js";
import type { FinanceContext } from "../../../shared/finance-context.js";
import { FinanceEventType } from "../../../shared/events.js";

export interface IcLineInput {
  readonly accountId: string;
  readonly debit: bigint;
  readonly credit: bigint;
}

export interface CreateIcTransactionInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly agreementId: string;
  readonly sourceLedgerId: string;
  readonly mirrorLedgerId: string;
  readonly fiscalPeriodId: string;
  readonly description: string;
  readonly postingDate: Date;
  readonly currency: string;
  readonly sourceLines: readonly IcLineInput[];
  readonly mirrorLines: readonly IcLineInput[];
}

export async function createIcTransaction(
  input: CreateIcTransactionInput,
  deps: {
    icAgreementRepo: IIcAgreementRepo;
    icTransactionRepo: IIcTransactionRepo;
    journalRepo: IJournalRepo;
    outboxWriter: IOutboxWriter;
  },
  ctx?: FinanceContext,
): Promise<Result<IntercompanyDocument>> {
  const tenantId = ctx?.tenantId ?? input.tenantId;
  // Validate agreement exists and is active
  const agreementResult = await deps.icAgreementRepo.findById(input.agreementId);
  if (!agreementResult.ok) return agreementResult;

  const agreement = agreementResult.value;
  if (!agreement.isActive) {
    return err(new AppError("INVALID_STATE", `IC agreement ${agreement.id} is inactive`));
  }

  // Validate lines
  if (input.sourceLines.length < 1 || input.mirrorLines.length < 1) {
    return err(new AppError("INSUFFICIENT_LINES", "IC transaction requires at least 1 source and 1 mirror line"));
  }

  // Create source journal (seller side)
  const sourceJournalInput: CreateJournalInput = {
    tenantId,
    ledgerId: input.sourceLedgerId,
    journalNumber: `IC-${Date.now()}-S`,
    description: `[IC] ${input.description}`,
    postingDate: input.postingDate,
    fiscalPeriodId: input.fiscalPeriodId,
    lines: input.sourceLines.map((l) => ({
      accountId: l.accountId,
      debit: l.debit,
      credit: l.credit,
    })),
  };
  const sourceResult = await deps.journalRepo.create(sourceJournalInput);
  if (!sourceResult.ok) return sourceResult as Result<never>;

  // Create mirror journal (buyer side)
  const mirrorJournalInput: CreateJournalInput = {
    tenantId,
    ledgerId: input.mirrorLedgerId,
    journalNumber: `IC-${Date.now()}-M`,
    description: `[IC Mirror] ${input.description}`,
    postingDate: input.postingDate,
    fiscalPeriodId: input.fiscalPeriodId,
    lines: input.mirrorLines.map((l) => ({
      accountId: l.accountId,
      debit: l.debit,
      credit: l.credit,
    })),
  };
  const mirrorResult = await deps.journalRepo.create(mirrorJournalInput);
  if (!mirrorResult.ok) return mirrorResult as Result<never>;

  // Compute IC transaction amount from source journal lines (sum of debits)
  const icAmount = input.sourceLines.reduce((sum, l) => sum + l.debit, 0n);

  // Create IC document linking both journals
  const docResult = await deps.icTransactionRepo.create({
    tenantId,
    relationshipId: input.agreementId,
    sourceCompanyId: String(agreement.sellerCompanyId),
    mirrorCompanyId: String(agreement.buyerCompanyId),
    sourceJournalId: sourceResult.value.id,
    mirrorJournalId: mirrorResult.value.id,
    amount: icAmount,
    currency: input.currency,
  });
  if (!docResult.ok) return docResult;

  await deps.outboxWriter.write({
    tenantId,
    eventType: FinanceEventType.IC_TRANSACTION_CREATED,
    payload: {
      icDocumentId: docResult.value.id,
      agreementId: input.agreementId,
      sourceJournalId: sourceResult.value.id,
      mirrorJournalId: mirrorResult.value.id,
    },
  });

  return docResult;
}
