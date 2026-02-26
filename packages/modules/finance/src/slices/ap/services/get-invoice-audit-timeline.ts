import type { Result } from '@afenda/core';
import { ok, err, AppError } from '@afenda/core';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import type { IApInvoiceRepo } from '../ports/ap-invoice-repo.js';
import type { FinanceContext } from '../../../shared/finance-context.js';

/**
 * W3-6: Invoice audit timeline.
 *
 * Aggregates outbox events for a given invoice ID into a queryable
 * chronological timeline. Uses the outbox as the audit log source.
 */

export interface InvoiceAuditTimelineInput {
  readonly tenantId: string;
  readonly invoiceId: string;
}

export interface AuditTimelineEvent {
  readonly id: string;
  readonly eventType: string;
  readonly timestamp: Date;
  readonly payload: unknown;
}

export interface InvoiceAuditTimeline {
  readonly invoiceId: string;
  readonly invoiceNumber: string;
  readonly events: readonly AuditTimelineEvent[];
  readonly eventCount: number;
}

const AP_EVENT_TYPES = new Set([
  'AP_INVOICE_APPROVED',
  'AP_INVOICE_CANCELLED',
  'AP_INVOICE_POSTED',
  'AP_INVOICE_PAID',
  'AP_PAYMENT_RUN_EXECUTED',
  'AP_DEBIT_MEMO_CREATED',
  'AP_PAYMENT_RUN_REVERSED',
]);

export async function getInvoiceAuditTimeline(
  input: InvoiceAuditTimelineInput,
  deps: {
    apInvoiceRepo: IApInvoiceRepo;
    outboxWriter: IOutboxWriter;
  },
  _ctx?: FinanceContext
): Promise<Result<InvoiceAuditTimeline>> {
  // Verify invoice exists
  const invoiceResult = await deps.apInvoiceRepo.findById(input.invoiceId);
  if (!invoiceResult.ok) {
    return err(new AppError('AP_INVOICE_NOT_FOUND', `Invoice ${input.invoiceId} not found`));
  }

  const invoice = invoiceResult.value;

  // Fetch recent outbox entries and filter by invoice ID
  if (!deps.outboxWriter.findRecent) {
    return ok({
      invoiceId: input.invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      events: [],
      eventCount: 0,
    });
  }

  const entries = await deps.outboxWriter.findRecent(1000);

  const relevantEvents: AuditTimelineEvent[] = entries
    .filter((entry) => {
      if (!AP_EVENT_TYPES.has(entry.eventType)) return false;
      const p = entry.payload as Record<string, unknown>;
      return (
        p.invoiceId === input.invoiceId ||
        p.originalInvoiceId === input.invoiceId ||
        p.debitMemoId === input.invoiceId
      );
    })
    .map((entry) => ({
      id: entry.id,
      eventType: entry.eventType,
      timestamp: entry.createdAt,
      payload: entry.payload,
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return ok({
    invoiceId: input.invoiceId,
    invoiceNumber: invoice.invoiceNumber,
    events: relevantEvents,
    eventCount: relevantEvents.length,
  });
}
