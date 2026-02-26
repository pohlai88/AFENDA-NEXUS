import type { Journal } from './journal.js';

export interface JournalAuditEntry {
  readonly id: string;
  readonly journalId: string;
  readonly tenantId: string;
  readonly fromStatus: Journal['status'] | null;
  readonly toStatus: Journal['status'];
  readonly userId: string;
  readonly reason?: string;
  readonly correlationId?: string;
  readonly metadata?: Record<string, unknown>;
  readonly occurredAt: Date;
}
