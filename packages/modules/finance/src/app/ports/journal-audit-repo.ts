import type { Result } from "@afenda/core";
import type { Journal, JournalAuditEntry } from "../../domain/index.js";

export interface AuditLogInput {
  readonly tenantId: string;
  readonly journalId: string;
  readonly fromStatus: Journal["status"] | null;
  readonly toStatus: Journal["status"];
  readonly userId: string;
  readonly reason?: string;
  readonly correlationId?: string;
}

export interface IJournalAuditRepo {
  log(input: AuditLogInput): Promise<void>;
  findByJournalId(journalId: string): Promise<Result<JournalAuditEntry[]>>;
}
