/**
 * SLA-01: Accounting event entity — the source event that triggers derivation.
 * Replaces ad-hoc source transactions with a formal, persistable event type.
 */

export type AccountingEventStatus = "PENDING" | "DERIVED" | "POSTED" | "FAILED" | "PREVIEW";

export interface AccountingEvent {
  readonly id: string;
  readonly tenantId: string;
  readonly eventType: string;
  readonly sourceSystem: string;
  readonly sourceDocumentId: string;
  readonly sourceDocumentType: string;
  readonly ledgerId: string;
  readonly accountId: string;
  readonly amountMinor: bigint;
  readonly currencyCode: string;
  readonly description: string;
  readonly eventDate: Date;
  readonly status: AccountingEventStatus;
  readonly derivedJournalIds: readonly string[];
  readonly errorMessage: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
