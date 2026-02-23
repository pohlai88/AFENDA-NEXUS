import type { Result } from "@afenda/core";
import { err, AppError } from "@afenda/core";
import type { IcSettlement } from "../../domain/entities/ic-settlement.js";
import type { IIcSettlementRepo, CreateIcSettlementInput } from "../ports/ic-settlement-repo.js";
import type { IIcTransactionRepo } from "../ports/ic-repo.js";
import type { IOutboxWriter } from "../ports/outbox-writer.js";
import type { FinanceContext } from "../../domain/finance-context.js";
import { FinanceEventType } from "../../domain/events.js";

export interface SettleIcDocumentsInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly sellerCompanyId: string;
  readonly buyerCompanyId: string;
  readonly documentIds: readonly string[];
  readonly settlementMethod: "NETTING" | "CASH" | "JOURNAL";
  readonly settlementAmount: bigint;
  readonly currency: string;
  readonly fxGainLoss: bigint;
  readonly reason?: string;
}

/**
 * @see IC-04 — Settlement tracking
 * @see AIS A-22 — IC settlement service
 *
 * Creates a settlement in DRAFT, validates all referenced IC documents exist
 * and are in PAIRED status, then confirms the settlement (transitioning
 * documents to RECONCILED).
 */
export async function settleIcDocuments(
  input: SettleIcDocumentsInput,
  deps: {
    icSettlementRepo: IIcSettlementRepo;
    icTransactionRepo: IIcTransactionRepo;
    outboxWriter: IOutboxWriter;
  },
  ctx?: FinanceContext,
): Promise<Result<IcSettlement>> {
  const tenantId = ctx?.tenantId ?? input.tenantId;

  if (input.documentIds.length === 0) {
    return err(new AppError("VALIDATION_ERROR", "At least one IC document is required for settlement"));
  }

  // Validate all documents exist and are in PAIRED status
  for (const docId of input.documentIds) {
    const docResult = await deps.icTransactionRepo.findById(docId);
    if (!docResult.ok) {
      return err(new AppError("NOT_FOUND", `IC document ${docId} not found`));
    }
    if (docResult.value.status !== "PAIRED") {
      return err(
        new AppError(
          "INVALID_STATE",
          `IC document ${docId} is in ${docResult.value.status} status, expected PAIRED`,
        ),
      );
    }
  }

  // Create settlement in DRAFT
  const createInput: CreateIcSettlementInput = {
    tenantId,
    sellerCompanyId: input.sellerCompanyId,
    buyerCompanyId: input.buyerCompanyId,
    documentIds: input.documentIds,
    settlementMethod: input.settlementMethod,
    settlementAmount: input.settlementAmount,
    currency: input.currency,
    fxGainLoss: input.fxGainLoss,
    settledBy: ctx?.actor?.userId ?? input.userId,
    reason: input.reason,
  };

  const createResult = await deps.icSettlementRepo.create(createInput);
  if (!createResult.ok) return createResult;

  // Confirm the settlement (transitions to CONFIRMED, documents to RECONCILED)
  const confirmResult = await deps.icSettlementRepo.confirm(createResult.value.id);
  if (!confirmResult.ok) return confirmResult;

  await deps.outboxWriter.write({
    tenantId,
    eventType: FinanceEventType.IC_SETTLEMENT_CONFIRMED,
    payload: {
      settlementId: confirmResult.value.id,
      documentIds: input.documentIds,
      settlementMethod: input.settlementMethod,
      sellerCompanyId: input.sellerCompanyId,
      buyerCompanyId: input.buyerCompanyId,
    },
  });

  return confirmResult;
}
