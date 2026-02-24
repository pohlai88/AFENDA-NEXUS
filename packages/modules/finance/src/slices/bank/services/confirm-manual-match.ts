/**
 * BR-03: Manual match service for complex transactions.
 * Allows user to manually match a bank statement line to a journal / source document.
 */

import { err, ValidationError } from "@afenda/core";
import type { Result } from "@afenda/core";
import type { IBankMatchRepo } from "../ports/bank-match-repo.js";
import type { IBankStatementRepo } from "../ports/bank-statement-repo.js";
import type { IOutboxWriter } from "../../../shared/ports/outbox-writer.js";
import type { BankMatch } from "../entities/bank-match.js";
import { FinanceEventType } from "../../../shared/events.js";

export interface ManualMatchInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly statementId: string;
  readonly statementLineId: string;
  readonly journalId: string | null;
  readonly sourceDocumentId: string | null;
  readonly sourceDocumentType: string | null;
  readonly matchedAmount: bigint;
  readonly currencyCode: string;
}

export async function confirmManualMatch(
  input: ManualMatchInput,
  deps: { bankMatchRepo: IBankMatchRepo; bankStatementRepo: IBankStatementRepo; outboxWriter: IOutboxWriter },
): Promise<Result<BankMatch>> {
  const existing = await deps.bankMatchRepo.findByStatementLine(input.statementLineId);
  if (existing) return err(new ValidationError("Statement line already matched"));

  const match = await deps.bankMatchRepo.create(input.tenantId, {
    statementLineId: input.statementLineId,
    journalId: input.journalId,
    sourceDocumentId: input.sourceDocumentId,
    sourceDocumentType: input.sourceDocumentType,
    matchType: "MANUAL",
    confidence: "HIGH",
    confidenceScore: 100,
    matchedAmount: input.matchedAmount,
    currencyCode: input.currencyCode,
    matchedBy: input.userId,
  });

  await deps.bankStatementRepo.updateLineMatchStatus(input.statementLineId, "MANUAL_MATCHED", match.id);

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.BANK_MATCH_CONFIRMED,
    payload: { matchId: match.id, statementLineId: input.statementLineId, userId: input.userId },
  });

  return { ok: true, value: match };
}
