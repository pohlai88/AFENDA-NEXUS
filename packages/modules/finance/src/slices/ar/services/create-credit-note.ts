import type { Result } from "@afenda/core";
import { err, AppError } from "@afenda/core";
import type { ArInvoice } from "../entities/ar-invoice.js";
import type { IArInvoiceRepo, CreateArInvoiceInput } from "../ports/ar-invoice-repo.js";
import type { IOutboxWriter } from "../../../shared/ports/outbox-writer.js";
import type { FinanceContext } from "../../../shared/finance-context.js";
import { FinanceEventType } from "../../../shared/events.js";

export interface CreateCreditNoteInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly originalInvoiceId: string;
  readonly reason: string;
  readonly correlationId?: string;
}

/**
 * AR-07: Credit note / return (negative invoice).
 * Creates a credit note that offsets an existing AR invoice.
 */
export async function createCreditNote(
  input: CreateCreditNoteInput,
  deps: {
    arInvoiceRepo: IArInvoiceRepo;
    outboxWriter: IOutboxWriter;
  },
  ctx?: FinanceContext,
): Promise<Result<ArInvoice>> {
  const tenantId = ctx?.tenantId ?? input.tenantId;
  const userId = ctx?.actor.userId ?? input.userId;

  const found = await deps.arInvoiceRepo.findById(input.originalInvoiceId);
  if (!found.ok) return found;

  const original = found.value;

  if (original.status === "CANCELLED" || original.status === "DRAFT") {
    return err(new AppError("VALIDATION", `Cannot create credit note for invoice with status: ${original.status}`));
  }

  const creditLines = original.lines.map((line) => ({
    accountId: line.accountId,
    description: `Credit note for ${original.invoiceNumber}: ${input.reason}`,
    quantity: line.quantity,
    unitPrice: -(line.unitPrice.amount),
    amount: -(line.amount.amount),
    taxAmount: -(line.taxAmount.amount),
  }));

  const creditInput: CreateArInvoiceInput = {
    tenantId,
    companyId: original.companyId as string,
    customerId: original.customerId,
    ledgerId: original.ledgerId as string,
    invoiceNumber: `CN-${original.invoiceNumber}`,
    customerRef: original.customerRef,
    invoiceDate: new Date(),
    dueDate: new Date(),
    currencyCode: original.totalAmount.currency,
    description: `Credit note for ${original.invoiceNumber}: ${input.reason}`,
    paymentTermsId: null,
    lines: creditLines,
  };

  const created = await deps.arInvoiceRepo.create(creditInput);
  if (!created.ok) return created;

  await deps.outboxWriter.write({
    tenantId,
    eventType: FinanceEventType.AR_CREDIT_NOTE_CREATED,
    payload: {
      creditNoteId: created.value.id,
      originalInvoiceId: original.id,
      reason: input.reason,
      userId,
      correlationId: input.correlationId,
    },
  });

  return created;
}
